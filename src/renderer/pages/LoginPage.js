import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { setServerUrlCache } from '../api/client';

// ── Refined wordmark logo — no cartoon, clean geometric mark ──────────────
function LiteLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="22" cy="22" r="20" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none"/>
      {/* Inner geometric — stylised F letterform */}
      <rect x="13" y="12" width="3" height="20" rx="1.5" fill="url(#logoGrad)"/>
      <rect x="13" y="12" width="14" height="3" rx="1.5" fill="url(#logoGrad)"/>
      <rect x="13" y="20" width="10" height="3" rx="1.5" fill="url(#logoGrad)"/>
      {/* Accent dot — bottom right */}
      <circle cx="29" cy="31" r="2.5" fill="#30D158"/>
      <defs>
        <linearGradient id="logoGrad" x1="13" y1="12" x2="31" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4DA8FF"/>
          <stop offset="100%" stopColor="#0071E3"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Animated loading bar ──────────────────────────────────────────────────
function LoadingBar({ progress, phase }) {
  return (
    <div style={{ width: '100%', marginBottom: 28 }}>
      <div style={{
        height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #0071E3, #30D158)',
          borderRadius: 99,
          transition: 'width 0.25s ease',
          boxShadow: '0 0 12px rgba(0,113,227,0.5)',
        }}/>
      </div>
      <div style={{
        marginTop: 10,
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'center',
        letterSpacing: '0.04em',
        minHeight: 16,
      }}>
        {phase}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState('Starting up...');
  const [serverReady, setServerReady] = useState(false);
  const [updateInfo, setUpdateInfo]   = useState(null);
  const submitting = useRef(false);

  const { login, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { if (token) navigate('/', { replace: true }); }, [token, navigate]);

  useEffect(() => {
    clearError();
    // Load remembered credentials
    try {
      const e = localStorage.getItem('pf_lite_email');
      const p = localStorage.getItem('pf_lite_pass');
      if (e) { setEmail(e); setRemember(true); }
      if (p) setPassword(p);
    } catch {}

    // Set server URL to local
    setServerUrlCache('http://127.0.0.1:3001');

    // Listen for server startup progress
    window.printflow?.onServerProgress?.(({ progress: pct, ready }) => {
      setProgress(pct);
      if (pct < 50) setPhase('Starting up...');
      else if (pct < 90) setPhase('Loading database...');
      else if (ready) {
        setPhase('Ready');
        setServerReady(true);
      } else {
        setPhase('Almost ready...');
      }
    });

    window.printflow?.onServerError?.((msg) => {
      setPhase('Error starting server — try restarting the app');
    });

    window.printflow?.onUpdateAvailable?.((info) => {
      setUpdateInfo(info);
    });

    // If server already running (e.g. hot reload in dev)
    window.printflow?.serverIsReady?.().then(ready => {
      if (ready) { setProgress(100); setPhase('Ready'); setServerReady(true); }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || submitting.current || !serverReady) return;
    submitting.current = true;
    setLoading(true);
    try {
      if (remember) {
        localStorage.setItem('pf_lite_email', email);
        localStorage.setItem('pf_lite_pass', password);
      } else {
        localStorage.removeItem('pf_lite_email');
        localStorage.removeItem('pf_lite_pass');
      }
    } catch {}
    await login(email, password);
    submitting.current = false;
    setLoading(false);
  }

  const showLoading = !serverReady;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#060612',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      {/* Drag region for frameless window */}
      <div className="drag-region" style={{ position:'fixed', top:0, left:0, right:0, height:44 }}/>

      {/* Subtle background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,113,227,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,113,227,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}/>

      {/* Ambient glow top-left */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,113,227,0.08) 0%, transparent 70%)',
        top: -200, left: -200, pointerEvents: 'none',
      }}/>
      {/* Ambient glow bottom-right */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)',
        bottom: -100, right: -100, pointerEvents: 'none',
      }}/>

      {/* Main card */}
      <div style={{
        width: 380,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(40px)',
        position: 'relative',
        animation: 'fadeInUp 0.4s ease',
      }}>

        {/* Logo + wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(0,113,227,0.15), rgba(0,113,227,0.05))',
            border: '0.5px solid rgba(0,113,227,0.2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(0,113,227,0.15)',
          }}>
            <LiteLogo size={36}/>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em',
              color: '#fff',
            }}>
              PrintFlow
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
              color: '#0071E3',
              background: 'rgba(0,113,227,0.12)',
              border: '0.5px solid rgba(0,113,227,0.25)',
              borderRadius: 6, padding: '2px 7px',
              textTransform: 'uppercase',
            }}>
              Lite
            </span>
          </div>

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
            3D Print Business Suite
          </div>
        </div>

        {/* Loading bar — shown while server starts */}
        {showLoading && (
          <LoadingBar progress={progress} phase={phase}/>
        )}

        {/* Update banner */}
        {updateInfo && serverReady && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(0,113,227,0.08)',
            border: '0.5px solid rgba(0,113,227,0.2)',
            borderRadius: 10, marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4DA8FF', marginBottom: 2 }}>
                Update available — v{updateInfo.latestVersion}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                You have v{updateInfo.currentVersion}
              </div>
            </div>
            <button
              onClick={() => {
                const url = process.platform === 'darwin' ? updateInfo.macUrl : updateInfo.winUrl;
                if (url) window.printflow.downloadUpdate(url);
              }}
              style={{
                background: '#0071E3', color: '#fff', border: 'none',
                borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Download
            </button>
          </div>
        )}

        {/* Login form — shown when server is ready */}
        <div style={{
          opacity: serverReady ? 1 : 0.3,
          transition: 'opacity 0.4s ease',
          pointerEvents: serverReady ? 'auto' : 'none',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus={serverReady}
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,113,227,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,113,227,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input
                type="checkbox" id="rm" checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: '#0071E3', cursor: 'pointer' }}
              />
              <label htmlFor="rm" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(255,59,48,0.1)',
                border: '0.5px solid rgba(255,59,48,0.25)',
                color: '#FF453A', fontSize: 12, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || !serverReady}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'rgba(0,113,227,0.5)' : 'linear-gradient(135deg, #0071E3, #0056B3)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', letterSpacing: '0.01em',
                boxShadow: '0 4px 16px rgba(0,113,227,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }}/>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Version */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}>
          v{window.printflow?.appVersion || '0.1.0-beta.1'} · PrintFlow Lite
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0a0a1a inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}
