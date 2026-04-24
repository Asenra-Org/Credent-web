import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, EyeOff, Server, Key, Landmark } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } })
};

const securities = [
  { icon: EyeOff, title: 'Zero-Retention Documents', desc: 'PDF files are never persistently stored. They are written to a temporary directory strictly during ingestion and permanently deleted the moment the text is extracted.', color: 'var(--navy)', bg: 'rgba(15, 23, 42, 0.08)' },
  { icon: Server, title: 'Local-First Audit Trail', desc: 'All parsed financial data and AI rationales are saved to a dedicated, localized SQLite database instead of third-party cloud analytics platforms.', color: 'var(--emerald)', bg: 'rgba(16, 185, 129, 0.1)' },
  { icon: ShieldCheck, title: 'Stateless AI Inference', desc: 'We strictly utilize API-based LLMs configured for zero-data retention, ensuring your sensitive financial information is never used for model training.', color: 'var(--teal)', bg: 'var(--teal-glow)' },
  { icon: Lock, title: 'Transport Security (TLS 1.3)', desc: 'All API traffic between the frontend interface and our processing backend is strictly encrypted in transit via industry-standard HTTPS protocols.', color: 'var(--indigo)', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: Landmark, title: 'Sovereign Dependencies', desc: 'Our critical extraction logic (like OCR and PDF parsing) runs directly on the backend server, completely isolated from external indexing engines.', color: 'var(--rose)', bg: 'rgba(244, 63, 94, 0.1)' },
  { icon: Key, title: 'Client-Side Session State', desc: 'Your frontend navigation and dark-mode preferences are secured locally using strict browser storage, preventing unauthorized cross-tab data leakage.', color: 'var(--amber)', bg: 'rgba(245, 158, 11, 0.1)' }
];

export default function SecurityPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="landing-wrapper" style={{ paddingBottom: '6rem', minHeight: 'auto' }}
    >
      <div className="section-header">
        <motion.div className="hero-pill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={14} /> TRANSPARENT SECURITY
        </motion.div>
        <h2 className="section-title">Practical, Built-In Privacy</h2>
        <p className="section-subtitle">We believe in transparent, pragmatic security. Here's exactly how we protect your data right now, without the buzzwords.</p>
      </div>

      <div className="features-grid">
        {securities.map((s, i) => (
          <motion.div key={i} className="feature-card" custom={i} initial="hidden" animate="visible" variants={cardVariants} whileHover={{ y: -4 }}>
            <div className="feature-icon-wrapper" style={{ background: s.bg, borderColor: 'transparent', color: s.color }}>
              <s.icon size={20} />
            </div>
            <h3 className="feature-title">{s.title}</h3>
            <p className="feature-desc">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}