import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldAlert, Key, AlertTriangle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function ProfileSettings() {
  const { user, fetchProfile, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mfaUri, setMfaUri] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnrollMFA = async () => {
    try {
      setLoading(true); setError(null); setSuccess(null);
      const res = await api.post('/auth/mfa/enroll');
      setMfaUri(res.data.provisioning_uri);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize MFA enrollment');
    } finally { setLoading(false); }
  };

  const handleActivateMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) return;
    try {
      setLoading(true); setError(null);
      await api.post('/auth/mfa/activate', { code: verificationCode });
      setSuccess('2FA activated successfully! Your account is now secured.');
      setMfaUri(null); setVerificationCode('');
      if (accessToken) await fetchProfile(accessToken);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Try again.');
    } finally { setLoading(false); }
  };

  const handleDisableMFA = async () => {
    if (!window.confirm('Disable 2FA? Your account will be less secure.')) return;
    try {
      setLoading(true); setError(null); setSuccess(null);
      await api.post('/auth/mfa/disable');
      setSuccess('2FA has been disabled. You have been logged out of all sessions.');
      if (accessToken) await fetchProfile(accessToken);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to disable MFA');
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      color: '#18181b',
    }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: '48px',
        borderBottom: '1px solid #e4e4e7',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: '1px solid #e4e4e7',
              padding: '4px 12px', cursor: 'pointer', color: '#71717a',
              fontSize: '12px', borderRadius: 0,
            }}
          >
            <ArrowLeft size={13} /> Back
          </button>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Security Settings
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: user.mfa_enabled ? '#16a34a' : '#d1d5db',
          }} />
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {user.mfa_enabled ? '2FA ACTIVE' : '2FA INACTIVE'}
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Page title */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e4e4e7' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '-0.02em', margin: 0 }}>
            Account Security
          </h1>
          <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
            {user.email} · {user.role}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2',
            border: '1px solid #fecaca', color: '#dc2626',
            display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            {error}
          </div>
        )}
        {success && (
          <div style={{
            marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4',
            border: '1px solid #bbf7d0', color: '#16a34a',
            display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px',
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            {success}
          </div>
        )}

        {/* ── 2FA Card ── */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '1.75rem' }}>

          {/* Card header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                padding: '10px', border: '1px solid #e4e4e7',
                color: user.mfa_enabled ? '#16a34a' : '#71717a',
              }}>
                {user.mfa_enabled ? <Shield size={22} /> : <ShieldAlert size={22} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>
                  Two-Factor Authentication (2FA)
                </h3>
                <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px', marginBottom: 0, maxWidth: '380px' }}>
                  Adds a one-time code from your authenticator app as a second login step.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Status:
                  </span>
                  <span style={{
                    fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                    padding: '2px 8px', border: `1px solid ${user.mfa_enabled ? '#bbf7d0' : '#e4e4e7'}`,
                    color: user.mfa_enabled ? '#16a34a' : '#71717a',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: user.mfa_enabled ? '#f0fdf4' : 'transparent',
                  }}>
                    {user.mfa_enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div style={{ flexShrink: 0 }}>
              {user.mfa_enabled ? (
                <button
                  onClick={handleDisableMFA}
                  disabled={loading}
                  style={{
                    padding: '8px 16px', border: '1px solid #fecaca', background: 'none',
                    color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                    borderRadius: 0, opacity: loading ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Disable 2FA
                </button>
              ) : !mfaUri && (
                <button
                  onClick={handleEnrollMFA}
                  disabled={loading}
                  style={{
                    padding: '8px 16px', background: '#18181b', color: '#ffffff',
                    border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                    borderRadius: 0, opacity: loading ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={13} />}
                  Set up 2FA
                </button>
              )}
            </div>
          </div>

          {/* ── QR Code + Verify Step ── */}
          {mfaUri && !user.mfa_enabled && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e4e4e7' }}>
              <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                Step 1 — Scan this QR code with Google Authenticator / Authy
              </p>

              <div style={{ display: 'flex', flexDirection: 'row', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* QR Code */}
                <div style={{
                  padding: '1.25rem', background: '#ffffff',
                  border: '2px solid #18181b', display: 'inline-block',
                }}>
                  <QRCodeSVG value={mfaUri} size={160} level="M" />
                </div>

                {/* Verify section */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                    Step 2 — Enter the 6-digit code from your app
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      style={{
                        width: '130px', padding: '10px', textAlign: 'center',
                        fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.25em',
                        border: '1px solid #d4d4d8', outline: 'none', borderRadius: 0,
                        color: '#18181b', background: '#ffffff',
                      }}
                      onFocus={e => e.target.style.borderColor = '#18181b'}
                      onBlur={e => e.target.style.borderColor = '#d4d4d8'}
                    />
                    <button
                      onClick={handleActivateMFA}
                      disabled={loading || verificationCode.length !== 6}
                      style={{
                        padding: '10px 20px', background: '#18181b', color: '#ffffff',
                        border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                        borderRadius: 0, opacity: (loading || verificationCode.length !== 6) ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                      Verify & Enable
                    </button>
                  </div>
                  <button
                    onClick={() => { setMfaUri(null); setVerificationCode(''); }}
                    style={{
                      marginTop: '1rem', background: 'none', border: 'none',
                      color: '#71717a', cursor: 'pointer', fontSize: '12px',
                      textDecoration: 'underline', padding: 0,
                    }}
                  >
                    Cancel setup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Info note ── */}
        {!user.mfa_enabled && !mfaUri && (
          <div style={{
            marginTop: '1rem', padding: '0.875rem 1rem',
            background: '#fafafa', border: '1px solid #e4e4e7',
            fontSize: '12px', color: '#71717a', lineHeight: '1.6',
          }}>
            💡 <strong>Recommended:</strong> Enable 2FA to protect this account against unauthorised access.
            Works with Google Authenticator, Authy, or any TOTP-compatible app.
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
