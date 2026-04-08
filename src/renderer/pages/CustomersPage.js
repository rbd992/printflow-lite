// [BOTH] CustomersPage — copied from enterprise
import React, { useEffect, useState, useCallback } from 'react';
import { api, ordersApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width, maxHeight:'90vh', overflowY:'auto', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['#0071E3','#30D158','#FF9F0A','#FF453A','#BF5AF2','#32ADE6'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${color}22`, border:`1.5px solid ${color}44`,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:size * 0.35, fontWeight:700, color, flexShrink:0 }}>
      {initials}
    </div>
  );
}

const BLANK = { name:'', email:'', phone:'', address:'', city:'', province:'', postal_code:'', notes:'', tags:'' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const { user } = useAuthStore();
  const canManage = ['owner', 'manager'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const [c, o] = await Promise.all([api.get('/api/customers'), ordersApi.list()]);
      setCustomers(c.data || []); setOrders(o.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getCustomerOrders(customer) {
    return orders.filter(o =>
      (o.customer_email && o.customer_email.toLowerCase() === customer.email?.toLowerCase()) ||
      o.customer_name?.toLowerCase() === customer.name?.toLowerCase()
    );
  }

  async function save() {
    setSaving(true); setErr('');
    try {
      if (editing?.id) await api.put(`/api/customers/${editing.id}`, form);
      else await api.post('/api/customers', form);
      setEditing(null); await load();
    } catch (e) { setErr(e.response?.data?.error || 'Save failed'); }
    setSaving(false);
  }

  const F = k => ({ value: form[k] ?? '', onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) });
  const filtered = customers.filter(c => !search || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = orders.reduce((a, o) => a + (o.price_cad || 0), 0);

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div><h1>Customers</h1><p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>{customers.length} customers</p></div>
          {canManage && <button className="btn btn-primary" onClick={() => { setForm(BLANK); setEditing({}); setErr(''); }}>+ Add Customer</button>}
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <input className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:280 }} />
        </div>

        <div className="card">
          {loading ? <div style={{ padding:32, color:'var(--text-secondary)' }}>Loading...</div> : (
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Spent</th><th></th></tr></thead>
              <tbody>
                {filtered.map(c => {
                  const custOrders = getCustomerOrders(c);
                  const spent = custOrders.reduce((a, o) => a + (o.price_cad || 0), 0);
                  return (
                    <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)} style={{ cursor:'pointer' }}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar name={c.name} size={32}/><div style={{ fontWeight:500 }}>{c.name}</div></div></td>
                      <td><div style={{ fontSize:12 }}>{c.email || '—'}</div>{c.phone && <div style={{ fontSize:11, color:'var(--text-tertiary)' }}>{c.phone}</div>}</td>
                      <td style={{ fontWeight:600 }}>{custOrders.length}</td>
                      <td style={{ fontWeight:700, color:'var(--accent)' }}>${spent.toFixed(2)}</td>
                      <td onClick={e => e.stopPropagation()}>{canManage && <button className="btn btn-ghost btn-sm" onClick={() => { setForm({ name:c.name||'', email:c.email||'', phone:c.phone||'', address:c.address||'', city:c.city||'', province:c.province||'ON', postal_code:c.postal_code||'', notes:c.notes||'', tags:c.tags||'' }); setEditing(c); setErr(''); }}>Edit</button>}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:32, color:'var(--text-tertiary)' }}>No customers yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing !== null && (
        <Modal title={editing.id ? 'Edit Customer' : 'Add Customer'} onClose={() => setEditing(null)}>
          <div className="form-row">
            <div className="form-group"><label className="label">Full Name *</label><input className="input" {...F('name')} autoFocus /></div>
            <div className="form-group"><label className="label">Email</label><input className="input" type="email" {...F('email')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Phone</label><input className="input" {...F('phone')} /></div>
            <div className="form-group"><label className="label">City</label><input className="input" {...F('city')} /></div>
          </div>
          <div className="form-group"><label className="label">Notes</label><textarea className="input" rows={2} {...F('notes')} /></div>
          {err && <div style={{ color:'var(--red)', fontSize:12, marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !form.name}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
