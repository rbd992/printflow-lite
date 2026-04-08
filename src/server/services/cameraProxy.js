// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — cameraProxy.js
// RTSP-to-MJPEG Proxy Service for Electron Main Process
// Handles Bambu Lab RTSP streams and generic IP camera RTSP feeds,
// converting them to browser-compatible MJPEG streams via ffmpeg
// Place in: src/server/services/cameraProxy.js
// ──────────────────────────────────────────────────────────────────────────────

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

class CameraProxyService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 8765;
    this.server = null;
    this.streams = new Map();   // { streamId: { process, clients, config } }
    this.snapshotCache = new Map(); // { streamId: { buffer, timestamp } }
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.maxStreams = options.maxStreams || 8;
    this.snapshotMaxAge = options.snapshotMaxAge || 5000; // 5s cache
  }

  // ─ Start the HTTP proxy server ────────────────────────────────────────────

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this._handleRequest(req, res);
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[CameraProxy] Port ${this.port} in use, trying ${this.port + 1}`);
          this.port++;
          this.server.listen(this.port);
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        console.log(`[CameraProxy] Running on http://127.0.0.1:${this.port}`);
        resolve(this.port);
      });
    });
  }

  // ─ Stop everything ────────────────────────────────────────────────────────

  stop() {
    // Kill all ffmpeg processes
    for (const [id, stream] of this.streams) {
      this._killStream(id);
    }
    this.streams.clear();
    this.snapshotCache.clear();

    if (this.server) {
      this.server.close();
      this.server = null;
    }
    console.log('[CameraProxy] Stopped');
  }

  // ─ Register a camera stream ───────────────────────────────────────────────

  registerStream(streamId, config) {
    // config: { rtspUrl, username, password, protocol ('rtsp'|'rtsps'), resolution, fps }
    if (this.streams.size >= this.maxStreams) {
      throw new Error(`Maximum streams (${this.maxStreams}) reached`);
    }

    this.streams.set(streamId, {
      config,
      process: null,
      clients: new Set(),
      lastFrame: null,
      frameCount: 0,
      startedAt: null,
    });

    console.log(`[CameraProxy] Registered stream: ${streamId}`);
    return {
      streamUrl: `http://127.0.0.1:${this.port}/camera/${streamId}/stream`,
      snapshotUrl: `http://127.0.0.1:${this.port}/camera/${streamId}/snapshot`,
    };
  }

  // ─ Remove a camera stream ─────────────────────────────────────────────────

  removeStream(streamId) {
    this._killStream(streamId);
    this.streams.delete(streamId);
    this.snapshotCache.delete(streamId);
    console.log(`[CameraProxy] Removed stream: ${streamId}`);
  }

  // ─ HTTP Request Handler ───────────────────────────────────────────────────

  _handleRequest(req, res) {
    const url = new URL(req.url, `http://127.0.0.1:${this.port}`);
    const parts = url.pathname.split('/').filter(Boolean);

    // CORS headers for renderer access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Route: GET /camera/:id/stream
    if (parts.length === 3 && parts[0] === 'camera' && parts[2] === 'stream') {
      return this._handleStreamRequest(parts[1], req, res);
    }

    // Route: GET /camera/:id/snapshot
    if (parts.length === 3 && parts[0] === 'camera' && parts[2] === 'snapshot') {
      return this._handleSnapshotRequest(parts[1], req, res);
    }

    // Route: GET /status
    if (parts.length === 1 && parts[0] === 'status') {
      return this._handleStatusRequest(req, res);
    }

    // Route: GET /cameras
    if (parts.length === 1 && parts[0] === 'cameras') {
      return this._handleListRequest(req, res);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  // ─ MJPEG Stream Handler ───────────────────────────────────────────────────

  _handleStreamRequest(streamId, req, res) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Stream "${streamId}" not registered` }));
      return;
    }

    // Set up MJPEG response headers
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Add this client
    stream.clients.add(res);

    // Start ffmpeg if not running
    if (!stream.process) {
      this._startFFmpeg(streamId);
    }

    // Clean up on disconnect
    req.on('close', () => {
      stream.clients.delete(res);
      // Stop ffmpeg if no clients
      if (stream.clients.size === 0) {
        setTimeout(() => {
          if (stream.clients.size === 0) {
            this._killStream(streamId);
          }
        }, 10000); // Wait 10s before killing — client might reconnect
      }
    });
  }

  // ─ Snapshot Handler ───────────────────────────────────────────────────────

  _handleSnapshotRequest(streamId, req, res) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Stream "${streamId}" not registered` }));
      return;
    }

    // Check cache
    const cached = this.snapshotCache.get(streamId);
    if (cached && (Date.now() - cached.timestamp) < this.snapshotMaxAge) {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': cached.buffer.length,
        'Cache-Control': 'no-cache',
      });
      res.end(cached.buffer);
      return;
    }

    // If we have a last frame from the stream, use that
    if (stream.lastFrame) {
      this.snapshotCache.set(streamId, {
        buffer: stream.lastFrame,
        timestamp: Date.now(),
      });
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': stream.lastFrame.length,
        'Cache-Control': 'no-cache',
      });
      res.end(stream.lastFrame);
      return;
    }

    // No frame available — grab one via ffmpeg
    this._captureSnapshot(streamId, stream.config)
      .then(buffer => {
        this.snapshotCache.set(streamId, { buffer, timestamp: Date.now() });
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Length': buffer.length,
        });
        res.end(buffer);
      })
      .catch(err => {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Snapshot failed', detail: err.message }));
      });
  }

  // ─ Status Handler ─────────────────────────────────────────────────────────

  _handleStatusRequest(req, res) {
    const status = {};
    for (const [id, stream] of this.streams) {
      status[id] = {
        active: !!stream.process,
        clients: stream.clients.size,
        frames: stream.frameCount,
        uptime: stream.startedAt ? Date.now() - stream.startedAt : 0,
      };
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ streams: status, port: this.port }));
  }

  // ─ List Handler ───────────────────────────────────────────────────────────

  _handleListRequest(req, res) {
    const cameras = [];
    for (const [id, stream] of this.streams) {
      cameras.push({
        id,
        active: !!stream.process,
        clients: stream.clients.size,
        streamUrl: `http://127.0.0.1:${this.port}/camera/${id}/stream`,
        snapshotUrl: `http://127.0.0.1:${this.port}/camera/${id}/snapshot`,
      });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ cameras }));
  }

  // ─ Start FFmpeg Process ───────────────────────────────────────────────────

  _startFFmpeg(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream || stream.process) return;

    const { config } = stream;
    const rtspUrl = config.rtspUrl;
    const fps = config.fps || 15;
    const resolution = config.resolution || '';  // e.g. '1280x720'

    // Build ffmpeg command
    const args = [
      '-hide_banner',
      '-loglevel', 'error',
    ];

    // RTSP input options
    if (config.protocol === 'rtsps' || rtspUrl.startsWith('rtsps://')) {
      // Bambu Lab uses TLS with self-signed certs
      args.push('-rtsp_transport', 'tcp');
      // For rtsps, we may need to disable cert verification
      // ffmpeg handles this via -tls_verify 0 on some builds
    } else {
      args.push('-rtsp_transport', 'tcp');
    }

    // Authentication
    if (config.username && config.password) {
      // Embed credentials in URL
      const urlObj = new URL(rtspUrl);
      urlObj.username = config.username;
      urlObj.password = config.password;
      args.push('-i', urlObj.toString());
    } else {
      args.push('-i', rtspUrl);
    }

    // Output options — MJPEG frames to stdout
    if (resolution) {
      args.push('-vf', `fps=${fps},scale=${resolution.replace('x', ':')}`);
    } else {
      args.push('-vf', `fps=${fps}`);
    }

    args.push(
      '-f', 'mjpeg',
      '-q:v', '5',        // JPEG quality (2=best, 31=worst)
      '-an',               // No audio
      'pipe:1'             // Output to stdout
    );

    console.log(`[CameraProxy] Starting ffmpeg for ${streamId}`);

    const proc = spawn(this.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    stream.process = proc;
    stream.startedAt = Date.now();
    stream.frameCount = 0;

    // Parse MJPEG frames from stdout
    let buffer = Buffer.alloc(0);
    const SOI = Buffer.from([0xFF, 0xD8]); // JPEG Start Of Image
    const EOI = Buffer.from([0xFF, 0xD9]); // JPEG End Of Image

    proc.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // Find complete JPEG frames
      while (true) {
        const soiIdx = buffer.indexOf(SOI);
        if (soiIdx === -1) break;

        const eoiIdx = buffer.indexOf(EOI, soiIdx + 2);
        if (eoiIdx === -1) break;

        const frame = buffer.slice(soiIdx, eoiIdx + 2);
        buffer = buffer.slice(eoiIdx + 2);

        stream.lastFrame = frame;
        stream.frameCount++;

        // Send to all connected MJPEG clients
        for (const client of stream.clients) {
          try {
            client.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
            client.write(frame);
            client.write('\r\n');
          } catch {
            stream.clients.delete(client);
          }
        }
      }

      // Prevent buffer from growing unbounded
      if (buffer.length > 5 * 1024 * 1024) {
        buffer = buffer.slice(-1024 * 1024);
      }
    });

    proc.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        console.warn(`[CameraProxy:${streamId}] ffmpeg: ${msg}`);
        this.emit('error', { streamId, message: msg });
      }
    });

    proc.on('close', (code) => {
      console.log(`[CameraProxy] ffmpeg exited for ${streamId} (code ${code})`);
      stream.process = null;
      stream.startedAt = null;

      // Auto-restart if there are still clients
      if (stream.clients.size > 0 && code !== 0) {
        console.log(`[CameraProxy] Auto-restarting ${streamId} in 3s...`);
        setTimeout(() => {
          if (this.streams.has(streamId) && this.streams.get(streamId).clients.size > 0) {
            this._startFFmpeg(streamId);
          }
        }, 3000);
      }
    });

    proc.on('error', (err) => {
      console.error(`[CameraProxy] Failed to start ffmpeg for ${streamId}:`, err.message);
      stream.process = null;
      this.emit('error', { streamId, message: `ffmpeg launch failed: ${err.message}` });
    });
  }

  // ─ Kill FFmpeg Process ────────────────────────────────────────────────────

  _killStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    if (stream.process) {
      try {
        stream.process.kill('SIGTERM');
        // Force kill after 3s
        setTimeout(() => {
          try { stream.process?.kill('SIGKILL'); } catch {}
        }, 3000);
      } catch {}
      stream.process = null;
    }

    // Close all client connections
    for (const client of stream.clients) {
      try { client.end(); } catch {}
    }
    stream.clients.clear();
  }

  // ─ One-shot Snapshot ──────────────────────────────────────────────────────

  _captureSnapshot(streamId, config) {
    return new Promise((resolve, reject) => {
      const args = [
        '-hide_banner', '-loglevel', 'error',
        '-rtsp_transport', 'tcp',
      ];

      let inputUrl = config.rtspUrl;
      if (config.username && config.password) {
        const urlObj = new URL(config.rtspUrl);
        urlObj.username = config.username;
        urlObj.password = config.password;
        inputUrl = urlObj.toString();
      }

      args.push(
        '-i', inputUrl,
        '-frames:v', '1',
        '-f', 'image2',
        '-q:v', '3',
        'pipe:1'
      );

      const proc = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      });

      const chunks = [];
      proc.stdout.on('data', (chunk) => chunks.push(chunk));
      proc.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Snapshot failed with code ${code}`));
        }
      });
      proc.on('error', reject);

      // Timeout
      setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch {}
        reject(new Error('Snapshot timed out'));
      }, 10000);
    });
  }

  // ─ Bambu Lab Helper ───────────────────────────────────────────────────────
  // Convenience method for registering a Bambu Lab camera

  registerBambuCamera(printerId, host, accessCode) {
    return this.registerStream(`bambu-${printerId}`, {
      rtspUrl: `rtsps://${host}:322/streaming/live/1`,
      username: 'bblp',
      password: accessCode,
      protocol: 'rtsps',
      fps: 15,
    });
  }

  // ─ Generic RTSP Helper ────────────────────────────────────────────────────

  registerRtspCamera(printerId, rtspUrl, options = {}) {
    return this.registerStream(`rtsp-${printerId}`, {
      rtspUrl,
      username: options.username || '',
      password: options.password || '',
      protocol: rtspUrl.startsWith('rtsps') ? 'rtsps' : 'rtsp',
      fps: options.fps || 15,
      resolution: options.resolution || '',
    });
  }
}

module.exports = CameraProxyService;
