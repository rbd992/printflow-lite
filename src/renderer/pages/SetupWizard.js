import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

const STEPS = [
  { id: 'welcome',  label: 'Welcome'  },
  { id: 'business', label: 'Business' },
  { id: 'account',  label: 'Account'  },
  { id: 'prefs',    label: 'Prefs'    },
  { id: 'done',     label: 'Done'     },
];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: i < current ? '#30D158' : i === current ? '#0071E3' : 'rgba(255,255,255,0.06)',
              color: i <= current ? '#fff' : 'rgba(255,255,255,0.3)',
              border: i === current ? '2px solid rgba(0,113,227,0.5)' : '2px solid transparent',
              transition: 'all 0.3s',
              boxShadow: i === current ? '0 0 16px rgba(0,113,227,0.4)' : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 9, color: i === current ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {s.label}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 40, height: 1, background: i < current ? '#30D158' : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input {...props} style={{
      width: '100%', boxSizing: 'border-box',
      padding: '11px 14px',
      background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: 10, color: '#fff', fontSize: 14,
      outline: 'none', fontFamily: 'inherit',
      transition: 'border-color 0.15s',
      ...(props.style || {}),
    }}
    onFocus={e => e.target.style.borderColor = 'rgba(0,113,227,0.6)'}
    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select {...props} style={{
      width: '100%', boxSizing: 'border-box',
      padding: '11px 14px',
      background: '#0d0d1f',
      border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: 10, color: '#fff', fontSize: 14,
      outline: 'none', fontFamily: 'inherit',
      cursor: 'pointer',
      ...(props.style || {}),
    }}>
      {children}
    </select>
  );
}

function PrimaryBtn({ children, disabled, onClick, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '13px',
      background: disabled ? 'rgba(0,113,227,0.3)' : 'linear-gradient(135deg, #0071E3, #0056B3)',
      color: '#fff', border: 'none', borderRadius: 12,
      fontSize: 14, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 16px rgba(0,113,227,0.3)',
      letterSpacing: '0.01em', transition: 'all 0.2s',
    }}>
      {children}
    </button>
  );
}

export default function SetupWizard({ onComplete }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [step, setStep]    = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  // Step 2 — business
  const [bizName,  setBizName]  = useState('');
  const [bizEmail, setBizEmail] = useState('');

  // Step 3 — account
  const [ownerName,  setOwnerName]  = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPass,  setOwnerPass]  = useState('');
  const [ownerPass2, setOwnerPass2] = useState('');

  // Step 4 — prefs
  const [currency, setCurrency] = useState('CAD');
  const [theme,    setTheme]    = useState('dark');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  async function finishSetup() {
    if (ownerPass !== ownerPass2) { setErr('Passwords do not match'); return; }
    if (ownerPass.length < 8) { setErr('Password must be at least 8 characters'); return; }
    setSaving(true); setErr('');
    try {
      // 1. Save company config
      await api.post('/api/settings/key', {
        key: 'company_config',
        value: {
          name: bizName || 'My Print Shop',
          email: bizEmail || '',
          currency,
          timezone,
          enable_hst: currency === 'CAD',
          hst_rate: 13,
        },
      });

      // 2. Create owner account (uses the default seed credentials first)
      await api.post('/api/setup/create-owner', {
        name:     ownerName,
        email:    ownerEmail,
        password: ownerPass,
      });

      // 3. Apply theme preference
      await window.printflow.setTheme(theme);

      // 4. Mark setup complete
      await window.printflow.setSetupComplete();
      if (window.printflow.setEulaAccepted) await window.printflow.setEulaAccepted();

      // 5. Auto-login
      await login(ownerEmail, ownerPass);

      setStep(4); // Done screen
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Setup failed. Try again.');
    }
    setSaving(false);
  }

  const card = (content) => (
    <div style={{
      width: 480,
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 22,
      padding: '40px 40px 36px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(40px)',
      animation: 'fadeInUp 0.35s ease',
    }}>
      <StepIndicator current={step}/>
      {content}
    </div>
  );

  // ── Step 0: Welcome ──────────────────────────────────────────────────────
  if (step === 0) return (
    <Wrap>
      {card(
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🖨️</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Welcome to PrintFlow Lite
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 36, maxWidth: 340, margin: '0 auto 36px' }}>
            Your complete 3D print business suite. Let's get you set up in about 2 minutes.
          </p>
          <PrimaryBtn onClick={() => setStep(1)}>Get Started →</PrimaryBtn>
          <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Everything runs locally on this computer — no internet required
          </div>
        </div>
      )}
    </Wrap>
  );

  // ── Step 1: Business info ────────────────────────────────────────────────
  if (step === 1) return (
    <Wrap>
      {card(
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Your business</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            This appears on quotes, invoices, and the order portal.
          </p>
          <Field label="Business / Shop name">
            <Input
              type="text" value={bizName} onChange={e => setBizName(e.target.value)}
              placeholder="e.g. Makers Workshop" autoFocus
            />
          </Field>
          <Field label="Contact email (optional)">
            <Input
              type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)}
              placeholder="hello@yourshop.com"
            />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setStep(0)} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>← Back</button>
            <div style={{ flex: 2 }}><PrimaryBtn onClick={() => setStep(2)}>Continue →</PrimaryBtn></div>
          </div>
        </>
      )}
    </Wrap>
  );

  // ── Step 2: Create owner account ─────────────────────────────────────────
  if (step === 2) return (
    <Wrap>
      {card(
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Create your account</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            This will be the Owner account. You can add more users later.
          </p>
          <Field label="Your name">
            <Input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Alex Smith" autoFocus/>
          </Field>
          <Field label="Email">
            <Input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="you@example.com"/>
          </Field>
          <Field label="Password">
            <Input type="password" value={ownerPass} onChange={e => setOwnerPass(e.target.value)} placeholder="Min. 8 characters"/>
          </Field>
          <Field label="Confirm password">
            <Input type="password" value={ownerPass2} onChange={e => setOwnerPass2(e.target.value)} placeholder="Same password again"/>
          </Field>
          {err && <div style={{ padding: '10px 14px', background: 'rgba(255,59,48,0.1)', border: '0.5px solid rgba(255,59,48,0.25)', borderRadius: 10, color: '#FF453A', fontSize: 12, marginBottom: 14 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => { setErr(''); setStep(1); }} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>← Back</button>
            <div style={{ flex: 2 }}>
              <PrimaryBtn disabled={!ownerName || !ownerEmail || !ownerPass || !ownerPass2} onClick={() => { setErr(''); setStep(3); }}>
                Continue →
              </PrimaryBtn>
            </div>
          </div>
        </>
      )}
    </Wrap>
  );

  // ── Step 3: Preferences ──────────────────────────────────────────────────
  if (step === 3) return (
    <Wrap>
      {card(
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Preferences</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            These can all be changed later in Settings.
          </p>
          <Field label="Currency">
            <Select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="CAD">CAD — Canadian Dollar ($)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="AUD">AUD — Australian Dollar ($)</option>
            </Select>
          </Field>
          <Field label="Appearance">
            <Select value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">Match system</option>
            </Select>
          </Field>
          <Field label="Timezone">
            <Input type="text" value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. America/Toronto"/>
          </Field>
          {err && <div style={{ padding: '10px 14px', background: 'rgba(255,59,48,0.1)', border: '0.5px solid rgba(255,59,48,0.25)', borderRadius: 10, color: '#FF453A', fontSize: 12, marginBottom: 14 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => { setErr(''); setStep(2); }} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>← Back</button>
            <div style={{ flex: 2 }}>
              <PrimaryBtn disabled={saving} onClick={finishSetup}>
                {saving ? 'Setting up...' : 'Finish Setup →'}
              </PrimaryBtn>
            </div>
          </div>
        </>
      )}
    </Wrap>
  );

  // ── Step 4: Done ─────────────────────────────────────────────────────────
  return (
    <Wrap>
      {card(
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
            You're all set!
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 36 }}>
            PrintFlow Lite is ready to go.<br/>
            Welcome, {ownerName || 'there'}.
          </p>
          <PrimaryBtn onClick={() => { if (onComplete) onComplete(); navigate('/', { replace: true }); }}>
            Open PrintFlow Lite →
          </PrimaryBtn>
        </div>
      )}
    </Wrap>
  );
}

function Wrap({ children }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060612', overflow: 'hidden', position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      <div className="drag-region" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 44 }}/>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,113,227,0.07) 0%, transparent 70%)', top: -200, left: -200, pointerEvents: 'none' }}/>
      {children}
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #0d0d1f; }
      `}</style>
    </div>
  );
}
