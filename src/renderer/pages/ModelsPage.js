import React from 'react';

export default function ModelsPage() {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}><h1>Models</h1><p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>Your 3D model library</p></div>
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🗂️</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Model Library</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', maxWidth:400, margin:'0 auto', lineHeight:1.7 }}>
            Track your .3mf and .stl files, link them to orders, and keep notes on print settings.
          </div>
          <div style={{ marginTop:24, padding:'14px 20px', background:'var(--bg-hover)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--text-secondary)', maxWidth:400, margin:'24px auto 0', lineHeight:1.7 }}>
            <strong style={{ color:'var(--text-primary)', display:'block', marginBottom:6 }}>Coming in next update:</strong>
            Model browser · Print settings per model · Link to orders · Thumbnail previews
          </div>
        </div>
      </div>
    </div>
  );
}
