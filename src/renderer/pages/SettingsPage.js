// [LITE] SettingsPage — adapted for Lite (no server URL, shows data path)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api, settingsApi } from '../api/client';

export default function SettingsPage({ onThemeChange }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setThemeLocal] = useState('dark');
  const [pwForm, setPwForm]    = useState({ cur: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg]      = useState('');
  const [pwErr, setPwErr]      = useState('');
  const [saving, setSaving]    = useState(false);
  const [dataPath, setDataPath] = useState('');
  const [biz, setBiz]          = useState({ name: '', email: '', currency: 'CAD' });
  const [bizSaved, setBizSaved] = useState(false);

  useEffect(() => {
    window.printflow.getTheme().then(t => setThemeLocal(t || 'dark'));
    window.printflow.getDataPath?.().then(p => setDataPath(p)).catch(() => {});
    settingsApi.get('company_config').then(r => { if (r.data?.value) setBiz(r.data.value); }).catch(() => {});
  }, []);

  async function changeTheme(t) {
    setThemeLocal(t);
    onThemeChange(t);
    await window.printflow.setTheme(t);
  }

  async function saveCompany() {
    await settingsApi.set('company_config', biz);
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 2000);
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match'); return; }
    if (pwForm.next.length < 8) { setPwErr('Min 8 characters'); return; }
    setSaving(true); setPwErr(''); setPwMsg('');
    try {
      await api.post('/api/auth/change-password', { currentPassword: pwForm.cur, newPassword: pwForm.next });
      setPwMsg('Password changed successfully');
      setPwForm({ cur: '', next: '', confirm: '' });
    } catch (e) {
      setPwErr(e.response?.data?.error || 'Failed');
    }
    setSaving(false);
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1>Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Configure PrintFlow Lite</p>
        </div>

        {/* Company info */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <h3 style={{ marginBottom: 14 }}>Business Info</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Business Name</label>
              <input className="input" value={biz.name || ''} onChange={e => setBiz(b => ({ ...b, name: e.target.value }))} placeholder="My Print Shop" />
            </div>
            <div className="form-group">
              <label className="label">Contact Email</label>
              <input className="input" type="email" value={biz.email || ''} onChange={e => setBiz(b => ({ ...b, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Currency</label>
            <select className="select" value={biz.currency || 'CAD'} onChange={e => setBiz(b => ({ ...b, currency: e.target.value }))} style={{ maxWidth: 220 }}>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
              <option value="AUD">AUD — Australian Dollar</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={saveCompany}>{bizSaved ? '✓ Saved' : 'Save'}</button>
        </div>

        {/* Appearance */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <h3 style={{ marginBottom: 14 }}>Appearance</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {['dark', 'light'].map(t => (
              <button key={t} className={`btn ${theme === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => changeTheme(t)} style={{ minWidth: 100, justifyContent: 'center' }}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <h3 style={{ marginBottom: 14 }}>Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.email} · <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></div>
            </div>
          </div>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Change Password</h3>
          <div className="form-group">
            <label className="label">Current Password</label>
            <input className="input" type="password" value={pwForm.cur} onChange={e => setPwForm(f => ({ ...f, cur: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">New Password</label><input className="input" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Confirm</label><input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
          </div>
          {pwErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{pwErr}</div>}
          {pwMsg && <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 8 }}>{pwMsg}</div>}
          <button className="btn btn-primary btn-sm" onClick={changePassword} disabled={saving || !pwForm.cur || !pwForm.next}>
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </div>

        {/* Data location */}
        {dataPath && (
          <div className="card" style={{ padding: 20, marginBottom: 14 }}>
            <h3 style={{ marginBottom: 10 }}>Data Storage</h3>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Your database and logs are stored at:</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--r-sm)', wordBreak: 'break-all' }}>{dataPath}</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 11 }} onClick={() => window.printflow.openExternal(`file://${dataPath}`)}>Open in Finder / Explorer</button>
          </div>
        )}

        {/* Sign out */}
        <div className="card" style={{ padding: 20, border: '0.5px solid rgba(255,69,58,0.25)' }}>
          <h3 style={{ marginBottom: 10, color: 'var(--red)' }}>Sign Out</h3>
          <button className="btn btn-danger" onClick={async () => { await logout(); navigate('/login', { replace: true }); }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
