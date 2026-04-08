// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — CameraFeed.js
// Universal 3D Printer Camera Feed Component
// Supports: MJPEG, Snapshot Polling, WebRTC, RTSP (via proxy), HLS
// Works with: OctoPrint, Klipper/Moonraker, Bambu Lab, Prusa Connect,
//             Creality, Duet3D, Repetier Server, generic IP cameras
// Place in: src/renderer/components/CameraFeed.js
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Camera Protocol Handlers ────────────────────────────────────────────────

const CAMERA_PROTOCOLS = {
  mjpeg: {
    name: 'MJPEG Stream',
    description: 'Motion JPEG continuous stream — most widely supported',
    brands: ['octoprint', 'klipper', 'creality', 'duet', 'repetier'],
  },
  snapshot: {
    name: 'Snapshot Polling',
    description: 'Periodic snapshot refresh — lower bandwidth fallback',
    brands: ['octoprint', 'klipper', 'prusa', 'creality', 'duet', 'repetier'],
  },
  webrtc: {
    name: 'WebRTC',
    description: 'Low-latency peer-to-peer video — Moonraker camera-streamer',
    brands: ['klipper'],
  },
  rtsp: {
    name: 'RTSP (via proxy)',
    description: 'Real-Time Streaming Protocol — Bambu Lab, IP cameras',
    brands: ['bambulab'],
  },
  hls: {
    name: 'HLS Stream',
    description: 'HTTP Live Streaming — adaptive bitrate',
    brands: ['klipper'],
  },
};


// ── SVG Icons ───────────────────────────────────────────────────────────────

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="10" cy="10.5" r="1" fill="currentColor"/>
    <circle cx="14.5" cy="7" r="0.8" fill="currentColor"/>
  </svg>
);

const IconExpand = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 6V2H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 10V14H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 6V2H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10V14H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSnapshot = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 8C2.5 4.96 4.96 2.5 8 2.5C10.21 2.5 12.1 3.86 12.93 5.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M13.5 8C13.5 11.04 11.04 13.5 8 13.5C5.79 13.5 3.9 12.14 3.07 10.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M10.5 5.8H13.2V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M8 12.5V14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M3.4 3.4L4.8 4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M11.2 11.2L12.6 12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M1.5 8H3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M12.5 8H14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconOffline = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect x="4" y="10" width="32" height="22" rx="3" stroke="currentColor" strokeWidth="1.8" opacity="0.3"/>
    <circle cx="20" cy="21" r="6" stroke="currentColor" strokeWidth="1.8" opacity="0.3"/>
    <path d="M6 6L34 34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconRecord = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" fill="#ef4444"/>
  </svg>
);


// ── Main CameraFeed Component ───────────────────────────────────────────────

export default function CameraFeed({
  printerName = 'Printer',
  printerBrand = 'octoprint',
  protocol = 'mjpeg',
  streamUrl = '',
  snapshotUrl = '',
  rtspUrl = '',
  webrtcSignalUrl = '',
  hlsUrl = '',
  refreshInterval = 1000,       // snapshot polling interval in ms
  credentials = null,           // { username, password } for RTSP/auth
  showControls = true,
  showOverlay = true,
  aspectRatio = '16/9',
  maxHeight = 480,
  onError = null,
  onSnapshot = null,
  className = '',
}) {
  const [status, setStatus] = useState('connecting');  // connecting, live, error, offline
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState(protocol);
  const [fps, setFps] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const snapshotTimerRef = useRef(null);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(null);
  const pcRef = useRef(null); // WebRTC peer connection

  // ─ FPS Counter ─
  useEffect(() => {
    fpsTimerRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    return () => clearInterval(fpsTimerRef.current);
  }, []);

  // ─ Protocol Switch ─
  useEffect(() => {
    cleanup();
    setStatus('connecting');

    switch (activeProtocol) {
      case 'mjpeg':    initMJPEG(); break;
      case 'snapshot':  initSnapshot(); break;
      case 'webrtc':   initWebRTC(); break;
      case 'hls':      initHLS(); break;
      case 'rtsp':     initRTSPProxy(); break;
      default:         setStatus('error');
    }

    return cleanup;
  }, [activeProtocol, streamUrl, snapshotUrl, webrtcSignalUrl, hlsUrl]);

  // ─ Cleanup ─
  const cleanup = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (imgRef.current) {
      imgRef.current.src = '';
    }
  }, []);

  // ─ MJPEG Stream ─
  const initMJPEG = () => {
    if (!streamUrl) { setStatus('offline'); return; }
    // MJPEG just needs an <img> tag pointed at the stream URL
    if (imgRef.current) {
      imgRef.current.src = streamUrl;
      imgRef.current.onload = () => {
        setStatus('live');
        frameCountRef.current++;
        setLastUpdate(new Date());
      };
      imgRef.current.onerror = () => {
        setStatus('error');
        onError?.('MJPEG stream failed to load');
      };
    }
  };

  // ─ Snapshot Polling ─
  const initSnapshot = () => {
    const url = snapshotUrl || streamUrl;
    if (!url) { setStatus('offline'); return; }

    const loadSnapshot = () => {
      if (imgRef.current) {
        const cacheBust = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        const tmpImg = new Image();
        tmpImg.crossOrigin = 'anonymous';
        tmpImg.onload = () => {
          if (imgRef.current) {
            imgRef.current.src = tmpImg.src;
            setStatus('live');
            frameCountRef.current++;
            setLastUpdate(new Date());
          }
        };
        tmpImg.onerror = () => {
          setStatus('error');
        };
        tmpImg.src = cacheBust;
      }
    };

    loadSnapshot();
    snapshotTimerRef.current = setInterval(loadSnapshot, refreshInterval);
  };

  // ─ WebRTC (Moonraker camera-streamer) ─
  const initWebRTC = async () => {
    if (!webrtcSignalUrl) { setStatus('offline'); return; }

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().catch(() => {});
          setStatus('live');
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setStatus('error');
        }
      };

      // Add transceiver for receiving video
      pc.addTransceiver('video', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to camera-streamer signaling endpoint
      const res = await fetch(webrtcSignalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'offer', sdp: offer.sdp }),
      });

      const answer = await res.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

    } catch (e) {
      setStatus('error');
      onError?.(`WebRTC failed: ${e.message}`);
    }
  };

  // ─ HLS Stream ─
  const initHLS = () => {
    if (!hlsUrl) { setStatus('offline'); return; }
    if (videoRef.current) {
      videoRef.current.src = hlsUrl;
      videoRef.current.onloadeddata = () => setStatus('live');
      videoRef.current.onerror = () => setStatus('error');
      videoRef.current.play().catch(() => {});
    }
  };

  // ─ RTSP (Bambu Lab — requires Electron/Node proxy) ─
  const initRTSPProxy = () => {
    // RTSP cannot run in browser directly.
    // In Electron, the main process runs an ffmpeg RTSP-to-MJPEG proxy.
    // We fall back to snapshot polling via the proxy endpoint.
    if (!rtspUrl) { setStatus('offline'); return; }

    // The main process exposes a local HTTP endpoint that proxies the RTSP stream
    // Default proxy: http://localhost:8765/camera/{serial}/stream
    const proxyStreamUrl = rtspUrl.replace('rtsps://', 'http://localhost:8765/camera/').replace(':322/streaming/live/1', '/stream');

    if (imgRef.current) {
      imgRef.current.src = proxyStreamUrl;
      imgRef.current.onload = () => {
        setStatus('live');
        frameCountRef.current++;
      };
      imgRef.current.onerror = () => {
        // If proxy not available, fall back to snapshot mode
        setActiveProtocol('snapshot');
      };
    }
  };

  // ─ Snapshot Capture ─
  const captureSnapshot = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const source = videoRef.current?.srcObject ? videoRef.current : imgRef.current;

      if (source instanceof HTMLVideoElement) {
        canvas.width = source.videoWidth;
        canvas.height = source.videoHeight;
        canvas.getContext('2d').drawImage(source, 0, 0);
      } else if (source instanceof HTMLImageElement) {
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;
        canvas.getContext('2d').drawImage(source, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          onSnapshot?.(blob, `${printerName}-${Date.now()}.jpg`);
          // Also trigger download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${printerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,19)}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.92);
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
    }
  }, [printerName, onSnapshot]);

  // ─ Fullscreen Toggle ─
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ─ Available protocols for this brand ─
  const availableProtocols = Object.entries(CAMERA_PROTOCOLS)
    .filter(([, p]) => p.brands.includes(printerBrand))
    .map(([key, p]) => ({ key, ...p }));

  // ─ Status indicator ─
  const statusConfig = {
    connecting: { color: '#f59e0b', label: 'Connecting…' },
    live:       { color: '#22c55e', label: 'Live' },
    error:      { color: '#ef4444', label: 'Error' },
    offline:    { color: '#6b7280', label: 'Offline' },
  };

  const st = statusConfig[status] || statusConfig.offline;

  // ── Styles ─────────────────────────────────────────────────────────────

  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      maxHeight: isFullscreen ? '100vh' : maxHeight,
      aspectRatio: aspectRatio,
      borderRadius: isFullscreen ? 0 : 12,
      overflow: 'hidden',
      background: '#0c0f1a',
      border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.08)',
      fontFamily: "'Manrope', -apple-system, sans-serif",
    },
    media: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      display: 'block',
    },
    overlay: {
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)',
      pointerEvents: 'none',
    },
    topBar: {
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      zIndex: 2,
    },
    bottomBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      zIndex: 2,
    },
    badge: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: 8,
      fontSize: 11.5,
      fontWeight: 600,
      color: '#f1f5f9',
      letterSpacing: 0.3,
    },
    dot: {
      width: 7, height: 7, borderRadius: '50%',
      background: st.color,
      boxShadow: status === 'live' ? `0 0 6px ${st.color}` : 'none',
    },
    controls: {
      display: 'flex', alignItems: 'center', gap: 4,
    },
    btn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      color: '#e2e8f0',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      pointerEvents: 'auto',
    },
    offlineState: {
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      color: 'rgba(255,255,255,0.3)',
    },
    settingsPanel: {
      position: 'absolute', top: 48, right: 14,
      width: 220,
      background: 'rgba(15,17,30,0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 12,
      zIndex: 10,
      pointerEvents: 'auto',
    },
    protocolOption: (isActive) => ({
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px',
      borderRadius: 8,
      background: isActive ? 'rgba(96,165,250,0.15)' : 'transparent',
      border: isActive ? '1px solid rgba(96,165,250,0.3)' : '1px solid transparent',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      fontSize: 12.5,
      fontWeight: 500,
      color: isActive ? '#93bbfd' : '#94a3b8',
    }),
    fpsLabel: {
      fontSize: 11, fontWeight: 600,
      color: 'rgba(255,255,255,0.5)',
      fontVariantNumeric: 'tabular-nums',
    },
  };

  return (
    <div
      ref={containerRef}
      className={`pf-camera-feed ${className}`}
      style={styles.container}
    >
      {/* ── Video/Image Element ──────────────────────────────────────── */}
      {(activeProtocol === 'webrtc' || activeProtocol === 'hls') ? (
        <video
          ref={videoRef}
          style={styles.media}
          autoPlay
          playsInline
          muted
        />
      ) : (
        <img
          ref={imgRef}
          style={styles.media}
          alt={`${printerName} camera`}
          crossOrigin="anonymous"
        />
      )}

      {/* ── Offline / Error State ────────────────────────────────────── */}
      {(status === 'offline' || status === 'error') && (
        <div style={styles.offlineState}>
          <IconOffline />
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {status === 'error' ? 'Camera feed unavailable' : 'No camera configured'}
          </span>
          <span style={{ fontSize: 11.5, opacity: 0.6 }}>
            {status === 'error' ? 'Check connection and retry' : 'Add a camera URL in printer settings'}
          </span>
        </div>
      )}

      {/* ── Overlay Gradient ─────────────────────────────────────────── */}
      {showOverlay && status === 'live' && <div style={styles.overlay} />}

      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      {showControls && (
        <div style={styles.topBar}>
          <div style={styles.badge}>
            <div style={styles.dot} />
            <span>{st.label}</span>
            {status === 'live' && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span style={styles.fpsLabel}>
                  {activeProtocol === 'mjpeg' ? 'MJPEG' : activeProtocol === 'snapshot' ? `${fps} fps` : activeProtocol.toUpperCase()}
                </span>
              </>
            )}
          </div>

          <div style={{ ...styles.controls, pointerEvents: 'auto' }}>
            <button
              style={styles.btn}
              onClick={() => setShowSettings(!showSettings)}
              title="Camera settings"
            >
              <IconSettings />
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Bar ───────────────────────────────────────────────── */}
      {showControls && (
        <div style={styles.bottomBar}>
          <div style={styles.badge}>
            <IconCamera />
            <span>{printerName}</span>
          </div>

          <div style={{ ...styles.controls, pointerEvents: 'auto' }}>
            <button
              style={styles.btn}
              onClick={captureSnapshot}
              title="Take snapshot"
            >
              <IconSnapshot />
            </button>
            <button
              style={styles.btn}
              onClick={() => { cleanup(); setStatus('connecting'); initMJPEG(); }}
              title="Refresh feed"
            >
              <IconRefresh />
            </button>
            <button
              style={styles.btn}
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
            >
              <IconExpand />
            </button>
          </div>
        </div>
      )}

      {/* ── Settings Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={styles.settingsPanel}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, padding: '0 4px' }}>
              Stream Protocol
            </div>
            {availableProtocols.map((p) => (
              <div
                key={p.key}
                style={styles.protocolOption(activeProtocol === p.key)}
                onClick={() => { setActiveProtocol(p.key); setShowSettings(false); }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: activeProtocol === p.key ? '#93bbfd' : '#e2e8f0' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10.5, opacity: 0.6, marginTop: 2 }}>{p.description}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ── Camera Configuration Helper ─────────────────────────────────────────────
// Returns the correct URLs for each printer brand's camera

export function getCameraConfig(brand, host, port, options = {}) {
  const base = `http://${host}:${port || 80}`;

  switch (brand) {
    case 'octoprint':
      return {
        protocol: 'mjpeg',
        streamUrl: `${base}/webcam/?action=stream`,
        snapshotUrl: `${base}/webcam/?action=snapshot`,
      };

    case 'klipper': {
      const webcamName = options.webcamName || '';
      const nameParam = webcamName ? `?name=${webcamName}` : '';
      return {
        protocol: options.preferWebRTC ? 'webrtc' : 'mjpeg',
        streamUrl: `${base}/webcam/?action=stream${nameParam ? '&' + nameParam.slice(1) : ''}`,
        snapshotUrl: `${base}/webcam/?action=snapshot${nameParam ? '&' + nameParam.slice(1) : ''}`,
        webrtcSignalUrl: options.preferWebRTC ? `${base}/webcam/webrtc${nameParam}` : '',
        hlsUrl: options.preferHLS ? `${base}/webcam/stream.m3u8${nameParam}` : '',
      };
    }

    case 'bambulab':
      return {
        protocol: 'rtsp',
        rtspUrl: `rtsps://${host}:322/streaming/live/1`,
        credentials: { username: 'bblp', password: options.accessCode || '' },
      };

    case 'prusa':
      return {
        protocol: 'snapshot',
        snapshotUrl: `${base}/api/v1/cameras/snap`,
        refreshInterval: 2000,
      };

    case 'creality':
      return {
        protocol: 'mjpeg',
        streamUrl: `${base}/protocal/printer/camera/stream`,
        snapshotUrl: `${base}/protocal/printer/camera/snapshot`,
      };

    case 'duet':
      return {
        protocol: 'mjpeg',
        streamUrl: `${base}/webcam/stream`,
        snapshotUrl: `${base}/webcam/snap`,
      };

    case 'repetier': {
      const printerSlug = options.printerSlug || 'default';
      return {
        protocol: 'mjpeg',
        streamUrl: `${base}/printer/cammjpg/${printerSlug}`,
        snapshotUrl: `${base}/printer/camshot/${printerSlug}`,
      };
    }

    default:
      return { protocol: 'snapshot', snapshotUrl: '', streamUrl: '' };
  }
}


// ── Multi-Camera Grid Helper ────────────────────────────────────────────────
// For dashboard views showing all printer cameras at once

export function CameraGrid({ printers = [], columns = 2 }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: 12,
    width: '100%',
  };

  return (
    <div style={gridStyle}>
      {printers.map((printer) => {
        const config = getCameraConfig(
          printer.brand,
          printer.host,
          printer.port,
          printer.cameraOptions || {}
        );
        return (
          <CameraFeed
            key={printer.id}
            printerName={printer.name}
            printerBrand={printer.brand}
            {...config}
          />
        );
      })}
    </div>
  );
}
