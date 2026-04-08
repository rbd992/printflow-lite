// [BOTH] FinancePage
import React, { useEffect, useState, useCallback } from 'react';
import { transactionsApi, ordersApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card" style={{ width:480,padding:28 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [txns, setTxns]       = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ date:new Date().toISOString().slice(0,10), description:'', category:'materials', type:'expense', amount_cad:'', hst_amount:'', order_id:'' });
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const { user } = useAuthStore();
  const canManage = ['owner','manager'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const [t,o] = await Promise.all([transactionsApi.list(), ordersApi.list()]);
      setTxns(t.data||[]); setOrders(o.data||[]);
    } catch {} setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const income   = txns.filter(t=>t.type==='income').reduce((a,t)=>a+(t.amount_cad||0),0);
  const expenses = txns.filter(t=>t.type==='expense').reduce((a,t)=>a+(t.amount_cad||0),0);

  async function save() {
    setSaving(true); setErr('');
    try {
      await transactionsApi.create({ ...form, amount_cad:parseFloat(form.amount_cad)||0, hst_amount:parseFloat(form.hst_amount)||0, order_id:form.order_id||null });
      setEditing(null); await load();
    } catch(e) { setErr(e.response?.data?.error||'Failed'); }
    setSaving(false);
  }

  async function del(id) {
    if(!window.confirm('Delete transaction?')) return;
    try { await transactionsApi.remove(id); await load(); } catch {}
  }

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });

  return (
    <div style={{ height:'100%',overflowY:'auto',padding:24 }}>
      <div style={{ maxWidth:1100,margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div><h1>Finance</h1><p style={{ color:'var(--text-secondary)',fontSize:13,marginTop:4 }}>Income, expenses, and profit tracking</p></div>
          {canManage&&<button className="btn btn-primary" onClick={()=>{setForm({date:new Date().toISOString().slice(0,10),description:'',category:'materials',type:'expense',amount_cad:'',hst_amount:'',order_id:''});setEditing({});setErr('');}}>+ Add Transaction</button>}
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20 }}>
          {[['Total Income',`$${income.toFixed(2)}`,'var(--green)'],['Total Expenses',`$${expenses.toFixed(2)}`,'var(--red)'],['Net Profit',`$${(income-expenses).toFixed(2)}`,(income-expenses)>=0?'var(--green)':'var(--red)']].map(([l,v,c])=>(
            <div key={l} className="card" style={{ padding:18 }}>
              <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-tertiary)',marginBottom:8 }}>{l}</div>
              <div style={{ fontSize:26,fontWeight:700,color:c }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          {loading?<div style={{ padding:32,color:'var(--text-secondary)' }}>Loading...</div>:(
            <table className="data-table">
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>HST</th><th></th></tr></thead>
              <tbody>
                {txns.map(t=>(
                  <tr key={t.id}>
                    <td style={{ fontSize:12 }}>{t.date}</td>
                    <td style={{ fontSize:12 }}>{t.description}</td>
                    <td><span className="pill pill-blue" style={{ fontSize:10 }}>{t.category}</span></td>
                    <td><span className={`pill ${t.type==='income'?'pill-green':'pill-red'}`} style={{ fontSize:10 }}>{t.type}</span></td>
                    <td style={{ fontWeight:700,color:t.type==='income'?'var(--green)':'var(--red)' }}>{t.type==='income'?'+':'-'}${(t.amount_cad||0).toFixed(2)}</td>
                    <td style={{ fontSize:12,color:'var(--text-tertiary)' }}>${(t.hst_amount||0).toFixed(2)}</td>
                    <td>{canManage&&<button className="btn btn-ghost btn-sm" style={{ fontSize:10,color:'var(--red)' }} onClick={()=>del(t.id)}>✕</button>}</td>
                  </tr>
                ))}
                {txns.length===0&&<tr><td colSpan={7} style={{ textAlign:'center',padding:32,color:'var(--text-tertiary)' }}>No transactions yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing!==null&&(
        <Modal title="Add Transaction" onClose={()=>setEditing(null)}>
          <div className="form-row">
            <div className="form-group"><label className="label">Date</label><input className="input" type="date" {...F('date')} /></div>
            <div className="form-group"><label className="label">Type</label>
              <select className="select" {...F('type')}><option value="income">Income</option><option value="expense">Expense</option></select>
            </div>
          </div>
          <div className="form-group"><label className="label">Description</label><input className="input" {...F('description')} autoFocus /></div>
          <div className="form-row">
            <div className="form-group"><label className="label">Category</label>
              <select className="select" {...F('category')}>{['sales','materials','shipping','fees','maintenance','other'].map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div className="form-group"><label className="label">Amount ($)</label><input className="input" type="number" step="0.01" min="0" {...F('amount_cad')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">HST ($)</label><input className="input" type="number" step="0.01" {...F('hst_amount')} /></div>
            <div className="form-group"><label className="label">Linked Order</label>
              <select className="select" {...F('order_id')}>
                <option value="">None</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.order_number} — {o.customer_name}</option>)}
              </select>
            </div>
          </div>
          {err&&<div style={{ color:'var(--red)',fontSize:12,marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:8 }}>
            <button className="btn btn-secondary" onClick={()=>setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving||!form.description||!form.amount_cad}>{saving?'Saving...':'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
