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
  Zap
} from 'lucide-react';

export default function ManagerDashboard({ theme, onExit }) {
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
      const response = await fetch('http://localhost:8000/api/v1/history/recent?limit=50');
      const result = await response.json();
      if (result.status === 'success') {
        setAppraisals(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch institutional data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newDecision) => {
    if (!appId) {
        alert(" Error: Invalid Application ID. Sync Failed.");
        return;
    }
    setUpdating(true);
    try {
      const resp = await fetch(`http://localhost:8000/api/v1/reports/update-status/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision: newDecision,
          rationale: `Formal institutional decision by bank manager. Date: ${new Date().toLocaleString()}`
        })
      });
      const result = await resp.json();
      if (result.status === 'success') {
        fetchAppraisals(); // Refresh cloud data
        setSelectedAppraisal(null); // Close modal/detail
      }
    } catch (err) {
      console.error("Cloud Decision Sync failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  const averageRisk = appraisals.length > 0 
    ? (appraisals.reduce((acc, curr) => acc + (Number(curr.adjusted_score) || 0), 0) / appraisals.length).toFixed(1)
    : '0.0';

  const flaggedCount = appraisals.filter(app => app.decision === 'REJECT').length;

  const filteredData = appraisals.filter(app => {
    const matchesSearch = app.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || app.decision === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    if (status === 'APPROVE') return 'var(--emerald)';
    if (status === 'REJECT') return 'var(--rose)';
    return 'var(--teal)';
  };

  // AUTO-SYNC POLLING (Industry-standard real-time pulse)
  useEffect(() => {
    fetchAppraisals(); // Initial
    const poll = setInterval(fetchAppraisals, 5000); // Pulse every 5s
    return () => clearInterval(poll);
  }, []);

  // SKELETON COMPONENTS
  const SkeletonStat = () => (
    <div style={{ height: '80px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite linear', marginBottom: '1rem' }}></div>
  );

  const SkeletonRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite linear' }}>
      {[...Array(7)].map((_, i) => <div key={i} style={{ height: '14px', background: 'var(--bg-secondary)', borderRadius: '4px' }}></div>)}
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
            onClick={onExit}
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Exit Terminal
          </motion.button>
          <div className="hud-brand" style={{ fontSize: '1.5rem' }}><ShieldCheck color="var(--teal)" size={28} /> Institutional Manager</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: loading ? 'var(--amber)' : 'var(--teal)', boxShadow: loading ? '0 0 5px var(--amber)' : '0 0 5px var(--teal)' }}></div>
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
                  <StatItem label="Total Applications" value={appraisals.length} icon={<FileText size={18} />} color="var(--teal)" />
                  <StatItem label="Average Risk Score" value={averageRisk} icon={<BarChart3 size={18} />} color="var(--emerald)" />
                  <StatItem label="Flagged for Manual Review" value={flaggedCount} icon={<AlertTriangle size={18} />} color="var(--rose)" />
                </>
              )}
            </div>
          </div>

          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-title"><Filter size={16} /> Global Filters</div>
            <div style={{ marginTop: '1rem' }}>
              <div className="search-bar" style={{ marginBottom: '1rem' }}>
                <Search size={16} color="var(--text-tertiary)" />
                <input 
                  placeholder="Search entities..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['ALL', 'APPROVE', 'REJECT'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{ 
                      padding: '0.4rem 0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      fontSize: '0.75rem', 
                      fontWeight: '700',
                      border: '1px solid var(--border-default)',
                      background: filterStatus === status ? 'var(--navy-soft)' : 'var(--bg-primary)',
                      color: filterStatus === status ? 'var(--teal)' : 'var(--text-secondary)',
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
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="panel-title" style={{ margin: 0 }}><History size={16} /> Application Ledger (Cloud Sync)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald)' }} /> Supabase Real-time Active
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Entity Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>AI Score</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Decision</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Recommended</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Date</th>
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
                        style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        className="ledger-row"
                      >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {app.integrity_flags?.forensics?.is_suspicious && <ShieldAlert size={16} color="var(--rose)" title="Photoshop/Modification Detected" />}
                          {app.company_name}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '40px', height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${app.adjusted_score}%`, background: getStatusColor(app.decision) }} />
                          </div>
                          <span style={{ fontWeight: '800' }}>{app.adjusted_score}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          background: `${getStatusColor(app.decision)}20`, 
                          color: getStatusColor(app.decision),
                          fontSize: '0.6875rem',
                          fontWeight: '800'
                        }}>{app.decision}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{app.recommended_loan_amount}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button className="btn-action-small"><Eye size={14} /></button>
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

      {/* DECISION DETAIL PANEL (Maker-Checker) */}
      <AnimatePresence>
        {selectedAppraisal && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            style={{ 
              position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', 
              background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-default)',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 1000, padding: '2rem',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck color="var(--teal)" /> Decision Center
              </div>
              <button onClick={() => setSelectedAppraisal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: selectedAppraisal.integrity_flags?.forensics?.is_suspicious ? '1px solid var(--rose)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Selected Entity</div>
                {selectedAppraisal.integrity_flags?.forensics && (
                    <div style={{ fontSize: '0.625rem', padding: '2px 6px', borderRadius: '4px', background: selectedAppraisal.integrity_flags.forensics.is_suspicious ? 'var(--rose)' : 'var(--emerald)', color: 'white', fontWeight: '800' }}>
                        {selectedAppraisal.integrity_flags.forensics.is_suspicious ? 'SUSPICIOUS' : 'SECURE'}
                    </div>
                )}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>{selectedAppraisal.company_name}</div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>SECTOR</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700' }}>{selectedAppraisal.sector}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>AI RISK SCORE</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: getStatusColor(selectedAppraisal.decision) }}>{selectedAppraisal.adjusted_score}%</div>
                </div>
              </div>

              {selectedAppraisal.integrity_flags?.forensics?.is_suspicious && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--rose)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--rose)', fontSize: '0.6875rem', fontWeight: '800' }}>
                      <AlertTriangle size={12} /> FORENSIC TAMPER ALERT
                   </div>
                   {selectedAppraisal.integrity_flags.forensics.flags.map((f, i) => (
                      <div key={i} style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '2px' }}>- {f}</div>
                   ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>AI ANALYSIS RATIONALE</div>
               <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  {selectedAppraisal.decision_rationale}
               </div>

               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>MANAGEMENT ACTION</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedAppraisal.id, 'APPROVE')}
                    style={{ padding: '1rem', background: 'var(--emerald)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {updating ? 'Processing...' : <><ShieldCheck size={18} /> Formal Approval</>}
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedAppraisal.id, 'REJECT')}
                    style={{ padding: '1rem', background: 'var(--rose)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {updating ? 'Processing...' : <><AlertTriangle size={18} /> Formal Rejection</>}
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedAppraisal.id, 'PENDING')}
                    style={{ padding: '1rem', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {updating ? 'Processing...' : 'Hold for Manual Review'}
                  </button>
               </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border-default)', fontSize: '0.625rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
               <Zap size={10} /> Cloud-Secure Synchronization Active
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
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}
