# PrintFlow Lite — v0.1.4-beta Release Notes

**Release Date:** April 8, 2026
**Previous Version:** 0.1.3-beta

---

## What's New in v0.1.4

### Redesigned Login Page
- Complete Apple-inspired glassmorphism redesign
- Animated mesh gradient background with subtle motion
- Frosted glass card with `backdrop-filter` blur
- Custom SVG icons throughout (no external icon deps)
- Staggered entrance animations via Framer Motion
- Password visibility toggle with smooth state transitions
- Remember Me checkbox with custom styled control
- Error/success state animations with contextual banners
- Version badge in footer with live pulse indicator
- Responsive layout for all Electron window sizes
- Full `-webkit-app-region: drag` support (drag window from background)
- Typography: Manrope (Google Fonts) — clean, professional, not overused

### Multi-Brand 3D Printer API Service
Full REST/WebSocket API clients with maximum endpoint coverage for:

| Brand | Endpoints | Auth | Camera | Realtime |
|---|---|---|---|---|
| **OctoPrint** | 25+ (state, temp, job, files, gcode, system, profiles, timelapse, slicing, logs, plugins) | API Key | MJPEG, Snapshot | SockJS |
| **Klipper / Moonraker** | 35+ (status, gcode, files, metadata, history, job queue, database, update manager, power, sensors, bed mesh, input shaper) | API Key / One-shot | MJPEG, WebRTC, HLS, Snapshot | WebSocket |
| **Bambu Lab** | MQTT topic builder + Cloud REST (devices, tasks, projects, firmware) | Access Code / Cloud Token | RTSP (via proxy) | MQTT |
| **Prusa Connect / PrusaLink** | 12+ (info, status, job, files, storage, transfer, cameras, MMU) | API Key / Bearer | Snapshot, MJPEG | Polling |
| **Creality** | 12+ local (status, temp, job, files, gcode, leveling) + Cloud (printers, models, history, slicing) | Token | MJPEG, Snapshot | Polling |
| **Duet3D / RepRapFirmware** | 20+ (object model, legacy status, gcode, files, macros, heightmap, network) | Session/Password | MJPEG, Snapshot | Long-poll |
| **Repetier Server** | 15+ (multi-printer, state, temp, job, gcode, models, logs, messages, updates) | API Key | MJPEG, Snapshot | WebSocket |

**Unified Features:**
- `createPrinterAPI(config)` factory — one function, any brand
- `normalizeStatus(brand, rawData)` — converts any brand's response to common format
- Brand-agnostic command dispatch (pause, resume, cancel, home, set temps, gcode)

### Cloud Integrations
New `CloudService.js` module with full API clients for:

- **Bambu Cloud** — devices, task history, projects, firmware updates, remote print
- **Prusa Connect** — multi-printer management, remote jobs, file sync, camera snapshots, events
- **Creality Cloud** — printer list, model library, remote printing, print history, slicer profiles
- **OctoPrint Anywhere / Obico** — remote status, AI failure detection, camera, notifications
- **Google Drive** — auto-create PrintFlow folder, upload/download files, database backup
- **Dropbox** — folder sync, file upload/download, database backup

**Cloud Sync Manager:**
- `CloudSyncManager` class for managing multiple cloud connections
- Auto-sync scheduler with configurable intervals
- Event listener system for sync status notifications
- Connection test method for all providers

### Universal Camera Feed Component
New `CameraFeed.js` React component supporting:

- **MJPEG Streams** — OctoPrint, Klipper, Creality, Duet, Repetier
- **Snapshot Polling** — All brands (fallback mode with configurable interval)
- **WebRTC** — Moonraker camera-streamer (lowest latency)
- **HLS** — Moonraker adaptive bitrate streaming
- **RTSP** — Bambu Lab (via ffmpeg proxy in main process)

**UI Features:**
- Live/Connecting/Error/Offline status indicator with color coding
- Protocol selector dropdown (shows available protocols per brand)
- Snapshot capture button (downloads JPEG)
- Fullscreen toggle
- FPS counter
- Printer name overlay
- `CameraGrid` helper component for multi-camera dashboard views
- `getCameraConfig(brand, host, port)` auto-generates correct URLs per brand

### RTSP Camera Proxy Service
New `cameraProxy.js` for Electron main process:
- HTTP server on `localhost:8765` that proxies RTSP → MJPEG
- Automatic ffmpeg management (start/stop based on connected clients)
- JPEG frame parsing from ffmpeg stdout
- Snapshot endpoint with 5s cache
- Auto-restart on ffmpeg crash (3s backoff)
- Status and listing API endpoints
- Bambu Lab convenience method (`registerBambuCamera`)
- Supports up to 8 simultaneous camera streams

### Server-Side Enhancements
New/updated database tables and API routes:
- `printers` table expanded: `camera_enabled`, `camera_protocol`, `camera_url`, `camera_snapshot`, `camera_webrtc`, `camera_rtsp` columns
- `cloud_connections` table: full cloud credential storage with token masking
- `printer_status_log` table: historical temperature/progress logging
- `camera_snapshots` table: snapshot metadata storage
- `GET/POST/PUT/DELETE /printers` — full CRUD with brand validation
- `POST /printers/:id/status` — status logging + Socket.io broadcast
- `GET /printers/:id/status/history` — historical status data
- `POST /printers/:id/test` — connectivity test
- `GET/POST/PUT/DELETE /printers/cloud/connections` — cloud CRUD
- `POST /printers/:id/camera/snapshot` — snapshot metadata
- `GET /printers/meta/brands` — supported brands reference

### State Management
New `printerStore.js` Zustand store:
- Automatic API instance creation per printer
- Status polling with configurable interval (default 3s)
- Brand-agnostic command dispatch
- Cloud connection management
- Camera config management
- Auto-generated camera URLs per brand

---

## File Manifest

```
NEW/REPLACED FILES:
src/renderer/pages/LoginPage.js         ← Full redesign (drop-in replacement)
src/renderer/pages/LoginPage.css        ← New stylesheet (drop-in replacement)
src/renderer/api/PrinterAPI.js          ← NEW — Multi-brand API service
src/renderer/api/CloudService.js        ← NEW — Cloud integrations
src/renderer/components/CameraFeed.js   ← NEW — Universal camera component
src/renderer/stores/printerStore.js     ← NEW — Zustand printer state
src/server/routes/printers.js           ← NEW — Server API routes
src/server/services/cameraProxy.js      ← NEW — RTSP proxy for main process
```

---

## Integration Guide

### 1. Drop in the files
Copy each file to the matching path in your project tree.

### 2. Update package.json version
```json
"version": "0.1.4-beta"
```

### 3. Register the printer routes in your Express server
In `src/server/index.js` (or wherever routes are mounted):
```js
const printerRoutes = require('./routes/printers');
// ... after db and io are initialized:
app.use('/printers', printerRoutes(db, io));
```

### 4. Start the camera proxy in main.js
In `src/main/main.js`, after the app is ready:
```js
const CameraProxyService = require('../server/services/cameraProxy');
const cameraProxy = new CameraProxyService();

app.on('ready', async () => {
  // ... existing setup ...
  await cameraProxy.start();
});

app.on('before-quit', () => {
  cameraProxy.stop();
});
```

### 5. Import the new store where needed
```js
import usePrinterStore from '../stores/printerStore';
// In any component:
const { printers, fetchPrinters, startAllPolling } = usePrinterStore();
```

### 6. Use the CameraFeed component
```jsx
import CameraFeed, { getCameraConfig } from '../components/CameraFeed';

const config = getCameraConfig('octoprint', '192.168.1.100', 80);
<CameraFeed printerName="Ender 3" printerBrand="octoprint" {...config} />
```

### 7. Google Fonts (LoginPage)
The login CSS imports Manrope from Google Fonts. Since the app works offline
after install, you may want to bundle the font locally. Download the woff2 files
and update the @import in LoginPage.css to a local path.

---

## Notes
- ffmpeg is required for RTSP camera proxy (Bambu Lab). Bundle it with
  electron-builder's extraResources or instruct users to install it.
- Cloud OAuth (Google Drive, Dropbox) requires client IDs — configure in
  your app settings before those integrations will work.
- Bambu Lab MQTT requires the `mqtt` npm package in the server dependencies.
  Run: `cd src/server && npm install mqtt`
