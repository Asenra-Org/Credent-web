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
import { BrainCircuit, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import AnimatedBeamWorkflow from './AnimatedBeamWorkflow';
import VideoText from './VideoText';
import Globe from './Globe';

export default function LandingPage({ onEnterEngine }) {
  return (
    <div style={{ position: 'relative' }}>

      {/* ══════════════════════════════════════════
          GLOBE — fixed center background
          Sits behind everything via z-index & opacity
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        opacity: 0.5,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <Globe size={1000} />
      </div>

      {/* ══════════════════════════════════════════
          ALL CONTENT — layered above the globe
      ══════════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══ Hero Section ═══ */}
        <div style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '8rem 4rem 5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(6,182,212,0.3)',
                color: 'var(--teal-dark)',
                padding: '6px 18px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '2rem',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', boxShadow: '0 0 6px var(--teal)' }} />
              AI-Powered Credit Intelligence
            </motion.div>

            {/* Title */}
            <div style={{ width: '100%', maxWidth: '700px' }}>
              <VideoText
                src="https://cdn.magicui.design/ocean-small.webm"
                fontSize="clamp(3rem, 5.5vw, 5rem)"
                fontWeight={900}
              >
                Credit Appraisal<br />Engine
              </VideoText>
            </div>

            {/* Subtitle */}
            <p style={{
              marginTop: '1.75rem',
              color: 'var(--text-secondary)',
              fontSize: '1.15rem',
              lineHeight: '1.75',
              maxWidth: '520px',
            }}>
              Autonomous AI agents for institutional-grade credit synthesis and risk intelligence.
            </p>

            {/* CTA */}
            <div style={{ marginTop: '2.5rem' }}>
              <button className="btn-primary pulse-glow" onClick={onEnterEngine}>
                Launch Analysis Console <ArrowRight size={18} />
              </button>
            </div>

            {/* Stat pills */}
            {/* <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              style={{
                display: 'flex',
                gap: '1.25rem',
                marginTop: '4rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {[
                { value: '10x', label: 'Faster Turnaround' },
                { value: '100+', label: 'Risk Vectors' },
                { value: 'Zero', label: 'Manual Mapping' },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '14px',
                  padding: '1rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '120px',
                }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--teal)', lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </motion.div> */}
          </motion.div>
        </div>

        {/* ═══ Stats + Pipeline Architecture ═══ */}
        <section style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '4rem 4rem 5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          flexWrap: 'wrap',
        }}>
          {/* Left: heading + stats */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{
              flex: '1 1 280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
              Institutional Credit Logic
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left', marginBottom: '3rem' }}>
              A multi-agent system designed to dismantle the Data Paradox in corporate lending.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
              {[
                { v: '10x', l: 'Faster Turnaround' },
                { v: '100+', l: 'Risk Vectors Analyzed' },
                { v: 'Zero', l: 'Manual Data Mapping' },
              ].map(({ v, l }) => (
                <motion.div key={l} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                  <div className="stat-number">{v}</div>
                  <div className="stat-label">{l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: pipeline diagram */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            style={{
              flex: '2 1 540px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p style={{
              fontSize: '0.625rem',
              fontWeight: 800,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '1.5rem',
            }}>Core Pipeline Architecture</p>
            <div style={{ width: '100%', transform: 'scale(1.15)', transformOrigin: 'center center' }}>
              <AnimatedBeamWorkflow />
            </div>
          </motion.div>
        </section>

        {/* ═══ Bento Grid ═══ */}
        <div className="landing-wrapper" style={{ minHeight: 'auto', paddingTop: '2rem' }}>
          <div className="bento-grid">
            <motion.div className="bento-item bento-large">
              <div>
                <div className="bento-icon" style={{ background: 'var(--teal-glow)', color: 'var(--teal)' }}><BrainCircuit size={26} /></div>
                <h3 className="bento-title">Five Cs Synthesis</h3>
                <p className="bento-desc">Full narrative analysis covering Character, Capacity, Capital, Collateral, and Conditions.</p>
              </div>
            </motion.div>

            <motion.div className="bento-item bento-square">
              <div className="bento-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)' }}><FileText size={22} /></div>
              <div>
                <h3 className="bento-title">OCR Intelligence</h3>
                <p className="bento-desc">Deep extraction from unstructured PDF documents.</p>
              </div>
            </motion.div>

            <motion.div className="bento-item bento-square">
              <div className="bento-icon" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--rose)' }}><ShieldCheck size={22} /></div>
              <div>
                <h3 className="bento-title">Integrity Verification</h3>
                <p className="bento-desc">GST vs Bank cross-validation for fraud detection.</p>
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ height: '6rem' }} />
      </div>
    </div>
  );
}