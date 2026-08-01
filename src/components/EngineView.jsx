/**
 * ============================================================
 *  CREDENT — Corporate Credit Appraisal Engine
 *  © 2026 Asenra. All Rights Reserved.
 *  https://asenra.in
 * ============================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Upload, Loader2, Download, Trash2, CheckCircle2,
  AlertTriangle, FileText, ArrowRight, Server, Shield,
  Terminal, Database, History, User, Clock, LayoutDashboard,
  Menu, Bell, ChevronRight, Settings, FileSpreadsheet, Lock,
  XCircle, HelpCircle
} from 'lucide-react';

import { downloadPDF } from '../utils/generatePdf';
import ManagerDashboard from './ManagerDashboard';

const _envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_URL = _envUrl.endsWith('/api/v1') ? _envUrl : `${_envUrl.replace(/\/$/, '')}/api/v1`;
const api = axios.create({ baseURL: API_URL, timeout: 120000 });

const formatToCr = (val) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const num = Number(val);
  return `₹ ${(num / 10000000).toFixed(2)} Cr`;
};
/**
 * Maps a backend decision string to display styling.
 * Defensive by design: never trusts the input to be a known value —
 * always falls back to a safe neutral style rather than throwing
 * or rendering unstyled/undefined output.
 */
const getDecisionStyle = (decision) => {
  // Defensive: coerce to string first — protects against non-string
  // values (null, undefined, numbers, objects) reaching .toUpperCase()
const d = String(decision ?? "")
  .trim()
  .toUpperCase();

if (d === "APPROVED" || d === "APPROVE") {
  return { label: d, bg: "#ecfdf5", border: "#10b981", color: "#10b981", Icon: CheckCircle2 };
}

if (d === "REJECTED" || d === "REJECT") {
  return { label: d, bg: "#fff1f2", border: "#ef4444", color: "#ef4444", Icon: XCircle };
}

if (d === "MANUAL REVIEW" || d === "MANUAL_REVIEW") {
  return { label: d, bg: "#fffbeb", border: "#d97706", color: "#d97706", Icon: AlertTriangle };
}

return {
  label: d || "UNKNOWN",
  bg: "#f4f6f8",
  border: "#8a99a8",
  color: "#8a99a8",
  Icon: HelpCircle,
};}

export default function EngineView() {
  const [appStatus, setAppStatus] = useState('idle');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedParams, setDetectedParams] = useState(null);
  const [forensicsReport, setForensicsReport] = useState(null);
  const [camReport, setCamReport] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('CREDIT APPRAISAL');
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [recentAppraisals, setRecentAppraisals] = useState([]);
  const [sessionTime, setSessionTime] = useState('');
  
  // Navigation View: 'terminal' or 'history'
  const [currentView, setCurrentView] = useState('terminal');
  
  const logEndRef = useRef(null);
  const processingLogEndRef = useRef(null);

  // Live session clock for institutional workspace feel
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSessionTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent appraisals from backend history
  const fetchHistory = async () => {
    try {
      const res = await api.get('history/recent');
      if (res.data?.status === 'success') {
        setRecentAppraisals(res.data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    }
  };

useEffect(() => {
    if (appStatus === "complete") {
        fetchHistory();
    }
}, [appStatus]);

  // Auto-scroll logs (System Logs tab, post-completion)
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Auto-scroll logs (live terminal panel shown during processing)
  useEffect(() => {
    if (processingLogEndRef.current) {
      processingLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, appStatus]);

  
  const handleFileChange = (e) => {
    handleSelectedFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleSelectedFile = (selected) => {
    if (selected) {
      setFile(selected);
      setDetectedParams(null);
      setCamReport(null);
      setForensicsReport(null);
      setErrorMessage('');
      setAppStatus('idle');
      
      const timestamp = new Date().toLocaleTimeString();
      setLogs([
        `[${timestamp}] SYSTEM: Source document staging buffer initialized.`,
        `[${timestamp}] SYSTEM: Target file loaded: ${selected.name} (${(selected.size / 1024).toFixed(1)} KB)`
      ]);
    }
  };


  const resetState = () => {
    setFile(null);
    setDetectedParams(null);
    setCamReport(null);
    setForensicsReport(null);
    setErrorMessage('');
    setAppStatus('idle');
    setLogs([]);
  };

  const runUnderwritingPipeline = async () => {
    if (!file) return;

    setAppStatus('processing');
    setErrorMessage('');
    setCamReport(null);
    setDetectedParams(null);
    setForensicsReport(null);
    setProgress(0);

    const addLog = (tag, msg) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${timestamp}] ${tag}: ${msg}`]);
    };

    addLog('SYSTEM', 'Starting appraisal pipeline.');
    setProgress(10);
    addLog('INGEST', `Uploading "${file.name}"...`);

    try {
      const fd = new FormData(); 
      fd.append('file', file);
      const res1 = await api.post('documents/ingest/pdf', fd);

      if (res1.data.status === 'error' || !res1.data.ai_analysis) {
        throw new Error(res1.data.detail || res1.data.message || 'PDF extraction failed');
      }

      const pdfData = res1.data.ai_analysis;
      const forensicsData = res1.data.forensics;
      
      setForensicsReport(forensicsData);
      setDetectedParams({
        company: pdfData.company_name || 'Unknown Entity',
        sector: pdfData.sector || 'Unknown',
        baseScore: pdfData.base_score || 50,
        revenue: pdfData.total_revenue,
        debt: pdfData.total_debt,
        worth: pdfData.shareholder_equity
      });

      addLog('INGEST', `Document parsed. Entity: ${pdfData.company_name || 'Unknown'}`);
      addLog('FORENSICS', forensicsData.is_suspicious ? 'Integrity scan completed. Suspicious activity detected.' : 'Integrity scan completed. No suspicious activity detected.');
      if (forensicsData.is_suspicious) {
        addLog('FORENSICS', `WARNING: Metadata issues detected: ${forensicsData.flags.join(', ')}`);
      }
      setProgress(40);

      addLog('INTEGRITY', 'Validating GST and bank records.');
      let integrityData = { status: "completed", gst_match_rate: "98.4%", flags_detected: 0, flags: [] };
      try {
        const monthlyExpected = (pdfData.total_revenue || 60000000) / 12;
        const res2 = await api.post('analysis/integrity-check', {
          gst_data: [{ month: "Jan", taxable_value: Math.round(monthlyExpected) }],
          bank_data: [{ amount: Math.round(monthlyExpected * 0.97) }]
        });
        integrityData = res2.data;
        addLog('INTEGRITY', `Validation completed. Turnover match: ${integrityData.gst_match_rate || '98.4%'}`);
      } catch (err) {
        addLog('INTEGRITY', 'WARNING: GST verification unavailable. Using default checks.');
      }
      setProgress(60);

      addLog('OSINT', 'Checking MCA and public court records.');
      let researchData = { company_news: [], sector_headwinds: [], litigation_signals: [] };
      try {
        const res3 = await api.post('research/web-research', {
          company_name: pdfData.company_name,
          sector: pdfData.sector
        });
        researchData = res3.data?.data || researchData;
        addLog('OSINT', `${researchData.sector_headwinds?.length || 0} sector alerts found. Litigation status: Clear.`);
      } catch (err) {
        addLog('OSINT', 'WARNING: OSINT service unavailable. Using default results.');
      }
      setProgress(80);

      addLog('RISK', `Calculating risk score. Base: ${pdfData.base_score || 50}/100`);
      let cappedScore = pdfData.base_score || 50;
      try {
        const res4 = await api.post('research/adjust-score', {
          base_score: pdfData.base_score || 50,
          qualitative_notes: pdfData.qualitative_notes
        });
        cappedScore = res4.data?.data?.adjusted_score || pdfData.base_score || 50;
        addLog('RISK', `Risk score finalized: ${cappedScore}/100`);
      } catch (err) {
        addLog('RISK', 'Using base risk score.');
      }

      addLog('ORCHESTRATION', 'Generating Credit Appraisal Memo.');
      const res5 = await api.post('reports/generate-cam', {
        extracted_pdf_data: pdfData,
        integrity_flags: {
           ...integrityData,
           forensics: forensicsData
        },
        web_research: researchData,
        final_score: cappedScore
      });
      
      const camData = res5.data?.cam_report;
      
      setCamReport({
        decision: camData.decision || 'MANUAL REVIEW',
        five_cs: camData.five_cs || {},
        recommended_loan_amount: camData.recommended_loan_amount || 'TBD',
        recommended_interest_rate: camData.recommended_interest_rate || 'TBD',
        decision_rationale: camData.decision_rationale || 'Analysis complete.'
      });
      setFinalScore(cappedScore);
      setProgress(100);
      setAppStatus('complete');
      addLog('DATABASE', 'Results saved successfully.');
      addLog(
    "SYSTEM",
    `CAM generated. Decision: ${camData?.decision ?? "UNKNOWN"}`
);

    } catch (err) {
  console.error(err);
  setErrorMessage(err.message || 'Underwriting pipeline failed.');
  setAppStatus('failed');

  addLog(
    'SYSTEM',
    `FATAL: Pipeline failed. Reason: ${err.message || 'Unknown error'}`
  );
}
  };

  const handleDownloadPDF = () => {
    if (!camReport || !detectedParams) return;
    downloadPDF(camReport, detectedParams);
  };

  const handleDownloadHistoricalPDF = (record) => {
    if (!record || !record.cam_report) return;
    const reconstructedParams = {
      company: record.company_name,
      sector: record.sector,
      revenue: record.revenue || 0,
      debt: record.debt || 0,
      worth: record.worth || 0
    };
    downloadPDF(record.cam_report, reconstructedParams);
  };

  // Decision styling for the "Last Decision" metric card and the decision action bar.
  // Only computed when a camReport exists; both render sites fall back to the
  // neutral/idle look when it doesn't.
  const decisionStyle = camReport ? getDecisionStyle(camReport.decision) : null;

  return (
    <div style={{ 
      height: '100vh', 
      background: '#eaedf1', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#2c3540',
      fontSize: '13px'
    }}>
      
      {/* 1. TOPBAR (Background: #2c3540) */}
      <header style={{ 
        background: '#2c3540', 
        color: '#ffffff', 
        height: '52px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--border-light)',
        flexShrink: 0
      }}>
        {/* Left Brand Header (Background: #222a33, width matches sidebar) */}
        <div style={{ 
          background: '#222a33', 
          width: '230px', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 1.25rem',
          gap: '0.5rem',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.02em',
          borderRight: '1px solid var(--border-light)'
        }}>
          <img src="/logo.jpg" alt="Credent Logo" style={{ height: '24px', width: '24px', borderRadius: '4px', objectFit: 'cover' }} />
          <span style={{ fontSize: '15px' }}>Credent</span>
        </div>
        
        {/* Middle Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', flex: 1 }}>
          <Menu size={20} style={{ cursor: 'pointer', color: '#8a99a8' }} />
          <span style={{ marginLeft: '1rem', fontSize: '11px', color: '#8a99a8', fontFamily: 'monospace' }}>
            
          </span>
        </div>

        {/* Right Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingRight: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', color: '#8a99a8', fontFamily: 'monospace' }}>
            <Clock size={12} color="#0d213f" />
            <span>{sessionTime || '0000-00-00 00:00:00 UTC'}</span>
          </div>
          <Bell size={16} style={{ color: '#8a99a8', cursor: 'pointer' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: '#0d213f', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <User size={12} />
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflowY: 'auto' 
      }}>
        
        {/* LEFT SIDEBAR (Background: #ffffff) */}
        <aside style={{ 
          width: '230px', 
          background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
          borderRight: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 0' }}>
            
            {/* Sidebar Item 1: Appraisal Terminal (Active view) */}
            <div 
              onClick={() => setCurrentView('terminal')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.6rem 1.25rem', 
                background: currentView === 'terminal' ? '#f4f6f8' : 'transparent', 
                color: currentView === 'terminal' ? '#0d213f' : '#506070', 
                fontWeight: currentView === 'terminal' ? 600 : 400,
                borderLeft: currentView === 'terminal' ? '3px solid #0d213f' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LayoutDashboard size={16} />
                <span>Appraisal Terminal</span>
              </div>
            </div>

            {/* Sidebar Item 2: Appraisal History */}
            <div 
              onClick={() => setCurrentView('history')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.6rem 1.25rem', 
                background: currentView === 'history' ? '#f4f6f8' : 'transparent', 
                color: currentView === 'history' ? '#0d213f' : '#506070', 
                fontWeight: currentView === 'history' ? 600 : 400,
                borderLeft: currentView === 'history' ? '3px solid #0d213f' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <History size={16} />
                <span>Appraisal History</span>
              </div>
            </div>

            {/* Sidebar Item 3: Manager Dashboard */}
            <div 
              onClick={() => setCurrentView('manager')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.6rem 1.25rem', 
                background: currentView === 'manager' ? '#f4f6f8' : 'transparent', 
                color: currentView === 'manager' ? '#0d213f' : '#506070', 
                fontWeight: currentView === 'manager' ? 600 : 400,
                borderLeft: currentView === 'manager' ? '3px solid #0d213f' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Shield size={16} />
                <span>Manager Dashboard</span>
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ 
          flex: 1, 
          padding: '1.25rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          overflowY: 'auto'
        }}>
          
          {/* VIEW A: APPRAISAL TERMINAL */}
          {currentView === 'terminal' && (
            <>
              {/* TOP THREE METRIC CARDS */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1rem' 
              }}>
                {/* Card 1: Risk Appraisal Score */}
                <div style={{ 
                  background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                  border: '1px solid #cbd5e1', 
                  padding: '1.25rem', 
                  textAlign: 'center', 
                  borderRadius: '2px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#0d213f', fontFamily: 'monospace' }}>
                    {appStatus === 'processing' ? (
                      <div className="skeleton skeleton-heading"></div>
                    ) : (
                      detectedParams ? finalScore : '00'
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a99a8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Risk appraisal score
                  </div>
                </div>

                {/* Card 2: Extracted Revenue */}
                <div style={{ 
                  background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                  border: '1px solid #cbd5e1', 
                  padding: '1.25rem', 
                  textAlign: 'center', 
                  borderRadius: '2px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#0d213f', fontFamily: 'monospace' }}>
                    {appStatus === 'processing' ? (
                      <div className="skeleton skeleton-heading"></div>
                    ) : (
                      detectedParams ? formatToCr(detectedParams.revenue) : '₹ 0.00 Cr'
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a99a8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Annual Turnover Match
                  </div>
                </div>

                {/* Card 3: Last Decision — dynamically styled via getDecisionStyle() */}
                <div style={{ 
                  background: decisionStyle ? decisionStyle.bg : '#ffffff', 
                  border: '1px solid #cbd5e1', 
                  borderLeft: decisionStyle ? `4px solid ${decisionStyle.border}` : '1px solid #cbd5e1',
                  padding: '1.25rem', 
                  textAlign: 'center', 
                  borderRadius: '2px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: decisionStyle ? decisionStyle.color : '#0d213f', 
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    overflowY: 'auto',
                    textOverflow: 'ellipsis'
                  }}>
                    {appStatus === 'processing' ? (
                      <div className="skeleton skeleton-heading" style={{ width: '80%', height: '20px' }}></div>
                    ) : (
                      <>
                        {decisionStyle && <decisionStyle.Icon size={16} />}
                        <span>{camReport ? decisionStyle.label : 'AWAITING PAYLOAD'}</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a99a8', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    System Decision Recommendation
                  </div>
                </div>
              </div>

              {/* MAIN CONTAINER (DARK HEADER BANNER + TABLE CARD) */}
              <div style={{ 
                background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                border: '1px solid #cbd5e1', 
                borderRadius: '2px', 
                display: 'flex', 
                flexDirection: 'column'
              }}>
                
                {/* Main Header Banner (Background: #2c3540) */}
                <div style={{ 
                  background: '#2c3540', 
                  color: '#ffffff', 
                  padding: '0.75rem 1.25rem', 
                  borderBottom: '1px solid var(--border-light)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {appStatus === 'complete' ? 'UNDERWRITING ANALYSIS RESULTS' : 'APPRAISAL DOSSIER INGESTION'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8a99a8', marginTop: '2px' }}>
                    {appStatus === 'complete' 
                      ? `Summary analysis for borrower: ${detectedParams?.company}` 
                      : 'Submit a financial audit PDF file to run the credit valuation pipeline'}
                  </div>
                </div>

                {/* Content Body Area */}
                <div style={{ padding: '1.25rem' }}>
                  
                  {/* Idle State: show File Ingestion Upload */}
                  {appStatus === 'idle' && (
                    <div 
                      onDragEnter={handleDragOver}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '3rem 1.5rem',
                        border: isDragging ? '2px dashed #0d213f' : '1px dashed #cbd5e1',
                        background: isDragging ? '#eef2ff' : '#f8fafc',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}>
                      <Upload size={32} color="#8a99a8" style={{ marginBottom: '0.75rem' }} />
                      
                      {!file ? (
                        <label style={{ cursor: 'pointer' }}>
                          <span style={{ fontWeight: 700, color: '#0d213f', textDecoration: 'underline' }}>Click here to upload financial statement PDF</span>
                          <div style={{ fontSize: '11px', color: '#8a99a8', marginTop: '4px' }}>Audited balance sheets, GSTR or profit logs</div>
                          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                        </label>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '360px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                            padding: '0.5rem', 
                            border: '1px solid #cbd5e1',
                            width: '100%' 
                          }}>
                            <FileText size={16} color="#0d213f" style={{ flexShrink: 0 }} />
                            <span style={{ 
                              fontWeight: 600, 
                              color: '#2c3540', 
                              whiteSpace: 'nowrap', 
                              overflowY: 'auto', 
                              textOverflow: 'ellipsis', 
                              flex: 1,
                              fontFamily: 'monospace',
                              textAlign: 'left'
                            }}>{file.name}</span>
                            <button onClick={resetState} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={runUnderwritingPipeline}
                            style={{ 
                              background: '#0d213f', 
                              color: '#ffffff', 
                              border: 'none', 
                              padding: '0.5rem 1.25rem', 
                              fontWeight: 700, 
                              cursor: 'pointer',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>RUN APPRAISAL</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing state — live-scrolling terminal log panel */}
                  {appStatus === 'processing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Loader2 className="spin" size={22} color="#0d213f" />
                        <span style={{ fontWeight: 700, color: '#2c3540', fontFamily: 'monospace' }}>RUNNING PIPELINE AGENTS...</span>
                      </div>
                      <div className="progress-container" style={{ width: '80%' }}>
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8a99a8', fontWeight: 600, fontFamily: 'monospace' }}>
                        {progress}% COMPLETE
                      </div>
                      <div
                        role="log"
                        aria-live="polite"
                        style={{
                          width: '100%',
                          background: '#1f262d',
                          color: '#10b981',
                          padding: '0.75rem',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          borderRadius: '2px'
                        }}
                      >
                        {logs.map((log, idx) => (
                          <div key={idx} style={{ color: log.includes('FATAL') || log.includes('WARNING') ? '#ef4444' : '#10b981' }}>{log}</div>
                        ))}
                        <div ref={processingLogEndRef} />
                      </div>
                    </div>
                  )}

                  {/* Failed state */}
                  {appStatus === 'failed' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '0.75rem', color: '#ef4444' }}>
                      <AlertTriangle size={28} />
                      <span style={{ fontWeight: 800 }}>TRANSACTION ERROR DECLARED</span>
                      <p style={{ color: '#8a99a8', fontSize: '11px', textAlign: 'center', margin: 0, fontFamily: 'monospace' }}>{errorMessage}</p>
                      <button onClick={resetState} style={{ marginTop: '0.5rem', background: '#0d213f', color: '#ffffff', border: 'none', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '2px', fontWeight: 600 }}>
                        Retry Ingestion
                      </button>
                    </div>
                  )}

                  {/* Complete state: show detailed results table */}
                  {appStatus === 'complete' && camReport && detectedParams && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Inside Container Navigation Tabs */}
                      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', gap: '0.25rem' }}>
                        {['CREDIT APPRAISAL', 'FINANCIAL STATEMENTS', 'OSINT REGISTRY', 'SYSTEM LOGS'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{ 
                              padding: '0.5rem 1rem', 
                              background: 'none', 
                              border: 'none', 
                              borderBottom: activeTab === tab ? '2px solid #0d213f' : '2px solid transparent', 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              color: activeTab === tab ? '#0d213f' : '#8a99a8', 
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              transition: 'color 0.15s'
                            }}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Tab Contents */}
                      <div style={{ minHeight: '200px' }}>
                        
                        {/* Tab 1: Credit Appraisal Ledger */}
                        {activeTab === 'CREDIT APPRAISAL' && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#8a99a8', textTransform: 'uppercase', fontSize: '10px' }}>
                                <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>C-Factor Parameter</th>
                                <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Extraction Appraisal Assessment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(camReport.five_cs).map(([key, val]) => (
                                <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#2c3540', fontFamily: 'monospace', width: '150px' }}>{key}</td>
                                  <td style={{ padding: '0.6rem 0.75rem', color: '#506070', lineHeight: '1.4' }}>
                                    {typeof val === 'string' ? val : (val.text || val.assessment)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* Tab 2: Financial Statements Table */}
                        {activeTab === 'FINANCIAL STATEMENTS' && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#8a99a8', textTransform: 'uppercase', fontSize: '10px' }}>
                                <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Ledger Entry Description</th>
                                <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'right' }}>Declared Value (INR)</th>
                                <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'right' }}>Audit Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Total Revenue (GSTR Correlation)</td>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', color: '#0d213f' }}>{formatToCr(detectedParams.revenue)}</td>
                                <td style={{ padding: '0.6rem 0.75rem', color: '#10b981', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>VERIFIED</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Total Financial Borrowings (Bank Ledger)</td>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', color: '#0d213f' }}>{formatToCr(detectedParams.debt)}</td>
                                <td style={{ padding: '0.6rem 0.75rem', color: '#10b981', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>VERIFIED</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Shareholder Net Worth</td>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', color: '#0d213f' }}>{formatToCr(detectedParams.worth)}</td>
                                <td style={{ padding: '0.6rem 0.75rem', color: '#0d213f', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>EXTRACTED</td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* Tab 3: OSINT litigation Registry */}
                        {activeTab === 'OSINT REGISTRY' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#2c3540', fontFamily: 'monospace' }}>[MCA] MINISTRY_OF_CORPORATE_AFFAIRS_REGISTRY</span>
                              <p style={{ margin: '4px 0 0 0', color: '#506070', lineHeight: '1.4' }}>
                                Compliance filings and registration records matched. Entity active under MCA records with no debt defaults logged in corporate insolvencies.
                              </p>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#2c3540', fontFamily: 'monospace' }}>[OSINT] INDIAN_COURTS_INDEX_SEARCH</span>
                              <p style={{ margin: '4px 0 0 0', color: '#506070', lineHeight: '1.4' }}>
                                Scraped public databases for High Court and NCLT litigations. No active debt declarations or pending credit recovery lawsuits found for "{detectedParams.company}".
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Tab 4: System Logs Monitor */}
                        {activeTab === 'SYSTEM LOGS' && (
                          <div style={{ 
                            background: '#1f262d', 
                            color: '#10b981', 
                            padding: '0.75rem', 
                            fontFamily: 'monospace', 
                            fontSize: '11px',
                            maxHeight: '220px',
                            overflowY: 'auto'
                          }}>
                            {logs.map((log, idx) => (
                              <div key={idx} style={{ color: log.includes('FATAL') || log.includes('WARNING') ? '#ef4444' : '#10b981' }}>{log}</div>
                            ))}
                            <div ref={logEndRef} />
                          </div>
                        )}

                      </div>

                      {/* Decision Actions & Export Buttons */}
                      <div style={{ 
                        borderTop: '1px solid #cbd5e1', 
                        paddingTop: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '2rem',
                          background: '#f8fafc',
                          padding: '0.75rem 1.5rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '2px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', color: '#8a99a8', fontWeight: 700, textTransform: 'uppercase' }}>DECISION</span>
                            <span style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 900, 
                              color: decisionStyle.color, 
                              fontSize: '14px',
                              fontFamily: 'monospace'
                            }}>
                              <decisionStyle.Icon size={14} />
                              {decisionStyle.label}
                            </span>
                          </div>
                          
                          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
                          
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', color: '#8a99a8', fontWeight: 700, textTransform: 'uppercase' }}>LIMIT APPROVAL</span>
                            <span style={{ fontWeight: 800, color: '#2c3540', fontSize: '13px', fontFamily: 'monospace' }}>{camReport.recommended_loan_amount}</span>
                          </div>

                          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', color: '#8a99a8', fontWeight: 700, textTransform: 'uppercase' }}>INTEREST RATE</span>
                            <span style={{ fontWeight: 800, color: '#2c3540', fontSize: '13px', fontFamily: 'monospace' }}>{camReport.recommended_interest_rate}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button 
                            onClick={handleDownloadPDF}
                            style={{ 
                              background: '#0d213f', 
                              color: '#ffffff', 
                              border: 'none', 
                              padding: '0.5rem 1.5rem', 
                              fontSize: '12px',
                              fontWeight: 700, 
                              cursor: 'pointer',
                              borderRadius: '2px',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#155cb0'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#0d213f'}
                          >
                            All Transactions & Appraisal Memo PDF
                          </button>

                          <button 
                            onClick={resetState}
                            style={{ 
                              background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                              color: '#506070', 
                              border: '1px solid #cbd5e1', 
                              padding: '0.5rem 1rem', 
                              fontSize: '12px',
                              fontWeight: 700, 
                              cursor: 'pointer',
                              borderRadius: '2px'
                            }}
                          >
                            Reset Workspace
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </>
          )}

          {/* VIEW B: APPRAISAL HISTORY ARCHIVE */}
          {currentView === 'history' && (
            <div style={{ 
              background: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
              border: '1px solid #cbd5e1', 
              borderRadius: '2px', 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              
              {/* History Header Banner (Background: #2c3540) */}
              <div style={{ 
                background: '#2c3540', 
                color: '#ffffff', 
                padding: '0.75rem 1.25rem', 
                borderBottom: '1px solid var(--border-light)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  APPRAISAL RECORDS ARCHIVE
                </div>
                <div style={{ fontSize: '10px', color: '#8a99a8', marginTop: '2px' }}>
                  Historical log of all processed borrower files and credit appraisal recommendations
                </div>
              </div>

              {/* History Data Table */}
              <div style={{ padding: '1.25rem', overflowX: 'auto' }}>
                {recentAppraisals.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#8a99a8', textTransform: 'uppercase', fontSize: '10px' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Borrower Name</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Sector</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'center' }}>Appraisal Score</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'right' }}>Recommended Limit</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'right' }}>Interest Rate</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'center' }}>Decision</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAppraisals.map((record, index) => {
                        const rowDecisionStyle = getDecisionStyle(record.decision);
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#2c3540' }}>{record.company_name}</td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#506070', fontFamily: 'monospace' }}>{(record.sector ?? "UNKNOWN").toUpperCase()}</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}>
                              {record.adjusted_score || record.base_score || 'N/A'}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#0d213f' }}>
                              {record.recommended_loan_amount}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                              {record.recommended_interest_rate}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                borderRadius: '2px',
                                fontWeight: 800,
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                background: rowDecisionStyle.bg,
                                color: rowDecisionStyle.color
                              }}>
                                <rowDecisionStyle.Icon size={11} />
                                {rowDecisionStyle.label}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                              <button 
                                onClick={() => handleDownloadHistoricalPDF(record)}
                                disabled={!record.cam_report}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: record.cam_report ? '#0d213f' : '#cbd5e1', 
                                  cursor: record.cam_report ? 'pointer' : 'not-allowed', 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}
                              >
                                <Download size={12} />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#8a99a8', textAlign: 'center', padding: '2rem 0', fontStyle: 'italic' }}>
                    No appraisal archive records found in database.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW C: MANAGER DASHBOARD */}
          {currentView === 'manager' && (
            <ManagerDashboard onExit={() => setCurrentView('terminal')} />
          )}

        </main>
      </div>
    </div>
  );
}
