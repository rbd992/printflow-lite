<div align="center">

<img src="assets/icon.png" alt="PrintFlow Lite" width="80" height="80" style="border-radius: 18px"/>

# PrintFlow Lite

**Standalone 3D print business management — no server, no subscription, no cloud required.**

[![Release](https://img.shields.io/github/v/release/rbd992/printflow-lite?include_prereleases&label=latest&color=0071E3)](https://github.com/rbd992/printflow-lite/releases)
[![Downloads](https://img.shields.io/github/downloads/rbd992/printflow-lite/total?color=30D158)](https://github.com/rbd992/printflow-lite/releases)
[![License](https://img.shields.io/github/license/rbd992/printflow-lite?color=FF9F0A)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)](https://github.com/rbd992/printflow-lite/releases)

[**Download**](https://github.com/rbd992/printflow-lite/releases/latest) · [**Report a Bug**](https://github.com/rbd992/printflow-lite/issues/new?template=bug_report.md) · [**Request a Feature**](https://github.com/rbd992/printflow-lite/issues/new?template=feature_request.md)

</div>

---

## What is PrintFlow Lite?

PrintFlow Lite is a desktop app built for independent 3D print shop owners. It runs entirely on your computer — your data never leaves your machine. No monthly fees, no accounts, no internet required after install.

Built with Electron, React, and SQLite. Designed to feel like a native app on Mac, Windows, and Linux.

> **Looking for the full multi-machine version?** [PrintFlow Enterprise](https://github.com/rbd992/printflow) runs on your NAS and lets your whole team connect from anywhere on your network.

---

## Features

### Orders & Customers
- Full order lifecycle — New → Queued → Printing → QC → Packed → Shipped → Paid
- Customer database auto-built from order history
- Price calculator with material cost, labour, markup, and HST
- Tracking number and carrier fields per order
- CSV export

### Production
- Job queue with kanban-style board (Queued / Printing / Done / Failed)
- Print history log across all printers
- Multi-brand filament catalogue — 12 brands including Bambu Lab, Prusament, Hatchbox, eSUN, Polymaker, Overture, Sunlu, Elegoo, Inland, MatterHackers, 3D Printing Canada, and Amazon Basics
- Brand-agnostic parts & maintenance tracker — 35+ tasks for generic FDM, Bambu Lab, Prusa, Creality, and Voron
- Printer management — any brand, any model

### Business
- Income and expense tracking with HST
- Finance dashboard with 7-day revenue chart
- Quote and invoice builder with price breakdown
- Shipping integration (Canada Post — coming soon)
- Marketing platform tracker

### App
- First-run setup wizard — ready in under 2 minutes
- Multi-user with Owner / Manager / Operator roles
- Light and dark mode
- Automatic update checks via GitHub Releases — no auto-install, you always choose when to update
- All data stored locally in SQLite — back up by copying one file

---

## Download

Go to the [**Releases page**](https://github.com/rbd992/printflow-lite/releases/latest) and download the file for your platform:

| Platform | File | Notes |
|----------|------|-------|
| macOS (Apple Silicon M1–M4) | `PrintFlow Lite-x.x.x-arm64.dmg` | Right-click → Open on first launch |
| macOS (Intel) | `PrintFlow Lite-x.x.x.dmg` | Right-click → Open on first launch |
| Windows | `PrintFlow Lite Setup x.x.x.exe` | Click "More info → Run anyway" if SmartScreen appears |
| Linux | `PrintFlowLite-x.x.x.AppImage` | `chmod +x` then run |

### Mac "damaged app" fix

If macOS says the app is damaged, run this once in Terminal:

```bash
xattr -cr "/Applications/PrintFlow Lite.app"
```

This removes the macOS quarantine flag. The app is ad-hoc signed — full notarization requires an Apple Developer subscription ($99/yr).

---

## Getting Started

1. Download and install the app for your platform
2. Launch PrintFlow Lite — the setup wizard opens automatically
3. Enter your business name and create your owner account
4. Start adding orders, filament, and printers

That's it. Everything runs locally. No internet needed after install (except for update checks and external links).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electron](https://electronjs.org) |
| UI | [React](https://react.dev) + [Recharts](https://recharts.org) |
| Local server | [Express](https://expressjs.com) + [Socket.io](https://socket.io) |
| Database | [SQLite](https://sqlite.org) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| State | [Zustand](https://zustand-demo.pmnd.rs) |
| Auth | JWT + bcrypt |
| Build | [electron-builder](https://electron.build) + GitHub Actions |

---

## Project Structure

```
printflow-lite/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # App lifecycle, server spawn, update check
│   │   └── preload.js  # IPC bridge to renderer
│   ├── renderer/       # React frontend
│   │   ├── pages/      # All UI pages
│   │   ├── api/        # Axios client + Socket.io
│   │   ├── stores/     # Zustand state
│   │   └── data/       # Filament + maintenance catalogues
│   └── server/         # Bundled Express server
│       ├── routes/     # REST API endpoints
│       ├── db/         # SQLite connection + migrations
│       └── services/   # Logger, Socket.io
├── assets/             # App icons + entitlements
├── public/             # HTML entry point
└── .github/workflows/  # GitHub Actions — builds DMG/EXE/AppImage on tag push
```

---

## Building from Source

```bash
# Clone
git clone https://github.com/rbd992/printflow-lite.git
cd printflow-lite

# Install frontend dependencies
npm install

# Install bundled server dependencies
cd src/server && npm install && cd ../..

# Run in development mode
npm start

# Build production app
npm run build
```

> **Node.js 20+ required.** The bundled server uses `better-sqlite3` which requires native compilation on some platforms.

---

## Contributing

Contributions are welcome and genuinely appreciated. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get involved.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built by <a href="https://github.com/rbd992">Rob Dunn</a> in Alliston, Ontario 🇨🇦</sub>
</div>
