import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { setServerUrlCache } from '../api/client';

// ── PrintFlow Wordmark ────────────────────────────────────────────────────
function PFMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="pf-a" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA"/>
          <stop offset="100%" stopColor="#2563EB"/>
        </linearGradient>
        <linearGradient id="pf-b" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      {/* F letterform */}
      <rect x="9"  y="7"  width="4"  height="26" rx="2" fill="url(#pf-a)"/>
      <rect x="9"  y="7"  width="18" height="4"  rx="2" fill="url(#pf-a)"/>
      <rect x="9"  y="18" width="12" height="4"  rx="2" fill="url(#pf-a)" opacity="0.8"/>
      {/* Accent dot — 3D print layer indicator */}
      <circle cx="30" cy="31" r="3.5" fill="url(#pf-b)"/>
      <circle cx="30" cy="31" r="1.5" fill="white" opacity="0.6"/>
    </svg>
  );
}

// ── Server progress bar ───────────────────────────────────────────────────
function ServerBar({ progress, phase, ready }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden', marginBottom: 10,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(3, progress)}%`,
          background: ready
            ? 'linear-gradient(90deg, #34D399, #059669)'
            : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
          borderRadius: 99,
          transition: 'width 0.4s ease, background 0.5s ease',
          boxShadow: ready
            ? '0 0 12px rgba(52,211,153,0.5)'
            : '0 0 12px rgba(59,130,246,0.4)',
        }}/>
      </div>
      <p style={{
        textAlign: 'center', fontSize: 11,
        color: 'rgba(255,255,255,0.28)',
        letterSpacing: '0.04em', margin: 0,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {phase}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase,    setPhase]    = useState('Starting server…');
  const [ready,    setReady]    = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const submitting = useRef(false);

  const { login, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    clearError();
    setServerUrlCache('http://127.0.0.1:3001');
    try { const e = localStorage.getItem('pf_email'); if (e) setEmail(e); } catch {}

    window.printflow?.onServerProgress?.(({ progress: pct, ready: r }) => {
      setProgress(pct);
      if      (pct < 30)  setPhase('Starting server…');
      else if (pct < 65)  setPhase('Loading database…');
      else if (pct < 95)  setPhase('Almost ready…');
      else if (r)         { setPhase('Ready'); setReady(true); }
    });

    window.printflow?.onServerError?.(() => setPhase('Server error — restart app'));
    window.printflow?.onUpdateAvailable?.(info => setUpdateInfo(info));

    window.printflow?.serverIsReady?.().then(r => {
      if (r) { setProgress(100); setPhase('Ready'); setReady(true); }
    }).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || submitting.current || !ready) return;
    submitting.current = true;
    setLoading(true);
    try { localStorage.setItem('pf_email', email); } catch {}
    await login(email, password);
    submitting.current = false;
    setLoading(false);
  }

  const canSubmit = ready && email && password && !loading;

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050510', position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      {/* Drag region */}
      <div className="drag-region" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 44, zIndex: 100 }}/>

      {/* Ambient glow layers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', top: -350, left: -200, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)' }}/>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', bottom: -300, right: -150, background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)' }}/>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', top: '40%', left: '55%', background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 65%)' }}/>
      </div>

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
      }}/>

      {/* Card */}
      <div style={{
        width: 380, position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '44px 40px 36px',
        boxShadow: `
          0 0 0 0.5px rgba(255,255,255,0.04) inset,
          0 1px 0 rgba(255,255,255,0.08) inset,
          0 48px 120px rgba(0,0,0,0.8),
          0 12px 40px rgba(0,0,0,0.5)
        `,
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        animation: 'loginFadeUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Logo + wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20, margin: '0 auto 20px',
            background: 'linear-gradient(145deg, rgba(59,130,246,0.15), rgba(37,99,235,0.06))',
            border: '0.5px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.08) inset',
          }}>
            <PFMark size={38}/>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.03em' }}>PrintFlow</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#60A5FA',
              background: 'rgba(59,130,246,0.12)',
              border: '0.5px solid rgba(59,130,246,0.25)',
              borderRadius: 6, padding: '3px 7px',
            }}>LITE</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', margin: 0, letterSpacing: '0.02em' }}>
            3D Print Business Suite
          </p>
        </div>

        {/* Server progress */}
        {!ready && <ServerBar progress={progress} phase={phase} ready={ready}/>}

        {/* Update banner */}
        {updateInfo && ready && (
          <div style={{
            marginBottom: 20, padding: '11px 14px',
            background: 'rgba(59,130,246,0.07)',
            border: '0.5px solid rgba(59,130,246,0.2)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', marginBottom: 2 }}>
                Update available — v{updateInfo.latestVersion}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>You have v{updateInfo.currentVersion}</div>
            </div>
            <button onClick={() => window.printflow.downloadUpdate(updateInfo.winUrl || updateInfo.macUrl)} style={{
              padding: '6px 12px', background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}>Download</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ opacity: ready ? 1 : 0.3, transition: 'opacity 0.4s', pointerEvents: ready ? 'auto' : 'none' }}>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus={ready}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 11, color: '#F8FAFC', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 42px 11px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 11, color: '#F8FAFC', fontSize: 14,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center',
              }}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)',
              border: '0.5px solid rgba(239,68,68,0.2)',
              borderRadius: 10, color: '#FCA5A5', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={!canSubmit} style={{
            width: '100%', padding: '13px',
            background: canSubmit
              ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
              : 'rgba(59,130,246,0.18)',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit ? '0 4px 20px rgba(59,130,246,0.35)' : 'none',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '0.01em',
          }}>
            {loading
              ? <><Spinner/> Signing in…</>
              : 'Sign In'
            }
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.1)', marginTop: 24, marginBottom: 0, letterSpacing: '0.04em' }}>
          v{window.printflow?.appVersion || '0.1.3'} · PrintFlow Lite
        </p>
      </div>

      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.15); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #050510 inset !important;
          -webkit-text-fill-color: #F8FAFC !important;
          caret-color: #F8FAFC;
        }
      `}</style>
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }}/>;
}
