import React from 'react';
import { motion } from 'framer-motion';
import { Upload, ShieldCheck, Search, BrainCircuit, FileText, History } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } })
};

const features = [
  { icon: Upload, title: 'Multi-Modal Ingestion', desc: 'Upload everything from perfectly formatted digital annual reports to blurry, scanned balance sheets. Our hybrid OCR engine reads it all.', color: 'var(--teal)', bg: 'var(--teal-glow)' },
  { icon: ShieldCheck, title: 'Deterministic Integrity', desc: "We don't rely purely on LLM hallucinations for math. Hardcoded deterministic algorithms cross-validate GST returns against core banking data.", color: 'var(--rose)', bg: 'rgba(244, 63, 94, 0.1)' },
  { icon: Search, title: 'Live OSINT Forensics', desc: 'Our AI crawls the live internet via DuckDuckGo to uncover active litigation, federal notices, and macro-economic sector shifts in real time.', color: 'var(--amber)', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: BrainCircuit, title: 'Human-in-the-Loop', desc: 'Inject qualitative field officer notes directly. The AI dynamically weighs human context against hard financial data to adjust the risk score.', color: 'var(--indigo)', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: FileText, title: 'Boardroom-Ready CAMs', desc: "Generate strictly formatted, downloadable PDF Credit Appraisal Memos structured around the fundamental Five C's of Credit.", color: 'var(--emerald)', bg: 'rgba(16, 185, 129, 0.1)' },
  { icon: History, title: 'Immutable Audit Trail', desc: 'Every AI extraction, decision rationale, and telemetry log is saved persistently, ensuring complete regulatory compliance and explainability.', color: 'var(--violet)', bg: 'rgba(139, 92, 246, 0.1)' }
];

export default function FeaturesPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="landing-wrapper" style={{ paddingBottom: '6rem', minHeight: 'auto' }}
    >
      <div className="section-header">
        <motion.div className="hero-pill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          ✦ CAPABILITIES
        </motion.div>
        <h2 className="section-title">Enterprise-Grade Capabilities</h2>
        <p className="section-subtitle">IntelliAssess isn't just a wrapper. It's a multi-agent orchestrated pipeline designed for the complexities of corporate lending.</p>
      </div>

      <div className="features-grid">
        {features.map((f, i) => (
          <motion.div key={i} className="feature-card" custom={i} initial="hidden" animate="visible" variants={cardVariants} whileHover={{ y: -4 }}>
            <div className="feature-icon-wrapper" style={{ background: f.bg, borderColor: 'transparent', color: f.color }}>
              <f.icon size={20} />
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}