import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { setServerUrlCache } from '../api/client';

// ── Wordmark logo ─────────────────────────────────────────────────────────
function PrintFlowMark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* F letterform */}
      <rect x="10" y="8"  width="3.5" height="22" rx="1.75" fill="url(#pf-grad)"/>
      <rect x="10" y="8"  width="16"  height="3.5" rx="1.75" fill="url(#pf-grad)"/>
      <rect x="10" y="17" width="11"  height="3.5" rx="1.75" fill="url(#pf-grad)"/>
      {/* Accent dot */}
      <circle cx="28" cy="29" r="3" fill="#30D158"/>
      <defs>
        <linearGradient id="pf-grad" x1="10" y1="8" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6DB8FF"/>
          <stop offset="100%" stopColor="#0071E3"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── 3D Printer icon (same as AppShell) ───────────────────────────────────
function PrinterIcon({ size = 20, color = 'currentColor', opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }}>
      <rect x="8"  y="14" width="6"  height="38" rx="3" fill={color} opacity="0.45"/>
      <rect x="66" y="14" width="6"  height="38" rx="3" fill={color} opacity="0.45"/>
      <rect x="8"  y="12" width="64" height="9"  rx="4" fill={color} opacity="0.7"/>
      <rect x="30" y="14" width="20" height="12" rx="3" fill={color}/>
      <path d="M36 26 L40 35 L44 26 Z" fill={color}/>
      <rect x="26" y="49" width="28" height="5"  rx="2.5" fill={color} opacity="0.65"/>
      <rect x="28" y="44" width="24" height="6"  rx="2.5" fill={color} opacity="0.5"/>
      <rect x="30" y="40" width="20" height="5"  rx="2"   fill={color} opacity="0.35"/>
      <rect x="14" y="54" width="52" height="4"  rx="2"   fill={color} opacity="0.4"/>
      <rect x="10" y="58" width="60" height="9"  rx="3"   fill={color} opacity="0.65"/>
    </svg>
  );
}

// ── Loading bar ───────────────────────────────────────────────────────────
function LoadingBar({ progress, phase }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          height: '100%',
          width: `${Math.max(2, progress)}%`,
          background: progress === 100
            ? 'linear-gradient(90deg, #30D158, #25a847)'
            : 'linear-gradient(90deg, #0071E3, #4DA8FF)',
          borderRadius: 99,
          transition: 'width 0.3s ease, background 0.4s ease',
          boxShadow: `0 0 10px ${progress === 100 ? 'rgba(48,209,88,0.4)' : 'rgba(0,113,227,0.4)'}`,
        }}/>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.03em', minHeight: 16 }}>
        {phase}
      </div>
    </div>
  );
}

// ── Update banner ─────────────────────────────────────────────────────────
function UpdateBanner({ info }) {
  const isMac = window.printflow?.platform === 'darwin';
  const url = isMac ? info.macUrl : info.winUrl;
  return (
    <div style={{
      marginBottom: 20, padding: '12px 14px', borderRadius: 12,
      background: 'rgba(0,113,227,0.06)', border: '0.5px solid rgba(0,113,227,0.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DA8FF" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v10m0 0l-3-3m3 3l3-3M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4DA8FF' }}>Update available — v{info.latestVersion}</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>You have v{info.currentVersion}</div>
      </div>
      {url && (
        <button onClick={() => window.printflow.downloadUpdate(url)} style={{
          padding: '6px 14px', background: '#0071E3', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          Download
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState('Starting server...');
  const [serverReady, setServerReady] = useState(false);
  const [updateInfo, setUpdateInfo]   = useState(null);
  const submitting = useRef(false);

  const { login, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { if (token) navigate('/', { replace: true }); }, [token, navigate]);

  useEffect(() => {
    clearError();
    setServerUrlCache('http://127.0.0.1:3001');

    // Load remembered email only (not password — security)
    try { const e = localStorage.getItem('pf_email'); if (e) setEmail(e); } catch {}

    window.printflow?.onServerProgress?.(({ progress: pct, ready }) => {
      setProgress(pct);
      if (pct < 35)       setPhase('Starting server...');
      else if (pct < 70)  setPhase('Loading database...');
      else if (pct < 95)  setPhase('Almost ready...');
      else if (ready)     { setPhase('Ready'); setServerReady(true); }
    });

    window.printflow?.onServerError?.(() => setPhase('Server error — please restart the app'));
    window.printflow?.onUpdateChecking?.(v => { if (v) setPhase(p => p !== 'Ready' ? 'Checking for updates...' : p); });
    window.printflow?.onUpdateAvailable?.(info => setUpdateInfo(info));
    window.printflow?.serverIsReady?.().then(ready => {
      if (ready) { setProgress(100); setPhase('Ready'); setServerReady(true); }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || submitting.current || !serverReady) return;
    submitting.current = true;
    setLoading(true);
    try { localStorage.setItem('pf_email', email); } catch {}
    await login(email, password);
    submitting.current = false;
    setLoading(false);
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#070714', position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      {/* Window drag region */}
      <div className="drag-region" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 44 }}/>

      {/* Background — very subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}/>

      {/* Radial glows */}
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', top:-280, left:-280, pointerEvents:'none',
        background: 'radial-gradient(circle, rgba(0,113,227,0.07) 0%, transparent 65%)' }}/>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', bottom:-200, right:-200, pointerEvents:'none',
        background: 'radial-gradient(circle, rgba(48,209,88,0.04) 0%, transparent 65%)' }}/>

      {/* Card */}
      <div style={{
        width: 368, position: 'relative',
        background: 'rgba(255,255,255,0.025)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        borderRadius: 22,
        padding: '40px 36px 36px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)',
        animation: 'fadeInUp 0.35s ease',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 62, height: 62, borderRadius: 17, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, rgba(0,113,227,0.14), rgba(0,113,227,0.04))',
            border: '0.5px solid rgba(0,113,227,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,113,227,0.12)',
          }}>
            <PrintFlowMark size={36}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em' }}>PrintFlow</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#4DA8FF', background: 'rgba(0,113,227,0.1)',
              border: '0.5px solid rgba(0,113,227,0.22)', borderRadius: 6, padding: '2px 7px',
            }}>Lite</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.01em' }}>
            3D Print Business Suite
          </div>
        </div>

        {/* Loading bar */}
        {!serverReady && <LoadingBar progress={progress} phase={phase}/>}

        {/* Update banner */}
        {updateInfo && serverReady && <UpdateBanner info={updateInfo}/>}

        {/* Form */}
        <div style={{ opacity: serverReady ? 1 : 0.35, transition: 'opacity 0.4s ease', pointerEvents: serverReady ? 'auto' : 'none' }}>
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.38)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoFocus={serverReady} required
                style={{
                  width:'100%', boxSizing:'border-box', padding:'11px 14px',
                  background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.09)',
                  borderRadius:10, color:'#fff', fontSize:14, outline:'none',
                  fontFamily:'inherit', transition:'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor='rgba(0,113,227,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(0,113,227,0.1)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.09)'; e.target.style.boxShadow='none'; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.38)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{
                    width:'100%', boxSizing:'border-box', padding:'11px 42px 11px 14px',
                    background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.09)',
                    borderRadius:10, color:'#fff', fontSize:14, outline:'none',
                    fontFamily:'inherit', transition:'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor='rgba(0,113,227,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(0,113,227,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.09)'; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', padding:2,
                  color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center',
                }}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding:'10px 14px', borderRadius:10, marginBottom:16,
                background:'rgba(255,59,48,0.07)', border:'0.5px solid rgba(255,59,48,0.18)',
                color:'#FF6B63', fontSize:12, lineHeight:1.5, display:'flex', alignItems:'center', gap:8,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password || !serverReady}
              style={{
                width:'100%', padding:'12px',
                background: (loading || !email || !password || !serverReady)
                  ? 'rgba(0,113,227,0.25)'
                  : 'linear-gradient(135deg, #0071E3 0%, #0056B3 100%)',
                color: (loading || !email || !password || !serverReady) ? 'rgba(255,255,255,0.35)' : '#fff',
                border:'none', borderRadius:12, fontSize:14, fontWeight:600,
                cursor:'pointer', letterSpacing:'0.01em', transition:'all 0.2s',
                boxShadow: (loading || !email || !password || !serverReady) ? 'none' : '0 4px 20px rgba(0,113,227,0.28)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              {loading
                ? <>
                    <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                    Signing in...
                  </>
                : 'Sign In'
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.03em' }}>
          v{window.printflow?.appVersion || '0.1.0'} · PrintFlow Lite
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.17); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0a0a18 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}
