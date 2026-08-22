import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Shield, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ requiredRoles }) {
  const { isAuthenticated, user, refresh, hasAnyRole } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          await refresh();
        } catch (err) {
          // Not authenticated
        }
      }
      setIsChecking(false);
    };
    checkAuth();
  }, [isAuthenticated, refresh]);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wrapper: {
      textAlign: 'center',
    },
    deniedBox: {
      textAlign: 'center',
      border: '1px solid #e4e4e7',
      padding: '3rem',
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 300,
      letterSpacing: '-0.025em',
      color: '#18181b',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#71717a',
    }
  };

  if (isChecking) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <Loader2 size={24} color="#a1a1aa" style={{ margin: '0 auto 0.75rem auto', animation: 'spin 1s linear infinite' }} />
          <p style={styles.subtitle}>Verifying Session</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      <div style={styles.container}>
        <div style={styles.deniedBox}>
          <Shield size={32} color="#d4d4d8" style={{ margin: '0 auto 1rem auto' }} strokeWidth={1.5} />
          <h1 style={styles.title}>Access Denied</h1>
          <p style={styles.subtitle}>Insufficient permissions for this resource</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
