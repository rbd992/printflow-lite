import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

// ── Professional SVG icon set ─────────────────────────────────────────────
const Icons = {
  printer: (
    <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
      <rect x="8"  y="14" width="6"  height="38" rx="3" fill="currentColor" opacity="0.45"/>
      <rect x="66" y="14" width="6"  height="38" rx="3" fill="currentColor" opacity="0.45"/>
      <rect x="8"  y="12" width="64" height="9"  rx="4" fill="currentColor" opacity="0.7"/>
      <rect x="30" y="14" width="20" height="12" rx="3" fill="currentColor"/>
      <path d="M36 26 L40 35 L44 26 Z" fill="currentColor"/>
      <rect x="26" y="49" width="28" height="5"  rx="2.5" fill="currentColor" opacity="0.65"/>
      <rect x="28" y="44" width="24" height="6"  rx="2.5" fill="currentColor" opacity="0.5"/>
      <rect x="30" y="40" width="20" height="5"  rx="2"   fill="currentColor" opacity="0.35"/>
      <rect x="14" y="54" width="52" height="4"  rx="2"   fill="currentColor" opacity="0.4"/>
      <rect x="10" y="58" width="60" height="9"  rx="3"   fill="currentColor" opacity="0.65"/>
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21V11h6v10"/>
      <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M15 11h.01"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  sliders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

const STEPS = [
  { id: 'welcome',  label: 'Welcome',  icon: Icons.printer  },
  { id: 'business', label: 'Business', icon: Icons.building },
  { id: 'account',  label: 'Account',  icon: Icons.user     },
  { id: 'prefs',    label: 'Prefs',    icon: Icons.sliders  },
  { id: 'done',     label: 'Done',     icon: Icons.check    },
];

// ── Step indicator ────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < current
                ? 'linear-gradient(135deg, #30D158, #25a847)'
                : i === current
                  ? 'linear-gradient(135deg, #0071E3, #0056B3)'
                  : 'rgba(255,255,255,0.06)',
              color: i <= current ? '#fff' : 'rgba(255,255,255,0.25)',
              border: i === current ? '2px solid rgba(77,168,255,0.4)' : '2px solid transparent',
              boxShadow: i === current ? '0 0 20px rgba(0,113,227,0.35)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              fontSize: 11,
            }}>
              {i < current
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
              }
            </div>
            <span style={{
              fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
              color: i === current ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
            }}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: 36, height: 1, margin: '0 6px', marginBottom: 18,
              background: i < current
                ? 'linear-gradient(90deg, #30D158, #25a847)'
                : 'rgba(255,255,255,0.07)',
              transition: 'background 0.4s ease',
            }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Form primitives ───────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function Input(props) {
  return (
    <input {...props} style={{ ...inputStyle, ...(props.style || {}) }}
      onFocus={e => { e.target.style.borderColor = 'rgba(0,113,227,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, background: '#0c0c1e', cursor: 'pointer', ...(props.style || {}) }}>
      {children}
    </select>
  );
}

function PrimaryBtn({ children, disabled, onClick, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '13px',
      background: disabled
        ? 'rgba(0,113,227,0.2)'
        : 'linear-gradient(135deg, #0071E3 0%, #0056B3 100%)',
      color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
      border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(0,113,227,0.3)',
      letterSpacing: '0.01em', transition: 'all 0.2s',
      ...style,
    }}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '13px',
      background: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.5)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12, fontSize: 14, cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      Back
    </button>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, marginBottom: 14,
      background: 'rgba(255,59,48,0.08)',
      border: '0.5px solid rgba(255,59,48,0.2)',
      color: '#FF6B63', fontSize: 12, lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────
function Card({ children }) {
  return (
    <div style={{
      width: 460,
      background: 'rgba(255,255,255,0.025)',
      border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 22,
      padding: '36px 38px 32px',
      boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
      backdropFilter: 'blur(40px)',
      animation: 'fadeInUp 0.3s ease',
    }}>
      {children}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────
export default function SetupWizard({ onComplete }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const [bizName,  setBizName]  = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [ownerName,  setOwnerName]  = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPass,  setOwnerPass]  = useState('');
  const [ownerPass2, setOwnerPass2] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [theme,    setTheme]    = useState('dark');

  async function finishSetup() {
    if (ownerPass !== ownerPass2) { setErr('Passwords do not match'); return; }
    if (ownerPass.length < 8)    { setErr('Password must be at least 8 characters'); return; }
    setSaving(true); setErr('');

    try {
      // Create owner account + save company config in one request (no auth needed)
      await api.post('/api/setup/create-owner', {
        name:     ownerName,
        email:    ownerEmail,
        password: ownerPass,
        companyConfig: {
          name: bizName || 'My Print Shop',
          email: bizEmail || '',
          currency,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          enable_hst: currency === 'CAD',
          hst_rate: 13,
        },
      });

      // Apply theme
      await window.printflow.setTheme(theme);

      // Mark setup complete
      await window.printflow.setSetupComplete();

      // Auto-login
      await login(ownerEmail, ownerPass);

      setStep(4);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Setup failed — please try again.');
    }
    setSaving(false);
  }

  // ── Step 0: Welcome ────────────────────────────────────────────────────
  if (step === 0) return (
    <Wrap>
      <Card>
        <StepIndicator current={0} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, rgba(0,113,227,0.12), rgba(0,113,227,0.04))',
            border: '0.5px solid rgba(0,113,227,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4DA8FF',
          }}>
            {Icons.printer}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Welcome to PrintFlow Lite
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
            Your complete 3D print business management suite. Set up takes about two minutes.
          </p>
          <PrimaryBtn onClick={() => setStep(1)}>Get Started</PrimaryBtn>
          <p style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
            All data is stored locally on this computer
          </p>
        </div>
      </Card>
    </Wrap>
  );

  // ── Step 1: Business ───────────────────────────────────────────────────
  if (step === 1) return (
    <Wrap>
      <Card>
        <StepIndicator current={1} />
        <SectionHeader icon={Icons.building} title="Your Business" desc="Used on quotes, invoices and customer communications." />
        <Field label="Business name">
          <Input type="text" value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Northern Makers" autoFocus />
        </Field>
        <Field label="Contact email" hint="Optional">
          <Input type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} placeholder="hello@yourshop.com" />
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <BackBtn onClick={() => setStep(0)} />
          <div style={{ flex: 2 }}><PrimaryBtn onClick={() => setStep(2)}>Continue</PrimaryBtn></div>
        </div>
      </Card>
    </Wrap>
  );

  // ── Step 2: Account ────────────────────────────────────────────────────
  if (step === 2) return (
    <Wrap>
      <Card>
        <StepIndicator current={2} />
        <SectionHeader icon={Icons.user} title="Create Your Account" desc="This will be the Owner account. You can add more team members later." />
        <Field label="Full name">
          <Input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Alex Smith" autoFocus />
        </Field>
        <Field label="Email address">
          <Input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" hint="Min. 8 characters">
          <Input type="password" value={ownerPass} onChange={e => setOwnerPass(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Confirm password">
          <Input type="password" value={ownerPass2} onChange={e => setOwnerPass2(e.target.value)} placeholder="••••••••" />
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <BackBtn onClick={() => { setErr(''); setStep(1); }} />
          <div style={{ flex: 2 }}>
            <PrimaryBtn
              disabled={!ownerName || !ownerEmail || !ownerPass || !ownerPass2}
              onClick={() => { setErr(''); setStep(3); }}
            >
              Continue
            </PrimaryBtn>
          </div>
        </div>
      </Card>
    </Wrap>
  );

  // ── Step 3: Preferences ────────────────────────────────────────────────
  if (step === 3) return (
    <Wrap>
      <Card>
        <StepIndicator current={3} />
        <SectionHeader icon={Icons.sliders} title="Preferences" desc="These can be changed at any time in Settings." />
        <Field label="Currency">
          <Select value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="CAD">CAD — Canadian Dollar</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
            <option value="AUD">AUD — Australian Dollar</option>
          </Select>
        </Field>
        <Field label="Appearance">
          <div style={{ display: 'flex', gap: 8 }}>
            {[['dark','Dark'],['light','Light'],['system','System']].map(([v, l]) => (
              <button key={v} onClick={() => setTheme(v)} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                background: theme === v ? 'rgba(0,113,227,0.15)' : 'rgba(255,255,255,0.04)',
                border: theme === v ? '0.5px solid rgba(0,113,227,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                color: theme === v ? '#4DA8FF' : 'rgba(255,255,255,0.4)',
                fontSize: 12, fontWeight: theme === v ? 600 : 400,
                transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
        </Field>
        <ErrorBox msg={err} />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <BackBtn onClick={() => { setErr(''); setStep(2); }} />
          <div style={{ flex: 2 }}>
            <PrimaryBtn disabled={saving} onClick={finishSetup}>
              {saving
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Spinner /> Setting up...
                  </span>
                : 'Finish Setup'
              }
            </PrimaryBtn>
          </div>
        </div>
      </Card>
    </Wrap>
  );

  // ── Step 4: Done ───────────────────────────────────────────────────────
  return (
    <Wrap>
      <Card>
        <StepIndicator current={4} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, rgba(48,209,88,0.15), rgba(48,209,88,0.05))',
            border: '0.5px solid rgba(48,209,88,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#30D158',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
            You're all set
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 32 }}>
            PrintFlow Lite is ready. Welcome, {ownerName}.
          </p>
          <PrimaryBtn onClick={() => { if (onComplete) onComplete(); navigate('/', { replace: true }); }}>
            Open PrintFlow Lite
          </PrimaryBtn>
        </div>
      </Card>
    </Wrap>
  );
}

function SectionHeader({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'rgba(0,113,227,0.1)', border: '0.5px solid rgba(0,113,227,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4DA8FF',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', display: 'inline-block',
    }}/>
  );
}

function Wrap({ children }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 20%, rgba(0,113,227,0.06) 0%, transparent 60%), #060612',
      overflow: 'hidden', position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      <div className="drag-region" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 44 }}/>
      {children}
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.18); }
        select option { background: #0c0c1e; }
        button:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}
