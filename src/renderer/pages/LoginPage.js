// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — LoginPage.js
// Apple-inspired glassmorphism login with professional polish
// Drop-in replacement for src/renderer/pages/LoginPage.js
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import './LoginPage.css';

const APP_VERSION = '0.1.4-beta';

// ── SVG Icon Components (no external deps, crisp at any size) ────────────────

const PrintFlowLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer cube frame */}
    <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" opacity="0.3"/>
    {/* Inner layered print bed */}
    <path d="M24 8L38 16V32L24 40L10 32V16L24 8Z" stroke="url(#logoGrad)" strokeWidth="1.2" fill="none" opacity="0.5"/>
    {/* Print layers */}
    <path d="M14 28L24 34L34 28" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M14 24L24 30L34 24" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.75"/>
    <path d="M14 20L24 26L34 20" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
    {/* Nozzle / extruder dot */}
    <circle cx="24" cy="16" r="2.5" fill="url(#logoGrad)"/>
    {/* Filament path */}
    <path d="M24 6V13.5" stroke="url(#logoGrad)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5"/>
    <defs>
      <linearGradient id="logoGrad" x1="6" y1="4" x2="42" y2="44">
        <stop offset="0%" stopColor="#60A5FA"/>
        <stop offset="50%" stopColor="#818CF8"/>
        <stop offset="100%" stopColor="#A78BFA"/>
      </linearGradient>
    </defs>
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M2.5 15.5C2.5 12.186 5.41 9.5 9 9.5C12.59 9.5 15.5 12.186 15.5 15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.5" y="8" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M6 8V5.5C6 3.843 7.343 2.5 9 2.5C10.657 2.5 12 3.843 12 5.5V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="9" cy="12" r="1.2" fill="currentColor"/>
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 9C1.5 9 4 3.5 9 3.5C14 3.5 16.5 9 16.5 9C16.5 9 14 14.5 9 14.5C4 14.5 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2L16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M7.05 7.05C6.7 7.4 6.5 7.88 6.5 8.4C6.5 9.78 7.62 10.9 9 10.9C9.52 10.9 10 10.7 10.35 10.35" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M3.5 5.5C2.4 6.7 1.5 8.2 1.5 9C1.5 9 4 14.5 9 14.5C10.2 14.5 11.3 14.1 12.2 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M14.5 12.5C15.6 11.3 16.5 9.8 16.5 9C16.5 9 14 3.5 9 3.5C7.8 3.5 6.7 3.9 5.8 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconSpinner = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="pf-spinner">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
    <path d="M18 10C18 5.582 14.418 2 10 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Background Canvas (animated mesh gradient) ──────────────────────────────

const MeshBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const orbs = [
      { x: 0.2, y: 0.3, r: 350, color: [30, 58, 138] },   // deep blue
      { x: 0.7, y: 0.2, r: 300, color: [49, 46, 129] },    // indigo
      { x: 0.5, y: 0.7, r: 380, color: [15, 23, 42] },     // slate
      { x: 0.8, y: 0.8, r: 250, color: [30, 27, 75] },     // violet dark
    ];

    const draw = () => {
      time += 0.002;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);

      orbs.forEach((orb, i) => {
        const ox = orb.x * w + Math.sin(time + i * 1.5) * 60;
        const oy = orb.y * h + Math.cos(time + i * 2) * 40;
        const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
        gradient.addColorStop(0, `rgba(${orb.color.join(',')}, 0.6)`);
        gradient.addColorStop(1, `rgba(${orb.color.join(',')}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pf-mesh-bg" />;
};

// ── Main Login Component ────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const usernameRef = useRef(null);

  useEffect(() => {
    // Check if first run (no users exist yet)
    const checkFirstRun = async () => {
      try {
        const res = await api.get('/auth/status');
        if (res.data && res.data.firstRun) {
          setIsFirstRun(true);
        }
      } catch {
        // Server not ready yet, ignore
      }
    };

    // Load remembered username
    const saved = localStorage.getItem('pf_remember_user');
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }

    checkFirstRun();
    setTimeout(() => usernameRef.current?.focus(), 600);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        username: username.trim(),
        password,
      });

      if (res.data?.token) {
        // Store JWT
        localStorage.setItem('pf_token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('pf_user', JSON.stringify(res.data.user));
        }
        if (rememberMe) {
          localStorage.setItem('pf_remember_user', username.trim());
        } else {
          localStorage.removeItem('pf_remember_user');
        }

        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 900);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      if (err.response?.status === 401) {
        setError(msg || 'Invalid username or password.');
      } else if (err.response?.status === 423) {
        setError(msg || 'Account is locked. Contact your administrator.');
      } else if (!err.response) {
        setError('Cannot reach PrintFlow server. Make sure the app is running.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Staggered entrance animations ──────────────────────────────────────

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="pf-login-root">
      <MeshBackground />

      {/* Noise overlay for texture */}
      <div className="pf-noise-overlay" />

      <motion.div
        className="pf-login-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Glass Card ─────────────────────────────────────────────────── */}
        <motion.div className="pf-glass-card" variants={itemVariants}>

          {/* Logo + Brand */}
          <motion.div className="pf-brand" variants={itemVariants}>
            <div className="pf-logo-wrap">
              <PrintFlowLogo size={52} />
            </div>
            <h1 className="pf-title">PrintFlow <span className="pf-title-lite">Lite</span></h1>
            <p className="pf-subtitle">3D Print Business Suite</p>
          </motion.div>

          {/* Error Banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="pf-error-banner"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
                </svg>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="pf-form" autoComplete="off">
            <motion.div className="pf-field" variants={itemVariants}>
              <label className="pf-label" htmlFor="pf-user">Username</label>
              <div className="pf-input-wrap">
                <span className="pf-input-icon"><IconUser /></span>
                <input
                  ref={usernameRef}
                  id="pf-user"
                  type="text"
                  className="pf-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  disabled={isLoading || success}
                  autoComplete="username"
                  spellCheck="false"
                />
              </div>
            </motion.div>

            <motion.div className="pf-field" variants={itemVariants}>
              <label className="pf-label" htmlFor="pf-pass">Password</label>
              <div className="pf-input-wrap">
                <span className="pf-input-icon"><IconLock /></span>
                <input
                  id="pf-pass"
                  type={showPassword ? 'text' : 'password'}
                  className="pf-input pf-input-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={isLoading || success}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pf-toggle-vis"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </motion.div>

            <motion.div className="pf-row-between" variants={itemVariants}>
              <label className="pf-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="pf-checkbox-native"
                />
                <span className={`pf-checkbox-box ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && <IconCheck />}
                </span>
                <span className="pf-checkbox-text">Remember me</span>
              </label>
            </motion.div>

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                className={`pf-btn-primary ${success ? 'pf-btn-success' : ''}`}
                disabled={isLoading || success}
              >
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pf-btn-content"
                    >
                      <IconCheck /> Authenticated
                    </motion.span>
                  ) : isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pf-btn-content"
                    >
                      <IconSpinner /> Signing in…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pf-btn-content"
                    >
                      Sign In
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          </form>

          {isFirstRun && (
            <motion.p className="pf-first-run-hint" variants={itemVariants}>
              First time? Use the credentials you created during setup.
            </motion.p>
          )}
        </motion.div>

        {/* ── Version Footer ─────────────────────────────────────────────── */}
        <motion.div className="pf-version-footer" variants={itemVariants}>
          <span className="pf-version-dot" />
          <span>PrintFlow Lite v{APP_VERSION}</span>
          <span className="pf-version-sep">·</span>
          <span className="pf-version-muted">Standalone Edition</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
