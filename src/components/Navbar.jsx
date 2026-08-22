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

  const getRoleLinks = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [{ path: '/platform', label: 'Platform Console' }];
      case 'ORG_ADMIN':
        return [{ path: '/admin', label: 'User Management' }];
      case 'UNDERWRITING_MANAGER':
        return [
          { path: '/dashboard', label: 'Pending Approvals' },
          { path: '/portfolio', label: 'Portfolio Overview' }
        ];
      case 'CREDIT_ANALYST':
        return [
          { path: '/engine', label: 'New Case (Engine)' },
          { path: '/my-cases', label: 'My Cases' }
        ];
      case 'VIEWER':
        return [{ path: '/reports', label: 'Reports Archive' }];
      default:
        return [];
    }
  };

  const navLinks = getRoleLinks(user?.role);

  return (
    <nav style={{
      background: '#18181b', // Zinc 900
      color: '#ffffff',
      height: '52px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #27272a', // Zinc 800
      padding: '0 1.25rem',
      fontSize: '13px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <Activity size={18} color="#ffffff" />
          <span style={{ fontSize: '15px' }}>Credent</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              style={{ 
                color: location.pathname === link.path ? '#ffffff' : '#a1a1aa', 
                textDecoration: 'none', 
                fontWeight: location.pathname === link.path ? 600 : 400 
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px', fontFamily: 'monospace' }}>
            <span style={{ color: '#a1a1aa' }}>{user.email}</span>
            <span style={{ 
              background: '#27272a', // Zinc 800
              padding: '2px 6px', 
              borderRadius: '0px',
              border: '1px solid #3f3f46' // Zinc 700
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
            color: '#a1a1aa',
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