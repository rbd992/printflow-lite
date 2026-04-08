// [BOTH] PartsPage — brand-agnostic with maintenance catalogue
import React, { useState, useEffect, useCallback } from 'react';
import { partsApi, settingsApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { MAINTENANCE_CATALOGUE, PRINTER_BRANDS, getTasksForBrands } from '../data/maintenanceCatalogue';

function Modal({ title, onClose, children, width=520 }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card" style={{ width,maxHeight:'92vh',overflowY:'auto',padding:28 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PartsPage() {
  const [tab, setTab]             = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ name:'',category:'Nozzles',description:'',quantity:1,reorder_at:1,unit_cost:'',printer_brand:'',printer_model:'' });
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [completed, setCompleted] = useState({});
  const { user } = useAuthStore();
  const canEdit = ['owner','manager'].includes(user?.role);

  const load = useCallback(async () => {
    try { const r = await partsApi.list(); setInventory(r.data||[]); } catch {} setLoading(false);
  }, []);

  const loadCompleted = useCallback(async () => {
    try { const r = await settingsApi.get('maintenance_completed'); setCompleted(r.data?.value||{}); } catch {}
  }, []);

  useEffect(() => { load(); loadCompleted(); }, [load, loadCompleted]);

  async function addPart() {
    setSaving(true); setErr('');
    try {
      await partsApi.create({ ...form,quantity:parseInt(form.quantity)||1,reorder_at:parseInt(form.reorder_at)||1,unit_cost:parseFloat(form.unit_cost)||0 });
      setShowAdd(false); await load();
    } catch(e) { setErr(e.response?.data?.error||'Failed'); }
    setSaving(false);
  }

  async function adjustQty(part, delta) {
    const q = Math.max(0,(part.quantity||1)+delta);
    if(q===0) { if(!window.confirm('Remove?')) return; await partsApi.remove(part.id); }
    else await partsApi.update(part.id,{quantity:q});
    await load();
  }

  async function markDone(key) {
    const updated = { ...completed,[key]:new Date().toLocaleDateString('en-CA') };
    setCompleted(updated);
    try { await settingsApi.set('maintenance_completed',updated); } catch {}
  }

  async function clearDone(key) {
    const updated = { ...completed }; delete updated[key];
    setCompleted(updated);
    try { await settingsApi.set('maintenance_completed',updated); } catch {}
  }

  function toggleBrand(key) {
    setSelectedBrands(p => p.includes(key) ? p.filter(b=>b!==key) : [...p,key]);
  }

  const tasks = getTasksForBrands(selectedBrands);
  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });

  return (
    <div style={{ height:'100%',overflowY:'auto',padding:24 }}>
      <div style={{ maxWidth:1200,margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div><h1>Parts & Maintenance</h1></div>
          {canEdit&&tab==='inventory'&&<button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Part</button>}
        </div>

        <div style={{ display:'flex',gap:4,marginBottom:20,background:'var(--bg-hover)',borderRadius:'var(--r-sm)',padding:4,width:'fit-content' }}>
          {[['inventory','📦 Inventory'],['maintenance','🔧 Maintenance']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className={`btn ${tab===t?'btn-primary':'btn-ghost'}`} style={{ fontSize:13 }}>{l}</button>
          ))}
        </div>

        {tab==='inventory'&&(
          loading?<div style={{ padding:32,color:'var(--text-secondary)' }}>Loading...</div>:(
            <div>
              {inventory.length===0 ? (
                <div className="card" style={{ padding:48,textAlign:'center' }}>
                  <div style={{ fontSize:48,marginBottom:12 }}>🔩</div>
                  <div style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>No parts yet</div>
                  {canEdit&&<button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add First Part</button>}
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12 }}>
                  {inventory.map(item=>(
                    <div key={item.id} className="card" style={{ padding:16 }}>
                      <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{item.name}</div>
                      <div style={{ fontSize:11,color:'var(--text-tertiary)',marginBottom:8 }}>{item.category}{item.printer_brand?` · ${item.printer_brand}`:''}</div>
                      {item.description&&<div style={{ fontSize:11,color:'var(--text-secondary)',marginBottom:8,lineHeight:1.5 }}>{item.description}</div>}
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                        <div><div style={{ fontSize:15,fontWeight:700,color:'var(--accent)' }}>${(item.unit_cost||0).toFixed(2)}</div></div>
                        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                          {canEdit&&<button className="btn btn-secondary btn-sm" style={{ width:28,height:28,padding:0,justifyContent:'center' }} onClick={()=>adjustQty(item,-1)}>-</button>}
                          <span style={{ fontSize:16,fontWeight:700,minWidth:28,textAlign:'center' }}>{item.quantity||1}</span>
                          {canEdit&&<button className="btn btn-secondary btn-sm" style={{ width:28,height:28,padding:0,justifyContent:'center' }} onClick={()=>adjustQty(item,1)}>+</button>}
                        </div>
                      </div>
                      {item.quantity<=(item.reorder_at||1)&&<div style={{ marginTop:8,fontSize:11,color:'var(--amber)' }}>⚠ Low stock — reorder</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {tab==='maintenance'&&(
          <div>
            {/* Brand filter */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:8 }}>Filter by your printer brands:</div>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {PRINTER_BRANDS.map(b=>(
                  <button key={b.key} onClick={()=>toggleBrand(b.key)} className={`btn btn-sm ${selectedBrands.includes(b.key)?'btn-primary':'btn-secondary'}`}>
                    {b.icon} {b.label}
                  </button>
                ))}
                {selectedBrands.length>0&&<button className="btn btn-ghost btn-sm" onClick={()=>setSelectedBrands([])}>Clear</button>}
              </div>
              {selectedBrands.length===0&&<div style={{ fontSize:11,color:'var(--text-tertiary)',marginTop:6 }}>Showing all tasks including generic FDM. Select your printer brands to filter.</div>}
            </div>

            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {tasks.map(task=>{
                const key = `${task.brand}__${task.task}`;
                const done = !!completed[key];
                const dc = done?'var(--green)':'var(--text-tertiary)';
                return (
                  <div key={key} className="card" style={{ padding:16,borderLeft:`3px solid ${dc}` }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:12 }}>
                      <div style={{ width:10,height:10,borderRadius:'50%',background:dc,marginTop:4,flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                          <div style={{ fontSize:14,fontWeight:600 }}>{task.task}</div>
                          <span className="pill pill-blue" style={{ fontSize:10 }}>{task.brand==='generic'?'All FDM':task.brand}</span>
                          <span style={{ fontSize:11,color:'var(--text-tertiary)' }}>{task.interval_label}</span>
                        </div>
                        <div style={{ fontSize:12,color:'var(--text-secondary)',lineHeight:1.5,marginBottom:done?6:0 }}>{task.instructions}</div>
                        {done&&<div style={{ fontSize:11,color:'var(--text-tertiary)' }}>Last done: {completed[key]}</div>}
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {done?<button className="btn btn-secondary btn-sm" onClick={()=>clearDone(key)}>Reset</button>:<button className="btn btn-primary btn-sm" onClick={()=>markDone(key)}>Mark Done</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {tasks.length===0&&<div style={{ padding:40,textAlign:'center',color:'var(--text-tertiary)' }}>No tasks match your filter</div>}
            </div>
          </div>
        )}
      </div>

      {showAdd&&(
        <Modal title="Add Part" onClose={()=>setShowAdd(false)}>
          <div className="form-row">
            <div className="form-group"><label className="label">Part Name *</label><input className="input" {...F('name')} autoFocus /></div>
            <div className="form-group"><label className="label">Category</label>
              <select className="select" {...F('category')}>
                {['Nozzles','Build Plates','Belts & Motion','PTFE & Bowden','Lubrication','Hotend Parts','Electronics','Cleaning','Other'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Printer Brand</label><input className="input" {...F('printer_brand')} placeholder="e.g. Bambu Lab, Prusa" /></div>
            <div className="form-group"><label className="label">Printer Model</label><input className="input" {...F('printer_model')} placeholder="e.g. P1S, MK4" /></div>
          </div>
          <div className="form-group"><label className="label">Description / Notes</label><input className="input" {...F('description')} /></div>
          <div className="form-row">
            <div className="form-group"><label className="label">Quantity</label><input className="input" type="number" min="0" {...F('quantity')} /></div>
            <div className="form-group"><label className="label">Reorder At</label><input className="input" type="number" min="0" {...F('reorder_at')} /></div>
            <div className="form-group"><label className="label">Unit Cost ($)</label><input className="input" type="number" step="0.01" {...F('unit_cost')} /></div>
          </div>
          {err&&<div style={{ color:'var(--red)',fontSize:12,marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:8 }}>
            <button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addPart} disabled={saving||!form.name}>{saving?'Saving...':'Add Part'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
