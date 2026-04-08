import React from 'react';
import { useAuthStore } from '../stores/authStore';

export default function ShippingPage() {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}><h1>Shipping</h1><p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>Rate calculation and label generation</p></div>
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📦</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Shipping Integration</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', maxWidth:400, margin:'0 auto', lineHeight:1.7 }}>
            Canada Post rate calculation and label generation. Configure your API credentials in Settings to get started.
          </div>
          <div style={{ marginTop:24, padding:'14px 20px', background:'var(--bg-hover)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--text-secondary)', maxWidth:400, margin:'24px auto 0', textAlign:'left', lineHeight:1.7 }}>
            <strong style={{ color:'var(--text-primary)', display:'block', marginBottom:6 }}>Coming in next update:</strong>
            Canada Post label generation · Rate comparison · Tracking integration
          </div>
        </div>
      </div>
    </div>
  );
}
