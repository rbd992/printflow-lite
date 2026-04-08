import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

// ── Professional 3D printer SVG ───────────────────────────────────────────
function Printer3DIcon({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Frame uprights */}
      <rect x="6"  y="10" width="5" height="36" rx="2.5" fill={color} opacity="0.35"/>
      <rect x="53" y="10" width="5" height="36" rx="2.5" fill={color} opacity="0.35"/>
      {/* Top crossbar */}
      <rect x="6"  y="10" width="52" height="7"  rx="3.5" fill={color} opacity="0.6"/>
      {/* Print head housing */}
      <rect x="22" y="10" width="20" height="11" rx="3"   fill={color}/>
      {/* Nozzle */}
      <path d="M29 21 L32 29 L35 21 Z" fill={color}/>
      {/* Extruded layers — the printed object */}
      <rect x="20" y="42" width="24" height="4.5" rx="2"   fill={color} opacity="0.55"/>
      <rect x="22" y="37" width="20" height="4.5" rx="2"   fill={color} opacity="0.45"/>
      <rect x="24" y="32" width="16" height="4.5" rx="2"   fill={color} opacity="0.35"/>
      {/* Build plate */}
      <rect x="10" y="46" width="44" height="4"   rx="2"   fill={color} opacity="0.4"/>
      {/* Base */}
      <rect x="7"  y="50" width="50" height="7"   rx="3.5" fill={color} opacity="0.6"/>
      {/* Filament guide dot */}
      <circle cx="52" cy="14" r="2.5" fill={color} opacity="0.9"/>
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div
      style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width, maxHeight:'90vh', overflowY:'auto',
        background:'linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',
        border:'0.5px solid rgba(255,255,255,0.1)',
        borderRadius:20, padding:'28px 32px 24px',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        backdropFilter:'blur(40px)',
        animation:'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <h2 style={{ fontSize:17,fontWeight:700,letterSpacing:'-0.02em' }}>{title}</h2>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:8,border:'0.5px solid var(--border)',background:'var(--bg-hover)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Form field helpers ────────────────────────────────────────────────────
function FormRow({ children }) {
  return <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>{children}</div>;
}
function FormGroup({ label, hint, children }) {
  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
        <label style={{ fontSize:11,fontWeight:600,color:'var(--text-tertiary)',letterSpacing:'0.07em',textTransform:'uppercase' }}>{label}</label>
        {hint && <span style={{ fontSize:10,color:'var(--text-tertiary)',opacity:0.6 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const BLANK = {
  name:'', brand:'Generic', model:'', serial:'', ip_address:'', access_code:'',
  camera_url:'', connection_type:'network', has_ams:false, ams_count:0, notes:''
};

const BRANDS = ['Generic','Bambu Lab','Prusa','Creality','Voron','AnkerMake','Elegoo','FlashForge','Other'];

export default function PrintersPage() {
  const [printers, setPrinters] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  const load = useCallback(async () => {
    try { const r = await api.get('/api/printers'); setPrinters(r.data); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditingId(null); setForm(BLANK); setErr(''); setShowAdd(true); }
  function openEdit(p) {
    setEditingId(p.id);
    setForm({ name:p.name||'', brand:p.brand||'Generic', model:p.model||'', serial:p.serial||'', ip_address:p.ip_address||'', access_code:p.access_code||'', camera_url:p.camera_url||'', connection_type:p.connection_type||'network', has_ams:!!p.has_ams, ams_count:p.ams_count||0, notes:p.notes||'' });
    setErr(''); setShowAdd(true);
  }

  async function savePrinter() {
    setSaving(true); setErr('');
    try {
      const payload = { ...form, has_ams:!!form.has_ams, ams_count:parseInt(form.ams_count)||0 };
      if (editingId) await api.patch(`/api/printers/${editingId}`, payload);
      else await api.post('/api/printers', payload);
      setShowAdd(false); setForm(BLANK); await load();
    } catch(e) { setErr(e.response?.data?.error || 'Failed to save'); }
    setSaving(false);
  }

  async function removePrinter(printer) {
    if (!window.confirm(`Remove "${printer.name}"? This cannot be undone.`)) return;
    try { await api.delete(`/api/printers/${printer.id}`); await load(); } catch(e) { alert(e.response?.data?.error || 'Failed'); }
  }

  const F = k => ({ value: form[k] ?? '', onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) });

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:28 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.025em', marginBottom:4 }}>Printers</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:13 }}>{printers.length} registered machine{printers.length!==1?'s':''}</p>
          </div>
          {isOwner && (
            <button className="btn btn-primary" onClick={openAdd} style={{ gap:6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Printer
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:48, color:'var(--text-tertiary)', fontSize:13 }}>
            <div style={{ width:16, height:16, border:'2px solid var(--border-strong)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            Loading printers…
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>

            {printers.map(p => (
              <div key={p.id} className="card" style={{ padding:22, position:'relative', overflow:'hidden' }}>
                {/* Subtle accent line */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, var(--accent), transparent)`, opacity:0.4, borderRadius:'20px 20px 0 0' }}/>

                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:'var(--accent-light)', border:'0.5px solid rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', flexShrink:0 }}>
                    <Printer3DIcon size={26}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{p.brand}{p.model ? ` · ${p.model}` : ''}</div>
                  </div>
                  <span style={{
                    fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                    padding:'3px 8px', borderRadius:99,
                    background: p.is_active ? 'var(--green-light)' : 'var(--red-light)',
                    color: p.is_active ? 'var(--green)' : 'var(--red)',
                    border: `0.5px solid ${p.is_active ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                    flexShrink:0,
                  }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', marginBottom:14 }}>
                  {p.serial && <Detail label="Serial" value={p.serial} mono/>}
                  {p.ip_address && <Detail label="IP" value={p.ip_address} mono/>}
                  {p.has_ams && <Detail label="AMS" value={`${p.ams_count} trays`}/>}
                  {p.connection_type && <Detail label="Connection" value={p.connection_type}/>}
                  {p.camera_url && <Detail label="Camera" value="Configured"/>}
                </div>

                {p.notes && (
                  <div style={{ fontSize:12, color:'var(--text-secondary)', padding:'8px 10px', background:'var(--bg-hover)', borderRadius:8, marginBottom:14, lineHeight:1.5 }}>
                    {p.notes}
                  </div>
                )}

                {isOwner && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex:1, fontSize:11 }} onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11, color:'var(--red)' }} onClick={() => removePrinter(p)}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add card */}
            {isOwner && (
              <div
                className="card"
                onClick={openAdd}
                style={{ padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, border:'0.5px dashed var(--border-strong)', background:'transparent', minHeight:180, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-strong)'; e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ width:48, height:48, borderRadius:14, border:'0.5px dashed var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-tertiary)' }}>
                  <Printer3DIcon size={26}/>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>Add Printer</div>
                  <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:2 }}>Register a new machine</div>
                </div>
              </div>
            )}

            {printers.length === 0 && !isOwner && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:64, color:'var(--text-tertiary)' }}>
                <Printer3DIcon size={40}/>
                <div style={{ marginTop:12, fontSize:14 }}>No printers registered yet</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAdd && (
        <Modal title={editingId ? 'Edit Printer' : 'Add Printer'} onClose={() => setShowAdd(false)}>
          <FormRow>
            <FormGroup label="Printer Name" hint="Required">
              <input className="input" {...F('name')} autoFocus placeholder="e.g. Workshop P1S"/>
            </FormGroup>
            <FormGroup label="Brand">
              <select className="select" {...F('brand')}>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup label="Model" hint="Required">
              <input className="input" {...F('model')} placeholder="e.g. P1S, MK4, Ender 3"/>
            </FormGroup>
            <FormGroup label="Serial Number" hint="Required">
              <input className="input" {...F('serial')} placeholder="SN-XXXXX" style={{ fontFamily:'monospace' }}/>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup label="IP Address" hint="Optional">
              <input className="input" {...F('ip_address')} placeholder="192.168.1.100" style={{ fontFamily:'monospace' }}/>
            </FormGroup>
            <FormGroup label="Access Code" hint="Optional">
              <input className="input" {...F('access_code')} placeholder="XXXXXXXX" style={{ fontFamily:'monospace' }}/>
            </FormGroup>
          </FormRow>

          {/* Camera feed */}
          <div style={{ marginBottom:14 }}>
            <FormGroup label="Camera Stream URL" hint="Optional — RTSP or HTTP">
              <input className="input" {...F('camera_url')} placeholder="rtsp://192.168.1.100/stream or http://..."/>
            </FormGroup>
          </div>

          {/* AMS */}
          <div style={{ marginBottom:14, padding:'12px 14px', background:'var(--bg-hover)', borderRadius:10, border:'0.5px solid var(--border)' }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
              <div
                onClick={() => setForm(f => ({ ...f, has_ams: !f.has_ams }))}
                style={{
                  width:36, height:20, borderRadius:10, flexShrink:0,
                  background: form.has_ams ? 'var(--accent)' : 'var(--border-strong)',
                  position:'relative', transition:'background 0.2s', cursor:'pointer',
                }}
              >
                <div style={{
                  width:16, height:16, borderRadius:'50%', background:'#fff',
                  position:'absolute', top:2,
                  left: form.has_ams ? 18 : 2,
                  transition:'left 0.2s',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
                }}/>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Multi-material / AMS unit</div>
                <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:1 }}>Bambu AMS, Prusa MMU, or similar</div>
              </div>
            </label>
            {form.has_ams && (
              <div style={{ marginTop:12 }}>
                <FormGroup label="Tray Count">
                  <input className="input" type="number" min="1" max="16" {...F('ams_count')} style={{ width:100 }}/>
                </FormGroup>
              </div>
            )}
          </div>

          <div style={{ marginBottom:18 }}>
            <FormGroup label="Notes" hint="Optional">
              <input className="input" {...F('notes')} placeholder="e.g. Dedicated to PETG prints"/>
            </FormGroup>
          </div>

          {err && (
            <div style={{ padding:'10px 12px', background:'var(--red-light)', border:'0.5px solid rgba(248,113,113,0.25)', borderRadius:8, color:'var(--red)', fontSize:12, marginBottom:14 }}>
              {err}
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={savePrinter} disabled={saving || !form.name || !form.model || !form.serial}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Printer'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:600, color:'var(--text-tertiary)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', fontFamily: mono ? 'monospace' : 'inherit', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
    </div>
  );
}
