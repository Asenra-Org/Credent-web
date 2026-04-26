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
import React from 'react';
import { Activity } from 'lucide-react';

export default function Footer({ setCurrentView }) {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div>
          <div className="nav-brand" style={{ marginBottom: '1rem', cursor: 'default' }}>
            <Activity color="var(--teal)" size={20} /> Credent
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.65', maxWidth: '300px' }}>
            Autonomous credit decisioning engine for the modern financial ecosystem.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Navigation</div>
          <span className="footer-link" onClick={() => setCurrentView('home')}>Home</span>
          <span className="footer-link" onClick={() => setCurrentView('features')}>Features</span>
          <span className="footer-link" onClick={() => setCurrentView('how-it-works')}>How it Works</span>
          <span className="footer-link" onClick={() => setCurrentView('security')}>Security</span>
        </div>

        <div>
          <div className="footer-col-title">Tools</div>
          <span className="footer-link" onClick={() => setCurrentView('engine')}>Launch Engine</span>
          <div className="footer-col-title" style={{ marginTop: '1.5rem' }}>Access</div>
          <span className="footer-link" onClick={() => setCurrentView('manager')} style={{ color: 'var(--teal)', fontWeight: '700' }}>Institutional Portal</span>
        </div>
      </div>

      <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>&copy; {new Date().getFullYear()} Credent by Asenra. Institutional Grade Analysis.</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Built by <a href="https://asenra.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', fontWeight: '700', textDecoration: 'none' }}>Asenra</a> — Digital Infrastructure for SMBs
        </div>
      </div>
    </footer>
  );
}