import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi } from '../api/client';

function PlatformCard({ name, icon, color, connected, features, onConfigure }) {
  return (
    <div className="card" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: connected ? 0.8 : 0.2, borderRadius: '16px 16px 0 0' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `0.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{name}</div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 99, background: connected ? 'var(--green-light)' : 'rgba(255,255,255,0.06)', color: connected ? 'var(--green)' : 'var(--text-tertiary)', border: `0.5px solid ${connected ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.1)'}` }}>
            {connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>
      {connected && features?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Active Features</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {features.slice(0, 4).map(f => (
              <span key={f} style={{ fontSize: 10, padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 99, color: 'var(--text-secondary)', border: '0.5px solid var(--border)' }}>{f}</span>
            ))}
            {features.length > 4 && <span style={{ fontSize: 10, padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 99, color: 'var(--text-tertiary)' }}>+{features.length - 4} more</span>}
          </div>
        </div>
      )}
      <button className="btn btn-ghost btn-sm" onClick={onConfigure} style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
        {connected ? 'Manage' : 'Set Up'}
      </button>
    </div>
  );
}

function StoreCard({ name, icon, color, connected, stats, onConfigure }) {
  return (
    <div className="card" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: connected ? 0.8 : 0.2, borderRadius: '16px 16px 0 0' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `0.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 99, background: connected ? 'var(--green-light)' : 'rgba(255,255,255,0.06)', color: connected ? 'var(--green)' : 'var(--text-tertiary)', border: `0.5px solid ${connected ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.1)'}` }}>
            {connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>
      {connected && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} style={{ padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{k}</div>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-ghost btn-sm" onClick={onConfigure} style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
        {connected ? 'Manage' : 'Set Up'}
      </button>
    </div>
  );
}

export default function MarketingPage() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState({});

  useEffect(() => {
    ['facebook','instagram','tiktok','youtube','shopify','etsy'].forEach(k => {
      settingsApi.get(`integration_${k}`).then(r => {
        if (r.data?.value) setIntegrations(i => ({ ...i, [k]: r.data.value }));
      }).catch(() => {});
    });
  }, []);

  const goSettings = (tab = 'integrations') => navigate('/settings', { state: { tab } });

  const activeFacebook = Object.entries(integrations.facebook?.features || {}).filter(([,v]) => v !== false).map(([k]) => k);
  const activeInstagram = Object.entries(integrations.instagram?.features || {}).filter(([,v]) => v !== false).map(([k]) => k);
  const activeTiktok = Object.entries(integrations.tiktok?.features || {}).filter(([,v]) => v !== false).map(([k]) => k);
  const activeYoutube = Object.entries(integrations.youtube?.features || {}).filter(([,v]) => v !== false).map(([k]) => k);

  const isConnected = {
    facebook:  !!(integrations.facebook?.page_access_token),
    instagram: !!(integrations.instagram?.access_token),
    tiktok:    !!(integrations.tiktok?.access_token),
    youtube:   !!(integrations.youtube?.refresh_token),
    shopify:   !!(integrations.shopify?.api_key && integrations.shopify?.store_url),
    etsy:      !!(integrations.etsy?.api_key),
  };

  const connectedCount = Object.values(isConnected).filter(Boolean).length;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Marketing & Integrations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {connectedCount === 0 ? 'No platforms connected yet' : `${connectedCount} platform${connectedCount !== 1 ? 's' : ''} connected`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => goSettings()} style={{ gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Manage Integrations
          </button>
        </div>

        {/* Social Media */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Social Media</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            <PlatformCard name="Facebook" color="#1877F2" connected={isConnected.facebook} features={activeFacebook}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
              onConfigure={() => goSettings()}
            />
            <PlatformCard name="Instagram" color="#E1306C" connected={isConnected.instagram} features={activeInstagram}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
              onConfigure={() => goSettings()}
            />
            <PlatformCard name="TikTok" color="#010101" connected={isConnected.tiktok} features={activeTiktok}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#010101' }}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.18a8.27 8.27 0 004.84 1.55V7.27a4.85 4.85 0 01-1.07-.58z"/></svg>}
              onConfigure={() => goSettings()}
            />
            <PlatformCard name="YouTube" color="#FF0000" connected={isConnected.youtube} features={activeYoutube}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
              onConfigure={() => goSettings()}
            />
          </div>
        </div>

        {/* E-Commerce */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>E-Commerce</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <StoreCard name="Shopify" color="#96BF48" connected={isConnected.shopify}
              stats={isConnected.shopify ? { 'Store': integrations.shopify?.store_url?.replace('.myshopify.com','') || '—', 'API Version': integrations.shopify?.api_version || '—' } : null}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="#96BF48"><path d="M15.337 23.979l7.216-1.561s-2.604-17.609-2.622-17.73c-.018-.12-.12-.198-.221-.198s-2.034-.141-2.034-.141-.882-.882-1.362-1.322v21.952zM13.777.992l-.882.24s-.541-1.562-1.643-1.562c0 0-1.623 0-2.404 3.505 0 0-1.923.601-2.023.621-.101.02-1.142.36-1.142.36l-2.624 18.57 15.95 2.265v-23.8c-.06 0-.141-.02-.221-.02-.381 0-1.062.28-1.443.26C17.326 1.413 13.777.992 13.777.992z"/></svg>}
              onConfigure={() => goSettings()}
            />
            <StoreCard name="Etsy" color="#F1641E" connected={isConnected.etsy}
              stats={isConnected.etsy ? { 'Shop ID': integrations.etsy?.shop_id || '—', 'Status': 'Active' } : null}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="#F1641E"><path d="M9.48 3.75V8.4H7.5V9.9h1.98v7.92c0 2.28 1.26 3.42 3.36 3.42.54 0 1.2-.12 1.74-.3v-1.56c-.36.12-.78.18-1.14.18-1.02 0-1.56-.6-1.56-1.74V9.9h2.64V8.4h-2.64V3.33L9.48 3.75z"/></svg>}
              onConfigure={() => goSettings()}
            />
          </div>
        </div>

        {/* Empty state */}
        {connectedCount === 0 && (
          <div style={{ marginTop: 32, padding: '32px 28px', background: 'linear-gradient(145deg,rgba(59,130,246,0.06),rgba(59,130,246,0.02))', border: '0.5px solid rgba(59,130,246,0.15)', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 20px' }}>
              Connect your social media platforms and online stores to sync orders automatically and post content directly from PrintFlow.
            </div>
            <button className="btn btn-primary" onClick={() => goSettings()}>
              Set Up Integrations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
