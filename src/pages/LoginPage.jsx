import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Loader2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaChallenge, setMfaChallenge] = useState(null);
  
  const { login, verifyMfa, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleDefaultRoute = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return '/platform';
      case 'ORG_ADMIN': return '/admin';
      case 'UNDERWRITING_MANAGER': return '/dashboard';
      case 'CREDIT_ANALYST': return '/engine';
      case 'VIEWER': return '/reports';
      default: return '/engine';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (mfaChallenge) {
        await verifyMfa(mfaChallenge, mfaCode);
        const user = useAuthStore.getState().user;
        const targetRoute = location.state?.from?.pathname || getRoleDefaultRoute(user?.role);
        navigate(targetRoute, { replace: true });
      } else {
        const result = await login(email, password);
        if (result.mfa_required) {
          setMfaChallenge(result.challenge_token);
        } else {
          const user = useAuthStore.getState().user;
          const targetRoute = location.state?.from?.pathname || getRoleDefaultRoute(user?.role);
          navigate(targetRoute, { replace: true });
        }
      }
    } catch (err) {
      // Error is handled in store and displayed below
    }
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
      fontFamily: 'var(--font-family)',
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: '#ffffff',
      border: '1px solid #e4e4e7',
    },
    header: {
      padding: '2.5rem 2rem 2rem',
      borderBottom: '1px solid #e4e4e7',
      textAlign: 'center',
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: 300,
      letterSpacing: '-0.025em',
      color: '#18181b',
      margin: 0,
    },
    subtitle: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#71717a',
      marginTop: '0.5rem',
    },
    body: {
      padding: '2rem',
    },
    errorBox: {
      marginBottom: '1.5rem',
      padding: '1rem',
      border: '1px solid #fecaca',
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      fontSize: '13px',
    },
    fieldGroup: {
      marginBottom: '1.25rem',
    },
    label: {
      display: 'block',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#71717a',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e4e4e7',
      borderRadius: 0,
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.15s',
      backgroundColor: '#fff',
      color: '#18181b',
      boxSizing: 'border-box',
    },
    mfaInput: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e4e4e7',
      borderRadius: 0,
      fontSize: '1.25rem',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.5em',
      textAlign: 'center',
      outline: 'none',
      transition: 'border-color 0.15s',
      backgroundColor: '#fff',
      color: '#18181b',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#18181b',
      color: '#ffffff',
      border: 'none',
      borderRadius: 0,
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '1.5rem',
      transition: 'background-color 0.15s',
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    footer: {
      padding: '1.25rem 2rem',
      borderTop: '1px solid #e4e4e7',
      textAlign: 'center',
    },
    footerText: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#a1a1aa',
      margin: 0,
    },
    icon: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '1rem',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        
        <div style={styles.header}>
          <div style={{ ...styles.icon, display: 'flex', justifyContent: 'center', marginBottom: '1rem', border: 'none', background: 'transparent' }}>
            <img src="/Credent_LOGO.png" alt="CRESEM Logo" style={{ height: '48px', objectFit: 'contain' }} />
          </div>
          <h1 style={styles.title}>CRESEM</h1>
          <p style={styles.subtitle}>Institutional Access</p>
        </div>
        
        <div style={styles.body}>
          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}
          
          <form onSubmit={handleLogin}>
            {!mfaChallenge ? (
              <>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#18181b'}
                    onBlur={(e) => e.target.style.borderColor = '#e4e4e7'}
                  />
                </div>
                
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#18181b'}
                    onBlur={(e) => e.target.style.borderColor = '#e4e4e7'}
                  />
                </div>
              </>
            ) : (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>MFA Verification Code</label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  placeholder="000000"
                  maxLength={6}
                  style={styles.mfaInput}
                  onFocus={(e) => e.target.style.borderColor = '#18181b'}
                  onBlur={(e) => e.target.style.borderColor = '#e4e4e7'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.backgroundColor = '#27272a'; }}
              onMouseLeave={(e) => { if (!isLoading) e.target.style.backgroundColor = '#18181b'; }}
            >
              {isLoading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                mfaChallenge ? 'Verify' : 'Sign In'
              )}
            </button>
          </form>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>CRESEM &middot; Asenra &middot; Secure Access</p>
        </div>
      </div>
    </div>
  );
}
