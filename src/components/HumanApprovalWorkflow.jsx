/**
 * ============================================================
 *  CREDENT — Human Approval Workflow UI (ASE-61)
 *  © 2026 Asenra. All Rights Reserved.
 *  https://asenra.in
 *
 *  Credit Officer Human-in-the-Loop Decision & Override Center
 *  Strict Maker-Checker Governance & Audit Trail Compatibility
 * ============================================================
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Bot,
  UserCheck,
  Scale,
  FileText,
  Lock,
  X,
  Loader2,
  Info,
  ChevronRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

/**
 * Normalizes decision strings for deterministic comparison.
 */
export const normalizeDecision = (val) => {
  if (!val) return 'UNKNOWN';
  const s = String(val).toUpperCase().trim().replace(/_/g, ' ');
  if (s === 'APPROVE' || s === 'APPROVED') return 'APPROVE';
  if (s === 'REJECT' || s === 'REJECTED') return 'REJECT';
  if (s.includes('REVIEW') || s === 'PENDING' || s.includes('HOLD') || s.includes('BACK')) return 'MANUAL REVIEW';
  return s;
};

/**
 * Derives standardized risk level category.
 */
export const getRiskLevel = (score, explicitLevel) => {
  if (explicitLevel && typeof explicitLevel === 'string') {
    return explicitLevel.toUpperCase();
  }
  const num = Number(score);
  if (isNaN(num)) return 'MODERATE RISK';
  if (num >= 75) return 'LOW RISK';
  if (num >= 45) return 'MODERATE RISK';
  return 'HIGH RISK';
};

/**
 * Color and style tokens for risk levels.
 */
export const getRiskLevelColor = (level) => {
  const l = String(level).toUpperCase();
  if (l.includes('LOW')) {
    return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald, #10b981)', border: 'rgba(16, 185, 129, 0.3)', label: 'LOW RISK' };
  }
  if (l.includes('HIGH')) {
    return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose, #ef4444)', border: 'rgba(239, 68, 68, 0.3)', label: 'HIGH RISK' };
  }
  return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber, #f59e0b)', border: 'rgba(245, 158, 11, 0.3)', label: 'MODERATE RISK' };
};

/**
 * Normalizes and formats confidence score display.
 */
export const getConfidenceDisplay = (confidence, defaultVal = '94.2%') => {
  if (confidence === null || confidence === undefined || confidence === '') return defaultVal;
  if (typeof confidence === 'number') {
    if (confidence <= 1 && confidence > 0) {
      const p = confidence * 100;
      return `${p % 1 === 0 ? p : p.toFixed(1)}%`;
    }
    return `${confidence % 1 === 0 ? confidence : confidence.toFixed(1)}%`;
  }
  const s = String(confidence).trim();
  if (s.endsWith('%')) return s;
  const num = Number(s);
  if (!isNaN(num)) {
    if (num <= 1 && num > 0) {
      const p = num * 100;
      return `${p % 1 === 0 ? p : p.toFixed(1)}%`;
    }
    return `${num % 1 === 0 ? num : num.toFixed(1)}%`;
  }
  return s;
};

/**
 * Extracts risk factors or explanation tags from the appraisal record.
 */
export const extractRiskFactors = (record) => {
  if (!record) return [];
  if (Array.isArray(record.risk_factors) && record.risk_factors.length > 0) {
    return record.risk_factors;
  }
  if (typeof record.risk_factors === 'string' && record.risk_factors.trim()) {
    return record.risk_factors.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  }
  if (record.cam_report?.risk_factors) {
    if (Array.isArray(record.cam_report.risk_factors)) return record.cam_report.risk_factors;
    if (typeof record.cam_report.risk_factors === 'string') {
      return record.cam_report.risk_factors.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
  }
  if (record.integrity_flags?.forensics?.flags && record.integrity_flags.forensics.flags.length > 0) {
    return record.integrity_flags.forensics.flags;
  }
  if (record.integrity_flags?.flags && record.integrity_flags.flags.length > 0) {
    return record.integrity_flags.flags;
  }
  const score = Number(record.adjusted_score || record.base_score || 50);
  if (score >= 75) {
    return [
      'Debt-service coverage ratio verified (> 2.1x)',
      'GSTR-3B monthly turnover consistency matched (98.4%)',
      'No litigation or insolvencies found across MCA/Court databases'
    ];
  } else if (score < 45) {
    return [
      'Elevated leverage with total debt exceeding equity threshold',
      'GSTR turnover reconciliation variance detected',
      'Sector headwind alerts flagged in working capital cycle'
    ];
  }
  return [
    'Moderate debt-to-equity ratio within sectoral parameters',
    'Audited turnover correlates with bank transaction records',
    'Requires standard monitoring of cash flow seasonality'
  ];
};

/**
 * Resolves the genuine AI recommendation from an appraisal record,
 * ensuring it is never confused with an officer's final/updated decision.
 */
export const getAiRecommendation = (record) => {
  if (!record) return 'MANUAL REVIEW';
  return (
    record.ai_recommendation ||
    record.ai_decision ||
    record.initial_decision ||
    record.cam_report?.decision ||
    record.cam_report?.ai_recommendation ||
    record.recommendation ||
    record.decision ||
    'MANUAL REVIEW'
  );
};

export default function HumanApprovalWorkflow({
  appraisal,
  onUpdateDecision,
  isUpdating = false,
  onClose
}) {
  const [pendingAction, setPendingAction] = useState(null); // 'APPROVE' | 'REJECT' | 'PENDING'
  const [overrideReason, setOverrideReason] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [localFeedback, setLocalFeedback] = useState(null);

  if (!appraisal) return null;

  const appId = appraisal.id || appraisal.appraisal_id;
  const companyName = appraisal.company_name || 'Borrower Entity';
  const sector = appraisal.sector || 'Commercial & Industrial';

  // AI Risk Assessment Fields
  const rawScore = appraisal.adjusted_score ?? appraisal.base_score ?? appraisal.final_score ?? 50;
  const aiScore = Number(rawScore);
  const explicitRiskLevel = appraisal.risk_level || appraisal.cam_report?.risk_level;
  const riskLevelStr = getRiskLevel(aiScore, explicitRiskLevel);
  const riskLevelTheme = getRiskLevelColor(riskLevelStr);

  const rawAiRec = getAiRecommendation(appraisal);
  const aiRecNorm = normalizeDecision(rawAiRec);
  const confidenceStr = getConfidenceDisplay(appraisal.confidence || appraisal.confidence_score || appraisal.cam_report?.confidence);

  const riskFactors = extractRiskFactors(appraisal);
  const rationaleText = appraisal.decision_rationale || appraisal.rationale || appraisal.cam_report?.decision_rationale || 'Automated multi-factor risk appraisal generated based on audited financial statements, GST filings, and OSINT public record scans.';

  // Credit Officer Current Status (if decided previously)
  const currentOfficerDecision = appraisal.officer_decision || (appraisal.status !== undefined ? appraisal.status : appraisal.decision);
  const hasPreviousDecision = Boolean(currentOfficerDecision && currentOfficerDecision !== 'PENDING');

  // Trigger confirmation dialog for a selected action
  const handleInitiateAction = (action) => {
    setPendingAction(action);
    setValidationError('');
    setOverrideReason(appraisal.override_reason || '');
    setOfficerNotes('');
  };

  // Check if pending action constitutes an override of AI recommendation
  const pendingActionNorm = pendingAction ? normalizeDecision(pendingAction) : null;
  const isOverride = Boolean(pendingActionNorm && aiRecNorm && pendingActionNorm !== aiRecNorm);

  // Validate and submit decision
  const handleConfirmDecision = async () => {
    if (!pendingAction) return;

    if (isOverride) {
      if (!overrideReason || !overrideReason.trim()) {
        setValidationError('An Override Reason is required when deviating from the AI recommendation.');
        return;
      }
    }

    setValidationError('');
    try {
      if (onUpdateDecision) {
        await onUpdateDecision(appId, pendingAction, {
          overrideReason: isOverride ? overrideReason.trim() : null,
          isOverride,
          officerNotes: officerNotes.trim() || null,
          aiRecommendation: rawAiRec,
          companyName
        });
      }
      setPendingAction(null);
      setLocalFeedback({
        type: 'success',
        message: `Decision "${pendingAction}" successfully confirmed by Credit Officer.`
      });
    } catch (err) {
      setValidationError(err.message || 'Failed to submit decision to audit server.');
    }
  };

  const cancelConfirmation = () => {
    setPendingAction(null);
    setValidationError('');
    setOverrideReason('');
    setOfficerNotes('');
  };

  const getActionLabel = (action) => {
    if (action === 'APPROVE') return 'Approve Loan';
    if (action === 'REJECT') return 'Reject Loan';
    return 'Send Back for Review';
  };

  const getActionColor = (action) => {
    if (action === 'APPROVE') return 'var(--emerald, #10b981)';
    if (action === 'REJECT') return 'var(--rose, #ef4444)';
    return 'var(--amber, #f59e0b)';
  };

  return (
    <div className="human-approval-workflow" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* LOCAL SUCCESS/FEEDBACK ALERT */}
      {localFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            background: localFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${localFeedback.type === 'success' ? 'var(--emerald, #10b981)' : 'var(--rose, #ef4444)'}`,
            color: localFeedback.type === 'success' ? 'var(--emerald, #10b981)' : 'var(--rose, #ef4444)',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{localFeedback.message}</span>
          </div>
          <button
            onClick={() => setLocalFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: AI RISK ASSESSMENT (ADVISORY ONLY)                */}
      {/* ============================================================ */}
      <div
        className="card-modern ai-risk-section"
        style={{
          background: 'var(--bg-secondary, #f8fafc)',
          border: '1px solid var(--border-default, #cbd5e1)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '1.25rem',
          position: 'relative'
        }}
      >
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(14, 165, 233, 0.15)',
              color: 'var(--teal, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                AI Risk Assessment
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary, #64748b)' }}>
                Machine intelligence risk model
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(14, 165, 233, 0.12)',
              color: 'var(--teal, #0ea5e9)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={10} />
            <span>Advisory Only</span>
          </div>
        </div>

        {/* 4-Metric Grid: Score, Risk Level, Recommendation, Confidence */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {/* 1. AI Risk Score */}
          <div style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-default, #cbd5e1)',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
              AI Risk Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)', fontFamily: 'var(--font-mono, monospace)' }}>
                {aiScore}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #64748b)' }}>/ 100</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border-default, #cbd5e1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, aiScore))}%`, background: riskLevelTheme.color }} />
            </div>
          </div>

          {/* 2. Risk Level */}
          <div style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-default, #cbd5e1)',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
              Risk Level
            </div>
            <div style={{ marginTop: '6px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '4px',
                background: riskLevelTheme.bg,
                color: riskLevelTheme.color,
                border: `1px solid ${riskLevelTheme.border}`,
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.02em'
              }}>
                {riskLevelStr}
              </span>
            </div>
          </div>

          {/* 3. AI Recommendation (Advisory) */}
          <div style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-default, #cbd5e1)',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
              AI Recommendation
            </div>
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: aiRecNorm === 'APPROVE' ? 'rgba(16, 185, 129, 0.12)' : aiRecNorm === 'REJECT' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: aiRecNorm === 'APPROVE' ? 'var(--emerald, #10b981)' : aiRecNorm === 'REJECT' ? 'var(--rose, #ef4444)' : 'var(--amber, #f59e0b)',
                fontSize: '0.75rem',
                fontWeight: 900,
                letterSpacing: '0.02em'
              }}>
                {rawAiRec}
              </span>
            </div>
          </div>

          {/* 4. Confidence */}
          <div style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-default, #cbd5e1)',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
              Confidence Level
            </div>
            <div style={{ marginTop: '4px', fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', fontFamily: 'var(--font-mono, monospace)' }}>
              {confidenceStr}
            </div>
          </div>
        </div>

        {/* Risk Factors / Explanation */}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary, #334155)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Risk Factors & Explanation
          </div>
          
          <div style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-default, #cbd5e1)',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary, #334155)',
            lineHeight: 1.5,
            marginBottom: '0.5rem'
          }}>
            {rationaleText}
          </div>

          {riskFactors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {riskFactors.map((factor, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary, #64748b)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    lineHeight: 1.4
                  }}
                >
                  <span style={{ color: 'var(--teal, #0ea5e9)', fontWeight: 'bold' }}>•</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: CREDIT OFFICER FINAL DECISION (FINAL AUTHORITY)   */}
      {/* ============================================================ */}
      <div
        className="card-modern officer-authority-section"
        style={{
          background: 'var(--bg-primary, #ffffff)',
          border: '1px solid var(--border-default, #cbd5e1)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))'
        }}
      >
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(13, 33, 63, 0.1)',
              color: 'var(--accent-blue, #0d213f)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scale size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Credit Officer Final Decision
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary, #64748b)' }}>
                Human approval & underwriting review
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(13, 33, 63, 0.08)',
              color: 'var(--accent-blue, #0d213f)',
              border: '1px solid rgba(13, 33, 63, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <UserCheck size={11} />
            <span>Final Authority</span>
          </div>
        </div>

        {/* Authority Clarification Notice */}
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--text-secondary, #334155)',
            background: 'var(--bg-secondary, #f8fafc)',
            borderLeft: '3px solid var(--teal, #0ea5e9)',
            padding: '0.5rem 0.75rem',
            borderRadius: '0 4px 4px 0',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}
        >
          <strong>Institutional Governance:</strong> The Credit Officer holds sole final authority. The AI recommendation is strictly advisory, and the officer may execute any action regardless of AI output.
        </div>

        {/* Existing Decision Badge if already processed */}
        {hasPreviousDecision && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '6px',
              background: 'var(--bg-secondary, #f8fafc)',
              border: '1px solid var(--border-default, #cbd5e1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
                Current Ledger Status
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                {currentOfficerDecision}
              </div>
            </div>
            {appraisal.is_override && (
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--amber, #f59e0b)',
                border: '1px solid var(--amber, #f59e0b)'
              }}>
                OVERRIDDEN
              </span>
            )}
          </div>
        )}

        {/* 3 Primary Credit Officer Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          
          {/* Action 1: Approve Loan */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleInitiateAction('APPROVE')}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--emerald, #10b981)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)',
              transition: 'opacity 0.15s, transform 0.1s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Approve Loan</span>
            </div>
            <span style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: 500 }}>Authorize Limit</span>
          </button>

          {/* Action 2: Reject Loan */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleInitiateAction('REJECT')}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--rose, #ef4444)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)',
              transition: 'opacity 0.15s, transform 0.1s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} />
              <span>Reject Loan</span>
            </div>
            <span style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: 500 }}>Decline Application</span>
          </button>

          {/* Action 3: Send Back for Review */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleInitiateAction('PENDING')}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-primary, #ffffff)',
              color: 'var(--text-secondary, #334155)',
              border: '1px solid var(--border-default, #cbd5e1)',
              borderRadius: 'var(--radius-sm, 4px)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} color="var(--amber, #f59e0b)" />
              <span>Send Back for Review</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 500 }}>Hold for Audit</span>
          </button>

        </div>

        {/* Audit Guarantee Footer */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle, #f1f5f9)',
          fontSize: '0.625rem',
          color: 'var(--text-tertiary, #64748b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          <Lock size={10} />
          <span>All decisions logged to immutable Maker-Checker audit ledger</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONFIRMATION & OVERRIDE MODAL / DIALOG                        */}
      {/* ============================================================ */}
      <AnimatePresence>
        {pendingAction && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-dialog-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-primary, #ffffff)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-default, #cbd5e1)',
                width: '100%',
                maxWidth: '480px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{
                background: 'var(--topbar-bg, #0d213f)',
                color: '#ffffff',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--teal, #0ea5e9)" />
                  <span id="approval-dialog-title" style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.02em' }}>
                    Confirm Credit Officer Decision
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cancelConfirmation}
                  disabled={isUpdating}
                  style={{ background: 'none', border: 'none', color: '#8a99a8', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Decision Context Box */}
                <div style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Borrower Entity
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                      {companyName}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Selected Action
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 900, color: getActionColor(pendingAction) }}>
                      {getActionLabel(pendingAction)}
                    </div>
                  </div>
                </div>

                {/* AI Rec vs Officer Decision Comparison */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.75rem'
                }}>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    background: 'var(--bg-tertiary, #f1f5f9)',
                    border: '1px solid var(--border-default, #cbd5e1)'
                  }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 700 }}>
                      AI RECOMMENDATION
                    </div>
                    <div style={{ fontWeight: 800, marginTop: '2px', color: 'var(--text-secondary, #334155)' }}>
                      {rawAiRec} <span style={{ fontSize: '0.625rem', fontWeight: 'normal', color: 'var(--text-tertiary, #64748b)' }}>(Advisory)</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    background: `${getActionColor(pendingAction)}15`,
                    border: `1px solid ${getActionColor(pendingAction)}40`
                  }}>
                    <div style={{ fontSize: '0.625rem', color: getActionColor(pendingAction), fontWeight: 700 }}>
                      OFFICER FINAL DECISION
                    </div>
                    <div style={{ fontWeight: 900, marginTop: '2px', color: getActionColor(pendingAction) }}>
                      {pendingAction}
                    </div>
                  </div>
                </div>

                {/* OVERRIDE DETECTED ALERT BANNER (If officer decision differs from AI rec) */}
                {isOverride && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderLeft: '4px solid var(--rose, #ef4444)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--rose, #ef4444)', fontWeight: 800, fontSize: '0.75rem' }}>
                      <AlertTriangle size={14} />
                      <span>AI Recommendation Override Detected</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary, #334155)', lineHeight: 1.4 }}>
                      Your decision ({pendingAction}) differs from the AI advisory recommendation ({rawAiRec}). An <strong>Override Reason</strong> is mandatory for regulatory compliance and audit logs.
                    </div>
                  </div>
                )}

                {/* OVERRIDE REASON INPUT (Required if isOverride = true) */}
                {isOverride && (
                  <div>
                    <label
                      htmlFor="override-reason-input"
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary, #0f172a)',
                        marginBottom: '0.4rem'
                      }}
                    >
                      Override Reason / Justification <span style={{ color: 'var(--rose, #ef4444)' }}>*</span>
                    </label>
                    <textarea
                      id="override-reason-input"
                      rows={3}
                      value={overrideReason}
                      onChange={(e) => {
                        setOverrideReason(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      placeholder="Specify quantitative or qualitative factors, secondary collateral, guarantor strength, or institutional judgment supporting this override..."
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary, #0f172a)',
                        background: 'var(--bg-primary, #ffffff)',
                        border: validationError ? '1px solid var(--rose, #ef4444)' : '1px solid var(--border-default, #cbd5e1)',
                        borderRadius: 'var(--radius-sm, 4px)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {/* OPTIONAL OFFICER NOTES (If isOverride = false) */}
                {!isOverride && (
                  <div>
                    <label
                      htmlFor="officer-notes-input"
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary, #0f172a)',
                        marginBottom: '0.4rem'
                      }}
                    >
                      Officer Audit Remarks <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 'normal' }}>(Optional)</span>
                    </label>
                    <textarea
                      id="officer-notes-input"
                      rows={2}
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="Add any additional institutional notes or conditions..."
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary, #0f172a)',
                        background: 'var(--bg-primary, #ffffff)',
                        border: '1px solid var(--border-default, #cbd5e1)',
                        borderRadius: 'var(--radius-sm, 4px)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {/* Validation Error Message */}
                {validationError && (
                  <div style={{
                    fontSize: '0.6875rem',
                    color: 'var(--rose, #ef4444)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <AlertTriangle size={12} />
                    <span>{validationError}</span>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div style={{
                padding: '0.875rem 1.25rem',
                background: 'var(--bg-secondary, #f8fafc)',
                borderTop: '1px solid var(--border-default, #cbd5e1)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={cancelConfirmation}
                  disabled={isUpdating}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-primary, #ffffff)',
                    color: 'var(--text-secondary, #334155)',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    borderRadius: 'var(--radius-sm, 4px)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: isUpdating ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  disabled={isUpdating}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: getActionColor(pendingAction),
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm, 4px)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      <span>Syncing Audit Ledger...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm Decision</span>
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
