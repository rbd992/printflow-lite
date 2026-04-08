// [BOTH] OrdersPage — copied from enterprise (uses generic platform field)
import React, { useEffect, useState, useCallback } from 'react';
import { api, ordersApi, filamentApi } from '../api/client';
import { onSocketEvent } from '../api/socket';
import { useAuthStore } from '../stores/authStore';

const STATUSES = ['new','quoted','confirmed','printing','printed','post-processing','qc','packed','shipped','delivered','paid','cancelled'];
const STATUS_COLORS = { new:'pill-blue',quoted:'pill-purple',confirmed:'pill-green',printing:'pill-amber',printed:'pill-teal','post-processing':'pill-amber',qc:'pill-teal',packed:'pill-blue',shipped:'pill-purple',delivered:'pill-green',paid:'pill-green',cancelled:'pill-red' };

function Modal({ title, onClose, children, width=560 }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card" style={{ width,maxHeight:'92vh',overflowY:'auto',padding:28,animation:'fadeIn 0.2s ease' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders,setOrders]   = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter]   = useState({ status:'',search:'' });
  const [editing,setEditing] = useState(null);
  const [form,setForm]       = useState({});
  const [saving,setSaving]   = useState(false);
  const [err,setErr]         = useState('');
  const { user } = useAuthStore();
  const canManage = ['owner','manager'].includes(user?.role);
  const isOwner = user?.role === 'owner';

  const load = useCallback(async()=>{
    try { const r = await ordersApi.list(); setOrders(r.data); } catch {}
    setLoading(false);
  },[]);

  useEffect(()=>{
    load();
    const u1=onSocketEvent('order:created',o=>setOrders(p=>[o,...p]));
    const u2=onSocketEvent('order:updated',o=>setOrders(p=>p.map(x=>x.id===o.id?o:x)));
    const u3=onSocketEvent('order:deleted',({id})=>setOrders(p=>p.filter(x=>x.id!==id)));
    return()=>{u1();u2();u3();};
  },[load]);

  const filtered = orders.filter(o=>{
    if(filter.status && o.status!==filter.status) return false;
    if(filter.search && !`${o.order_number} ${o.customer_name} ${o.description||''}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  function openNew() { setForm({ customer_name:'',customer_email:'',description:'',platform:'direct',price_cad:'',status:'new',notes:'' }); setEditing({}); setErr(''); }
  function openEdit(o) { setForm({ ...o,price_cad:o.price_cad||'' }); setEditing(o); setErr(''); }

  async function save() {
    setSaving(true); setErr('');
    try {
      const payload = { ...form,price_cad:parseFloat(form.price_cad)||0 };
      if(editing?.id) await ordersApi.update(editing.id,payload);
      else await ordersApi.create(payload);
      setEditing(null); await load();
    } catch(e) { setErr(e.response?.data?.error||'Save failed'); }
    setSaving(false);
  }

  async function deleteOrder(o) {
    if(!window.confirm(`Delete order "${o.order_number}"? This cannot be undone.`)) return;
    try { await api.delete(`/api/orders/${o.id}`); setEditing(null); await load(); } catch(e) { alert(e.response?.data?.error||'Delete failed'); }
  }

  async function updateStatus(id,status) {
    try { await ordersApi.update(id,{status}); setOrders(p=>p.map(o=>o.id===id?{...o,status}:o)); } catch {}
  }

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });
  const revenue = filtered.filter(o=>o.status!=='cancelled').reduce((a,o)=>a+(o.price_cad||0),0);

  return (
    <div style={{ height:'100%',overflowY:'auto',padding:24 }}>
      <div style={{ maxWidth:1300,margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div><h1>Orders</h1><p style={{ color:'var(--text-secondary)',fontSize:13,marginTop:4 }}>{orders.length} orders · ${revenue.toFixed(2)} total</p></div>
          <div style={{ display:'flex',gap:8 }}>
            {canManage && <button className="btn btn-primary" onClick={openNew}>+ New Order</button>}
          </div>
        </div>

        <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
          <input className="input" placeholder="Search orders..." style={{ width:240 }} value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} />
          <select className="select" style={{ width:160 }} value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
            <option value="">All Statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {(filter.search||filter.status)&&<button className="btn btn-secondary btn-sm" onClick={()=>setFilter({status:'',search:''})}>Clear</button>}
        </div>

        <div className="card">
          {loading ? <div style={{ padding:32,color:'var(--text-secondary)' }}>Loading...</div> : (
            <table className="data-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Description</th><th>Platform</th><th>Price</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filtered.map(o=>(
                  <tr key={o.id} onClick={()=>canManage&&openEdit(o)} style={{ cursor:canManage?'pointer':'default' }}>
                    <td style={{ fontWeight:600,color:'var(--accent)',fontFamily:'monospace',fontSize:12 }}>{o.order_number}</td>
                    <td><div style={{ fontWeight:500 }}>{o.customer_name}</div>{o.customer_email&&<div style={{ fontSize:11,color:'var(--text-tertiary)' }}>{o.customer_email}</div>}</td>
                    <td style={{ maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12 }}>{o.description||'—'}</td>
                    <td>{o.platform?<span className="pill pill-blue" style={{ fontSize:10 }}>{o.platform}</span>:'—'}</td>
                    <td style={{ fontWeight:600 }}>${(o.price_cad||0).toFixed(2)}</td>
                    <td><span className={`pill ${STATUS_COLORS[o.status]||'pill-blue'}`}>{o.status}</span></td>
                    <td style={{ fontSize:12,color:'var(--text-tertiary)' }}>{o.created_at?.slice(0,10)}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      {canManage&&<select className="select" style={{ fontSize:11,padding:'3px 6px',height:28 }} value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>
                        {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>}
                    </td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={8} style={{ textAlign:'center',padding:40,color:'var(--text-tertiary)' }}>No orders {filter.search||filter.status?'match':'yet'}</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing!==null&&(
        <Modal title={editing.id?`Order ${editing.order_number}`:'New Order'} width={580} onClose={()=>setEditing(null)}>
          <div className="form-row">
            <div className="form-group"><label className="label">Customer Name</label><input className="input" {...F('customer_name')} autoFocus /></div>
            <div className="form-group"><label className="label">Email</label><input className="input" type="email" {...F('customer_email')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Platform / Source</label>
              <input className="input" {...F('platform')} list="plat-list" placeholder="e.g. Etsy, Direct" />
              <datalist id="plat-list">{['Etsy','Shopify','Amazon','Direct','Facebook','Instagram','TikTok','Other'].map(p=><option key={p} value={p}/>)}</datalist>
            </div>
            <div className="form-group"><label className="label">Status</label>
              <select className="select" {...F('status')}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea className="input" rows={2} {...F('description')} /></div>
          <div className="form-row">
            <div className="form-group"><label className="label">Price ($)</label><input className="input" type="number" step="0.01" min="0" {...F('price_cad')} /></div>
            <div className="form-group"><label className="label">Due Date</label><input className="input" type="date" {...F('due_date')} /></div>
          </div>
          {editing?.id&&<div className="form-row">
            <div className="form-group"><label className="label">Tracking #</label><input className="input" {...F('tracking_number')} style={{ fontFamily:'monospace' }} /></div>
            <div className="form-group"><label className="label">Carrier</label><input className="input" {...F('carrier')} /></div>
          </div>}
          <div className="form-group"><label className="label">Notes</label><textarea className="input" rows={2} {...F('notes')} /></div>
          {err&&<div style={{ color:'var(--red)',fontSize:12,marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex',gap:8,justifyContent:'space-between',marginTop:8 }}>
            <div>{editing?.id&&isOwner&&<button className="btn btn-danger btn-sm" onClick={()=>deleteOrder(editing)}>Delete</button>}</div>
            <div style={{ display:'flex',gap:8 }}>
              <button className="btn btn-secondary" onClick={()=>setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving||!form.customer_name}>{saving?'Saving...':(editing?.id?'Save':'Create Order')}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
