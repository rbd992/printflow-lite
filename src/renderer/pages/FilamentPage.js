// [BOTH] FilamentPage — adapted for multi-brand catalogue
import React, { useEffect, useState, useCallback } from 'react';
import { filamentApi } from '../api/client';
import { onSocketEvent } from '../api/socket';
import { useAuthStore } from '../stores/authStore';
import { BRAND_CATALOGUE, MATERIAL_TYPES, SPOOL_WEIGHTS, ALL_BRANDS, getBrandColors, getBrandMaterials, getBrandPrice } from '../data/filamentCatalogue';

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card" style={{ width:540,maxHeight:'92vh',overflowY:'auto',padding:28 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { brand:'Bambu Lab',material:'PLA',color_name:'',color_hex:'#3B82F6',diameter_mm:1.75,full_weight_g:1000,remaining_g:1000,cost_cad:'',reorder_at_g:200,auto_reorder:false,reorder_qty:1,notes:'' };

export default function FilamentPage() {
  const [spools,setSpools]   = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter]   = useState({ material:'',search:'',showLow:false });
  const [editing,setEditing] = useState(null);
  const [form,setForm]       = useState(BLANK);
  const [saving,setSaving]   = useState(false);
  const [err,setErr]         = useState('');
  const { user } = useAuthStore();
  const canEdit = ['owner','manager'].includes(user?.role);

  const load = useCallback(async()=>{
    try { const r = await filamentApi.list(); setSpools(r.data); } catch {} setLoading(false);
  },[]);

  useEffect(()=>{
    load();
    const u1=onSocketEvent('filament:updated',u=>setSpools(p=>p.some(s=>s.id===u.id)?p.map(s=>s.id===u.id?u:s):[...p,u]));
    const u2=onSocketEvent('filament:deleted',({id})=>setSpools(p=>p.filter(s=>s.id!==id)));
    return()=>{u1();u2();};
  },[load]);

  const filtered = spools.filter(s=>{
    if(filter.material && s.material!==filter.material) return false;
    if(filter.showLow && !s.is_low) return false;
    if(filter.search && !`${s.brand} ${s.color_name} ${s.material}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const lowCount = spools.filter(s=>s.is_low).length;
  const totalKg = (spools.reduce((a,s)=>a+s.remaining_g,0)/1000).toFixed(2);

  function openAdd() { setForm(BLANK); setEditing({}); setErr(''); }
  function openEdit(s) { setForm({ ...s,cost_cad:s.cost_cad||'',auto_reorder:!!s.auto_reorder }); setEditing(s); setErr(''); }

  async function save() {
    setSaving(true); setErr('');
    try {
      const payload = { ...form,diameter_mm:parseFloat(form.diameter_mm)||1.75,full_weight_g:parseInt(form.full_weight_g)||1000,remaining_g:parseFloat(form.remaining_g)||0,cost_cad:parseFloat(form.cost_cad)||0,reorder_at_g:parseInt(form.reorder_at_g)||200,auto_reorder:!!form.auto_reorder,reorder_qty:parseInt(form.reorder_qty)||1 };
      if(!payload.color_name) { setErr('Colour name required'); setSaving(false); return; }
      if(editing?.id) await filamentApi.update(editing.id,payload);
      else await filamentApi.create(payload);
      setEditing(null); await load();
    } catch(e) { setErr(e.response?.data?.error||'Save failed'); }
    setSaving(false);
  }

  async function del(id) {
    if(!window.confirm('Delete this spool?')) return;
    try { await filamentApi.remove(id); setEditing(null); await load(); } catch {}
  }

  // When brand or material changes, auto-fill price
  function onBrandChange(brand) {
    const mats = getBrandMaterials(brand);
    const mat = mats.includes(form.material) ? form.material : mats[0] || form.material;
    const price = getBrandPrice(brand, mat);
    setForm(f=>({ ...f, brand, material:mat, cost_cad: price ? String(price) : f.cost_cad }));
  }

  function onMaterialChange(mat) {
    const price = getBrandPrice(form.brand, mat);
    setForm(f=>({ ...f, material:mat, cost_cad: price ? String(price) : f.cost_cad }));
  }

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });

  return (
    <div style={{ height:'100%',overflowY:'auto',padding:24 }}>
      <div style={{ maxWidth:1200,margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div><h1>Filament Inventory</h1><p style={{ color:'var(--text-secondary)',fontSize:13,marginTop:4 }}>{spools.length} spools · {totalKg} kg total</p></div>
          {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Spool</button>}
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20 }}>
          {[['Total Spools',spools.length,'var(--text-primary)'],['Total Stock',`${totalKg} kg`,'var(--text-primary)'],['Low Stock',lowCount,lowCount>0?'var(--red)':'var(--green)'],['Est. Value',`$${spools.reduce((a,s)=>a+(parseFloat(s.cost_cad||0)*(parseFloat(s.remaining_g)||0)/(parseFloat(s.full_weight_g)||1000)),0).toFixed(2)}`,'var(--text-primary)']].map(([l,v,c])=>(
            <div key={l} className="card" style={{ padding:16 }}>
              <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-tertiary)',marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:24,fontWeight:700,color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {lowCount>0&&<div style={{ padding:'10px 16px',borderRadius:'var(--r-sm)',marginBottom:14,fontSize:13,background:'var(--red-light)',border:'0.5px solid rgba(255,69,58,0.25)',color:'var(--red)' }}>⚠ {lowCount} spool{lowCount!==1?'s':''} low on stock</div>}

        <div style={{ display:'flex',gap:10,marginBottom:16 }}>
          <input className="input" placeholder="Search brand, colour, material" style={{ width:240 }} value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} />
          <select className="select" style={{ width:160 }} value={filter.material} onChange={e=>setFilter(f=>({...f,material:e.target.value}))}>
            <option value="">All Materials</option>
            {MATERIAL_TYPES.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          {(filter.search||filter.material||filter.showLow)&&<button className="btn btn-secondary btn-sm" onClick={()=>setFilter({material:'',search:'',showLow:false})}>Clear</button>}
        </div>

        {loading ? <div style={{ color:'var(--text-secondary)',padding:32 }}>Loading...</div> : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:14 }}>
            {filtered.map(s=>{
              const pct=Math.min(100,Math.round((s.remaining_g/s.full_weight_g)*100));
              const bc=pct>40?'var(--green)':pct>15?'var(--amber)':'var(--red)';
              return (
                <div key={s.id} className="card interactive" onClick={()=>canEdit&&openEdit(s)} style={{ padding:16,display:'flex',flexDirection:'column',gap:8 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,background:s.color_hex,boxShadow:`0 2px 8px ${s.color_hex}55`,border:'2px solid rgba(255,255,255,0.2)' }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.color_name}</div>
                      <div style={{ fontSize:11,color:'var(--text-secondary)' }}>{s.brand}</div>
                      <div style={{ fontSize:10,color:'var(--text-tertiary)' }}>{s.material}</div>
                    </div>
                    {s.is_low&&<span style={{ fontSize:14,flexShrink:0 }}>⚠️</span>}
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width:`${pct}%`,background:bc }}/></div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:11 }}>
                    <span style={{ color:bc,fontWeight:600 }}>{s.remaining_g}g</span>
                    <span style={{ color:'var(--text-tertiary)' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
            {canEdit&&(
              <div className="card interactive" onClick={openAdd} style={{ padding:16,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,border:'0.5px dashed var(--border-strong)',background:'transparent',minHeight:140 }}>
                <span style={{ fontSize:28,color:'var(--text-tertiary)' }}>+</span>
                <span style={{ fontSize:12,color:'var(--text-tertiary)',fontWeight:500 }}>Add Spool</span>
              </div>
            )}
          </div>
        )}
      </div>

      {editing!==null&&(
        <Modal title={editing.id?'Edit Spool':'Add Filament Spool'} onClose={()=>{setEditing(null);setErr('');}}>
          <div className="form-row">
            <div className="form-group"><label className="label">Brand</label>
              <select className="select" value={form.brand} onChange={e=>onBrandChange(e.target.value)}>
                {ALL_BRANDS.map(b=><option key={b}>{b}</option>)}
                <option value="Other">Other / Generic</option>
              </select>
            </div>
            <div className="form-group"><label className="label">Material</label>
              <select className="select" value={form.material} onChange={e=>onMaterialChange(e.target.value)}>
                {MATERIAL_TYPES.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Colour Name</label><input className="input" {...F('color_name')} placeholder="e.g. Galaxy Black" /></div>
            <div className="form-group"><label className="label">Colour</label>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <input type="color" value={form.color_hex} onChange={e=>setForm(f=>({...f,color_hex:e.target.value}))} style={{ width:40,height:38,border:'none',borderRadius:6,cursor:'pointer',padding:2 }} />
                <input className="input" {...F('color_hex')} style={{ fontFamily:'monospace' }} />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Spool Weight (g)</label><select className="select" value={form.full_weight_g} onChange={e=>setForm(f=>({...f,full_weight_g:parseInt(e.target.value),remaining_g:parseInt(e.target.value)}))}>
              {SPOOL_WEIGHTS.filter(w=>w.value).map(w=><option key={w.value} value={w.value}>{w.label}</option>)}
            </select></div>
            <div className="form-group"><label className="label">Remaining (g)</label><input className="input" type="number" min="0" {...F('remaining_g')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Cost ($)</label><input className="input" type="number" step="0.01" {...F('cost_cad')} /></div>
            <div className="form-group"><label className="label">Reorder At (g)</label><input className="input" type="number" {...F('reorder_at_g')} /></div>
          </div>
          <div className="form-group" style={{ display:'flex',alignItems:'center',gap:10 }}>
            <input type="checkbox" id="ar" checked={!!form.auto_reorder} onChange={e=>setForm(f=>({...f,auto_reorder:e.target.checked}))} style={{ width:16,height:16 }} />
            <label htmlFor="ar" style={{ fontSize:13,cursor:'pointer' }}>Enable auto-reorder</label>
          </div>
          <div className="form-group"><label className="label">Notes</label><textarea className="input" rows={2} {...F('notes')} /></div>
          {err&&<div style={{ color:'var(--red)',fontSize:12,marginTop:8 }}>{err}</div>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:20 }}>
            {editing?.id&&canEdit&&<button className="btn btn-danger btn-sm" onClick={()=>del(editing.id)}>Delete</button>}
            <button className="btn btn-secondary" onClick={()=>{setEditing(null);setErr('');}}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':(editing?.id?'Save Changes':'Add Spool')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
