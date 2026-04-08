// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — HelpPage.js
// In-App Help Center & Setup Guide
// Comprehensive user documentation for all features
// Place in: src/renderer/pages/HelpPage.js
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const APP_VERSION = '0.1.4-beta';

// ── Help Content Database ───────────────────────────────────────────────────

const HELP_SECTIONS = [
  // ─ Getting Started ─
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    articles: [
      {
        id: 'first-launch',
        title: 'First Launch & Setup Wizard',
        content: `When you first open PrintFlow Lite, the setup wizard walks you through everything in under 2 minutes.

**Step 1 — Business Info**
Enter your business name, address, and contact details. This information appears on quotes, invoices, and shipping labels. You can change it later in Settings.

**Step 2 — Create Owner Account**
Create your login credentials. The owner account has full access to everything including user management and finances. Choose a strong password — all data is stored locally on your machine.

**Step 3 — Add Your First Printer**
Enter your printer's name, brand, and model. If your printer has a network connection (WiFi/Ethernet), enter its IP address to enable remote monitoring and camera feeds.

**Step 4 — Currency & Tax**
Select your currency (CAD default) and enter your HST/GST rate. PrintFlow calculates tax automatically on orders, quotes, and invoices.

**Step 5 — Done!**
You're ready to go. Start by adding an order or exploring the dashboard.`,
      },
      {
        id: 'overview',
        title: 'App Overview & Navigation',
        content: `PrintFlow Lite is organized into these main sections, accessible from the sidebar:

**Dashboard** — Overview of your business: active orders, revenue chart, printer status, and recent activity.

**Orders** — Create, manage, and track customer orders through the full lifecycle from New → Queued → Printing → QC → Packed → Shipped → Paid.

**Job Queue** — Kanban-style board showing what's queued, printing, done, or failed. Drag cards between columns.

**Customers** — Auto-built from order history. View order history, contact info, and lifetime value per customer.

**Printers** — Manage your printers, view live status, camera feeds, temperature readings, and maintenance schedules.

**Filament** — Track your filament inventory across 12+ brands with costs, weights, and colour tracking.

**Maintenance** — Scheduled maintenance tasks for 35+ procedures across all major printer brands.

**Finance** — Income/expense tracking with HST, 7-day revenue chart, and financial summaries.

**Quotes & Invoices** — Generate professional quotes and invoices with automatic price calculations.

**Shipping** — Configure carriers, get rate quotes, create shipments, and print labels.

**Settings** — Company info, users, theme, carriers, cloud connections, and more.

**Help** — You're here! Setup guides, troubleshooting, and keyboard shortcuts.`,
      },
      {
        id: 'system-requirements',
        title: 'System Requirements',
        content: `**Minimum Requirements:**
- macOS 11 (Big Sur) or later, Windows 10 or later, or Linux (Ubuntu 20.04+)
- 4 GB RAM
- 500 MB disk space
- No internet required after initial install (except for update checks and shipping APIs)

**Recommended for Camera Feeds:**
- ffmpeg installed (for Bambu Lab RTSP cameras)
- macOS: \`brew install ffmpeg\`
- Windows: Download from ffmpeg.org and add to PATH
- Linux: \`sudo apt install ffmpeg\`

**Recommended for Label Printing:**
- Thermal label printer (Dymo, Rollo, Zebra, or Brother QL series)
- Standard 4×6" label stock for shipping labels
- Set your thermal printer as default for fastest label printing`,
      },
    ],
  },

  // ─ Orders ─
  {
    id: 'orders',
    title: 'Orders & Customers',
    icon: '📋',
    articles: [
      {
        id: 'create-order',
        title: 'Creating an Order',
        content: `**To create a new order:**

1. Click "New Order" on the Orders page or Dashboard
2. Enter the customer name (or select existing) and contact info
3. Add line items — each item has a name, quantity, material cost, labour time, and markup percentage
4. The price calculator shows per-item and total costs with HST
5. Add any notes (print instructions, special requests, etc.)
6. Click "Create Order" — it starts in the "New" status

**Price Calculator Fields:**
- Material Cost: Cost of filament used (grams × price per gram)
- Labour: Your hourly rate × estimated hours
- Markup: Percentage added on top (default based on Settings)
- HST: Automatically calculated from your tax rate in Settings

**Tip:** The more detail you put in order notes, the easier it is to reference during printing and QC.`,
      },
      {
        id: 'order-lifecycle',
        title: 'Order Status Lifecycle',
        content: `Orders flow through these statuses:

**New** → Order just created, not yet assigned to a print job
**Queued** → Ready to print, appears on the Job Queue board
**Printing** → Currently being printed
**QC** → Print complete, undergoing quality check
**Packed** → Passed QC, packaged and ready to ship
**Shipped** → Shipped to customer (tracking number added)
**Paid** → Payment received, order complete

Click the status badge on any order to advance it to the next stage. You can also move orders backward if needed (e.g., failed QC goes back to Queued).

**Quick Actions on Order Cards:**
- Click the tracking field to add a tracking number
- Click the carrier dropdown to select the shipping carrier
- Use the "Ship" button to open the shipping workflow (rate quotes → label → done)`,
      },
      {
        id: 'csv-export',
        title: 'Exporting Orders (CSV)',
        content: `To export your orders as a spreadsheet:

1. Go to Orders page
2. Click the "Export" button in the top right
3. Choose your date range (or export all)
4. A .csv file downloads automatically

The CSV includes all order fields: order number, customer, items, totals, status, dates, tracking, and notes. Open it in Excel, Google Sheets, or any spreadsheet app.`,
      },
    ],
  },

  // ─ Shipping ─
  {
    id: 'shipping',
    title: 'Shipping & Labels',
    icon: '📬',
    articles: [
      {
        id: 'shipping-overview',
        title: 'Shipping Overview',
        content: `PrintFlow Lite supports five major carriers:

🍁 **Canada Post** — Expedited, Xpresspost, Priority, Regular Parcel, International
📦 **FedEx** — Ground, Express Saver, 2Day, Overnight, International
🟤 **UPS** — Ground, 2nd Day, Next Day, Standard (Canada), Worldwide
🔴 **Purolator** — Express, Ground, Express 9AM/12PM, US, International
🟡 **DHL Express** — Express Worldwide, Economy Select, Express 9:00/12:00

Each carrier lets you:
- Compare shipping rates across services
- Create shipments and generate labels (PDF or ZPL for thermal printers)
- Track packages in real-time
- Validate recipient addresses before shipping

You can configure multiple carriers and PrintFlow will compare rates across all of them to find the best price.`,
      },
      {
        id: 'carrier-setup-canadapost',
        title: 'Setting Up Canada Post',
        content: `**What You Need:**
- A Canada Post business/commercial account
- API credentials from the Developer Program

**Step-by-Step:**

1. Go to **canadapost-postescanada.ca** and sign in to your business account
2. Navigate to **Developer Program** → **API Keys** (or go directly to canadapost-postescanada.ca/information/app/drc/registered)
3. Click **Create New API Key** — you'll get an API Username and API Password
4. Find your **Customer Number** on your Canada Post account dashboard (usually 7+ digits)
5. (Optional) If you have a contract account, note your **Contract Number** for discounted rates
6. In PrintFlow, go to **Settings** → **Shipping** → **Add Carrier** → **Canada Post**
7. Paste your API Username, API Password, and Customer Number
8. Enter your return/sender address (used on all labels)
9. Toggle **Sandbox Mode** off when you're ready for live shipping
10. Click **Test Connection** to verify

**Tip:** Start with sandbox mode enabled to test label generation without creating real shipments. Canada Post sandbox uses the same credentials but doesn't charge your account.`,
      },
      {
        id: 'carrier-setup-fedex',
        title: 'Setting Up FedEx',
        content: `**What You Need:**
- A FedEx business account
- FedEx Developer Portal credentials

**Step-by-Step:**

1. Go to **developer.fedex.com** and create a developer account (use your FedEx.com business login)
2. Click **Create a Project** and name it "PrintFlow"
3. Select these APIs: **Ship API, Rate API, Track API, Address Validation API**
4. After approval, copy your **API Key (Client ID)** and **Secret Key (Client Secret)**
5. Find your **FedEx Account Number** (9 digits) from your FedEx business account
6. In PrintFlow, go to **Settings** → **Shipping** → **Add Carrier** → **FedEx**
7. Paste Client ID, Client Secret, and Account Number
8. Enter your return/sender address
9. Use **Sandbox Mode** for testing — the sandbox URL is used automatically
10. Click **Test Connection**

**Note:** FedEx developer accounts may take 24-48 hours for full API approval. Sandbox access is usually immediate.`,
      },
      {
        id: 'carrier-setup-ups',
        title: 'Setting Up UPS',
        content: `**What You Need:**
- A UPS business account at ups.com
- UPS Developer Portal access

**Step-by-Step:**

1. Go to **developer.ups.com** and sign in with your UPS.com account
2. Navigate to **My Apps** → **Create New App**
3. Select: **Rating API, Shipping API, Tracking API, Address Validation API**
4. Copy your **Client ID** and **Client Secret**
5. Find your **UPS Account Number** (6 alphanumeric characters, e.g., A1B2C3) from your UPS billing account
6. In PrintFlow, go to **Settings** → **Shipping** → **Add Carrier** → **UPS**
7. Paste Client ID, Client Secret, and Account Number
8. Enter your return/sender address
9. Toggle sandbox for testing
10. Click **Test Connection**

**Important for Canadian Shippers:** UPS Standard (service code 11) is the most cost-effective for domestic Canadian shipments. For US-bound, UPS Ground is available from Canada.`,
      },
      {
        id: 'carrier-setup-purolator',
        title: 'Setting Up Purolator',
        content: `**What You Need:**
- A Purolator business/commercial account
- E-Ship API credentials (obtained from Purolator directly)

**Step-by-Step:**

1. Call **Purolator E-Ship Solutions** at **1-888-SHIP-123** or email **eship@purolator.com**
2. Request API access — mention you're integrating with shipping software
3. Purolator will provide:
   - An **Activation Key** (UUID format)
   - A **Password** for API authentication
   - Your **Billing Account Number**
4. For testing, ask for **sandbox credentials** separately
5. In PrintFlow, go to **Settings** → **Shipping** → **Add Carrier** → **Purolator**
6. Enter Activation Key, Password, and Billing Account Number
7. Enter your return/sender address
8. Enable sandbox mode for initial testing
9. Click **Test Connection**

**Note:** Purolator API access typically requires a brief review process. Allow 3-5 business days for approval. Purolator is Canada-focused and an excellent choice for domestic and US-bound shipments.`,
      },
      {
        id: 'carrier-setup-dhl',
        title: 'Setting Up DHL Express',
        content: `**What You Need:**
- A DHL Express account
- MyDHL API credentials

**Step-by-Step:**

1. Go to **developer.dhl.com** and register for an account
2. Navigate to **MyDHL API** and request access
3. You'll receive **API Username** and **API Password** via email (may take 1-2 days)
4. Find your **DHL Account Number** (typically 9 digits) from your DHL Express account
5. In PrintFlow, go to **Settings** → **Shipping** → **Add Carrier** → **DHL Express**
6. Paste API Username, API Password, and Account Number
7. Enter your return/sender address
8. Enable sandbox for testing (uses the test endpoint automatically)
9. Click **Test Connection**

**For International Shipments:** DHL is the strongest choice for overseas packages. Customs documentation is generated automatically when shipping internationally. Ensure your DHL account has export privileges enabled.`,
      },
      {
        id: 'create-shipment',
        title: 'Creating a Shipment & Printing Labels',
        content: `**From an Order:**

1. Open any order in "Packed" status
2. Click the **Ship** button
3. The shipping panel opens with the customer's address pre-filled
4. Verify the recipient address (click "Validate" to check with the carrier)
5. Enter or confirm the package dimensions and weight
6. Click **Get Rates** — rates from all configured carriers appear sorted by price
7. Select the rate/service you want
8. Click **Create Shipment** — the label is generated
9. Click **Print Label** to send it to your printer
10. The tracking number is automatically added to the order

**Label Printing Tips:**
- For thermal printers (Dymo/Rollo/Zebra): Select 4×6 PDF or ZPL format
- For standard printers: Select Letter PDF format
- Labels are saved locally and can be reprinted anytime from the shipment record
- ZPL format sends raw commands to Zebra-compatible thermal printers for fastest printing

**Multi-Carrier Rate Comparison:**
When you click "Get Rates," PrintFlow queries all enabled carriers simultaneously and displays every available service option sorted by price. This makes it easy to find the cheapest or fastest option at a glance.`,
      },
      {
        id: 'tracking',
        title: 'Package Tracking',
        content: `**Automatic Tracking:**
When you create a shipment through PrintFlow, the tracking number is automatically saved and linked to the order.

**Manual Tracking:**
You can also enter a tracking number manually on any order — just click the tracking field on the order card.

**Checking Status:**
1. Open an order with a tracking number
2. Click "Track" to fetch the latest status from the carrier
3. Tracking events (scanned, in transit, delivered, etc.) are displayed with timestamps and locations

**Tip:** The order status automatically updates to "Shipped" when a tracking number is added, and you can manually mark it "Delivered" / "Paid" once confirmed.`,
      },
    ],
  },

  // ─ Printers & Cameras ─
  {
    id: 'printers',
    title: 'Printers & Cameras',
    icon: '🖨️',
    articles: [
      {
        id: 'add-printer',
        title: 'Adding a Printer',
        content: `PrintFlow supports any 3D printer. For network-connected printers, you get live status, temperature monitoring, and camera feeds.

**To add a printer:**

1. Go to **Printers** → **Add Printer**
2. Enter a name and select the brand/firmware:
   - **OctoPrint** — Raspberry Pi running OctoPrint
   - **Klipper / Moonraker** — Klipper firmware with Moonraker API
   - **Bambu Lab** — X1C, P1S, P1P, A1 series
   - **Prusa Connect** — MK4, MK3.9, XL, Mini
   - **Creality** — K1, K1 Max, Ender series with WiFi
   - **Duet3D / RRF** — Duet boards with RepRapFirmware
   - **Repetier Server** — Multi-printer Repetier setup
3. Enter the printer's IP address and port
4. Enter the API key / access code (see brand-specific guides below)
5. Enable the camera if your printer has one
6. Click **Save** — PrintFlow begins monitoring

**No Network? No Problem:**
You can add any printer without network details. It simply won't have remote status or camera features — you'll track jobs manually through the Job Queue.`,
      },
      {
        id: 'printer-api-keys',
        title: 'Finding Your Printer API Key',
        content: `**OctoPrint:**
Open OctoPrint in your browser → Settings (wrench icon) → API → Copy the "API Key"

**Klipper / Moonraker:**
Usually no API key needed if on the same network. If auth is enabled: check ~/printer_data/config/moonraker.conf for the [authorization] section.

**Bambu Lab:**
Open Bambu Studio → Device tab → click your printer → LAN Only mode → note the "Access Code" and "Serial Number" shown on the printer screen under Settings → Network → LAN-only.

**Prusa Connect:**
Login to connect.prusa3d.com → select your printer → Settings → API Key. Or on PrusaLink: access the printer's IP in a browser → Settings → generate an API key.

**Creality:**
For K1/K1 Max: ensure the printer is on WiFi, find its IP in the printer's network settings. The local API doesn't require authentication on most models.

**Duet3D:**
No API key needed — just the printer's IP. If a password is set, enter it in PrintFlow (default is usually empty or "reprap").

**Repetier Server:**
Open Repetier Server in your browser → Global Settings → API Keys → copy or create a key.`,
      },
      {
        id: 'camera-setup',
        title: 'Camera Feed Setup',
        content: `**Automatic Camera Detection:**
When you add a printer with a known brand, PrintFlow automatically configures the camera URL for that brand. Most setups work without any extra steps.

**Manual Camera Configuration:**
If auto-detection doesn't work, you can enter custom camera URLs in the printer's settings:
- **MJPEG Stream URL** — for continuous video streams
- **Snapshot URL** — for periodic image refresh
- **WebRTC Signal URL** — for Moonraker camera-streamer
- **RTSP URL** — for Bambu Lab and IP cameras

**Camera Protocols by Brand:**
- OctoPrint: MJPEG (usually http://[ip]/webcam/?action=stream)
- Klipper: MJPEG, WebRTC, or HLS (via camera-streamer)
- Bambu Lab: RTSP (requires ffmpeg installed — see System Requirements)
- Prusa: Snapshot polling (http://[ip]/api/v1/cameras/snap)
- Creality: MJPEG
- Duet/Repetier: MJPEG

**Troubleshooting Cameras:**
- Ensure the camera URL is accessible from your computer's browser first
- For Bambu Lab, ffmpeg must be installed for RTSP stream conversion
- Try the "Snapshot" protocol if MJPEG streaming has issues
- Check that your firewall isn't blocking the camera port`,
      },
    ],
  },

  // ─ Production ─
  {
    id: 'production',
    title: 'Production & Job Queue',
    icon: '⚙️',
    articles: [
      {
        id: 'job-queue',
        title: 'Using the Job Queue',
        content: `The Job Queue is a kanban board with four columns: **Queued**, **Printing**, **Done**, **Failed**.

**Adding Jobs:**
When an order status changes to "Queued," its print jobs appear in the Queued column. You can also add standalone jobs.

**Moving Jobs:**
Drag cards between columns or click the arrow buttons. When a job moves to "Done," the linked order advances to "QC" status automatically.

**Failed Jobs:**
If a print fails, move it to Failed with a note about why. You can then move it back to Queued to retry.

**Print History:**
All completed and failed jobs are logged in the Print History section, accessible from the Production menu.`,
      },
      {
        id: 'filament-mgmt',
        title: 'Filament Management',
        content: `PrintFlow includes a multi-brand filament catalogue with 12+ brands pre-loaded: Bambu Lab, Prusament, Hatchbox, eSUN, Polymaker, Overture, Sunlu, Elegoo, Inland, MatterHackers, 3D Printing Canada, and Amazon Basics.

**Adding Filament:**
1. Go to Filament → Add Filament
2. Select brand and material type (PLA, PETG, ABS, TPU, etc.)
3. Enter the colour, weight, and cost
4. The cost-per-gram is calculated automatically

**Tracking Usage:**
When calculating order costs, reference your filament cost-per-gram for accurate material pricing.`,
      },
      {
        id: 'maintenance',
        title: 'Printer Maintenance',
        content: `PrintFlow tracks 35+ maintenance tasks across generic FDM, Bambu Lab, Prusa, Creality, and Voron printers.

**Tasks include:**
- Nozzle cleaning and replacement
- Bed leveling and PEI sheet cleaning
- Belt tensioning
- Lubrication (rails, lead screws)
- Firmware updates
- Filter replacements (carbon, HEPA)
- Hotend rebuilds

Each task has a recommended interval. PrintFlow reminds you when maintenance is due based on print hours or calendar days.`,
      },
    ],
  },

  // ─ Business / Finance ─
  {
    id: 'finance',
    title: 'Finance & Invoicing',
    icon: '💰',
    articles: [
      {
        id: 'income-expenses',
        title: 'Income & Expense Tracking',
        content: `**Recording Income:**
Income is automatically recorded when orders are marked as "Paid." You can also add manual income entries for non-order revenue.

**Recording Expenses:**
Go to Finance → Add Expense. Common categories: filament, printer parts, shipping supplies, electricity, software subscriptions.

**HST/Tax:**
All amounts can include or exclude HST. PrintFlow tracks HST collected (on sales) and HST paid (on expenses) separately, making tax season easier.

**7-Day Revenue Chart:**
The Dashboard and Finance page show a 7-day rolling revenue chart so you can spot trends at a glance.`,
      },
      {
        id: 'quotes-invoices',
        title: 'Quotes & Invoices',
        content: `**Creating a Quote:**
1. Go to Quotes → New Quote
2. Add the customer and line items with pricing
3. The quote shows material cost, labour, markup, and HST
4. Export as PDF or send directly to the customer

**Converting to Invoice:**
Once a quote is accepted, convert it to an invoice with one click. The invoice inherits all line items and pricing.

**Converting to Order:**
An accepted quote can also be converted to an order, which then flows through the normal order lifecycle.`,
      },
    ],
  },

  // ─ Cloud & Integrations ─
  {
    id: 'cloud',
    title: 'Cloud Integrations',
    icon: '☁️',
    articles: [
      {
        id: 'cloud-overview',
        title: 'Cloud Connections Overview',
        content: `PrintFlow Lite runs entirely offline, but you can optionally connect cloud services for extra features:

**Printer Clouds:**
- Bambu Cloud — monitor your Bambu Lab printers remotely
- Prusa Connect — manage Prusa printers from anywhere
- Creality Cloud — access Creality's model library and remote printing
- OctoPrint Anywhere / Obico — remote access with AI failure detection

**File Storage:**
- Google Drive — backup your database and sync G-code files
- Dropbox — same as Google Drive, alternative storage

**Setup:**
Go to Settings → Cloud Integrations → select a provider and enter your credentials. Each provider has specific steps — see the individual guides.

**Privacy Note:** Cloud connections are optional. Your core data always stays on your machine. Cloud features only sync what you explicitly configure.`,
      },
    ],
  },

  // ─ Users & Security ─
  {
    id: 'users',
    title: 'Users & Roles',
    icon: '👥',
    articles: [
      {
        id: 'user-roles',
        title: 'User Roles Explained',
        content: `PrintFlow supports three roles:

**Owner** — Full access to everything. Can manage users, view finances, change settings, and delete data. Created during setup.

**Manager** — Can manage orders, printers, job queue, shipping, and customers. Cannot access user management or delete the database.

**Operator** — Can view and update orders, use the job queue, and log print completions. Cannot access finances, settings, or user management.

**Adding Users:**
Go to Settings → Users → Add User. Enter a username, password, and select their role.

**Tip:** For a one-person shop, you only need the Owner account. Add Manager/Operator accounts if you have employees or collaborators.`,
      },
    ],
  },

  // ─ Settings & Backup ─
  {
    id: 'settings',
    title: 'Settings & Backup',
    icon: '⚡',
    articles: [
      {
        id: 'theme',
        title: 'Light & Dark Mode',
        content: `Go to Settings → Appearance → toggle between Light and Dark mode. The setting persists across sessions.`,
      },
      {
        id: 'backup',
        title: 'Backing Up Your Data',
        content: `All PrintFlow Lite data is stored in a single SQLite file on your machine.

**Manual Backup:**
1. Go to Settings → Data → Backup
2. Click "Create Backup" — a timestamped copy of your database is saved
3. You can also find the database file at the path shown in Settings → Data

**Cloud Backup:**
If you've connected Google Drive or Dropbox, PrintFlow can automatically upload your database backup to the cloud. Enable this in Settings → Cloud → Auto-Backup.

**Restoring from Backup:**
1. Go to Settings → Data → Restore
2. Select your backup file
3. PrintFlow replaces the current database with the backup

**Important:** Back up regularly, especially before app updates. Your data is your business!`,
      },
      {
        id: 'updates',
        title: 'Checking for Updates',
        content: `PrintFlow checks for updates automatically when you open the app (requires internet).

**Manual Check:**
Go to Settings → About → Check for Updates.

**How Updates Work:**
- PrintFlow checks GitHub Releases for new versions
- If an update is available, you'll see a notification with the version number and changelog
- Updates are never auto-installed — you always choose when to update
- Download the new version from the notification link and install it over the current version
- Your data is preserved through updates (it's stored separately from the app)`,
      },
    ],
  },

  // ─ Troubleshooting ─
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    articles: [
      {
        id: 'common-issues',
        title: 'Common Issues & Fixes',
        content: `**"Cannot reach PrintFlow server"**
The bundled Express server hasn't started yet. Wait a few seconds and try again. If it persists, restart the app.

**macOS says the app is "damaged"**
Run this in Terminal:
\`xattr -cr "/Applications/PrintFlow Lite.app"\`
This removes the macOS quarantine flag from the unsigned app.

**Windows SmartScreen warning**
Click "More info" → "Run anyway". This appears because the app isn't code-signed (yet). It's safe.

**Printer not connecting**
1. Verify the printer's IP address in your router or printer display
2. Ensure your computer is on the same network as the printer
3. Try accessing the printer's web interface in your browser first
4. Check that the correct port is entered (default varies by brand)
5. Verify the API key / access code is correct

**Camera feed not loading**
1. Test the camera URL directly in your browser
2. For Bambu Lab: ensure ffmpeg is installed
3. Try switching from MJPEG to Snapshot mode in camera settings
4. Check firewall settings for the camera port

**Shipping rates not loading**
1. Verify carrier credentials in Settings → Shipping
2. Check that sandbox mode is set correctly
3. Ensure the sender/return address is complete
4. Try testing with a known-good destination address first`,
      },
      {
        id: 'reset',
        title: 'Factory Reset',
        content: `If you need to start completely fresh:

1. Close PrintFlow Lite
2. Delete the database file (path shown in Settings → Data)
3. Reopen PrintFlow — the setup wizard will appear again

**Warning:** This permanently deletes all orders, customers, financial data, printer configs, and settings. Create a backup first!`,
      },
    ],
  },

  // ─ Keyboard Shortcuts ─
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: '⌨️',
    articles: [
      {
        id: 'shortcut-list',
        title: 'All Keyboard Shortcuts',
        content: `**Global:**
- \`Ctrl/⌘ + N\` — New Order
- \`Ctrl/⌘ + F\` — Search (orders, customers, printers)
- \`Ctrl/⌘ + ,\` — Settings
- \`Ctrl/⌘ + D\` — Dashboard
- \`Ctrl/⌘ + Q\` — Job Queue
- \`Ctrl/⌘ + /\` — Help (this page)

**Orders:**
- \`Ctrl/⌘ + S\` — Save current order
- \`Ctrl/⌘ + P\` — Print order / label
- \`Escape\` — Close modal / cancel

**Job Queue:**
- \`→\` — Move selected job forward
- \`←\` — Move selected job backward

**Theme:**
- \`Ctrl/⌘ + Shift + T\` — Toggle light/dark mode`,
      },
    ],
  },
];


// ── HelpPage Component ──────────────────────────────────────────────────────

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeArticle, setActiveArticle] = useState('first-launch');
  const [searchQuery, setSearchQuery] = useState('');

  // Search across all articles
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results = [];
    HELP_SECTIONS.forEach(section => {
      section.articles.forEach(article => {
        if (
          article.title.toLowerCase().includes(q) ||
          article.content.toLowerCase().includes(q)
        ) {
          results.push({ ...article, sectionId: section.id, sectionTitle: section.title });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const currentSection = HELP_SECTIONS.find(s => s.id === activeSection);
  const currentArticle = currentSection?.articles.find(a => a.id === activeArticle)
    || currentSection?.articles[0];

  const navigateTo = (sectionId, articleId) => {
    setActiveSection(sectionId);
    setActiveArticle(articleId);
    setSearchQuery('');
  };

  // Simple markdown-ish renderer for content
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} style={styles.contentH3}>{line.replace(/\*\*/g, '')}</h3>;
      }
      if (line.match(/^\*\*.*\*\*$/)) {
        return <h3 key={i} style={styles.contentH3}>{line.replace(/\*\*/g, '')}</h3>;
      }
      // Bold inline
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={styles.contentP}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      }
      // List items
      if (line.match(/^[\s]*[-•]\s/)) {
        return <p key={i} style={styles.contentLi}>{line.replace(/^[\s]*[-•]\s/, '')}</p>;
      }
      // Numbered items
      if (line.match(/^[\s]*\d+\.\s/)) {
        return <p key={i} style={styles.contentLi}>{line}</p>;
      }
      // Code inline
      if (line.includes('`')) {
        const parts = line.split(/`(.*?)`/g);
        return (
          <p key={i} style={styles.contentP}>
            {parts.map((part, j) => j % 2 === 1 ? <code key={j} style={styles.code}>{part}</code> : part)}
          </p>
        );
      }
      // Empty lines
      if (!line.trim()) return <div key={i} style={{ height: 12 }} />;
      // Regular text
      return <p key={i} style={styles.contentP}>{line}</p>;
    });
  };

  const styles = {
    page: { display: 'flex', height: '100%', fontFamily: "'Manrope', -apple-system, sans-serif", background: 'var(--bg-primary, #0f1117)', color: 'var(--text-primary, #e2e8f0)' },
    sidebar: { width: 260, flexShrink: 0, borderRight: '1px solid var(--border, rgba(255,255,255,0.08))', overflowY: 'auto', padding: '24px 0' },
    main: { flex: 1, overflowY: 'auto', padding: '32px 40px' },
    sidebarHeader: { padding: '0 20px 20px', borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))', marginBottom: 12 },
    searchInput: { width: '100%', height: 36, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'inherit', outline: 'none' },
    sectionBtn: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 20px', border: 'none', background: active ? 'rgba(96,165,250,0.1)' : 'transparent', color: active ? '#93bbfd' : 'rgba(255,255,255,0.6)', fontSize: 13.5, fontWeight: active ? 600 : 500, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', borderLeft: active ? '2px solid #60a5fa' : '2px solid transparent', transition: 'all 150ms ease' }),
    articleBtn: (active) => ({ display: 'block', width: '100%', padding: '7px 20px 7px 50px', border: 'none', background: active ? 'rgba(96,165,250,0.06)' : 'transparent', color: active ? '#93bbfd' : 'rgba(255,255,255,0.4)', fontSize: 12.5, fontWeight: active ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease' }),
    articleTitle: { fontSize: 24, fontWeight: 700, letterSpacing: -0.3, marginBottom: 24, lineHeight: 1.3 },
    contentH3: { fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 8, color: 'var(--text-primary, #e2e8f0)' },
    contentP: { fontSize: 14, lineHeight: 1.75, marginBottom: 4, color: 'rgba(255,255,255,0.7)' },
    contentLi: { fontSize: 14, lineHeight: 1.75, marginBottom: 2, paddingLeft: 16, color: 'rgba(255,255,255,0.7)' },
    code: { fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12.5, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: '#93bbfd' },
    searchResult: { padding: '12px 16px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' },
    versionFooter: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto', fontSize: 11.5, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  };

  return (
    <div style={styles.page}>
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Help Center</div>
          <input
            style={styles.searchInput}
            placeholder="Search help articles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            spellCheck="false"
          />
        </div>

        {HELP_SECTIONS.map(section => (
          <div key={section.id}>
            <button
              style={styles.sectionBtn(activeSection === section.id && !searchQuery)}
              onClick={() => navigateTo(section.id, section.articles[0]?.id)}
            >
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </button>
            {activeSection === section.id && !searchQuery && (
              <div>
                {section.articles.map(article => (
                  <button
                    key={article.id}
                    style={styles.articleBtn(activeArticle === article.id)}
                    onClick={() => navigateTo(section.id, article.id)}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={styles.versionFooter}>
          PrintFlow Lite v{APP_VERSION}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div style={styles.main}>
        {searchQuery && searchResults ? (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h2>
            {searchResults.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                No articles match your search. Try different keywords.
              </p>
            )}
            {searchResults.map(result => (
              <div
                key={result.id}
                style={styles.searchResult}
                onClick={() => navigateTo(result.sectionId, result.id)}
              >
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{result.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{result.sectionTitle}</div>
              </div>
            ))}
          </div>
        ) : currentArticle ? (
          <motion.div
            key={currentArticle.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {currentSection?.icon} {currentSection?.title}
            </div>
            <h1 style={styles.articleTitle}>{currentArticle.title}</h1>
            {renderContent(currentArticle.content)}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
