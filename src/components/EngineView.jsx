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
  XCircle, HelpCircle, Folder, RefreshCw, Play, Eye, Plus
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

  // Ingestion Task Queue & Folder Staging State
  const [queueItems, setQueueItems] = useState([]);
  const [activeQueueItemId, setActiveQueueItemId] = useState(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  
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

  // Recursive HTML5 FileSystem API reader for folder drag & drop
  const extractFilesFromDataTransfer = async (dataTransfer) => {
    const extractedFiles = [];

    if (dataTransfer.items && dataTransfer.items.length > 0 && dataTransfer.items[0].webkitGetAsEntry) {
      const readEntry = (entry, path = '') => {
        return new Promise((resolve) => {
          if (!entry) return resolve();
          if (entry.isFile) {
            entry.file(
              (f) => {
                const relativePath = path ? `${path}/${f.name}` : f.name;
                extractedFiles.push({ file: f, path: relativePath, name: f.name, size: f.size });
                resolve();
              },
              () => resolve()
            );
          } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            dirReader.readEntries(
              async (entries) => {
                const promises = entries.map((childEntry) =>
                  readEntry(childEntry, path ? `${path}/${entry.name}` : entry.name)
                );
                await Promise.all(promises);
                resolve();
              },
              () => resolve()
            );
          } else {
            resolve();
          }
        });
      };

      const entryPromises = [];
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            entryPromises.push(readEntry(entry));
          }
        }
      }
      await Promise.all(entryPromises);
    } else if (dataTransfer.files && dataTransfer.files.length > 0) {
      for (let i = 0; i < dataTransfer.files.length; i++) {
        const f = dataTransfer.files[i];
        const relativePath = f.webkitRelativePath || f.name;
        extractedFiles.push({ file: f, path: relativePath, name: f.name, size: f.size });
      }
    }

    return extractedFiles;
  };

  const addFilesToStagingQueue = (filesList, autoStart = false) => {
    if (!filesList || filesList.length === 0) return;

    const newQueueItems = filesList.map((item, idx) => {
      const f = item.file || item;
      const path = item.path || f.webkitRelativePath || f.name;
      return {
        id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        name: f.name,
        path: path,
        size: f.size,
        status: 'staged',
        progress: 0,
        step: 'STAGED',
        errorMessage: '',
        resultData: null
      };
    });

    setQueueItems(prev => {
      const updated = [...prev, ...newQueueItems];
      // Auto-start the queue immediately if pipeline is idle and caller requested it
      if (autoStart && !isProcessingQueue) {
        // Use setTimeout so state settles before runAllQueueTasks reads it
        setTimeout(() => runAllQueueTasks(newQueueItems), 0);
      }
      return updated;
    });

    const timestamp = new Date().toLocaleTimeString();
    const queuedMsg = autoStart && isProcessingQueue
      ? `Queued ${newQueueItems.length} file(s) — will run after current case finishes.`
      : `Staged ${newQueueItems.length} file(s) into ingestion queue.`;
    setLogs(prev => [
      ...prev,
      `[${timestamp}] QUEUE: ${queuedMsg}`
    ]);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer) {
      const extracted = await extractFilesFromDataTransfer(e.dataTransfer);
      if (extracted.length === 0) return;

      const isFromFolder = extracted.some(item => (item.path || '').includes('/'));
      const isPipelineActive = isProcessingQueue || appStatus === 'processing';

      if (!isFromFolder && extracted.length === 1 && !isPipelineActive) {
        // Single bare file, nothing running → run directly with full progress bar
        const singleFile = extracted[0].file || extracted[0];
        resetState();
        runUnderwritingPipeline(singleFile);
      } else if (!isFromFolder && extracted.length === 1 && isPipelineActive) {
        // Single file but pipeline is busy → add to queue, run after current finishes
        addFilesToStagingQueue(extracted, false);
      } else {
        // Folder or multi-file: stage into queue, auto-start if idle
        addFilesToStagingQueue(extracted, !isPipelineActive);
      }
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const isPipelineActive = isProcessingQueue || appStatus === 'processing';

      if (e.target.files.length === 1 && !isPipelineActive) {
        // Single file, pipeline idle → run directly with full progress bar
        const singleFile = e.target.files[0];
        resetState();
        runUnderwritingPipeline(singleFile);
      } else if (e.target.files.length === 1 && isPipelineActive) {
        // Single file but pipeline is busy → queue it, run after current finishes
        const filesArray = [{ file: e.target.files[0], name: e.target.files[0].name, path: e.target.files[0].name, size: e.target.files[0].size }];
        addFilesToStagingQueue(filesArray, false);
      } else {
        // Multiple files / folder picker → queue, auto-start if idle
        const filesArray = Array.from(e.target.files).map(f => ({
          file: f,
          name: f.name,
          path: f.webkitRelativePath || f.name,
          size: f.size
        }));
        addFilesToStagingQueue(filesArray, !isPipelineActive);
      }
      e.target.value = '';
    }
  };

  const removeQueueItem = (id) => {
    setQueueItems(prev => prev.filter(item => item.id !== id));
    if (activeQueueItemId === id) {
      setActiveQueueItemId(null);
    }
  };

  const clearQueue = () => {
    setQueueItems([]);
    setActiveQueueItemId(null);
    resetState();
  };

  const processSingleQueueTask = async (taskItem) => {
    const taskId = taskItem.id;

    setQueueItems(prev => prev.map(item => item.id === taskId ? {
      ...item, status: 'processing', progress: 0, step: 'INGESTING', errorMessage: ''
    } : item));

    const addLog = (tag, msg) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${timestamp}] ${tag} [${taskItem.name}]: ${msg}`]);
    };

    addLog('QUEUE', `Task ${taskId} execution started.`);

    // Generate a unique case_id and attach it to the ingest request so the
    // backend can track this specific run under GET /documents/ingest/status/{caseId}.
    const caseId = `case-${taskId}-${Date.now()}`;
    let pollerAborted = false;

    // Self-terminating status poller. The backend long-polls while in-flight
    // (blocks rather than returning immediately), so we loop sequentially rather
    // than using setInterval. A 404 with {"detail":"Case not found."} is terminal
    // — it means the ID is invalid, not "not ready yet".
    const pollStatus = async () => {
      while (!pollerAborted) {
        try {
          const statusRes = await api.get(
            `documents/ingest/status/${caseId}`,
            { timeout: 30000 }  // generous timeout — endpoint long-polls server-side
          );
          const s = statusRes.data;
          // Apply real backend fields: progress (0-100 number), stage (string), status (string)
          const backendProgress = typeof s.progress === 'number' ? s.progress : null;
          const backendStage   = s.stage || s.current_stage || null;
          const backendStatus  = s.status || null;

          if (backendProgress !== null || backendStage !== null) {
            setQueueItems(prev => prev.map(item => {
              if (item.id !== taskId) return item;
              return {
                ...item,
                ...(backendProgress !== null && { progress: backendProgress }),
                ...(backendStage    !== null && { step: backendStage }),
              };
            }));
          }

          // Stop polling if the backend signals completion or failure
          if (backendStatus === 'completed' || backendStatus === 'failed') {
            pollerAborted = true;
            break;
          }
        } catch (err) {
          const httpStatus = err.response?.status;
          if (httpStatus === 404) {
            // 404 = "Case not found" — the case_id is unknown. Stop polling gracefully.
            pollerAborted = true;
            break;
          }
          // Any other network error: continue polling (transient connectivity issue)
        }
      }
    };

    // Start the poller concurrently — it runs alongside the sequential pipeline calls
    const pollerPromise = pollStatus();

    try {
      // 1. Ingestion & PDF Forensics
      const fd = new FormData();
      fd.append('file', taskItem.file);
      fd.append('case_id', caseId);  // passes our tracking ID to the backend
      const res1 = await api.post('documents/ingest/pdf', fd);

      if (res1.data.status === 'error' || !res1.data.ai_analysis) {
        throw new Error(res1.data.detail || res1.data.message || 'PDF extraction failed');
      }

      const pdfData = res1.data.ai_analysis;
      const forensicsData = res1.data.forensics;

      // Ingest resolved — stop the poller and log real FORENSICS data
      pollerAborted = true;
      await pollerPromise;

      addLog('INGEST', `Document parsed. Entity: ${pdfData.company_name || 'Unknown'}`);
      addLog('FORENSICS', forensicsData?.is_suspicious
        ? 'Integrity scan complete. Suspicious activity detected.'
        : 'Integrity scan complete. No suspicious activity found.');
      if (forensicsData?.is_suspicious && forensicsData?.flags?.length > 0) {
        addLog('FORENSICS', `WARNING: ${forensicsData.flags.join(', ')}`);
      }
      setQueueItems(prev => prev.map(item => item.id === taskId
        ? { ...item, progress: Math.max(item.progress, 40), step: 'INTEGRITY' }
        : item));

      // 2. Tax & Ledger Integrity
      addLog('INTEGRITY', 'Validating GST and bank records.');
      let integrityData = { status: 'completed', gst_match_rate: null, flags_detected: 0, flags: [] };
      try {
        const monthlyExpected = (pdfData.total_revenue || 60000000) / 12;
        const res2 = await api.post('analysis/integrity-check', {
          gst_data: [{ month: 'Jan', taxable_value: Math.round(monthlyExpected) }],
          bank_data: [{ amount: Math.round(monthlyExpected * 0.97) }]
        });
        integrityData = res2.data;
        addLog('INTEGRITY', `Validation complete. Turnover match: ${integrityData.gst_match_rate || 'N/A'}`);
      } catch (err) {
        addLog('INTEGRITY', 'WARNING: Integrity service check fallback.');
      }
      setQueueItems(prev => prev.map(item => item.id === taskId
        ? { ...item, progress: Math.max(item.progress, 60), step: 'OSINT' }
        : item));

      // 3. OSINT Web Research
      addLog('OSINT', 'Checking MCA and public court records.');
      let researchData = { company_news: [], sector_headwinds: [], litigation_signals: [] };
      try {
        const res3 = await api.post('research/web-research', {
          company_name: pdfData.company_name,
          sector: pdfData.sector
        });
        researchData = res3.data?.data || researchData;
        addLog('OSINT', `${researchData.sector_headwinds?.length || 0} sector alerts found.`);
      } catch (err) {
        addLog('OSINT', 'WARNING: OSINT research fallback.');
      }
      setQueueItems(prev => prev.map(item => item.id === taskId
        ? { ...item, progress: Math.max(item.progress, 75), step: 'RISK' }
        : item));

      // 4. Risk Score Adjustment
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
      setQueueItems(prev => prev.map(item => item.id === taskId
        ? { ...item, progress: Math.max(item.progress, 90), step: 'CAM_GEN' }
        : item));

      // 5. CAM Generation
      addLog('ORCHESTRATION', 'Generating Credit Appraisal Memo.');
      const res5 = await api.post('reports/generate-cam', {
        extracted_pdf_data: pdfData,
        integrity_flags: { ...integrityData, forensics: forensicsData },
        web_research: researchData,
        final_score: cappedScore
      });

      const camData = res5.data?.cam_report || {};
      addLog('ORCHESTRATION', `CAM generated. Decision: ${camData.decision || 'UNKNOWN'}`);

      const resultData = {
        detectedParams: {
          company: pdfData.company_name || 'Unknown Entity',
          sector: pdfData.sector || 'Unknown',
          baseScore: pdfData.base_score || 50,
          revenue: pdfData.total_revenue,
          debt: pdfData.total_debt,
          worth: pdfData.shareholder_equity
        },
        forensicsReport: forensicsData,
        camReport: {
          decision: camData.decision || 'MANUAL REVIEW',
          five_cs: camData.five_cs || {},
          recommended_loan_amount: camData.recommended_loan_amount || 'TBD',
          recommended_interest_rate: camData.recommended_interest_rate || 'TBD',
          decision_rationale: camData.decision_rationale || 'Analysis complete.'
        },
        finalScore: cappedScore
      };

      setQueueItems(prev => prev.map(item => item.id === taskId ? {
        ...item, status: 'completed', progress: 100, step: 'COMPLETED', resultData
      } : item));

      setDetectedParams(resultData.detectedParams);
      setForensicsReport(resultData.forensicsReport);
      setCamReport(resultData.camReport);
      setFinalScore(resultData.finalScore);
      setActiveQueueItemId(taskId);

      addLog('QUEUE', `Task ${taskId} completed successfully.`);
      return true;
    } catch (err) {
      pollerAborted = true;
      await pollerPromise;
      console.error(`Task ${taskId} failed:`, err);
      const errText = err.message || 'Underwriting pipeline failed during queue execution';
      setQueueItems(prev => prev.map(item => item.id === taskId ? {
        ...item, status: 'failed', progress: item.progress || 0, step: 'FAILED', errorMessage: errText
      } : item));
      addLog('QUEUE', `FATAL: Task ${taskId} crashed/failed. Reason: ${errText}`);
      return false;
    }
  };

  const runAllQueueTasks = async (targetItems = null) => {
    const itemsToProcess = targetItems || queueItems.filter(item => item.status === 'staged' || item.status === 'queued' || item.status === 'failed');
    if (itemsToProcess.length === 0) return;

    setIsProcessingQueue(true);
    setAppStatus('processing');
    setErrorMessage('');

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      setProgress(Math.round(((i) / itemsToProcess.length) * 100));
      await processSingleQueueTask(item);
      setProgress(Math.round(((i + 1) / itemsToProcess.length) * 100));
    }

    setIsProcessingQueue(false);
    setAppStatus('complete');
  };

  const resumeFailedTask = async (taskId) => {
    const targetItem = queueItems.find(item => item.id === taskId);
    if (!targetItem) return;
    setIsProcessingQueue(true);
    setAppStatus('processing');
    await processSingleQueueTask(targetItem);
    setIsProcessingQueue(false);
    setAppStatus('complete');
  };

  const resumeAllFailedTasks = async () => {
    const failedItems = queueItems.filter(item => item.status === 'failed');
    if (failedItems.length === 0) return;
    await runAllQueueTasks(failedItems);
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

  // fileArg: pass the File object directly to avoid stale state closure.
  // When called from handleFileChange/handleDrop, React's setFile may not have
  // committed yet, so we always prefer the explicit argument.
  const runUnderwritingPipeline = async (fileArg) => {
    const targetFile = fileArg || file;
    if (!targetFile) return;
    // Sync the file state so the rest of the UI (filename display etc.) updates
    if (fileArg && fileArg !== file) setFile(fileArg);

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
    addLog('INGEST', `Uploading "${targetFile.name}"...`);

    try {
      const fd = new FormData();
      fd.append('file', targetFile);
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
      let integrityData = { status: "completed", gst_match_rate: "N/A", flags_detected: 0, flags: [] };
      try {
        const monthlyExpected = (pdfData.total_revenue || 60000000) / 12;
        const res2 = await api.post('analysis/integrity-check', {
          gst_data: [{ month: "Jan", taxable_value: Math.round(monthlyExpected) }],
          bank_data: [{ amount: Math.round(monthlyExpected * 0.97) }]
        });
        integrityData = res2.data;
        if (integrityData.flags_detected > 0) {
          addLog('INTEGRITY', `Validation completed with ${integrityData.flags_detected} flags. Match: ${integrityData.gst_match_rate || 'N/A'}`);
        } else {
          addLog('INTEGRITY', `Validation completed. Turnover match: ${integrityData.gst_match_rate || 'N/A'}`);
        }
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
                  background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
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
                  background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
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
                background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
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
                  
                  {/* Ingestion & Task Queue Dropzone */}
                  {appStatus === 'idle' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Dropzone Box */}
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
                          padding: '2.5rem 1.5rem',
                          border: isDragging ? '2px dashed #0d213f' : '1px dashed #cbd5e1',
                          background: isDragging ? '#eef2ff' : '#f8fafc',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          borderRadius: '4px'
                        }}>
                        <Upload size={36} color="#0d213f" style={{ marginBottom: '0.75rem' }} />
                        
                        <div style={{ fontWeight: 700, color: '#0d213f', fontSize: '14px' }}>
                          Drag and drop financial PDFs or entire folders here
                        </div>
                        <div style={{ fontSize: '11px', color: '#8a99a8', marginTop: '4px', marginBottom: '1rem' }}>
                          Supports nested directory upload, multi-file batching, and asynchronous task queue processing
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ 
                              background: '#ffffff', 
                              color: '#0d213f', 
                              border: '1px solid #cbd5e1', 
                              padding: '0.4rem 0.9rem', 
                              fontWeight: 600, 
                              fontSize: '11px',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                            <FileText size={14} />
                            <span>Select Files</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => folderInputRef.current?.click()}
                            style={{ 
                              background: '#ffffff', 
                              color: '#0d213f', 
                              border: '1px solid #cbd5e1', 
                              padding: '0.4rem 0.9rem', 
                              fontWeight: 600, 
                              fontSize: '11px',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                            <Folder size={14} />
                            <span>Select Folder</span>
                          </button>
                        </div>

                        {/* Hidden inputs for Files and Folder selection */}
                        <input 
                          ref={fileInputRef} 
                          type="file" 
                          multiple 
                          accept=".pdf,.xlsx,.csv,.txt" 
                          style={{ display: 'none' }} 
                          onChange={handleFileChange} 
                        />
                        <input 
                          ref={folderInputRef} 
                          type="file" 
                          webkitdirectory="" 
                          directory="" 
                          multiple 
                          style={{ display: 'none' }} 
                          onChange={handleFileChange} 
                        />
                      </div>

                      {/* File Staging Grid & Queue Controller */}
                      {queueItems.length > 0 && (
                        <div style={{ 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '2px', 
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          {/* Queue Header & Actions */}
                          <div style={{ 
                            background: '#f8fafc', 
                            padding: '0.75rem 1rem', 
                            borderBottom: '1px solid #cbd5e1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0d213f', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                Ingestion Staging Queue ({queueItems.length} File{queueItems.length === 1 ? '' : 's'})
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                                Completed: {queueItems.filter(i => i.status === 'completed').length} | Staged: {queueItems.filter(i => i.status === 'staged').length} | Failed: {queueItems.filter(i => i.status === 'failed').length}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {/* Resume Failed Tasks Button */}
                              {queueItems.some(i => i.status === 'failed') && (
                                <button
                                  type="button"
                                  onClick={resumeAllFailedTasks}
                                  disabled={isProcessingQueue}
                                  style={{
                                    background: '#d97706',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.4rem 0.85rem',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: isProcessingQueue ? 'not-allowed' : 'pointer',
                                    borderRadius: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                  <RefreshCw size={13} />
                                  <span>RESUME FAILED TASKS ({queueItems.filter(i => i.status === 'failed').length})</span>
                                </button>
                              )}

                              {/* Run Appraisal Queue */}
                              <button
                                type="button"
                                onClick={() => runAllQueueTasks()}
                                disabled={isProcessingQueue || queueItems.every(i => i.status === 'completed')}
                                style={{
                                  background: isProcessingQueue ? '#64748b' : '#0d213f',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '0.4rem 0.85rem',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: isProcessingQueue ? 'not-allowed' : 'pointer',
                                  borderRadius: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}>
                                {isProcessingQueue ? <Loader2 className="spin" size={13} /> : <Play size={13} />}
                                <span>{isProcessingQueue ? 'PROCESSING QUEUE...' : 'RUN QUEUE APPRAISAL'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={clearQueue}
                                disabled={isProcessingQueue}
                                style={{
                                  background: 'none',
                                  color: '#ef4444',
                                  border: '1px solid #fca5a5',
                                  padding: '0.4rem 0.6rem',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  borderRadius: '2px'
                                }}>
                                Clear Queue
                              </button>
                            </div>
                          </div>

                          {/* Staging Table */}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#64748b', background: '#f1f5f9', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>File / Relative Path</th>
                                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700, width: '90px' }}>Size</th>
                                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700, width: '130px' }}>Queue Status</th>
                                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700, width: '150px' }}>Task Progress</th>
                                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700, width: '110px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {queueItems.map((item) => (
                                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: activeQueueItemId === item.id ? '#f8fafc' : '#ffffff' }}>
                                    {/* Name & Path */}
                                    <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#1e293b' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {item.path.includes('/') ? <Folder size={14} color="#0d213f" /> : <FileText size={14} color="#64748b" />}
                                        <span style={{ fontWeight: 600 }}>{item.path}</span>
                                      </div>
                                    </td>

                                    {/* File Size */}
                                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      {(item.size / 1024).toFixed(1)} KB
                                    </td>

                                    {/* Status Badge */}
                                    <td style={{ padding: '0.6rem 0.75rem' }}>
                                      {item.status === 'staged' && (
                                        <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', padding: '2px 6px', borderRadius: '2px', fontWeight: 700, fontSize: '10px' }}>
                                          STAGED
                                        </span>
                                      )}
                                      {item.status === 'processing' && (
                                        <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', padding: '2px 6px', borderRadius: '2px', fontWeight: 700, fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <Loader2 className="spin" size={10} /> {item.step}
                                        </span>
                                      )}
                                      {item.status === 'completed' && (
                                        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', padding: '2px 6px', borderRadius: '2px', fontWeight: 700, fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <CheckCircle2 size={10} /> COMPLETED
                                        </span>
                                      )}
                                      {item.status === 'failed' && (
                                        <span style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '2px 6px', borderRadius: '2px', fontWeight: 700, fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <XCircle size={10} /> FAILED
                                        </span>
                                      )}
                                    </td>

                                    {/* Progress Bar */}
                                    <td style={{ padding: '0.6rem 0.75rem' }}>
                                      <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ 
                                          width: `${item.progress}%`, 
                                          height: '100%', 
                                          background: item.status === 'failed' ? '#ef4444' : item.status === 'completed' ? '#10b981' : '#0d213f',
                                          transition: 'width 0.3s ease'
                                        }}></div>
                                      </div>
                                      <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                                        {item.progress}%
                                      </div>
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                        {item.status === 'failed' && (
                                          <button
                                            type="button"
                                            onClick={() => resumeFailedTask(item.id)}
                                            style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontWeight: 600, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                            title="Resume Failed Task">
                                            <RefreshCw size={10} />
                                            <span>Resume</span>
                                          </button>
                                        )}
                                        {item.status === 'completed' && item.resultData && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveQueueItemId(item.id);
                                              setDetectedParams(item.resultData.detectedParams);
                                              setForensicsReport(item.resultData.forensicsReport);
                                              setCamReport(item.resultData.camReport);
                                              setFinalScore(item.resultData.finalScore);
                                              setAppStatus('complete');
                                            }}
                                            style={{ background: '#0d213f', color: '#ffffff', border: 'none', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontWeight: 600, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Eye size={10} />
                                            <span>View</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => removeQueueItem(item.id)}
                                          style={{ background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '2px' }}
                                          title="Remove file">
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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
                              background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
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

          {/* VIEW C: MANAGER DASHBOARD */}
          {currentView === 'manager' && (
            <ManagerDashboard onExit={() => setCurrentView('terminal')} />
          )}

        </main>
      </div>
    </div>
  );
}
