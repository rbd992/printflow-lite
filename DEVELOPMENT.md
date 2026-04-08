# PrintFlow Lite — Developer Notes

## Git Commit Tag System

Every commit is tagged to indicate which product(s) it affects. This helps keep the Enterprise and Lite codebases in sync:

| Tag | Meaning | Action |
|-----|---------|--------|
| `[BOTH]` | Works in both Enterprise and Lite | Changes are relevant to both products |
| `[LITE]` | Lite-only feature or fix | Only applies to this repo |
| `[ENT]`  | Enterprise-only (NAS, Docker) | Only applies to the Enterprise repo |

### Examples
```
[BOTH] fix: filament catalogue price updates
[BOTH] feat: expand maintenance task catalogue
[LITE] fix: setup wizard network error on step 4
[LITE] feat: parallel update check at startup
[ENT]  feat: Bambu Cloud OAuth integration
[ENT]  fix: NAS deploy workflow
```

---

## Features by Product

### Shared (BOTH) — works in both Lite and Enterprise
- Orders, Finance, Customers, Quotes
- Filament management (multi-brand catalogue)
- Parts catalogue (brand-agnostic)
- Maintenance tasks (brand-agnostic with brand filter)
- Printers (local LAN)
- Users & roles (Owner / Manager / Operator)
- Dashboard, Job Queue, Print History
- Shipping, Marketing, Models
- Settings (theme, currency, company info)
- Changelog, Help

### Lite Only
- Bundled local server (spawned by Electron)
- 5-step setup wizard (first-run)
- GitHub Releases auto-update check
- No server URL config (always localhost)
- Single machine only

### Enterprise Only
- NAS/Docker server deployment
- Bambu Cloud integration
- Customer portal (/track page)
- Tailscale remote access
- Multi-machine access

---

## Project Structure

```
printflow-lite/
├── src/
│   ├── main/
│   │   ├── main.js         — Electron main, server spawn, update check
│   │   └── preload.js      — IPC bridge to renderer
│   ├── renderer/
│   │   ├── App.js          — Router, setup wizard gate
│   │   ├── index.js        — React entry
│   │   ├── index.css       — Design tokens + global styles
│   │   ├── api/client.js   — Axios (always localhost:3001)
│   │   ├── stores/authStore.js
│   │   ├── data/
│   │   │   ├── filamentCatalogue.js    — Multi-brand filament catalogue
│   │   │   └── maintenanceCatalogue.js — Brand-agnostic maintenance tasks
│   │   └── pages/          — All UI pages
│   └── server/
│       ├── package.json     — Server-only dependencies
│       ├── index.js         — Server entry (localhost only)
│       ├── app.js           — Express app
│       ├── db/              — SQLite connection + migrations
│       ├── routes/          — All API routes
│       ├── services/        — Logger, Socket.io
│       └── middleware/      — Auth
├── assets/
│   ├── icon.icns            — Mac app icon
│   ├── icon.ico             — Windows app icon
│   ├── icon.png             — Linux app icon
│   └── entitlements.mac.plist
├── public/index.html
├── package.json             — appId: com.printflow.lite
└── .github/workflows/
    └── release.yml          — Builds DMG + EXE + AppImage on version tag push
```

---

## Code Signing Status

### Mac
- **Current:** Ad-hoc signed (free)
- **User experience:** Right-click → Open on first launch (once only)
- **To upgrade:** Apple Developer Program ($99/yr) → add CSC_LINK + APPLE_ID secrets to GitHub

### Windows
- **Current:** Unsigned
- **User experience:** SmartScreen "More info" → "Run anyway"
- **To upgrade (free):** Azure Trusted Signing for open source projects
  - Sign up at portal.azure.com
  - Add secrets: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_ENDPOINT, AZURE_CODE_SIGNING_NAME, AZURE_CERT_PROFILE
  - Uncomment the Azure signing lines in `.github/workflows/release.yml`

### Linux
- AppImage — no signing required

---

## Release Process

```bash
# Bump version in package.json, then:
git add -A
git commit -m "[LITE] release: v0.x.x"
git tag v0.x.x
git push origin main
git push origin v0.x.x
# GitHub Actions builds Mac (arm64 + x64) + Windows EXE + Linux AppImage
# and publishes them to GitHub Releases automatically
```

---

## Development Setup

```bash
npm install
cd src/server && npm install && cd ../..
npm start        # React dev server + Electron
npm run build    # Full production build
```

> Node.js 20+ required.
