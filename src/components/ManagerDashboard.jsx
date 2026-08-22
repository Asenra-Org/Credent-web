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
import {
  ShieldCheck,
  BarChart3,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Activity,
  History,
  FileText,
  ShieldAlert,
  X,
  Zap,
  Download
} from 'lucide-react';

import { downloadPDF } from '../utils/generatePdf';
import HumanApprovalWorkflow, { getAiRecommendation } from './HumanApprovalWorkflow';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard({ theme }) {
  const navigate = useNavigate();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchAppraisals = async () => {
    try {
      const response = await api.get('/history/recent', { params: { limit: 50 } });
      const result = response.data;
      if (result.status === 'success') {
        setAppraisals(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch institutional data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHistoricalPDF = (record) => {
    if (!record || !record.cam_report) return;
    const reconstructedParams = {
      company: record.company_name,
      sector: record.sector,
      revenue: record.revenue || 0,
      debt: record.debt || 0,
      worth: record.worth || 0,
      baseScore: record.base_score || record.adjusted_score || 'N/A'
    };
    downloadPDF(record.cam_report, reconstructedParams);
  };

  const handleUpdateStatus = async (appId, newDecision, auditPayload = {}) => {
    if (!appId || updating) return;

    // Find and backup ONLY the single affected appraisal object for memory efficiency
    const targetItem = appraisals.find(app => app.id === appId || app.appraisal_id === appId);
    if (!targetItem) {
      alert("Error: Application record not found. Sync Failed.");
      return;
    }

    const previousItem = { ...targetItem };
    const isDrawerTarget = selectedAppraisal && (selectedAppraisal.id === appId || selectedAppraisal.appraisal_id === appId);
    const previousDrawerItem = isDrawerTarget ? { ...selectedAppraisal } : null;

    const originalAiRec = getAiRecommendation(targetItem);
    const aiRec = auditPayload.aiRecommendation || originalAiRec;
    const isOverride = auditPayload.isOverride || false;
    const overrideReason = auditPayload.overrideReason || '';
    const officerNotes = auditPayload.officerNotes || '';

    // Construct rich audit rationale compatible with existing backend
    let finalRationale = auditPayload.rationale;
    if (!finalRationale) {
      if (isOverride) {
        finalRationale = `[OFFICER OVERRIDE] Decision: ${newDecision} (AI Recommendation: ${aiRec}). Justification: ${overrideReason}. Date: ${new Date().toISOString()}`;
      } else if (officerNotes) {
        finalRationale = `[OFFICER CONCURRENCE] Decision: ${newDecision}. Remarks: ${officerNotes}. Date: ${new Date().toISOString()}`;
      } else {
        finalRationale = `Formal institutional decision by Credit Officer: ${newDecision}. Date: ${new Date().toLocaleString()}`;
      }
    }

    const updatedRecordFields = {
      decision: newDecision,
      status: newDecision,
      officer_decision: newDecision,
      ai_recommendation: originalAiRec,
      decision_rationale: finalRationale,
      is_override: isOverride,
      override_reason: isOverride ? overrideReason : (targetItem.override_reason || null),
      officer_notes: officerNotes || null
    };

    // 1. Instant Optimistic Local State Mutation (0ms UI lag, single item update)
    setAppraisals(prev => prev.map(item => {
      const id = item.id || item.appraisal_id;
      return id === appId ? { ...item, ...updatedRecordFields } : item;
    }));

    if (isDrawerTarget) {
      setSelectedAppraisal(prev => prev ? { ...prev, ...updatedRecordFields } : null);
    }

    setUpdating(true);

    try {
      const resp = await api.patch(`/reports/update-status/${appId}`, {
        decision: newDecision,
        rationale: finalRationale,
        override_reason: isOverride ? overrideReason : undefined,
        is_override: isOverride,
        officer_decision: newDecision,
        ai_recommendation: aiRec,
        timestamp: new Date().toISOString()
      });

      const result = resp.data;

      if (result.status !== 'success') {
        throw new Error(result.message || 'Server rejected status update');
      }
    } catch (err) {
      console.error("Cloud Decision Sync failed:", err);
      // 2. Rollback ONLY the single affected item and drawer state on error
      setAppraisals(prev => prev.map(item => {
        const id = item.id || item.appraisal_id;
        return id === appId ? previousItem : item;
      }));

      if (previousDrawerItem) {
        setSelectedAppraisal(previousDrawerItem);
      }

      alert(`Cloud Decision Sync Failed: ${err.message || 'Network error'}. Previous status restored.`);
    } finally {
      setUpdating(false);
    }
  };

  const averageRisk = appraisals.length > 0
    ? (appraisals.reduce((acc, curr) => acc + (Number(curr.adjusted_score) || 0), 0) / appraisals.length).toFixed(1)
    : '0.0';

  const flaggedCount = appraisals.filter(app => app.decision === 'REJECT').length;

  const filteredData = appraisals.filter(app => {
    const matchesSearch = (app.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const filterKey = filterStatus === 'MANUAL REVIEW' ? 'PENDING' : filterStatus;
    const matchesFilter = filterStatus === 'ALL' || app.decision === filterKey;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    if (status === 'APPROVE') return '#18181b';
    if (status === 'REJECT') return '#71717a';
    return '#18181b';
  };

  // AUTO-SYNC POLLING (Industry-standard real-time pulse)
  useEffect(() => {
    fetchAppraisals(); // Initial
    const poll = setInterval(fetchAppraisals, 5000); // Pulse every 5s
    return () => clearInterval(poll);
  }, []);

  // SKELETON COMPONENTS
  const SkeletonStat = () => (
    <div style={{ height: '80px', background: 'var(--bg-secondary)', borderRadius: 0, animation: 'pulse 1.5s infinite linear', marginBottom: '1rem' }}></div>
  );

  const SkeletonRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', padding: '1rem', borderBottom: '1px solid #e4e4e7', animation: 'pulse 1.5s infinite linear' }}>
      {[...Array(7)].map((_, i) => <div key={i} style={{ height: '14px', background: 'var(--bg-secondary)', borderRadius: 0 }}></div>)}
    </div>
  );

  return (
    <div className="hud-container" style={{ padding: '2rem' }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(0.995); }
          50% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0.4; transform: scale(0.995); }
        }
      `}</style>
      <header className="hud-header" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/engine')}
            style={{ background: 'var(--bg-primary)', border: '1px solid #e4e4e7', color: '#09090b', padding: '0.5rem 1rem', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Exit Terminal
          </motion.button>
          <div className="hud-brand" style={{ fontSize: '1.5rem' }}><ShieldCheck color="#18181b" size={28} /> Institutional Manager</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ color: '#71717a', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: 0, background: loading ? '#71717a' : '#18181b', boxShadow: loading ? '0 0 5px #71717a' : '0 0 5px #18181b' }}></div>
              {loading ? 'Cloud Syncing...' : 'Live Cloud Pulse'}
           </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* SIDEBAR STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-title"><Activity size={16} /> Live Portfolio</div>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <>
                  <SkeletonStat />
                  <SkeletonStat />
                  <SkeletonStat />
                </>
              ) : (
                <>
                  <StatItem label="Total Applications" value={appraisals.length} icon={<FileText size={18} />} color="#18181b" />
                  <StatItem label="Average Risk Score" value={averageRisk} icon={<BarChart3 size={18} />} color="#18181b" />
                  <StatItem label="Flagged for Manual Review" value={flaggedCount} icon={<AlertTriangle size={18} />} color="#71717a" />
                </>
              )}
            </div>
          </div>

          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-title"><Filter size={16} /> Global Filters</div>
            <div style={{ marginTop: '1rem' }}>
              <div className="search-bar" style={{ marginBottom: '1rem' }}>
                <Search size={16} color="#71717a" />
                <input
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#09090b', width: '100%', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['ALL', 'APPROVE', 'REJECT', 'MANUAL REVIEW'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 0,
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      border: '1px solid #e4e4e7',
                      background: filterStatus === status ? 'var(--navy-soft)' : 'var(--bg-primary)',
                      color: filterStatus === status ? '#18181b' : '#3f3f46',
                      cursor: 'pointer'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN FEED */}
        <div className="panel" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="panel-title" style={{ margin: 0 }}><History size={16} /> Application Ledger (Cloud Sync)</div>
            <div style={{ fontSize: '0.75rem', color: '#18181b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: 0, background: '#18181b' }} /> Supabase Real-time Active
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid #e4e4e7' }}>
                  <th style={{ padding: '1rem 1.5rem', color: '#71717a', fontWeight: '600' }}>Entity Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#71717a', fontWeight: '600' }}>AI Score</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#71717a', fontWeight: '600' }}>Decision</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#71717a', fontWeight: '600' }}>Recommended</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#71717a', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}><td colSpan="6" style={{ padding: 0 }}><SkeletonRow /></td></tr>
                  ))
                ) : (
                  <AnimatePresence>
                    {filteredData.map((app, index) => (
                      <motion.tr
                        key={app.id || index}
                        onClick={() => setSelectedAppraisal(app)}
                        whileHover={{ scale: 1.01, background: 'var(--bg-tertiary)' }}
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ borderBottom: '1px solid #e4e4e7', cursor: 'pointer' }}
                        className="ledger-row"
                      >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {app.integrity_flags?.forensics?.is_suspicious && <ShieldAlert size={16} color="#71717a" title="Photoshop/Modification Detected" />}
                          {app.company_name}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '40px', height: '4px', background: '#e4e4e7', borderRadius: 0, overflowY: 'auto' }}>
                            <div style={{ height: '100%', width: `${app.adjusted_score}%`, background: getStatusColor(app.decision) }} />
                          </div>
                          <span style={{ fontWeight: '800' }}>{app.adjusted_score}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 0,
                          background: `${getStatusColor(app.decision)}20`,
                          color: getStatusColor(app.decision),
                          fontSize: '0.6875rem',
                          fontWeight: '800'
                        }}>{app.decision}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#3f3f46' }}>{app.recommended_loan_amount}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#71717a', fontSize: '0.75rem' }}>
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn-action-small"
                            title="Download PDF"
                            onClick={(e) => { e.stopPropagation(); handleDownloadHistoricalPDF(app); }}
                            disabled={!app.cam_report}
                            style={{ opacity: app.cam_report ? 1 : 0.3, cursor: app.cam_report ? 'pointer' : 'not-allowed' }}
                          >
                            <Download size={14} />
                          </button>
                          <button className="btn-action-small" title="View Details"><Eye size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DECISION DETAIL PANEL (Maker-Checker / Human Approval Workflow) */}
      <AnimatePresence>
        {selectedAppraisal && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            style={{
              position: 'fixed', top: 0, right: 0, width: '480px', maxWidth: '100vw', height: '100vh',
              background: 'var(--bg-primary)', borderLeft: '1px solid #e4e4e7',
              boxShadow: 'none', zIndex: 1000, padding: '1.75rem',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck color="#18181b" /> Decision Center
              </div>
              <button
                onClick={() => setSelectedAppraisal(null)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
                aria-label="Close Decision Center"
              >
                <X size={22} />
              </button>
            </div>

            {/* Entity Quick Header Banner */}
            <div className="panel" style={{ padding: '1.25rem', marginBottom: '1rem', border: selectedAppraisal.integrity_flags?.forensics?.is_suspicious ? '1px solid #71717a' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Selected Entity</div>
                {selectedAppraisal.integrity_flags?.forensics && (
                    <div style={{ fontSize: '0.625rem', padding: '2px 6px', borderRadius: 0, background: selectedAppraisal.integrity_flags.forensics.is_suspicious ? '#71717a' : '#18181b', color: 'white', fontWeight: '800' }}>
                        {selectedAppraisal.integrity_flags.forensics.is_suspicious ? 'SUSPICIOUS' : 'SECURE'}
                    </div>
                )}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', marginTop: '0.25rem' }}>{selectedAppraisal.company_name}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.625rem', color: '#71717a', fontWeight: 700 }}>SECTOR</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700' }}>{selectedAppraisal.sector || 'Commercial'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.625rem', color: '#71717a', fontWeight: 700 }}>APPLICATION ID</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', fontFamily: 'var(--font-mono, monospace)' }}>{selectedAppraisal.id || selectedAppraisal.appraisal_id || 'N/A'}</div>
                </div>
              </div>

              {selectedAppraisal.integrity_flags?.forensics?.is_suspicious && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f4f4f5', borderRadius: 0, borderLeft: '3px solid #71717a' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '0.6875rem', fontWeight: '800' }}>
                      <AlertTriangle size={12} /> FORENSIC TAMPER ALERT
                   </div>
                   {selectedAppraisal.integrity_flags.forensics.flags.map((f, i) => (
                      <div key={i} style={{ fontSize: '0.625rem', color: '#3f3f46', marginTop: '2px' }}>- {f}</div>
                   ))}
                </div>
              )}
            </div>

            {/* Scrollable Human Approval Workflow */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
              <HumanApprovalWorkflow
                appraisal={selectedAppraisal}
                onUpdateDecision={handleUpdateStatus}
                isUpdating={updating}
                onClose={() => setSelectedAppraisal(null)}
              />
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e4e4e7', fontSize: '0.625rem', color: '#71717a', textAlign: 'center' }}>
               <Zap size={10} /> Cloud-Secure Synchronization Active • Maker-Checker Audit Log
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ label, value, icon, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: 0, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.6875rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#09090b' }}>{value}</div>
      </div>
    </div>
  );
}
