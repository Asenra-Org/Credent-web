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
import { motion } from 'framer-motion';
import { FileUp, GitCompare, Award, Zap } from 'lucide-react';

const steps = [
  { num: '01', icon: FileUp, title: 'Ingest & Extract', desc: 'Drop a corporate dossier into the Analysis Engine. The Ingestion Agent extracts financial commitments, legal risks, and operational data using PyPDF2 and Tesseract OCR.', color: 'var(--teal)' },
  { num: '02', icon: GitCompare, title: 'Enrich & Cross-Validate', desc: 'The pipeline parallelizes. One agent validates tax filings against banking statements while another crawls the web for litigation signals and sector headwinds.', color: 'var(--indigo)' },
  { num: '03', icon: Award, title: 'Synthesize & Recommend', desc: 'The Master Orchestrator synthesizes all sub-agent outputs, calculates a dynamic risk premium, writes a decision rationale, and compiles the final PDF Credit Appraisal Memo.', color: 'var(--emerald)' }
];

export default function HowItWorksPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="landing-wrapper" style={{ paddingBottom: '8rem', minHeight: 'auto' }}
    >
      <div className="section-header">
        <motion.div className="hero-pill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} /> PIPELINE
        </motion.div>
        <h2 className="section-title">The Anatomy of a Decision</h2>
        <p className="section-subtitle">Watch how raw, unstructured data transforms into actionable credit intelligence in under 60 seconds.</p>
      </div>

      <div className="steps-wrapper">
        {steps.map((step, i) => (
          <motion.div
            key={step.num} className="step-item"
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            whileHover={{ x: 6 }}
          >
            <div className="step-number" style={{ color: step.color, opacity: 0.2 }}>{step.num}</div>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${step.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: step.color }}>
              <step.icon size={20} />
            </div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Pipeline Indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        style={{ marginTop: '3rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontWeight: 600 }}
      >
        <span style={{ width: '40px', height: '1px', background: 'var(--border-emphasis)' }} />
        PDF Upload → AI Extraction → Integrity Check → Web Research → Score Adjustment → CAM Generation
        <span style={{ width: '40px', height: '1px', background: 'var(--border-emphasis)' }} />
      </motion.div>
    </motion.div>
  );
}