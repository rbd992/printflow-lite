import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

export default function QuotePage() {
  const [form, setForm] = useState({ customer_name:'', customer_email:'', description:'', material:'PLA', grams:'', labor_hours:'0', labor_rate:'25', markup:'40', include_hst:true, notes:'' });
  const [price, setPrice] = useState(null);
  const { user } = useAuthStore();

  function calculate() {
    const filamentCost = (parseFloat(form.grams)||0) * 0.025;
    const laborCost    = (parseFloat(form.labor_hours)||0) * (parseFloat(form.labor_rate)||0);
    const subtotal     = (filamentCost + laborCost) * (1 + (parseFloat(form.markup)||0)/100);
    const hst          = form.include_hst ? subtotal * 0.13 : 0;
    setPrice({ filamentCost, laborCost, subtotal, hst, total: subtotal + hst });
  }

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}><h1>Quotes & Invoices</h1><p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>Generate quotes and price estimates</p></div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card" style={{ padding:24 }}>
            <h3 style={{ marginBottom:16 }}>Price Calculator</h3>
            <div className="form-group"><label className="label">Material</label>
              <select className="select" {...F('material')}>
                {['PLA','PETG','ABS','ASA','TPU','PA','PC'].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="label">Est. Grams</label><input className="input" type="number" min="0" {...F('grams')} placeholder="85" /></div>
              <div className="form-group"><label className="label">Labour Hours</label><input className="input" type="number" min="0" step="0.25" {...F('labor_hours')} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="label">Labour Rate ($/hr)</label><input className="input" type="number" {...F('labor_rate')} /></div>
              <div className="form-group"><label className="label">Markup (%)</label><input className="input" type="number" {...F('markup')} /></div>
            </div>
            <div className="form-group" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" id="hst" checked={form.include_hst} onChange={e=>setForm(f=>({...f,include_hst:e.target.checked}))} style={{ width:15,height:15 }} />
              <label htmlFor="hst" style={{ fontSize:13, cursor:'pointer' }}>Include HST (13%)</label>
            </div>
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={calculate}>Calculate Price</button>
          </div>

          <div className="card" style={{ padding:24 }}>
            <h3 style={{ marginBottom:16 }}>Price Breakdown</h3>
            {price ? (
              <div>
                {[['Filament cost',price.filamentCost],['Labour',price.laborCost],['Subtotal + markup',price.subtotal],['HST (13%)',price.hst]].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'0.5px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--text-secondary)' }}>{l}</span>
                    <span>${v.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontSize:20, fontWeight:700, color:'var(--accent)' }}>
                  <span>Total</span>
                  <span>${price.total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-tertiary)', fontSize:13 }}>
                Fill in the details and click Calculate
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding:24, marginTop:16 }}>
          <h3 style={{ marginBottom:16 }}>Customer Details</h3>
          <div className="form-row">
            <div className="form-group"><label className="label">Customer Name</label><input className="input" {...F('customer_name')} /></div>
            <div className="form-group"><label className="label">Email</label><input className="input" type="email" {...F('customer_email')} /></div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea className="input" rows={2} {...F('description')} placeholder="Describe the print job..." /></div>
          <div className="form-group"><label className="label">Notes</label><textarea className="input" rows={2} {...F('notes')} /></div>
          <button className="btn btn-secondary" style={{ marginTop:8 }} onClick={() => alert('Quote PDF generation coming soon!')}>
            📄 Generate Quote PDF
          </button>
        </div>
      </div>
    </div>
  );
}
