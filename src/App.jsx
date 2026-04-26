/**
 * ============================================================
 *  CREDENT — AI Credit Appraisal Engine
 *  © 2025 Asenra. All Rights Reserved.
 *  https://asenra.in
 *
 *  This source code is the exclusive intellectual property of
 *  Asenra. Unauthorized reproduction, distribution, or use
 *  of this code, in whole or in part, is strictly prohibited.
 * ============================================================
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Component Imports
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import FeaturesPage from './components/FeaturesPage';
import HowItWorksPage from './components/HowItWorksPage';
import SecurityPage from './components/SecurityPage';
import EngineView from './components/EngineView';
import ManagerDashboard from './components/ManagerDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState(() => sessionStorage.getItem('credent_view') || 'home');
  const [theme, setTheme] = useState(() => localStorage.getItem('credent_theme') || 'light');

  // Handle Theme Persistence
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('credent_theme', theme);
  }, [theme]);

  // Session Management (Cookie)
  useEffect(() => {
    const hasSession = document.cookie.split('; ').find(row => row.startsWith('credent_session='));
    if (!hasSession) {
      const expiry = new Date();
      expiry.setTime(expiry.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1 day
      document.cookie = `credent_session=active; expires=${expiry.toUTCString()}; path=/; SameSite=Strict`;
    }
  }, []);

  // Scroll to top on view change, and save state to sessionStorage
  useEffect(() => {
    window.scrollTo(0, 0);
    sessionStorage.setItem('credent_view', currentView);
  }, [currentView]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (currentView === 'engine') {
    return <EngineView onExit={() => setCurrentView('home')} theme={theme} toggleTheme={toggleTheme} onSwitchToManager={() => setCurrentView('manager')} />;
  }

  if (currentView === 'manager') {
    return <ManagerDashboard theme={theme} onExit={() => setCurrentView('home')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="aurora-bg"></div>

      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'home' && <LandingPage onEnterEngine={() => setCurrentView('engine')} />}
            {currentView === 'features' && <FeaturesPage />}
            {currentView === 'how-it-works' && <HowItWorksPage />}
            {currentView === 'security' && <SecurityPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer setCurrentView={setCurrentView} />
    </div>
  );
}