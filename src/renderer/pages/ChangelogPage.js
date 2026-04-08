import React from 'react';

const CHANGELOG = [
  {
    version: '0.1.3-beta',
    date: 'April 2026',
    title: 'First Beta Release',
    highlights: ['Standalone app — no server required','5-step setup wizard','12-brand filament catalogue','Brand-agnostic maintenance tracker'],
    changes: [
      { type: 'new', text: 'PrintFlow Lite — standalone Electron app with bundled local server' },
      { type: 'new', text: '5-step setup wizard: business info, owner account, preferences' },
      { type: 'new', text: 'Expanded filament catalogue: Bambu Lab, Hatchbox, eSUN, Prusament, Polymaker, Overture, Sunlu, Elegoo, Inland, MatterHackers, 3D Printing Canada, Amazon Basics' },
      { type: 'new', text: 'Brand-agnostic maintenance tracker with 35+ tasks for generic FDM, Bambu, Prusa, Creality, and Voron' },
      { type: 'new', text: 'Automatic update check via GitHub Releases on every startup' },
      { type: 'new', text: 'Loading bar on login screen shows server startup and update check progress' },
      { type: 'new', text: 'Multi-user support with Owner / Manager / Operator roles' },
      { type: 'new', text: 'Brand-agnostic printer management — any FDM printer, any brand' },
      { type: 'new', text: 'Full orders, finance, customers, filament, parts, and job queue' },
      { type: 'new', text: 'Mac DMG, Windows EXE, and Linux AppImage installers' },
      { type: 'new', text: 'Ad-hoc Mac signing (no "app is damaged" error), Azure Trusted Signing ready for Windows' },
    ],
  },
];

const TYPE_STYLES = {
  new:  { label: 'New',  bg: 'var(--green-light)',  color: 'var(--green)'  },
  fix:  { label: 'Fix',  bg: 'var(--amber-light)',  color: 'var(--amber)'  },
  imp:  { label: 'Improved', bg: 'var(--accent-light)', color: 'var(--accent)' },
  break:{ label: 'Breaking', bg: 'var(--red-light)',    color: 'var(--red)'    },
};

export default function ChangelogPage() {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <h1>Changelog</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>PrintFlow Lite release history</p>
        </div>

        {CHANGELOG.map((release, ri) => (
          <div key={release.version} style={{ marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ padding:'6px 14px', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:14, background:ri===0?'var(--accent)':'var(--bg-active)', color:ri===0?'#fff':'var(--text-secondary)' }}>
                v{release.version}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:600 }}>{release.title}</div>
                <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{release.date}</div>
              </div>
              {ri===0 && <span className="pill pill-green" style={{ marginLeft:'auto' }}>Current</span>}
            </div>

            {release.highlights && (
              <div style={{ marginBottom:14, padding:'12px 16px', background:'var(--bg-hover)', borderRadius:'var(--r-sm)', borderLeft:`3px solid ${ri===0?'var(--accent)':'var(--border-strong)'}` }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-tertiary)', marginBottom:8 }}>Highlights</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {release.highlights.map((h,i)=>(
                    <span key={i} style={{ fontSize:12, color:'var(--text-secondary)', background:'var(--bg-card)', padding:'3px 10px', borderRadius:20, border:'0.5px solid var(--border)' }}>{h}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="card" style={{ overflow:'hidden' }}>
              {release.changes.map((change, ci) => {
                const meta = TYPE_STYLES[change.type] || TYPE_STYLES.new;
                return (
                  <div key={ci} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 16px', borderBottom:'0.5px solid var(--border)' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:700, flexShrink:0, marginTop:1, background:meta.bg, color:meta.color }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.5 }}>{change.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
