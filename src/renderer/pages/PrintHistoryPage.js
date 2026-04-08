import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function PrintHistoryPage() {
  const [jobs, setJobs]       = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [filter, setFilter]    = useState({ stage:'', search:'' });

  const load = useCallback(async () => {
    try {
      const [j, p] = await Promise.all([api.get('/api/jobs'), api.get('/api/printers')]);
      setJobs(j.data||[]); setPrinters(p.data||[]);
    } catch {} setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter(j => {
    if (filter.stage && j.stage !== filter.stage) return false;
    if (filter.search && !`${j.job_name} ${j.customer_name||''}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const done   = jobs.filter(j => j.stage === 'done').length;
  const failed = jobs.filter(j => j.stage === 'failed').length;

  function duration(mins) {
    if (!mins) return '—';
    const h = Math.floor(mins/60), m = mins%60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom:20 }}>
          <h1>Print History</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>Complete log of all print jobs</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[['Total Jobs',jobs.length,'var(--text-primary)'],['Completed',done,'var(--green)'],['Failed',failed,'var(--red)'],['Total Time',duration(jobs.reduce((a,j)=>a+(j.estimated_duration_min||0),0)),'var(--accent)']].map(([l,v,c])=>(
            <div key={l} className="card" style={{ padding:16 }}>
              <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-tertiary)',marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:24,fontWeight:700,color:c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <input className="input" placeholder="Search jobs..." style={{ width:240 }} value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} />
          <select className="select" style={{ width:140 }} value={filter.stage} onChange={e=>setFilter(f=>({...f,stage:e.target.value}))}>
            <option value="">All Stages</option>
            {['queued','printing','done','failed'].map(s=><option key={s}>{s}</option>)}
          </select>
          {(filter.search||filter.stage)&&<button className="btn btn-secondary btn-sm" onClick={()=>setFilter({stage:'',search:''})}>Clear</button>}
        </div>

        <div className="card">
          {loading ? <div style={{ padding:32, color:'var(--text-secondary)' }}>Loading...</div> : (
            <table className="data-table">
              <thead><tr><th>Job</th><th>Customer</th><th>Material</th><th>Est. Time</th><th>Stage</th><th>Date</th></tr></thead>
              <tbody>
                {filtered.map(j=>(
                  <tr key={j.id}>
                    <td style={{ fontWeight:500 }}>{j.job_name}</td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{j.customer_name||'—'}</td>
                    <td style={{ fontSize:12 }}>{j.material||'—'}{j.color?` · ${j.color}`:''}</td>
                    <td style={{ fontSize:12 }}>{duration(j.estimated_duration_min)}</td>
                    <td><span style={{ fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,color:j.stage==='done'?'var(--green)':j.stage==='failed'?'var(--red)':j.stage==='printing'?'var(--amber)':'var(--text-tertiary)',background:j.stage==='done'?'var(--green-light)':j.stage==='failed'?'var(--red-light)':j.stage==='printing'?'var(--amber-light)':'var(--bg-hover)' }}>{j.stage}</span></td>
                    <td style={{ fontSize:12, color:'var(--text-tertiary)' }}>{j.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={6} style={{ textAlign:'center', padding:32, color:'var(--text-tertiary)' }}>{jobs.length===0?'No print jobs yet':'No jobs match your filter'}</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
