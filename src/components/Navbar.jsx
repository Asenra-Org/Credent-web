import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar({ currentView, setCurrentView, theme, toggleTheme }) {
  const views = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How it Works' },
    { id: 'security', label: 'Security' }
  ];

  return (
    <nav className="navbar">
      <motion.div 
        className="nav-brand" 
        onClick={() => setCurrentView('home')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ 
          background: 'var(--teal-glow)', 
          padding: '6px', 
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--teal-glow)'
        }}>
          <Activity color="var(--teal)" size={18} />
        </div>
        <span style={{ fontWeight: 800 }}>IntelliAssess</span>
      </motion.div>

      <div className="nav-links">
        {views.map((v) => (
          <motion.span
            key={v.id}
            className={`nav-link ${currentView === v.id ? 'active' : ''}`}
            onClick={() => setCurrentView(v.id)}
            style={{ position: 'relative' }}
            whileHover={{ color: 'var(--text-primary)' }}
          >
            {currentView === v.id && (
              <motion.div
                layoutId="active-nav"
                className="nav-link-bg"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--navy)',
                  borderRadius: '9999px',
                  zIndex: -1,
                  boxShadow: '0 4px 12px rgba(9, 9, 11, 0.2)'
                }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{v.label}</span>
          </motion.span>
        ))}

        <motion.span
          className="nav-link"
          onClick={() => setCurrentView('manager')}
          style={{ cursor: 'pointer', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--teal)', marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          whileHover={{ opacity: 0.8 }}
        >
          <ShieldCheck size={14} /> Institutional Portal
        </motion.span>

        <ThemeToggle isDark={theme === 'dark'} onToggle={toggleTheme} />
      </div>

      <motion.button 
        className="btn-primary" 
        onClick={() => setCurrentView('engine')}
        style={{ padding: '0.625rem 1.5rem', fontSize: '0.8125rem' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Zap size={14} /> Launch Engine
      </motion.button>
    </nav>
  );
}