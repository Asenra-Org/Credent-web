import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Activity, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasAnyRole } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showDashboard = hasAnyRole(['UNDERWRITING_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN']);
  const showAdmin = hasAnyRole(['ORG_ADMIN', 'SUPER_ADMIN']);

  return (
    <nav style={{
      background: '#2c3540',
      color: '#ffffff',
      height: '52px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #3f4a57',
      padding: '0 1.25rem',
      fontSize: '13px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <Activity size={18} color="#10b981" />
          <span style={{ fontSize: '15px' }}>Credent</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/engine" style={{ color: location.pathname === '/engine' ? '#ffffff' : '#8a99a8', textDecoration: 'none', fontWeight: location.pathname === '/engine' ? 600 : 400 }}>Engine</Link>
          {showDashboard && (
            <Link to="/dashboard" style={{ color: location.pathname === '/dashboard' ? '#ffffff' : '#8a99a8', textDecoration: 'none', fontWeight: location.pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
          )}
          {showAdmin && (
            <Link to="/admin" style={{ color: location.pathname === '/admin' ? '#ffffff' : '#8a99a8', textDecoration: 'none', fontWeight: location.pathname === '/admin' ? 600 : 400 }}>Admin</Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px', fontFamily: 'monospace' }}>
            <span style={{ color: '#8a99a8' }}>{user.email}</span>
            <span style={{ 
              background: '#0d213f', 
              padding: '2px 6px', 
              borderRadius: '2px',
              border: '1px solid #1a365d'
            }}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}
        <button 
          onClick={handleLogout}
          style={{ 
            background: 'transparent',
            border: 'none',
            color: '#8a99a8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}