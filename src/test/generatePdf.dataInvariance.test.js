// =============================================================================
// ASE-51 [QA-W6] — PDF-vs-Dashboard Data Invariance Tests
// =============================================================================
//
// downloadPDF() draws directly onto a jsPDF canvas via doc.text(...) calls —
// there's no plain-text output to diff against. To genuinely verify "PDF
// contents are identical to screen parameters" without rendering and OCR'ing
// an actual PDF binary, we mock jsPDF and capture every string passed to
// doc.text(), then assert that every value shown on the dashboard actually
// appears somewhere in the captured PDF output. This tests the REAL
// downloadPDF function, not a reimplementation of it.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const capturedText = [];

vi.mock('jspdf', () => {
  function MockJsPDF() {
    this.internal = {
      pageSize: { width: 210 },
      getNumberOfPages: () => 1,
    };
    this.text = (content) => {
      if (Array.isArray(content)) capturedText.push(...content);
      else capturedText.push(content);
    };
    this.setFont = () => {};
    this.setFontSize = () => {};
    this.setTextColor = () => {};
    this.setFillColor = () => {};
    this.setDrawColor = () => {};
    this.rect = () => {};
    this.roundedRect = () => {};
    this.line = () => {};
    this.addPage = () => {};
    this.setPage = () => {};
    this.setLineWidth = () => {};
    this.splitTextToSize = (text) => [String(text)];
    this.save = () => {};
  }
  return { jsPDF: MockJsPDF };
});

const { downloadPDF } = await import('../utils/generatePdf');

beforeEach(() => {
  capturedText.length = 0;
});

// This is the same shape of data the dashboard actually displays for a
// selected appraisal (mirrors ManagerDashboard's detail view + camReport).
const DASHBOARD_DETECTED_PARAMS = {
  company: 'Vikram Precision Engineering Pvt Ltd',
  sector: 'Manufacturing',
  baseScore: 92,
  revenue: 100000000,
  debt: 12000000,
  worth: 18000000,
};

const DASHBOARD_CAM_REPORT = {
  decision: 'APPROVE',
  recommended_loan_amount: 'INR 50,00,000',
  recommended_interest_rate: '12.5%',
  decision_rationale: 'Strong financials across all five Cs.',
  five_cs: {
    character: 'Strong',
    capacity: 'Strong',
    capital: 'Adequate',
    collateral: 'Sufficient',
    conditions: 'Favorable',
  },
};

describe('downloadPDF — data invariance with dashboard', () => {
  it('company name shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText).toContain(DASHBOARD_DETECTED_PARAMS.company);
  });

  it('sector shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText).toContain(DASHBOARD_DETECTED_PARAMS.sector);
  });

  it('base score shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText.some(t => t.includes('92'))).toBe(true);
  });

  it('final decision shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText.some(t => t.includes('APPROVE'))).toBe(true);
  });

  it('recommended loan amount matches exactly between screen and PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText).toContain(DASHBOARD_CAM_REPORT.recommended_loan_amount);
  });

  it('recommended interest rate matches exactly between screen and PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText).toContain(DASHBOARD_CAM_REPORT.recommended_interest_rate);
  });

  it('decision rationale text matches between screen and PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(capturedText).toContain(DASHBOARD_CAM_REPORT.decision_rationale);
  });

  it('missing/null fields render as "N/A" or "Unknown" rather than "undefined" or crashing', () => {
    const incompleteParams = { company: 'Incomplete Co', sector: null, baseScore: undefined, revenue: null, debt: null, worth: null };
    const incompleteCam = { decision: null, recommended_loan_amount: null, recommended_interest_rate: null, decision_rationale: null, five_cs: {} };

    expect(() => downloadPDF(incompleteCam, incompleteParams)).not.toThrow();
    expect(capturedText.some(t => t.includes('undefined'))).toBe(false);
    expect(capturedText).toContain('Unknown'); // sector fallback
  });

  it('downloadPDF does not crash and shows an alert when data is entirely missing', () => {
    const originalAlert = global.alert;
    global.alert = vi.fn();

    downloadPDF(null, null);

    expect(global.alert).toHaveBeenCalledWith('No report data available to download.');
    global.alert = originalAlert;
  });
});