import React, { useState } from 'react';

const SECTIONS = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      { q: 'How do I add my first order?', a: 'Go to Orders → click "+ New Order". Fill in the customer name, description, and price. The order number is assigned automatically.' },
      { q: 'How do I add filament spools?', a: 'Go to Filament → click "+ Add Spool". Select your brand and material from the expanded catalogue (12+ brands), pick a colour, and enter the cost.' },
      { q: 'Can I add multiple users?', a: 'Yes — go to Users (owner only) → "+ Add User". Set their role: Owner, Manager, or Operator. Each person logs in with their own credentials.' },
      { q: 'Where is my data stored?', a: 'All data is stored locally on this computer. Go to Settings → Data Storage to see the exact folder path. Back it up regularly!' },
    ],
  },
  {
    title: 'Orders & Finance',
    icon: '📋',
    items: [
      { q: 'How do order statuses work?', a: 'New → Queued → Printing → QC → Packed → Shipped → Paid. You can update status from the order list or from the order detail view.' },
      { q: 'Are transactions created automatically?', a: 'Yes — when you create an order, an income transaction is created automatically. You can add expenses manually in the Finance tab.' },
      { q: 'How do I track shipping?', a: 'Open an order and add a tracking number and carrier. The order status will automatically move to Shipped.' },
    ],
  },
  {
    title: 'Printers & Maintenance',
    icon: '🖨️',
    items: [
      { q: 'What printers are supported?', a: 'Any FDM printer with a network connection can be added. Bambu Lab P1S and X1C have full LAN Mode support with live status. Other brands can be added for maintenance tracking.' },
      { q: 'How do I connect a Bambu printer?', a: 'Enable LAN Mode on the printer (Settings → Network → LAN Mode), then add it in PrintFlow Lite with the serial number, IP address, and access code.' },
      { q: 'What is the maintenance tracker?', a: 'The Parts & Maintenance page shows scheduled tasks for your printers. Filter by brand to see only tasks relevant to your setup. Mark tasks done to track when they were last completed.' },
    ],
  },
  {
    title: 'Updates & Data',
    icon: '🔄',
    items: [
      { q: 'How do updates work?', a: 'PrintFlow Lite checks GitHub for updates automatically at startup. If an update is available, a banner appears above the login screen. Click Download to get the new installer.' },
      { q: 'How do I back up my data?', a: 'Go to Settings → Data Storage to find your database folder. Copy the entire folder to a safe location. The database file is printflow.db.' },
      { q: 'Will I lose data if I reinstall?', a: 'No — your data is in your user data folder, not inside the app. Reinstalling the app does not affect your database. Just make sure to back up regularly.' },
    ],
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState({});
  const toggle = (key) => setOpen(o => ({ ...o, [key]: !o[key] }));

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <h1>Help & Support</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>Frequently asked questions and guides</p>
        </div>

        {SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:20 }}>{section.icon}</span>
              <h2 style={{ fontSize:16 }}>{section.title}</h2>
            </div>
            <div className="card" style={{ overflow:'hidden' }}>
              {section.items.map((item, i) => {
                const key = `${section.title}-${i}`;
                const isOpen = open[key];
                return (
                  <div key={i} style={{ borderBottom: i < section.items.length-1 ? '0.5px solid var(--border)' : 'none' }}>
                    <button onClick={() => toggle(key)} style={{ width:'100%', padding:'14px 20px', background:'transparent', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left', gap:12 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{item.q}</span>
                      <span style={{ fontSize:16, color:'var(--text-tertiary)', flexShrink:0, transition:'transform 0.2s', transform:isOpen?'rotate(45deg)':'none' }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding:'0 20px 16px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="card" style={{ padding:24, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>Need more help?</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Open an issue on GitHub or check the documentation.</div>
          <button className="btn btn-secondary" onClick={() => window.printflow.openExternal('https://github.com/rbd992/printflow-lite/issues')}>
            Open GitHub Issues ↗
          </button>
        </div>
      </div>
    </div>
  );
}
