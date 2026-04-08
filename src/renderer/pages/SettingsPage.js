// [LITE] SettingsPage — Full featured settings with integrations
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api, settingsApi } from '../api/client';

// ── Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  general:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  appearance:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  integrations: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><path d="M8 6h8M8 18h8M5 9v6M19 9v6"/></svg>,
  printers:     <svg width="15" height="15" viewBox="0 0 64 64" fill="none"><rect x="6" y="10" width="5" height="36" rx="2.5" fill="currentColor" opacity="0.35"/><rect x="53" y="10" width="5" height="36" rx="2.5" fill="currentColor" opacity="0.35"/><rect x="6" y="10" width="52" height="7" rx="3.5" fill="currentColor" opacity="0.6"/><rect x="22" y="10" width="20" height="11" rx="3" fill="currentColor"/><path d="M29 21 L32 29 L35 21 Z" fill="currentColor"/><rect x="20" y="42" width="24" height="4.5" rx="2" fill="currentColor" opacity="0.55"/><rect x="22" y="37" width="20" height="4.5" rx="2" fill="currentColor" opacity="0.45"/><rect x="24" y="32" width="16" height="4.5" rx="2" fill="currentColor" opacity="0.35"/><rect x="10" y="46" width="44" height="4" rx="2" fill="currentColor" opacity="0.4"/><rect x="7" y="50" width="50" height="7" rx="3.5" fill="currentColor" opacity="0.6"/></svg>,
  account:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  data:         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  updates:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
  check:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  link:         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

// ── Shared components ─────────────────────────────────────────────────────
function Section({ title, desc, children, action }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3 }}>{title}</div>
          {desc && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>}
        </div>
        {action}
      </div>
      <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</label>
        {hint && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', opacity: 0.7 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>{children}</div>;
}

function SaveBtn({ saving, saved, onClick, label = 'Save Changes', disabled }) {
  return (
    <button className="btn btn-primary btn-sm" onClick={onClick} disabled={saving || disabled} style={{ minWidth: 120, justifyContent: 'center' }}>
      {saving ? 'Saving…' : saved ? <><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{Icons.check} Saved</span></> : label}
    </button>
  );
}

function StatusBadge({ connected }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 99,
      background: connected ? 'var(--green-light)' : 'rgba(255,255,255,0.06)',
      color: connected ? 'var(--green)' : 'var(--text-tertiary)',
      border: `0.5px solid ${connected ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.1)'}`,
    }}>
      {connected ? 'Connected' : 'Not Connected'}
    </span>
  );
}

function InfoBox({ children, type = 'info' }) {
  const colors = {
    info:    { bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.2)',  text: 'var(--accent)' },
    warning: { bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.2)',  text: 'var(--amber)'  },
    success: { bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.2)',  text: 'var(--green)'  },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ padding: '10px 14px', background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 10, fontSize: 12, color: c.text, lineHeight: 1.6, marginBottom: 14 }}>
      {children}
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────
const TABS = [
  { id: 'general',      label: 'General',      icon: Icons.general      },
  { id: 'appearance',   label: 'Appearance',   icon: Icons.appearance   },
  { id: 'integrations', label: 'Integrations', icon: Icons.integrations },
  { id: 'printers',     label: 'Printers',     icon: Icons.printers     },
  { id: 'updates',      label: 'Updates',      icon: Icons.updates      },
  { id: 'account',      label: 'Account',      icon: Icons.account      },
  { id: 'data',         label: 'Data',         icon: Icons.data         },
];

// ── Social platform brand icons ───────────────────────────────────────────
function FacebookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
}
function InstagramIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#ig)"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
}
function TikTokIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.18a8.27 8.27 0 004.84 1.55V7.27a4.85 4.85 0 01-1.07-.58z"/></svg>;
}
function YouTubeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
}
function ShopifyIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#96BF48"><path d="M15.337 23.979l7.216-1.561s-2.604-17.609-2.622-17.73c-.018-.12-.12-.198-.221-.198s-2.034-.141-2.034-.141-.882-.882-1.362-1.322v21.952zM13.777.992l-.882.24s-.541-1.562-1.643-1.562c0 0-1.623 0-2.404 3.505 0 0-1.923.601-2.023.621-.101.02-1.142.36-1.142.36l-2.624 18.57 15.95 2.265v-23.8c-.06 0-.141-.02-.221-.02-.381 0-1.062.28-1.443.26C17.326 1.413 13.777.992 13.777.992zM10.232 2.273c-.621 1.682-1.422 3.585-2.304 4.527V6.98c0-.28.02-.581.06-.861C8.43 3.736 9.551 2.514 10.232 2.273zm-1.182 7.351c.781 0 1.163.981 1.163 2.384s-.381 2.384-1.163 2.384c-.781 0-1.163-.981-1.163-2.384s.381-2.384 1.163-2.384z"/></svg>;
}
function EtsyIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#F1641E"><path d="M9.48 3.75V8.4H7.5V9.9h1.98v7.92c0 2.28 1.26 3.42 3.36 3.42.54 0 1.2-.12 1.74-.3v-1.56c-.36.12-.78.18-1.14.18-1.02 0-1.56-.6-1.56-1.74V9.9h2.64V8.4h-2.64V3.33L9.48 3.75zm-4.8 5.07c0-.72.66-1.32 1.38-1.32.72 0 1.32.6 1.32 1.32 0 .72-.6 1.38-1.32 1.38-.72 0-1.38-.66-1.38-1.38z"/></svg>;
}

// ── INTEGRATIONS TAB ──────────────────────────────────────────────────────
function IntegrationsTab({ integrations, setIntegrations, saving, setSaving, saved, setSaved }) {

  async function saveIntegration(key, data) {
    setSaving(key);
    try {
      await settingsApi.set(`integration_${key}`, data);
      setIntegrations(i => ({ ...i, [key]: data }));
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    } catch {}
    setSaving(null);
  }

  const upd = (key, field, val) => setIntegrations(i => ({ ...i, [key]: { ...i[key], [field]: val } }));

  return (
    <div>
      {/* Facebook */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FacebookIcon/> Facebook</div>}
        desc="Post content, manage your Page, run ads, and sync orders from Facebook Marketplace."
        action={<StatusBadge connected={!!(integrations.facebook?.page_access_token)}/>}
      >
        <InfoBox>
          <strong>Setup:</strong> Create a Facebook App at <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>developers.facebook.com</a>, enable the Pages API, and paste your credentials below. You'll need a Page Access Token with <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, and <code>pages_manage_metadata</code> permissions.
        </InfoBox>
        <Row>
          <Field label="App ID">
            <input className="input" placeholder="Your Facebook App ID" value={integrations.facebook?.app_id || ''} onChange={e => upd('facebook','app_id',e.target.value)}/>
          </Field>
          <Field label="App Secret">
            <input className="input" type="password" placeholder="••••••••••••••••" value={integrations.facebook?.app_secret || ''} onChange={e => upd('facebook','app_secret',e.target.value)}/>
          </Field>
        </Row>
        <Row>
          <Field label="Page ID">
            <input className="input" placeholder="Your Facebook Page ID" value={integrations.facebook?.page_id || ''} onChange={e => upd('facebook','page_id',e.target.value)}/>
          </Field>
          <Field label="Page Access Token">
            <input className="input" type="password" placeholder="Long-lived Page Token" value={integrations.facebook?.page_access_token || ''} onChange={e => upd('facebook','page_access_token',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Default Post Privacy">
          <select className="select" value={integrations.facebook?.default_privacy || 'PUBLISHED'} onChange={e => upd('facebook','default_privacy',e.target.value)} style={{ maxWidth: 220 }}>
            <option value="PUBLISHED">Published (Public)</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <SaveBtn saving={saving==='facebook'} saved={saved==='facebook'} onClick={() => saveIntegration('facebook', integrations.facebook)}/>
          <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Graph API Explorer
          </a>
          <a href="https://developers.facebook.com/docs/pages-api/overview" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Facebook Pages Docs
          </a>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>ENABLED FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {['Post to Page', 'Schedule Posts', 'Photo & Video Posts', 'Page Analytics', 'Comment Monitoring', 'Facebook Marketplace Orders', 'Audience Insights', 'Ad Campaign Links'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <Toggle checked={integrations.facebook?.features?.[f] !== false} onChange={v => upd('facebook', 'features', { ...integrations.facebook?.features, [f]: v })}/>
                {f}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* Instagram */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><InstagramIcon/> Instagram</div>}
        desc="Post photos, Reels, Stories, and sync product tags. Requires a Professional (Business or Creator) account."
        action={<StatusBadge connected={!!(integrations.instagram?.access_token)}/>}
      >
        <InfoBox>
          <strong>Setup:</strong> Instagram uses the same Facebook App. Enable the <strong>Instagram Graph API</strong> in your Facebook App. Your Instagram account must be a <strong>Business or Creator account</strong> linked to a Facebook Page. Get your Instagram Business Account ID and a User Access Token with <code>instagram_basic</code>, <code>instagram_content_publish</code>, and <code>pages_read_engagement</code>.
        </InfoBox>
        <Row>
          <Field label="Instagram Business Account ID">
            <input className="input" placeholder="17841400000000000" value={integrations.instagram?.account_id || ''} onChange={e => upd('instagram','account_id',e.target.value)}/>
          </Field>
          <Field label="User Access Token">
            <input className="input" type="password" placeholder="Long-lived User Token" value={integrations.instagram?.access_token || ''} onChange={e => upd('instagram','access_token',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Default Hashtags" hint="Space separated">
          <input className="input" placeholder="#3dprinting #3dprint #maker" value={integrations.instagram?.default_hashtags || ''} onChange={e => upd('instagram','default_hashtags',e.target.value)}/>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <SaveBtn saving={saving==='instagram'} saved={saved==='instagram'} onClick={() => saveIntegration('instagram', integrations.instagram)}/>
          <a href="https://developers.facebook.com/docs/instagram-api" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Instagram Graph API Docs
          </a>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>ENABLED FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {['Photo Posts', 'Video / Reels', 'Stories', 'Product Tags', 'Post Analytics', 'Comment Monitoring', 'Hashtag Research', 'Audience Insights'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <Toggle checked={integrations.instagram?.features?.[f] !== false} onChange={v => upd('instagram', 'features', { ...integrations.instagram?.features, [f]: v })}/>
                {f}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* TikTok */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><TikTokIcon/> TikTok</div>}
        desc="Post videos, manage your TikTok for Business account, and track performance."
        action={<StatusBadge connected={!!(integrations.tiktok?.access_token)}/>}
      >
        <InfoBox>
          <strong>Setup:</strong> Register a developer account at <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>developers.tiktok.com</a> and create an app with the <strong>Content Posting API</strong> and <strong>Login Kit</strong> enabled. TikTok requires a Business account for the Content Posting API.
        </InfoBox>
        <Row>
          <Field label="Client Key">
            <input className="input" placeholder="TikTok App Client Key" value={integrations.tiktok?.client_key || ''} onChange={e => upd('tiktok','client_key',e.target.value)}/>
          </Field>
          <Field label="Client Secret">
            <input className="input" type="password" placeholder="••••••••••••••••" value={integrations.tiktok?.client_secret || ''} onChange={e => upd('tiktok','client_secret',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Access Token">
          <input className="input" type="password" placeholder="OAuth Access Token" value={integrations.tiktok?.access_token || ''} onChange={e => upd('tiktok','access_token',e.target.value)}/>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <SaveBtn saving={saving==='tiktok'} saved={saved==='tiktok'} onClick={() => saveIntegration('tiktok', integrations.tiktok)}/>
          <a href="https://developers.tiktok.com/doc/content-posting-api-get-started" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} TikTok Content API Docs
          </a>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>ENABLED FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {['Video Upload & Post', 'Video Scheduling', 'Performance Analytics', 'Comment Monitoring', 'Audience Demographics', 'Hashtag Suggestions'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <Toggle checked={integrations.tiktok?.features?.[f] !== false} onChange={v => upd('tiktok', 'features', { ...integrations.tiktok?.features, [f]: v })}/>
                {f}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* YouTube */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><YouTubeIcon/> YouTube</div>}
        desc="Upload videos, manage your channel, and sync content with print orders."
        action={<StatusBadge connected={!!(integrations.youtube?.access_token)}/>}
      >
        <InfoBox>
          <strong>Setup:</strong> Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Google Cloud Console</a>, create a project, enable the <strong>YouTube Data API v3</strong>, create OAuth 2.0 credentials, and paste them below.
        </InfoBox>
        <Row>
          <Field label="OAuth Client ID">
            <input className="input" placeholder="Google OAuth Client ID" value={integrations.youtube?.client_id || ''} onChange={e => upd('youtube','client_id',e.target.value)}/>
          </Field>
          <Field label="OAuth Client Secret">
            <input className="input" type="password" placeholder="••••••••••••••••" value={integrations.youtube?.client_secret || ''} onChange={e => upd('youtube','client_secret',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Refresh Token">
          <input className="input" type="password" placeholder="OAuth Refresh Token" value={integrations.youtube?.refresh_token || ''} onChange={e => upd('youtube','refresh_token',e.target.value)}/>
        </Field>
        <Row>
          <Field label="Default Playlist" hint="Optional">
            <input className="input" placeholder="PLxxxxx" value={integrations.youtube?.default_playlist || ''} onChange={e => upd('youtube','default_playlist',e.target.value)}/>
          </Field>
          <Field label="Default Privacy">
            <select className="select" value={integrations.youtube?.default_privacy || 'private'} onChange={e => upd('youtube','default_privacy',e.target.value)}>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
          </Field>
        </Row>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <SaveBtn saving={saving==='youtube'} saved={saved==='youtube'} onClick={() => saveIntegration('youtube', integrations.youtube)}/>
          <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Enable YouTube API
          </a>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>ENABLED FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {['Video Upload', 'Auto-publish', 'Channel Analytics', 'Playlist Management', 'Comment Monitoring', 'Thumbnail Upload', 'End Screen & Cards', 'Live Streaming'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <Toggle checked={integrations.youtube?.features?.[f] !== false} onChange={v => upd('youtube', 'features', { ...integrations.youtube?.features, [f]: v })}/>
                {f}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* Shopify */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShopifyIcon/> Shopify</div>}
        desc="Sync orders, manage products, inventory, customers, and fulfillment with your Shopify store."
        action={<StatusBadge connected={!!(integrations.shopify?.api_key && integrations.shopify?.store_url)}/>}
      >
        <InfoBox>
          <strong>Setup:</strong> In your Shopify admin, go to <strong>Settings → Apps and sales channels → Develop apps</strong>. Create a private app with scopes: <code>read_orders</code>, <code>write_orders</code>, <code>read_products</code>, <code>write_products</code>, <code>read_inventory</code>, <code>write_inventory</code>, <code>read_customers</code>, <code>read_fulfillments</code>, <code>write_fulfillments</code>.
        </InfoBox>
        <Row>
          <Field label="Store URL">
            <input className="input" placeholder="yourstore.myshopify.com" value={integrations.shopify?.store_url || ''} onChange={e => upd('shopify','store_url',e.target.value)}/>
          </Field>
          <Field label="API Version">
            <select className="select" value={integrations.shopify?.api_version || '2024-01'} onChange={e => upd('shopify','api_version',e.target.value)}>
              <option value="2024-10">2024-10 (Latest)</option>
              <option value="2024-07">2024-07</option>
              <option value="2024-04">2024-04</option>
              <option value="2024-01">2024-01</option>
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Admin API Access Token">
            <input className="input" type="password" placeholder="shpat_xxxxxxxxxxxx" value={integrations.shopify?.api_key || ''} onChange={e => upd('shopify','api_key',e.target.value)}/>
          </Field>
          <Field label="Storefront API Token" hint="Optional - for public API">
            <input className="input" type="password" placeholder="Storefront token" value={integrations.shopify?.storefront_token || ''} onChange={e => upd('shopify','storefront_token',e.target.value)}/>
          </Field>
        </Row>
        <Row>
          <Field label="Webhook Secret" hint="For order notifications">
            <input className="input" type="password" placeholder="Webhook signing secret" value={integrations.shopify?.webhook_secret || ''} onChange={e => upd('shopify','webhook_secret',e.target.value)}/>
          </Field>
          <Field label="Default Location ID" hint="For inventory/fulfillment">
            <input className="input" placeholder="Shopify Location ID" value={integrations.shopify?.location_id || ''} onChange={e => upd('shopify','location_id',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Order Sync">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {['Auto-import new orders', 'Sync fulfillment status back', 'Auto-create customer records', 'Sync tracking numbers', 'Import product listings', 'Sync inventory levels', 'Import cancelled orders', 'Auto-tag printed orders'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <Toggle checked={integrations.shopify?.features?.[f] !== false} onChange={v => upd('shopify', 'features', { ...integrations.shopify?.features, [f]: v })}/>
                {f}
              </label>
            ))}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <SaveBtn saving={saving==='shopify'} saved={saved==='shopify'} onClick={() => saveIntegration('shopify', integrations.shopify)}/>
          <a href="https://shopify.dev/docs/api/admin-rest" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Shopify Admin API Docs
          </a>
        </div>
      </Section>

      {/* Etsy */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><EtsyIcon/> Etsy</div>}
        desc="Sync Etsy orders, manage listings, inventory, shipping profiles, and customer communications."
        action={<StatusBadge connected={!!(integrations.etsy?.api_key)}/>}
      >
        <InfoBox>
          <strong>Setup:</strong> Go to <a href="https://www.etsy.com/developers/register" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Etsy Developer Portal</a> and create an app. Request scopes: <code>listings_r</code>, <code>listings_w</code>, <code>transactions_r</code>, <code>transactions_w</code>, <code>billing_r</code>, <code>profile_r</code>, <code>email_r</code>. Use OAuth 2.0 PKCE flow. Note: Etsy API v3 does not support all legacy v2 features.
        </InfoBox>
        <Row>
          <Field label="API Key (Keystring)">
            <input className="input" placeholder="Your Etsy API Keystring" value={integrations.etsy?.api_key || ''} onChange={e => upd('etsy','api_key',e.target.value)}/>
          </Field>
          <Field label="API Secret">
            <input className="input" type="password" placeholder="••••••••••••••••" value={integrations.etsy?.api_secret || ''} onChange={e => upd('etsy','api_secret',e.target.value)}/>
          </Field>
        </Row>
        <Row>
          <Field label="OAuth Access Token">
            <input className="input" type="password" placeholder="OAuth Access Token" value={integrations.etsy?.access_token || ''} onChange={e => upd('etsy','access_token',e.target.value)}/>
          </Field>
          <Field label="Refresh Token">
            <input className="input" type="password" placeholder="OAuth Refresh Token" value={integrations.etsy?.refresh_token || ''} onChange={e => upd('etsy','refresh_token',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Shop ID">
          <input className="input" placeholder="Your Etsy Shop ID (numeric)" value={integrations.etsy?.shop_id || ''} onChange={e => upd('etsy','shop_id',e.target.value)} style={{ maxWidth: 240 }}/>
        </Field>
        <Field label="Order & Listing Sync">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {['Auto-import new orders', 'Sync order status back', 'Auto-create customer records', 'Sync shipping/tracking', 'Import active listings', 'Sync listing inventory', 'Import custom orders', 'Monitor messages/reviews', 'Auto-mark as shipped', 'Sync production notes'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <Toggle checked={integrations.etsy?.features?.[f] !== false} onChange={v => upd('etsy', 'features', { ...integrations.etsy?.features, [f]: v })}/>
                {f}
              </label>
            ))}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <SaveBtn saving={saving==='etsy'} saved={saved==='etsy'} onClick={() => saveIntegration('etsy', integrations.etsy)}/>
          <a href="https://developers.etsy.com/documentation/" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Etsy API v3 Docs
          </a>
        </div>
      </Section>
    </div>
  );
}

// ── PRINTER CONNECTIONS TAB ───────────────────────────────────────────────
function PrinterConnectionsTab({ printerCfg, setPrinterCfg, saving, setSaving, saved, setSaved }) {

  async function savePrinterCfg(brand, data) {
    setSaving(brand);
    try {
      await settingsApi.set(`printer_cfg_${brand}`, data);
      setPrinterCfg(c => ({ ...c, [brand]: data }));
      setSaved(brand);
      setTimeout(() => setSaved(null), 2500);
    } catch {}
    setSaving(null);
  }

  const upd = (brand, field, val) => setPrinterCfg(c => ({ ...c, [brand]: { ...c[brand], [field]: val } }));

  const Printer3DIcon = () => (
    <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="10" width="5" height="36" rx="2.5" fill="currentColor" opacity="0.35"/>
      <rect x="53" y="10" width="5" height="36" rx="2.5" fill="currentColor" opacity="0.35"/>
      <rect x="6" y="10" width="52" height="7" rx="3.5" fill="currentColor" opacity="0.6"/>
      <rect x="22" y="10" width="20" height="11" rx="3" fill="currentColor"/>
      <path d="M29 21 L32 29 L35 21 Z" fill="currentColor"/>
      <rect x="20" y="42" width="24" height="4.5" rx="2" fill="currentColor" opacity="0.55"/>
      <rect x="22" y="37" width="20" height="4.5" rx="2" fill="currentColor" opacity="0.45"/>
      <rect x="24" y="32" width="16" height="4.5" rx="2" fill="currentColor" opacity="0.35"/>
      <rect x="10" y="46" width="44" height="4" rx="2" fill="currentColor" opacity="0.4"/>
      <rect x="7" y="50" width="50" height="7" rx="3.5" fill="currentColor" opacity="0.6"/>
    </svg>
  );

  return (
    <div>
      <InfoBox type="info">
        Printer connections let PrintFlow monitor status, temperatures, print progress, and camera feeds directly. Each brand uses a different protocol — configure the ones you own below. Most features work on your local network without needing cloud accounts.
      </InfoBox>

      {/* Bambu Lab */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Printer3DIcon/> Bambu Lab</div>}
        desc="Bambu Lab printers (X1C, X1E, P1S, P1P, A1, A1 Mini) connect via MQTT over LAN. No cloud account required when using LAN-only mode."
        action={<StatusBadge connected={!!(printerCfg.bambu?.enabled)}/>}
      >
        <InfoBox type="warning">
          <strong>LAN Mode:</strong> For the best privacy and reliability, enable <strong>LAN-only mode</strong> on your printer (Settings → Network → LAN-only mode). PrintFlow will connect directly without going through Bambu Cloud. Your printer's IP and access code are on the printer display under Network.
        </InfoBox>
        <Row>
          <Field label="Connection Mode">
            <select className="select" value={printerCfg.bambu?.mode || 'lan'} onChange={e => upd('bambu','mode',e.target.value)}>
              <option value="lan">LAN Direct (Recommended)</option>
              <option value="cloud">Bambu Cloud API</option>
            </select>
          </Field>
          <Field label="MQTT Port">
            <input className="input" type="number" placeholder="8883" value={printerCfg.bambu?.mqtt_port || '8883'} onChange={e => upd('bambu','mqtt_port',e.target.value)}/>
          </Field>
        </Row>
        {printerCfg.bambu?.mode !== 'cloud' ? (
          <>
            <Field label="How to find your Access Code">
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, lineHeight: 1.7 }}>
                On your Bambu printer touchscreen: <strong>Settings → Network</strong> → scroll down to see your <strong>Access Code</strong> and <strong>Serial Number</strong>. The IP address is shown under the same menu.
              </div>
            </Field>
            <Row>
              <Field label="Printer IP Address">
                <input className="input" placeholder="192.168.1.xxx" value={printerCfg.bambu?.ip || ''} onChange={e => upd('bambu','ip',e.target.value)} style={{ fontFamily: 'monospace' }}/>
              </Field>
              <Field label="Access Code">
                <input className="input" placeholder="8-character code" value={printerCfg.bambu?.access_code || ''} onChange={e => upd('bambu','access_code',e.target.value)} style={{ fontFamily: 'monospace' }}/>
              </Field>
            </Row>
            <Field label="Serial Number">
              <input className="input" placeholder="01S00C000000000" value={printerCfg.bambu?.serial || ''} onChange={e => upd('bambu','serial',e.target.value)} style={{ fontFamily: 'monospace', maxWidth: 240 }}/>
            </Field>
          </>
        ) : (
          <>
            <Row>
              <Field label="Bambu Cloud Username / Email">
                <input className="input" placeholder="your@email.com" value={printerCfg.bambu?.username || ''} onChange={e => upd('bambu','username',e.target.value)}/>
              </Field>
              <Field label="Bambu Cloud Password">
                <input className="input" type="password" placeholder="••••••••" value={printerCfg.bambu?.password || ''} onChange={e => upd('bambu','password',e.target.value)}/>
              </Field>
            </Row>
          </>
        )}
        <Field label="Camera Stream" hint="Optional">
          <input className="input" placeholder="rtsps://192.168.1.xxx:322/streaming/live/1 (Bambu RTSPS)" value={printerCfg.bambu?.camera_url || ''} onChange={e => upd('bambu','camera_url',e.target.value)}/>
        </Field>
        <div style={{ marginTop: 8, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>MONITORED DATA</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {['Print status & progress', 'Nozzle temperature', 'Bed temperature', 'Chamber temperature', 'AMS filament status', 'Fan speeds', 'Print time remaining', 'Layer count', 'File name', 'Timelapse trigger', 'Error/warning alerts', 'Camera feed'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--green)', flexShrink: 0 }}>{Icons.check}</span>{f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle checked={!!printerCfg.bambu?.enabled} onChange={v => upd('bambu','enabled',v)} label="Enable Bambu integration"/>
          <SaveBtn saving={saving==='bambu'} saved={saved==='bambu'} onClick={() => savePrinterCfg('bambu', printerCfg.bambu)}/>
        </div>
      </Section>

      {/* Prusa */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Printer3DIcon/> Prusa</div>}
        desc="Prusa MK4, MK3.9, XL, and MINI+ connect via PrusaLink — a local HTTP API built into the printer."
        action={<StatusBadge connected={!!(printerCfg.prusa?.enabled)}/>}
      >
        <InfoBox>
          <strong>PrusaLink setup:</strong> On your Prusa printer, go to <strong>Settings → Network → PrusaLink</strong>. Enable it and note the <strong>API key</strong>. The printer must be on your local network. Prusa MK3.9 and later support PrusaLink natively. For older MK3S, a Raspberry Pi with OctoPrint is recommended.
        </InfoBox>
        <Row>
          <Field label="Printer IP / Hostname">
            <input className="input" placeholder="192.168.1.xxx or prusa.local" value={printerCfg.prusa?.ip || ''} onChange={e => upd('prusa','ip',e.target.value)} style={{ fontFamily: 'monospace' }}/>
          </Field>
          <Field label="PrusaLink API Key">
            <input className="input" type="password" placeholder="PrusaLink API Key" value={printerCfg.prusa?.api_key || ''} onChange={e => upd('prusa','api_key',e.target.value)}/>
          </Field>
        </Row>
        <Row>
          <Field label="Printer Model">
            <select className="select" value={printerCfg.prusa?.model || 'mk4'} onChange={e => upd('prusa','model',e.target.value)}>
              <option value="mk4">MK4</option>
              <option value="mk3.9">MK3.9</option>
              <option value="mk3s">MK3S / MK3S+</option>
              <option value="xl">XL</option>
              <option value="mini">MINI+</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="API Port">
            <input className="input" type="number" placeholder="80" value={printerCfg.prusa?.port || '80'} onChange={e => upd('prusa','port',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Camera Stream" hint="Optional">
          <input className="input" placeholder="http://192.168.1.xxx/webcam/?action=stream" value={printerCfg.prusa?.camera_url || ''} onChange={e => upd('prusa','camera_url',e.target.value)}/>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle checked={!!printerCfg.prusa?.enabled} onChange={v => upd('prusa','enabled',v)} label="Enable Prusa integration"/>
          <SaveBtn saving={saving==='prusa'} saved={saved==='prusa'} onClick={() => savePrinterCfg('prusa', printerCfg.prusa)}/>
          <a href="https://help.prusa3d.com/article/prusalink_302342" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} PrusaLink Docs
          </a>
        </div>
      </Section>

      {/* Creality / Ender */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Printer3DIcon/> Creality / Ender</div>}
        desc="Creality Ender, CR, K1, and Sonic Pad series. Newer models use Creality Cloud API; older models use OctoPrint or Klipper."
        action={<StatusBadge connected={!!(printerCfg.creality?.enabled)}/>}
      >
        <Field label="Connection Type">
          <select className="select" value={printerCfg.creality?.type || 'octoprint'} onChange={e => upd('creality','type',e.target.value)} style={{ maxWidth: 260 }}>
            <option value="octoprint">OctoPrint (Universal)</option>
            <option value="klipper">Klipper / Moonraker</option>
            <option value="creality_cloud">Creality Cloud API</option>
            <option value="creality_box">Creality Sonic Pad / Box</option>
          </select>
        </Field>
        <Row>
          <Field label="Printer IP / Hostname">
            <input className="input" placeholder="192.168.1.xxx" value={printerCfg.creality?.ip || ''} onChange={e => upd('creality','ip',e.target.value)} style={{ fontFamily: 'monospace' }}/>
          </Field>
          <Field label="API Key / Token">
            <input className="input" type="password" placeholder="OctoPrint/Moonraker API Key" value={printerCfg.creality?.api_key || ''} onChange={e => upd('creality','api_key',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Camera Stream" hint="Optional">
          <input className="input" placeholder="http://192.168.1.xxx/webcam/?action=stream" value={printerCfg.creality?.camera_url || ''} onChange={e => upd('creality','camera_url',e.target.value)}/>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle checked={!!printerCfg.creality?.enabled} onChange={v => upd('creality','enabled',v)} label="Enable Creality/Ender integration"/>
          <SaveBtn saving={saving==='creality'} saved={saved==='creality'} onClick={() => savePrinterCfg('creality', printerCfg.creality)}/>
        </div>
      </Section>

      {/* FlashForge */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Printer3DIcon/> FlashForge</div>}
        desc="FlashForge Adventurer, Creator, Guider, and other series. Connects via FlashForge's local TCP API or FlashCloud."
        action={<StatusBadge connected={!!(printerCfg.flashforge?.enabled)}/>}
      >
        <InfoBox>
          <strong>FlashForge LAN API:</strong> Most FlashForge printers expose a TCP socket API on port <code>8899</code> when connected to your network. No extra setup required — just enter the printer IP. FlashCloud requires a registered account at <a href="https://www.flashforge.com" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>flashforge.com</a>.
        </InfoBox>
        <Row>
          <Field label="Connection Type">
            <select className="select" value={printerCfg.flashforge?.type || 'lan'} onChange={e => upd('flashforge','type',e.target.value)}>
              <option value="lan">LAN TCP (Port 8899)</option>
              <option value="flashcloud">FlashCloud API</option>
              <option value="octoprint">OctoPrint</option>
            </select>
          </Field>
          <Field label="Printer IP">
            <input className="input" placeholder="192.168.1.xxx" value={printerCfg.flashforge?.ip || ''} onChange={e => upd('flashforge','ip',e.target.value)} style={{ fontFamily: 'monospace' }}/>
          </Field>
        </Row>
        {printerCfg.flashforge?.type === 'flashcloud' && (
          <Row>
            <Field label="FlashCloud Serial">
              <input className="input" placeholder="Serial Number" value={printerCfg.flashforge?.serial || ''} onChange={e => upd('flashforge','serial',e.target.value)}/>
            </Field>
            <Field label="FlashCloud API Key">
              <input className="input" type="password" placeholder="API Key" value={printerCfg.flashforge?.api_key || ''} onChange={e => upd('flashforge','api_key',e.target.value)}/>
            </Field>
          </Row>
        )}
        <Field label="Camera Stream" hint="Optional">
          <input className="input" placeholder="http://192.168.1.xxx/webcam/?action=stream" value={printerCfg.flashforge?.camera_url || ''} onChange={e => upd('flashforge','camera_url',e.target.value)}/>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle checked={!!printerCfg.flashforge?.enabled} onChange={v => upd('flashforge','enabled',v)} label="Enable FlashForge integration"/>
          <SaveBtn saving={saving==='flashforge'} saved={saved==='flashforge'} onClick={() => savePrinterCfg('flashforge', printerCfg.flashforge)}/>
        </div>
      </Section>

      {/* Klipper */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Printer3DIcon/> Klipper / Moonraker</div>}
        desc="Any printer running Klipper firmware with Moonraker. Works with Voron, Ratrig, custom builds, and Klipper-converted printers."
        action={<StatusBadge connected={!!(printerCfg.klipper?.enabled)}/>}
      >
        <InfoBox>
          <strong>Moonraker API:</strong> Klipper requires <strong>Moonraker</strong> installed alongside it. Moonraker exposes a REST API and WebSocket on port <code>7125</code> by default. You can use the Moonraker API key (set in <code>moonraker.conf</code> under <code>[authorization]</code>) or leave it blank if your Moonraker is configured without auth.
        </InfoBox>
        <Row>
          <Field label="Moonraker URL">
            <input className="input" placeholder="http://192.168.1.xxx:7125" value={printerCfg.klipper?.url || ''} onChange={e => upd('klipper','url',e.target.value)} style={{ fontFamily: 'monospace' }}/>
          </Field>
          <Field label="API Key" hint="Optional">
            <input className="input" type="password" placeholder="Moonraker API Key" value={printerCfg.klipper?.api_key || ''} onChange={e => upd('klipper','api_key',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Camera Stream" hint="Optional — Crowsnest / mjpeg-streamer">
          <input className="input" placeholder="http://192.168.1.xxx/webcam/?action=stream" value={printerCfg.klipper?.camera_url || ''} onChange={e => upd('klipper','camera_url',e.target.value)}/>
        </Field>
        <div style={{ marginTop: 8, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>MONITORED DATA</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {['Print status & progress', 'Hotend temperature', 'Bed temperature', 'MCU temperature', 'Fan speeds', 'Print time remaining', 'File name', 'Layer progress', 'Position (X/Y/Z)', 'GCode macros list', 'Emergency stop', 'Klippy state'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--green)', flexShrink: 0 }}>{Icons.check}</span>{f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle checked={!!printerCfg.klipper?.enabled} onChange={v => upd('klipper','enabled',v)} label="Enable Klipper integration"/>
          <SaveBtn saving={saving==='klipper'} saved={saved==='klipper'} onClick={() => savePrinterCfg('klipper', printerCfg.klipper)}/>
          <a href="https://moonraker.readthedocs.io/en/latest/" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} Moonraker Docs
          </a>
        </div>
      </Section>

      {/* OctoPrint */}
      <Section
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Printer3DIcon/> OctoPrint (Universal)</div>}
        desc="OctoPrint connects to virtually any 3D printer via serial. If your printer brand isn't listed above, use this."
        action={<StatusBadge connected={!!(printerCfg.octoprint?.enabled)}/>}
      >
        <InfoBox>
          <strong>OctoPrint API Key:</strong> In OctoPrint, go to <strong>Settings → API → Global API Key</strong>. Copy the key and paste it below. Your OctoPrint instance must be reachable on your local network.
        </InfoBox>
        <Row>
          <Field label="OctoPrint URL">
            <input className="input" placeholder="http://octopi.local or http://192.168.1.xxx" value={printerCfg.octoprint?.url || ''} onChange={e => upd('octoprint','url',e.target.value)} style={{ fontFamily: 'monospace' }}/>
          </Field>
          <Field label="API Key">
            <input className="input" type="password" placeholder="OctoPrint Global API Key" value={printerCfg.octoprint?.api_key || ''} onChange={e => upd('octoprint','api_key',e.target.value)}/>
          </Field>
        </Row>
        <Field label="Camera Stream" hint="Optional">
          <input className="input" placeholder="http://octopi.local/webcam/?action=stream" value={printerCfg.octoprint?.camera_url || ''} onChange={e => upd('octoprint','camera_url',e.target.value)}/>
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle checked={!!printerCfg.octoprint?.enabled} onChange={v => upd('octoprint','enabled',v)} label="Enable OctoPrint integration"/>
          <SaveBtn saving={saving==='octoprint'} saved={saved==='octoprint'} onClick={() => savePrinterCfg('octoprint', printerCfg.octoprint)}/>
          <a href="https://docs.octoprint.org/en/master/api/index.html" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.link} OctoPrint API Docs
          </a>
        </div>
      </Section>
    </div>
  );
}

// ── UPDATES TAB ───────────────────────────────────────────────────────────
function UpdatesTab() {
  const [updateInfo, setUpdateInfo]   = useState(null);
  const [checking,   setChecking]     = useState(false);
  const [checked,    setChecked]      = useState(false);
  const appVersion = window.printflow?.appVersion || '0.0.0';

  async function checkNow() {
    setChecking(true); setChecked(false); setUpdateInfo(null);
    try {
      const result = await window.printflow.checkForUpdates();
      setUpdateInfo(result);
    } catch {}
    setChecking(false); setChecked(true);
  }

  return (
    <div>
      <Section title="App Version" desc="PrintFlow Lite version information and update settings.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-light)', border: '0.5px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            {Icons.updates}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>v{appVersion}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>PrintFlow Lite</div>
          </div>
        </div>

        {updateInfo && (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: updateInfo.updateAvailable ? 'var(--green-light)' : 'var(--bg-hover)', border: `0.5px solid ${updateInfo.updateAvailable ? 'rgba(52,211,153,0.25)' : 'var(--border)'}`, borderRadius: 12 }}>
            {updateInfo.updateAvailable ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>Update available — v{updateInfo.latestVersion}</div>
                {updateInfo.releaseNotes && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                    {updateInfo.releaseNotes.substring(0, 500)}{updateInfo.releaseNotes.length > 500 ? '…' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {updateInfo.winUrl && <button className="btn btn-primary btn-sm" onClick={() => window.printflow.downloadUpdate(updateInfo.winUrl)}>Download for Windows</button>}
                  {updateInfo.macUrl && <button className="btn btn-primary btn-sm" onClick={() => window.printflow.downloadUpdate(updateInfo.macUrl)}>Download for Mac</button>}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>{Icons.check}</span>
                PrintFlow Lite is up to date (v{updateInfo.currentVersion})
              </div>
            )}
          </div>
        )}

        <button className="btn btn-secondary" onClick={checkNow} disabled={checking} style={{ gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {checking ? <span style={{ width: 13, height: 13, border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/> : Icons.updates}
            {checking ? 'Checking…' : 'Check for Updates'}
          </span>
        </button>
      </Section>

      <Section title="Release Notes" desc="What's new in each version.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { version: appVersion, date: 'April 2026', notes: ['Enterprise-grade printer integrations — Bambu Lab, Prusa, Creality, FlashForge, Klipper, OctoPrint', 'Social media integrations — Facebook, Instagram, TikTok, YouTube', 'E-commerce integrations — Shopify and Etsy', 'Redesigned settings with tabbed navigation', 'New Help & Documentation center', 'Auto-update checking on launch', 'Full glass UI redesign with enterprise Apple-inspired theme', 'Professional 3D printer icons throughout', 'Fixed server startup crash on Windows (path resolution)', 'Fixed setup wizard network error'] },
            { version: '0.1.2-beta', date: 'April 2026', notes: ['Fixed server startup on Windows', 'Improved setup wizard flow', 'Theme toggle fix'] },
            { version: '0.1.0-beta', date: 'April 2026', notes: ['Initial beta release', '5-step setup wizard', 'Orders, Finance, Customers, Filament, Printers', 'Job Queue and Print History', '12-brand filament catalogue', 'Brand-agnostic maintenance tracker'] },
          ].map(r => (
            <div key={r.version} style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 12, border: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>v{r.version}</span>
                  {r.version === appVersion && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'var(--green-light)', padding: '2px 7px', borderRadius: 99 }}>Current</span>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.date}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {r.notes.map((n, i) => <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3, lineHeight: 1.5 }}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Toggle component ──────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div onClick={() => onChange(!checked)} style={{ width: 34, height: 19, borderRadius: 10, background: checked ? 'var(--accent)' : 'var(--border-strong)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: checked ? 17 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}/>
      </div>
      {label && <span style={{ fontSize: 12 }}>{label}</span>}
    </label>
  );
}

// ── MAIN SETTINGS PAGE ────────────────────────────────────────────────────
export default function SettingsPage({ onThemeChange }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab]   = useState('general');
  const [theme, setThemeLocal] = useState('dark');
  const [biz, setBiz]   = useState({ name: '', email: '', currency: 'CAD', phone: '', address: '', website: '', hst_number: '', hst_rate: 13, enable_hst: true });
  const [bizSaved, setBizSaved] = useState(false);
  const [bizSaving, setBizSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ cur: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg]   = useState('');
  const [pwErr, setPwErr]   = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [dataPath, setDataPath] = useState('');
  const [integrations, setIntegrations] = useState({ facebook: {}, instagram: {}, tiktok: {}, youtube: {}, shopify: {}, etsy: {} });
  const [printerCfg, setPrinterCfg] = useState({ bambu: {}, prusa: {}, creality: {}, flashforge: {}, klipper: {}, octoprint: {} });
  const [intSaving, setIntSaving] = useState(null);
  const [intSaved, setIntSaved]   = useState(null);

  useEffect(() => {
    window.printflow.getTheme().then(t => setThemeLocal(t || 'dark'));
    window.printflow.getDataPath?.().then(p => setDataPath(p)).catch(() => {});
    settingsApi.get('company_config').then(r => { if (r.data?.value) setBiz(b => ({ ...b, ...r.data.value })); }).catch(() => {});
    // Load all integration settings
    ['facebook','instagram','tiktok','youtube','shopify','etsy'].forEach(k => {
      settingsApi.get(`integration_${k}`).then(r => { if (r.data?.value) setIntegrations(i => ({ ...i, [k]: r.data.value })); }).catch(() => {});
    });
    ['bambu','prusa','creality','flashforge','klipper','octoprint'].forEach(k => {
      settingsApi.get(`printer_cfg_${k}`).then(r => { if (r.data?.value) setPrinterCfg(c => ({ ...c, [k]: r.data.value })); }).catch(() => {});
    });
  }, []);

  async function changeTheme(t) {
    setThemeLocal(t);
    document.documentElement.setAttribute('data-theme', t);
    onThemeChange(t);
    await window.printflow.setTheme(t);
  }

  async function saveCompany() {
    setBizSaving(true);
    try { await settingsApi.set('company_config', biz); setBizSaved(true); setTimeout(() => setBizSaved(false), 2500); } catch {}
    setBizSaving(false);
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match'); return; }
    if (pwForm.next.length < 8) { setPwErr('Minimum 8 characters'); return; }
    setPwSaving(true); setPwErr(''); setPwMsg('');
    try {
      await api.post('/api/auth/change-password', { currentPassword: pwForm.cur, newPassword: pwForm.next });
      setPwMsg('Password changed successfully');
      setPwForm({ cur: '', next: '', confirm: '' });
    } catch (e) { setPwErr(e.response?.data?.error || 'Failed to change password'); }
    setPwSaving(false);
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar nav */}
      <div style={{ width: 196, flexShrink: 0, borderRight: '0.5px solid var(--border)', padding: '20px 0', overflowY: 'auto', background: 'var(--bg-sidebar)' }}>
        <div style={{ padding: '0 16px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Settings</div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%',
            padding: '8px 16px', border: 'none', borderRadius: 0, cursor: 'pointer',
            background: tab === t.id ? 'var(--accent-light)' : 'transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            borderLeft: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
            transition: 'all 0.12s', textAlign: 'left',
          }}>
            <span style={{ opacity: 0.8 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <div style={{ margin: '16px 16px 0', borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
          <button
            onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 0', border: 'none', background: 'transparent', color: 'var(--red)', fontSize: 13, cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 860 }}>

          {/* GENERAL */}
          {tab === 'general' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>General</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Business information and basic configuration</p>
              </div>
              <Section title="Business Information" desc="Used on quotes, invoices, and customer communications.">
                <Row>
                  <Field label="Business Name">
                    <input className="input" value={biz.name || ''} onChange={e => setBiz(b => ({ ...b, name: e.target.value }))} placeholder="Northern Makers"/>
                  </Field>
                  <Field label="Contact Email">
                    <input className="input" type="email" value={biz.email || ''} onChange={e => setBiz(b => ({ ...b, email: e.target.value }))} placeholder="hello@yourshop.com"/>
                  </Field>
                </Row>
                <Row>
                  <Field label="Phone">
                    <input className="input" value={biz.phone || ''} onChange={e => setBiz(b => ({ ...b, phone: e.target.value }))} placeholder="+1 (555) 000-0000"/>
                  </Field>
                  <Field label="Website">
                    <input className="input" value={biz.website || ''} onChange={e => setBiz(b => ({ ...b, website: e.target.value }))} placeholder="https://yourshop.com"/>
                  </Field>
                </Row>
                <Field label="Business Address">
                  <input className="input" value={biz.address || ''} onChange={e => setBiz(b => ({ ...b, address: e.target.value }))} placeholder="123 Main St, City, Province/State, Postal Code"/>
                </Field>
                <Row>
                  <Field label="Currency">
                    <select className="select" value={biz.currency || 'CAD'} onChange={e => setBiz(b => ({ ...b, currency: e.target.value }))}>
                      <option value="CAD">CAD — Canadian Dollar</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="AUD">AUD — Australian Dollar</option>
                    </select>
                  </Field>
                  <Field label="HST / Tax Number" hint="Optional">
                    <input className="input" value={biz.hst_number || ''} onChange={e => setBiz(b => ({ ...b, hst_number: e.target.value }))} placeholder="BN 123456789 RT0001"/>
                  </Field>
                </Row>
                <Row>
                  <Field label="Tax Rate (%)" hint="HST/GST/VAT">
                    <input className="input" type="number" step="0.01" value={biz.hst_rate ?? 13} onChange={e => setBiz(b => ({ ...b, hst_rate: parseFloat(e.target.value) }))} style={{ maxWidth: 120 }}/>
                  </Field>
                  <Field label="Enable Tax on Orders">
                    <div style={{ marginTop: 4 }}>
                      <Toggle checked={!!biz.enable_hst} onChange={v => setBiz(b => ({ ...b, enable_hst: v }))} label="Automatically apply tax to orders"/>
                    </div>
                  </Field>
                </Row>
                <SaveBtn saving={bizSaving} saved={bizSaved} onClick={saveCompany}/>
              </Section>
            </div>
          )}

          {/* APPEARANCE */}
          {tab === 'appearance' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Appearance</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Customize the look and feel</p>
              </div>
              <Section title="Theme">
                <div style={{ display: 'flex', gap: 12 }}>
                  {[['dark','Dark','#050510'],['light','Light','#F1F5F9']].map(([t, label, bg]) => (
                    <button key={t} onClick={() => changeTheme(t)} style={{
                      padding: '0', border: `2px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 14, cursor: 'pointer', overflow: 'hidden', background: 'transparent',
                      transition: 'border-color 0.15s', width: 120,
                    }}>
                      <div style={{ height: 72, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 64, height: 40, borderRadius: 6, background: t === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', border: `0.5px solid ${t === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}/>
                      </div>
                      <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: t === 'dark' ? '#fff' : '#000' }}>{label}</span>
                        {theme === t && <span style={{ color: 'var(--accent)', display: 'flex' }}>{Icons.check}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* INTEGRATIONS */}
          {tab === 'integrations' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Integrations</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect social media platforms and e-commerce stores</p>
              </div>
              <IntegrationsTab integrations={integrations} setIntegrations={setIntegrations} saving={intSaving} setSaving={setIntSaving} saved={intSaved} setSaved={setIntSaved}/>
            </div>
          )}

          {/* PRINTER CONNECTIONS */}
          {tab === 'printers' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Printer Connections</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Configure direct connections to your 3D printers for live monitoring and control</p>
              </div>
              <PrinterConnectionsTab printerCfg={printerCfg} setPrinterCfg={setPrinterCfg} saving={intSaving} setSaving={setIntSaving} saved={intSaved} setSaved={setIntSaved}/>
            </div>
          )}

          {/* UPDATES */}
          {tab === 'updates' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Updates</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Version information and release notes</p>
              </div>
              <UpdatesTab/>
            </div>
          )}

          {/* ACCOUNT */}
          {tab === 'account' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Account</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Your profile and security settings</p>
              </div>
              <Section title="Profile">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 12, marginBottom: 4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {user?.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email} · <span style={{ textTransform: 'capitalize', color: 'var(--accent)' }}>{user?.role}</span></div>
                  </div>
                </div>
              </Section>
              <Section title="Change Password">
                <Field label="Current Password">
                  <input className="input" type="password" value={pwForm.cur} onChange={e => setPwForm(f => ({ ...f, cur: e.target.value }))} style={{ maxWidth: 340 }}/>
                </Field>
                <Row>
                  <Field label="New Password" hint="Min. 8 characters">
                    <input className="input" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}/>
                  </Field>
                  <Field label="Confirm Password">
                    <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}/>
                  </Field>
                </Row>
                {pwErr && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{pwErr}</div>}
                {pwMsg && <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 10 }}>{pwMsg}</div>}
                <button className="btn btn-primary btn-sm" onClick={changePassword} disabled={pwSaving || !pwForm.cur || !pwForm.next}>
                  {pwSaving ? 'Saving…' : 'Change Password'}
                </button>
              </Section>
            </div>
          )}

          {/* DATA */}
          {tab === 'data' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Data</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Data storage location and backup</p>
              </div>
              <Section title="Data Location" desc="All your data is stored locally on this computer. No cloud sync.">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Database and logs are stored at:</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 10, wordBreak: 'break-all', marginBottom: 12 }}>
                  {dataPath || 'Loading…'}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.printflow.openExternal(`file://${dataPath}`)}>Open in Explorer</button>
                </div>
              </Section>
              <Section title="Backup" desc="Export your data for safekeeping.">
                <InfoBox type="info">
                  To back up PrintFlow Lite, copy the entire folder shown above to a safe location. The <code>printflow.db</code> file contains all your orders, customers, filament, and settings. Restore by copying it back to the same location before launching the app.
                </InfoBox>
              </Section>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
