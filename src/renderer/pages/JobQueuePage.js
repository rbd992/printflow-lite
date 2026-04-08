import React, { useEffect, useState, useCallback } from 'react';
import { api, ordersApi } from '../api/client';
import { onSocketEvent } from '../api/socket';
import { useAuthStore } from '../stores/authStore';

const STAGES = [
  { id:'queued', label:'Queued', color:'var(--text-tertiary)' },
  { id:'printing', label:'Printing', color:'var(--amber)' },
  { id:'done', label:'Done', color:'var(--green)' },
  { id:'failed', label:'Failed', color:'var(--red)' },
];

const BLANK = { job_name:'',order_id:'',customer_name:'',printer_id:'',material:'PLA',color:'',estimated_grams:'',estimated_duration_min:'',notes:'',stage:'queued',priority:1 };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card" style={{ width:520,maxHeight:'90vh',overflowY:'auto',padding:28 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function JobQueuePage() {
  const [jobs,setJobs]         = useState([]);
  const [orders,setOrders]     = useState([]);
  const [printers,setPrinters] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [editing,setEditing]   = useState(null);
  const [form,setForm]         = useState(BLANK);
  const [saving,setSaving]     = useState(false);
  const [err,setErr]           = useState('');
  const { user } = useAuthStore();
  const canManage = ['owner','manager'].includes(user?.role);

  const load = useCallback(async()=>{
    try {
      const [j,o,p] = await Promise.all([api.get('/api/jobs'),ordersApi.list(),api.get('/api/printers')]);
      setJobs(j.data||[]); setOrders(o.data||[]); setPrinters(p.data||[]);
    } catch {} setLoading(false);
  },[]);

  useEffect(()=>{ load(); const u=onSocketEvent('job:created',()=>load()); return()=>u(); },[load]);

  async function save() {
    setSaving(true); setErr('');
    try {
      const payload = { ...form,estimated_grams:parseFloat(form.estimated_grams)||null,estimated_duration_min:parseInt(form.estimated_duration_min)||null,printer_id:form.printer_id||null,order_id:form.order_id||null };
      if(editing?.id) await api.put(`/api/jobs/${editing.id}`,payload);
      else await api.post('/api/jobs',payload);
      setEditing(null); await load();
    } catch(e) { setErr(e.response?.data?.error||'Save failed'); }
    setSaving(false);
  }

  async function moveJob(job,stage) {
    try { await api.put(`/api/jobs/${job.id}`,{...job,stage}); setJobs(p=>p.map(j=>j.id===job.id?{...j,stage}:j)); } catch {}
  }

  async function del(id) {
    if(!window.confirm('Delete job?')) return;
    try { await api.delete(`/api/jobs/${id}`); setJobs(p=>p.filter(j=>j.id!==id)); } catch {}
  }

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(f=>({...f,[k]:e.target.value})) });
  const printing=jobs.filter(j=>j.stage==='printing').length;
  const queued=jobs.filter(j=>j.stage==='queued').length;

  return (
    <div style={{ height:'100%',overflowY:'auto',padding:24 }}>
      <div style={{ maxWidth:1300,margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div><h1>Job Queue</h1><p style={{ color:'var(--text-secondary)',fontSize:13,marginTop:4 }}>{printing} printing · {queued} queued</p></div>
          {canManage&&<button className="btn btn-primary" onClick={()=>{setForm(BLANK);setEditing({});setErr('');}}>+ Add Job</button>}
        </div>

        {loading?<div style={{ padding:32,color:'var(--text-secondary)' }}>Loading...</div>:(
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
            {STAGES.map(stage=>{
              const stageJobs=jobs.filter(j=>j.stage===stage.id).sort((a,b)=>a.priority-b.priority);
              return (
                <div key={stage.id}>
                  <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:stage.color,marginBottom:10,display:'flex',justifyContent:'space-between' }}>
                    <span>{stage.label}</span><span style={{ color:'var(--text-tertiary)' }}>{stageJobs.length}</span>
                  </div>
                  {stageJobs.length===0?(
                    <div style={{ padding:'20px 14px',background:'var(--bg-hover)',borderRadius:'var(--r-md)',border:'0.5px dashed var(--border)',textAlign:'center',color:'var(--text-tertiary)',fontSize:12 }}>Empty</div>
                  ):stageJobs.map(job=>(
                    <div key={job.id} className="card" style={{ padding:14,marginBottom:8,borderLeft:`3px solid ${stage.color}`,cursor:canManage?'pointer':'default' }} onClick={()=>canManage&&(setForm({...job}),setEditing(job),setErr(''))}>
                      <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{job.job_name}</div>
                      {job.customer_name&&<div style={{ fontSize:11,color:'var(--text-secondary)',marginBottom:6 }}>{job.customer_name}</div>}
                      {job.material&&<div style={{ fontSize:11,color:'var(--text-tertiary)',marginBottom:8 }}>{job.material}{job.color?` · ${job.color}`:''}</div>}
                      {canManage&&(
                        <div style={{ display:'flex',gap:4,flexWrap:'wrap' }} onClick={e=>e.stopPropagation()}>
                          {STAGES.filter(s=>s.id!==stage.id).map(s=>(
                            <button key={s.id} className="btn btn-ghost btn-sm" style={{ fontSize:10,padding:'2px 6px',color:s.color }} onClick={()=>moveJob(job,s.id)}>→{s.label}</button>
                          ))}
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:10,color:'var(--red)',marginLeft:'auto' }} onClick={()=>del(job.id)}>✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing!==null&&(
        <Modal title={editing.id?'Edit Job':'Add Job'} onClose={()=>setEditing(null)}>
          <div className="form-group"><label className="label">Job Name *</label><input className="input" {...F('job_name')} autoFocus /></div>
          <div className="form-row">
            <div className="form-group"><label className="label">Stage</label><select className="select" {...F('stage')}>{STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <div className="form-group"><label className="label">Priority</label><input className="input" type="number" min="1" max="10" {...F('priority')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Material</label><input className="input" {...F('material')} /></div>
            <div className="form-group"><label className="label">Est. Grams</label><input className="input" type="number" min="0" {...F('estimated_grams')} /></div>
          </div>
          <div className="form-group"><label className="label">Notes</label><textarea className="input" rows={2} {...F('notes')} /></div>
          {err&&<div style={{ color:'var(--red)',fontSize:12,marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:8 }}>
            <button className="btn btn-secondary" onClick={()=>setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving||!form.job_name}>{saving?'Saving...':editing?.id?'Save':'Add Job'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
