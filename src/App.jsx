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
import React, { useEffect } from 'react';
import EngineView from './components/EngineView';

export default function App() {
  // Force Light Theme for Institutional Banking Style
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return <EngineView />;
}