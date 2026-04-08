// [BOTH] — copied from enterprise
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { onSocketEvent } from '../api/socket';
import { useAuthStore } from '../stores/authStore';

function Modal({ title, onClose, children, width=480 }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card" style={{ width,maxHeight:'90vh',overflowY:'auto',padding:28,animation:'fadeIn 0.2s ease' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { name:'',brand:'generic',model:'',serial:'',ip_address:'',access_code:'',connection_type:'network',has_ams:false,ams_count:0,notes:'' };
const BRANDS = ['generic','Bambu Lab','Prusa','Creality','Voron','AnkerMake','Elegoo','FlashForge','Other'];

export default function PrintersPage() {
  const [printers,setPrinters] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [showAdd,setShowAdd]   = useState(false);
  const [form,setForm]         = useState(BLANK);
  const [saving,setSaving]     = useState(false);
  const [err,setErr]           = useState('');
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  const load = useCallback(async()=>{
    try { const r = await api.get('/api/printers'); setPrinters(r.data); } catch {}
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  async function addPrinter() {
    setSaving(true); setErr('');
    try {
      await api.post('/api/printers', { ...form, has_ams: !!form.has_ams, ams_count: parseInt(form.ams_count)||0 });
      setShowAdd(false); setForm(BLANK); await load();
    } catch(e) { setErr(e.response?.data?.error||'Failed'); }
    setSaving(false);
  }

  async function removePrinter(printer) {
    if(!window.confirm(`Remove "${printer.name}"?`)) return;
    try { await api.delete(`/api/printers/${printer.id}`); await load(); } catch(e) { alert(e.response?.data?.error||'Failed'); }
  }

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });

  return (
    <div style={{ height:'100%',overflowY:'auto',padding:24 }}>
      <div style={{ maxWidth:1200,margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div><h1>Printers</h1><p style={{ color:'var(--text-secondary)',fontSize:13,marginTop:4 }}>{printers.length} registered</p></div>
          {isOwner && <button className="btn btn-primary" onClick={()=>{setShowAdd(true);setForm(BLANK);setErr('');}}>+ Add Printer</button>}
        </div>

        {loading ? <div style={{ padding:32,color:'var(--text-secondary)' }}>Loading...</div> : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16 }}>
            {printers.map(p=>(
              <div key={p.id} className="card" style={{ padding:20 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
                  <div style={{ width:40,height:40,borderRadius:10,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>🖨️</div>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700 }}>{p.name}</div>
                    <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{p.brand} {p.model}</div>
                  </div>
                  <span className={`pill ${p.is_active?'pill-green':'pill-red'}`} style={{ marginLeft:'auto',fontSize:10 }}>{p.is_active?'Active':'Inactive'}</span>
                </div>
                <div style={{ fontSize:12,color:'var(--text-tertiary)',marginBottom:4 }}>Serial: <span style={{ fontFamily:'monospace' }}>{p.serial}</span></div>
                {p.ip_address && <div style={{ fontSize:12,color:'var(--text-tertiary)',marginBottom:4 }}>IP: {p.ip_address}</div>}
                {p.has_ams && <div style={{ fontSize:12,color:'var(--accent)',marginBottom:4 }}>AMS: {p.ams_count} trays</div>}
                {p.notes && <div style={{ fontSize:12,color:'var(--text-secondary)',marginTop:8 }}>{p.notes}</div>}
                {isOwner && <button className="btn btn-ghost btn-sm" style={{ marginTop:12,fontSize:11,color:'var(--red)' }} onClick={()=>removePrinter(p)}>Remove</button>}
              </div>
            ))}
            {isOwner && (
              <div className="card interactive" onClick={()=>{setShowAdd(true);setForm(BLANK);setErr('');}}
                style={{ padding:24,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,border:'0.5px dashed var(--border-strong)',background:'transparent',minHeight:160 }}>
                <span style={{ fontSize:32,opacity:0.4 }}>🖨️</span>
                <span style={{ fontSize:13,color:'var(--text-tertiary)',fontWeight:500 }}>Add Printer</span>
              </div>
            )}
            {printers.length===0&&!isOwner&&<div style={{ gridColumn:'1/-1',textAlign:'center',padding:48,color:'var(--text-tertiary)' }}>No printers yet</div>}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Printer" onClose={()=>setShowAdd(false)}>
          <div className="form-row">
            <div className="form-group"><label className="label">Printer Name *</label><input className="input" {...F('name')} autoFocus placeholder="e.g. Workshop P1S" /></div>
            <div className="form-group"><label className="label">Brand</label><select className="select" {...F('brand')}>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Model *</label><input className="input" {...F('model')} placeholder="e.g. P1S, MK4, Ender 3" /></div>
            <div className="form-group"><label className="label">Serial Number *</label><input className="input" {...F('serial')} style={{ fontFamily:'monospace' }} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">IP Address</label><input className="input" {...F('ip_address')} placeholder="192.168.1.100" style={{ fontFamily:'monospace' }} /></div>
            <div className="form-group"><label className="label">Access Code</label><input className="input" {...F('access_code')} style={{ fontFamily:'monospace' }} /></div>
          </div>
          <div className="form-group" style={{ display:'flex',alignItems:'center',gap:8 }}>
            <input type="checkbox" id="has_ams" checked={!!form.has_ams} onChange={e=>setForm(f=>({...f,has_ams:e.target.checked}))} style={{ width:16,height:16 }} />
            <label htmlFor="has_ams" style={{ fontSize:13,cursor:'pointer' }}>Has AMS / multi-material unit</label>
          </div>
          {form.has_ams && <div className="form-group"><label className="label">AMS Tray Count</label><input className="input" type="number" min="1" max="16" {...F('ams_count')} /></div>}
          <div className="form-group"><label className="label">Notes</label><input className="input" {...F('notes')} /></div>
          {err && <div style={{ color:'var(--red)',fontSize:12,marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:8 }}>
            <button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addPrinter} disabled={saving||!form.name||!form.model||!form.serial}>{saving?'Adding...':'Add Printer'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
