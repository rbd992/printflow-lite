import React from 'react';

export default function MarketingPage() {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}><h1>Marketing</h1><p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>Platform connections and promotions</p></div>
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📣</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Marketing Tools</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', maxWidth:400, margin:'0 auto', lineHeight:1.7 }}>
            Connect your Etsy, Shopify, and social media platforms to sync listings and track performance.
          </div>
          <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, maxWidth:600, margin:'24px auto 0' }}>
            {['Etsy','Shopify','Amazon','Facebook','Instagram','TikTok'].map(p=>(
              <div key={p} style={{ padding:'14px 16px', background:'var(--bg-hover)', borderRadius:'var(--r-md)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{p}</span>
                <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
