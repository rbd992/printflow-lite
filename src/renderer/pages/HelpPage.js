import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    articles: [
      {
        title: 'Welcome to PrintFlow Lite',
        content: `PrintFlow Lite is a complete 3D print business management suite that runs entirely on your computer. No subscription, no cloud, no internet required after installation.

Your data is stored locally in a SQLite database, giving you full control over your information. The app bundles its own server which starts automatically when you launch it.

**What you can do with PrintFlow Lite:**
• Manage orders from intake to delivery
• Track filament inventory across 12+ brands
• Monitor and control your 3D printers in real time
• Manage customers and generate quotes
• Track income and expenses with HST/tax support
• Manage parts and maintenance schedules
• Connect your Shopify and Etsy stores for order sync
• Post to Facebook, Instagram, TikTok, and YouTube
• View production analytics and financial reports

**System Requirements:**
• macOS 12+ (Apple Silicon or Intel)
• Windows 10/11 (64-bit)
• Ubuntu 22.04+ or similar Linux
• 4GB RAM minimum, 8GB recommended
• 500MB disk space`
      },
      {
        title: 'First Launch & Setup Wizard',
        content: `When you launch PrintFlow Lite for the first time, the setup wizard will guide you through initial configuration.

**Step 1 — Welcome**
Read the overview and click Get Started.

**Step 2 — Business Info**
Enter your business name and contact email. This information appears on quotes and invoices. You can change it later in Settings → General.

**Step 3 — Create Your Account**
Create the Owner account. This is your primary login. Choose a strong password (8+ characters). You can add more team members later in the Users section.

**Step 4 — Preferences**
Select your currency and preferred theme. These can be changed at any time in Settings.

**Waiting for server…**
After clicking Finish Setup, the app starts the local server and creates your database. This normally takes 2–5 seconds. If it takes longer, see the Troubleshooting section.

**After setup:**
You'll be logged in automatically and taken to the Dashboard. The setup wizard will not appear again unless you reset the app data.`
      },
      {
        title: 'Navigating PrintFlow',
        content: `**Sidebar Navigation**
The sidebar on the left contains all sections:

• **Dashboard** — Overview of orders, revenue, and printer status
• **Orders** — All customer orders with status tracking
• **Job Queue** — Kanban-style print queue
• **Print History** — Completed print log
• **Customers** — Customer database (auto-built from orders)
• **Quotes** — Quote and invoice builder
• **Printers** — Registered printers and live status
• **Filament** — Spool inventory and usage tracking
• **Parts** — Spare parts and consumables
• **Finance** — Income, expenses, and profit tracking
• **Shipping** — Shipping and tracking
• **Marketing** — Social media and platform connections
• **Settings** — All configuration
• **Users** — Team management (Owner only)
• **Help** — This documentation

**Theme Toggle**
Click the sun/moon icon in the bottom-left of the sidebar to switch between dark and light mode.

**Update Indicator**
When a new version is available, a blue banner appears above the user info in the sidebar.`
      },
    ]
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><path d="M12 12H3"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    articles: [
      {
        title: 'Order Status Flow',
        content: `Every order moves through a lifecycle of statuses:

**New** → Order received, not yet confirmed
**Quoted** → Quote sent to customer, awaiting approval
**Confirmed** → Customer approved, ready to schedule
**Queued** → Added to the print queue
**Printing** → Currently being printed
**Printed** → Print complete, awaiting post-processing
**Post-Processing** → Sanding, painting, assembly, etc.
**QC** → Quality check in progress
**Packed** → Packaged and ready to ship
**Shipped** → Shipped with tracking
**Delivered** → Confirmed delivered
**Paid** → Payment received
**Cancelled** → Order cancelled

**Moving orders through statuses:**
Click on any order to open it, then use the status dropdown to advance it. You can also bulk-update statuses from the order list.

**Auto-tracking:**
When you add a tracking number and change status to Shipped, the order is automatically marked for delivery monitoring.`
      },
      {
        title: 'Creating Orders',
        content: `**From the Orders page:**
Click "+ New Order" to create a new order manually.

**Required fields:**
• Customer name
• Description of what they want printed
• Price

**Optional but recommended:**
• Customer email — enables sending quotes and updates
• Platform — where the order came from (Direct, Etsy, Shopify, etc.)
• Filament — which spool will be used (tracks usage)
• Due date — shows on the queue board
• Notes — internal notes about the order

**From Shopify/Etsy:**
If you have Shopify or Etsy connected in Settings → Integrations, new orders are imported automatically based on your sync settings.

**Price Calculator:**
The built-in calculator helps you price jobs based on:
• Material cost (from filament spool price)
• Print time estimate
• Markup percentage
• Shipping`
      },
    ]
  },
  {
    id: 'printers',
    title: 'Printer Connections',
    icon: <svg width="16" height="16" viewBox="0 0 64 64" fill="none"><rect x="6" y="10" width="5" height="36" rx="2.5" fill="currentColor" opacity="0.35"/><rect x="53" y="10" width="5" height="36" rx="2.5" fill="currentColor" opacity="0.35"/><rect x="6" y="10" width="52" height="7" rx="3.5" fill="currentColor" opacity="0.6"/><rect x="22" y="10" width="20" height="11" rx="3" fill="currentColor"/><path d="M29 21 L32 29 L35 21 Z" fill="currentColor"/><rect x="20" y="42" width="24" height="4.5" rx="2" fill="currentColor" opacity="0.55"/><rect x="7" y="50" width="50" height="7" rx="3.5" fill="currentColor" opacity="0.6"/></svg>,
    articles: [
      {
        title: 'Bambu Lab Setup',
        content: `Bambu Lab printers connect via MQTT over your local network. This is the most feature-rich integration.

**Step 1 — Find your credentials on the printer:**
On the touchscreen, go to: Settings → Network
Note down:
• IP Address
• Access Code (8-character code)
• Serial Number

**Step 2 — Optional: Enable LAN-only mode**
In the same Network menu, you can enable LAN-only mode. This prevents the printer from connecting to Bambu Cloud and gives you direct control. Recommended for privacy.

**Step 3 — Enter in PrintFlow:**
Settings → Printer Connections → Bambu Lab
Enter the IP, Access Code, and Serial Number.
Toggle "Enable Bambu integration" and Save.

**What you get:**
• Real-time print progress and layer count
• Nozzle, bed, and chamber temperatures
• AMS filament slot status and which slot is active
• Print time remaining
• Error and warning notifications
• Camera feed (RTSPS stream — requires Bambu viewer or VLC)

**Supported models:** X1C, X1E, P1S, P1P, A1, A1 Mini`
      },
      {
        title: 'Prusa Setup (PrusaLink)',
        content: `Prusa MK4, MK3.9, and XL connect via PrusaLink — a local HTTP API.

**Step 1 — Enable PrusaLink on your Prusa:**
• Go to: Settings → Network → PrusaLink
• Enable PrusaLink
• Note the **API Key** shown on screen

**Step 2 — Find your printer IP:**
Settings → Network → IP Address

**Step 3 — Enter in PrintFlow:**
Settings → Printer Connections → Prusa
Enter IP address and API Key.
Toggle "Enable Prusa integration" and Save.

**Older models (MK3S, MK2S):**
Use OctoPrint integration instead. Install OctoPrint on a Raspberry Pi connected to your printer via USB.

**PrusaConnect (Cloud):**
Prusa's cloud service is separate from PrusaLink. PrintFlow uses PrusaLink (local API) for direct connection without cloud dependency.`
      },
      {
        title: 'Klipper / Moonraker Setup',
        content: `Klipper works with any printer that has the Klipper firmware installed. Moonraker is required as the API layer.

**Prerequisites:**
• Klipper installed on a Raspberry Pi or similar SBC
• Moonraker installed and running (usually installed alongside Klipper via KIAUH)
• Mainsail, Fluidd, or similar UI (optional but recommended for setup)

**Step 1 — Find your Moonraker URL:**
It's typically: http://[your-pi-ip]:7125
Or: http://mainsailos.local:7125

**Step 2 — Optional: Get API Key:**
In Moonraker config (/home/pi/printer_data/config/moonraker.conf):
Look for [authorization] section and your API key.
If [authorization] is not configured, you don't need an API key.

**Step 3 — Enter in PrintFlow:**
Settings → Printer Connections → Klipper/Moonraker
Enter Moonraker URL and API Key (if required).
Toggle enable and Save.

**What you get:**
• Full print status from Klipper
• All temperature readings (hotend, bed, chamber, MCU)
• Print progress and time remaining
• GCode macro list
• Emergency stop button
• Camera feed via Crowsnest or mjpeg-streamer

**Compatible printers:** Voron V2.4, Voron Trident, Voron 0, Ratrig V-Core, custom Ender 3 conversions, and any printer running Klipper.`
      },
      {
        title: 'OctoPrint Setup',
        content: `OctoPrint is a universal 3D printer interface that works with virtually any printer via USB serial connection.

**When to use OctoPrint:**
• Older Prusa printers (MK3S, MK2, MK1)
• Older Creality/Ender printers without network capability
• Any printer that doesn't have a native network API
• When you want a universal solution for mixed printer fleet

**Step 1 — Install OctoPrint:**
The easiest method is OctoPi — a pre-built Raspberry Pi image with OctoPrint.
Download from: https://octoprint.org/download/

**Step 2 — Get your API Key:**
In OctoPrint web interface: Settings (wrench icon) → API → Global API Key → Copy

**Step 3 — Find OctoPrint URL:**
Usually: http://octopi.local or http://[raspberry-pi-ip]:5000

**Step 4 — Enter in PrintFlow:**
Settings → Printer Connections → OctoPrint
Enter URL and API Key.
Toggle enable and Save.`
      },
    ]
  },
  {
    id: 'integrations',
    title: 'Social & E-Commerce',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><path d="M8 6h8M8 18h8M5 9v6M19 9v6"/></svg>,
    articles: [
      {
        title: 'Facebook & Instagram Setup',
        content: `Facebook and Instagram use the same developer app.

**Step 1 — Create a Facebook Developer Account:**
1. Go to https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in app name and contact email

**Step 2 — Add the required products:**
In your app dashboard, add:
• Pages API (for posting to your Facebook Page)
• Instagram Graph API (for Instagram posts)

**Step 3 — Configure permissions:**
In App Review → Permissions, request:
• pages_manage_posts
• pages_read_engagement
• pages_manage_metadata
• instagram_basic
• instagram_content_publish

**Step 4 — Generate a Page Access Token:**
Use the Graph API Explorer (https://developers.facebook.com/tools/explorer/) to generate a long-lived Page Access Token.

**Step 5 — Enter credentials in PrintFlow:**
Settings → Integrations → Facebook
Enter App ID, App Secret, Page ID, and Page Access Token.

**Finding your Page ID:**
Go to your Facebook Page → About → scroll to bottom for Page ID.

**Instagram Account ID:**
Use the Graph API Explorer: GET /me/accounts then find your Instagram Business Account.

**Note:** Instagram posting requires a Business or Creator account linked to your Facebook Page.`
      },
      {
        title: 'Shopify Integration',
        content: `The Shopify integration syncs orders bidirectionally between your Shopify store and PrintFlow.

**Step 1 — Create a Private App in Shopify:**
1. Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → "Create an app"
3. Name it "PrintFlow Lite"

**Step 2 — Configure API scopes:**
Under "Configuration" → "Admin API access scopes", enable:
• read_orders, write_orders
• read_products, write_products
• read_inventory, write_inventory
• read_customers
• read_fulfillments, write_fulfillments
• read_shipping

**Step 3 — Install and get credentials:**
Click "Install app" then copy:
• Admin API access token (starts with shpat_)
• API key
• API secret key

**Step 4 — Enter in PrintFlow:**
Settings → Integrations → Shopify
Enter your store URL (yourstore.myshopify.com) and the Admin API access token.

**Order Sync:**
With "Auto-import new orders" enabled, new Shopify orders appear in PrintFlow automatically. When you mark an order as Shipped in PrintFlow with a tracking number, the fulfillment is updated in Shopify.

**Product sync:**
PrintFlow can read your Shopify product listings to pre-fill order descriptions.`
      },
      {
        title: 'Etsy Integration',
        content: `The Etsy integration uses the Etsy API v3 to sync orders and listings.

**Step 1 — Register as an Etsy Developer:**
1. Go to https://www.etsy.com/developers
2. Sign in with your Etsy seller account
3. Click "Register as a developer"

**Step 2 — Create an app:**
Click "Create a new app" and fill in:
• App name: PrintFlow Lite
• Description: 3D print shop management
• Callback URL: http://localhost:3001/api/etsy/callback

**Step 3 — Request scopes:**
Under "Requested Permissions", select:
• listings_r, listings_w
• transactions_r, transactions_w
• billing_r
• profile_r, email_r

**Step 4 — OAuth flow:**
Etsy uses OAuth 2.0 with PKCE. After entering your API key and secret in PrintFlow's settings, click the authorization link to complete the OAuth flow. Your browser will open Etsy's login page.

**Step 5 — Enter in PrintFlow:**
Settings → Integrations → Etsy
Enter Keystring (API Key) and Shared Secret.

**What syncs:**
• New Etsy orders → PrintFlow orders
• Custom orders and convos
• When marked shipped in PrintFlow → Etsy tracking updated
• Active listings → available in order creation`
      },
    ]
  },
  {
    id: 'filament',
    title: 'Filament & Materials',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>,
    articles: [
      {
        title: 'Managing Filament Spools',
        content: `PrintFlow tracks your filament inventory so you always know what you have and when to reorder.

**Adding a spool:**
1. Go to Filament section
2. Click "+ Add Spool"
3. Select brand, material, and color
4. Enter full weight (typically 1000g) and current remaining weight
5. Set cost — used for job costing in orders
6. Set reorder threshold — PrintFlow alerts you when remaining weight drops below this

**Supported brands (12 built-in):**
Bambu Lab, Prusament, Hatchbox, eSUN, Polymaker, Overture, Sunlu, Elegoo, Inland, MatterHackers, 3D Printing Canada, Amazon Basics

**Tracking usage:**
When you create an order and select a filament spool, you can enter the estimated filament used in grams. This automatically deducts from the spool's remaining weight.

**Reorder alerts:**
When a spool drops below the reorder threshold, it appears highlighted in the filament list and shows on the Dashboard.

**Materials supported:**
PLA, PETG, ABS, ASA, TPU, TPE, PC, Nylon, PA12-CF, PA-CF, PLA-CF, PETG-CF, PVA, HIPS, and custom.`
      },
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    articles: [
      {
        title: 'App Won\'t Start / Server Not Ready',
        content: `**Symptoms:** Login screen shows "Starting server…" and never progresses.

**Cause:** The bundled Express server failed to start.

**Fix on Windows:**
1. Open PowerShell and run:
   Get-ChildItem "$env:LOCALAPPDATA\\Programs\\PrintFlow Lite\\resources\\server" | Select Name
   
2. If server files are there, run:
   node "$env:LOCALAPPDATA\\Programs\\PrintFlow Lite\\resources\\server\\index.js"
   
3. Look for the error message. Common causes:
   • Port 3001 already in use → close other apps using that port
   • Missing node_modules → reinstall the app
   • Permission error on logs folder → the app needs write access to AppData

**Fix on Mac:**
Open Terminal and run:
node "/Applications/PrintFlow Lite.app/Contents/Resources/server/index.js"

**If you see "EPERM mkdir logs":**
This is a known issue in older versions. Update to the latest version from the releases page.

**If port 3001 is in use:**
Another application is using port 3001. Find and stop it, or check if another instance of PrintFlow is already running.`
      },
      {
        title: 'App Skips Setup Wizard',
        content: `**Symptom:** App goes straight to login instead of showing setup wizard.

**Cause:** The config file has setupComplete = true from a previous attempt.

**Fix on Windows:**
Open PowerShell:

$config = Get-Content "C:\\Users\\[username]\\AppData\\Roaming\\printflow-lite\\printflow-lite-config.json" | ConvertFrom-Json
$config.setupComplete = $false
$config | ConvertTo-Json | Set-Content "C:\\Users\\[username]\\AppData\\Roaming\\printflow-lite\\printflow-lite-config.json"

Also delete the database to start fresh:
Remove-Item "C:\\Users\\[username]\\AppData\\Roaming\\printflow-lite\\data\\*"

**Fix on Mac:**
In Terminal:
nano ~/Library/Application\\ Support/PrintFlow\\ Lite/printflow-lite-config.json
Change "setupComplete": true to "setupComplete": false
Save with Ctrl+X, Y, Enter`
      },
      {
        title: '"Damaged App" on Mac',
        content: `**Symptom:** macOS says "PrintFlow Lite is damaged and can't be opened."

**Cause:** macOS quarantine flag on unsigned/ad-hoc signed apps.

**Fix:**
Open Terminal and run:
xattr -cr "/Applications/PrintFlow Lite.app"

Then try opening again. You may need to right-click → Open the first time.

**Why this happens:**
PrintFlow Lite is ad-hoc signed, not notarized by Apple. Full notarization requires an Apple Developer Program account ($99/year). The app is safe — this is just Apple's gatekeeper for uncertified apps.`
      },
      {
        title: 'Network Error During Setup',
        content: `**Symptom:** Clicking "Finish Setup" shows a network error.

**Causes and fixes:**

1. **Server not ready yet** — The button should be greyed out with "Starting server…" until the server is ready. If you somehow clicked it too fast, wait and try again.

2. **Server crashed** — Check if the server is running. Open Settings → Data → Open in Explorer and look for an error.log file.

3. **Port conflict** — Another app is using port 3001. Close it.

4. **Antivirus blocking** — Some antivirus software blocks local server connections. Add an exception for PrintFlow Lite.

5. **Windows Firewall** — On first launch, Windows may ask if you want to allow the app on your network. Click "Allow".`
      },
    ]
  },
  {
    id: 'updates',
    title: 'Updates',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
    articles: [
      {
        title: 'Updating PrintFlow Lite',
        content: `PrintFlow Lite checks for updates automatically when you launch the app.

**How updates work:**
1. App launches and immediately checks GitHub Releases in the background
2. If a new version is available, a blue banner appears in the sidebar
3. Click "Download" to open the download page in your browser
4. Download and install the new version over the existing one

**Manual check:**
Settings → Updates → Check for Updates

**Release notes:**
Settings → Updates → Release Notes shows what changed in each version.

**Your data is safe:**
Updates never touch your database or configuration. Your orders, customers, filament, and settings are preserved across updates.

**Auto-install:**
PrintFlow does not auto-install updates. You always choose when to update. This is intentional — you're running a business and shouldn't have updates forced on you.

**Download page:**
https://github.com/rbd992/printflow-lite/releases/latest`
      },
    ]
  },
  {
    id: 'support',
    title: 'Support & Feedback',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    articles: [
      {
        title: 'Getting Help',
        content: `**GitHub Issues (Bugs & Feature Requests)**
https://github.com/rbd992/printflow-lite/issues

This is the best place to report bugs or request features. Use the bug report or feature request templates. Include your OS version and PrintFlow version number.

**GitHub Discussions (Questions & Ideas)**
https://github.com/rbd992/printflow-lite/discussions

For general questions, sharing how you're using PrintFlow, or discussing ideas that aren't ready to be a formal feature request.

**What to include in a bug report:**
• PrintFlow Lite version (shown in login screen footer and Settings → Updates)
• Your OS and version (Windows 11, macOS 15.x, etc.)
• Steps to reproduce the bug
• What you expected to happen
• What actually happened
• Any error messages

**Contributing**
PrintFlow Lite is open source. Contributions are welcome — see CONTRIBUTING.md on GitHub. This project is built by a maker for makers — your input directly shapes the roadmap.

**Support the project**
If PrintFlow Lite saves you time or helps your business, consider buying me a coffee at https://buymeacoffee.com/rbd992. It helps fund development time.`
      },
    ]
  },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeArticle, setActiveArticle] = useState(0);
  const [search, setSearch] = useState('');

  const currentSection = SECTIONS.find(s => s.id === activeSection);
  const currentArticle = currentSection?.articles[activeArticle];

  // Search
  const searchResults = search.trim().length > 1
    ? SECTIONS.flatMap(s => s.articles.map(a => ({ ...a, section: s.title, sectionId: s.id, idx: s.articles.indexOf(a) }))).filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
    : [];

  function renderContent(text) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: i > 0 ? 18 : 0, marginBottom: 6 }}>{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.startsWith('• ')) {
        return <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>•</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{line.slice(2)}</span>
        </div>;
      }
      if (line.match(/^\d+\./)) {
        const [num, ...rest] = line.split('. ');
        return <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 11, flexShrink: 0, minWidth: 16, marginTop: 2 }}>{num}.</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{rest.join('. ')}</span>
        </div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 8 }}/>;
      // Code lines (indented)
      if (line.startsWith('   ') || line.startsWith('\t')) {
        return <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--bg-hover)', padding: '2px 10px', borderRadius: 6, margin: '3px 0' }}>{line.trim()}</div>;
      }
      // Inline code (backtick)
      const parts = line.split(/(`[^`]+`)/g);
      return <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 6 }}>
        {parts.map((p, j) => p.startsWith('`') && p.endsWith('`')
          ? <code key={j} style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--accent)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>{p.slice(1,-1)}</code>
          : p
        )}
      </p>;
    });
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)' }}>
        {/* Search */}
        <div style={{ padding: '16px 14px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search docs…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 30px', background: 'var(--bg-hover)', border: '0.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Section nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {search.trim().length > 1 ? (
            <div>
              <div style={{ padding: '4px 14px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{searchResults.length} Results</div>
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => { setActiveSection(r.sectionId); setActiveArticle(r.idx); setSearch(''); }} style={{ display: 'block', width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.section}</div>
                </button>
              ))}
              {searchResults.length === 0 && <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-tertiary)' }}>No results found</div>}
            </div>
          ) : (
            SECTIONS.map(s => (
              <div key={s.id}>
                <button onClick={() => { setActiveSection(s.id); setActiveArticle(0); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 14px', border: 'none', background: activeSection === s.id ? 'var(--accent-light)' : 'transparent',
                  color: activeSection === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400, cursor: 'pointer',
                  borderLeft: `2px solid ${activeSection === s.id ? 'var(--accent)' : 'transparent'}`,
                  textAlign: 'left',
                }}>
                  <span style={{ opacity: 0.8, flexShrink: 0 }}>{s.icon}</span>
                  {s.title}
                </button>
                {activeSection === s.id && s.articles.map((a, i) => (
                  <button key={i} onClick={() => setActiveArticle(i)} style={{
                    display: 'block', width: '100%', padding: '6px 14px 6px 36px', border: 'none',
                    background: activeArticle === i ? 'var(--bg-active)' : 'transparent',
                    color: activeArticle === i ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontSize: 12, cursor: 'pointer', textAlign: 'left', fontWeight: activeArticle === i ? 500 : 400,
                  }}>
                    {a.title}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Article content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        {currentArticle && (
          <div style={{ maxWidth: 720 }}>
            <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {currentSection?.icon}
              {currentSection?.title}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 24, lineHeight: 1.2 }}>{currentArticle.title}</h1>
            <div>{renderContent(currentArticle.content)}</div>
            {/* Nav */}
            <div style={{ marginTop: 48, paddingTop: 20, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              {activeArticle > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveArticle(a => a - 1)} style={{ gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Previous
                </button>
              )}
              <div/>
              {activeArticle < (currentSection?.articles.length || 0) - 1 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveArticle(a => a + 1)} style={{ gap: 6 }}>
                  Next
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
