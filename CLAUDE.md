# PrintFlow Lite — Development Notes

## Git Commit Tag System

Every commit must be tagged to indicate which product(s) it affects:

| Tag | Meaning | Action |
|-----|---------|--------|
| `[BOTH]` | Works in both Enterprise and Lite | Auto-synced to printflow-lite via GitHub Action |
| `[LITE]` | Lite-only feature or fix | Only in this repo |
| `[ENT]`  | Enterprise-only (NAS, Bambu Cloud, Docker) | Only in printflow repo |

### Examples
```
[BOTH] fix: CSP header on /track enables fetch
[BOTH] feat: expand filament catalogue with Hatchbox, eSUN
[LITE] feat: bundled server spawn in main.js
[LITE] fix: setup wizard step 3 password validation
[ENT]  feat: Bambu Cloud OAuth integration
[ENT]  fix: NAS deploy workflow Tailscale authkey
```

## Features by Version

### Shared (BOTH) — works in both
- Orders, Finance, Customers, Quotes
- Filament management (expanded multi-brand catalogue)
- Parts catalogue (brand-agnostic)
- Maintenance tasks (brand-agnostic with brand filter)
- Printers (local LAN — no Bambu Cloud required)
- Users & roles (Owner / Manager / Operator)
- Dashboard, Job Queue, Print History
- Shipping, Marketing, Models
- Settings (theme, currency, company info)
- Changelog, Help

### Lite Only (LITE)
- Bundled local server (spawned by Electron)
- 5-step setup wizard (first-run)
- GitHub Releases auto-update
- No server URL config (always localhost)

### Enterprise Only (ENT)
- NAS/Docker server deployment
- Bambu Cloud integration
- Customer portal (/track page)
- Tailscale remote access
- Multi-machine access
- NAS-based auto-updates

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
│   │   │   ├── filamentCatalogue.js   — [BOTH] Multi-brand catalogue
│   │   │   └── maintenanceCatalogue.js — [BOTH] Brand-agnostic tasks
│   │   └── pages/
│   │       ├── LoginPage.js      — [LITE] Loading bar + professional design
│   │       ├── SetupWizard.js    — [LITE] 5-step first-run wizard
│   │       ├── AppShell.js       — [LITE] Sidebar (no Bambu Cloud)
│   │       └── ... shared pages
│   └── server/
│       ├── index.js         — Bundles server entry (localhost only)
│       ├── app.js           — Express app (no Bambu Cloud routes)
│       ├── db/              — SQLite connection + migrations
│       ├── routes/          — All shared API routes
│       ├── services/        — Logger, Socket.io
│       └── middleware/      — Auth
├── assets/
│   ├── icon.icns            — Mac app icon
│   ├── icon.ico             — Windows app icon
│   ├── icon.png             — Linux app icon
│   └── entitlements.mac.plist — Mac signing entitlements
├── public/index.html
├── package.json             — appId: com.printflow.lite
└── .github/workflows/
    └── release.yml          — Build DMG + EXE + AppImage → GitHub Releases
```

## Code Signing Status

### Mac
- **Current:** Ad-hoc signed (free)
- **User experience:** Right-click → Open on first launch (once only)
- **To upgrade:** Apple Developer Program ($99/yr) → add CSC_LINK + APPLE_ID secrets

### Windows
- **Current:** Unsigned
- **User experience:** SmartScreen "More info" → "Run anyway"
- **To upgrade (free):** Azure Trusted Signing for open source
  - Sign up at portal.azure.com
  - Create Trusted Signing account
  - Add secrets: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_ENDPOINT, AZURE_CODE_SIGNING_NAME, AZURE_CERT_PROFILE
  - Uncomment the Azure signing lines in .github/workflows/release.yml

### Linux
- AppImage — no signing required, works on all major distros

## Release Process

```bash
# Bump version in package.json, then:
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
# GitHub Actions builds Mac + Win + Linux and publishes to GitHub Releases
```

## Development

```bash
npm install
npm start        # React dev server + Electron
npm run build    # Full production build
```

**Note:** The bundled server lives at `src/server/`. In dev mode, Electron spawns it from there.
In production, electron-builder copies it to `Resources/server/` via `extraResources`.
