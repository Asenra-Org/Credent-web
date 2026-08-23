// =============================================================================
// ASE-51 [QA-W6] — PDF-vs-Dashboard Data Invariance Tests
// =============================================================================
//
// downloadPDF() draws directly onto a jsPDF canvas — there is no plain-text
// output to diff against. To verify "PDF contents match the screen" without
// rendering and OCR'ing a real PDF, we mock jsPDF *and* jspdf-autotable and
// capture every string written through either, then assert that every value
// shown on the dashboard appears somewhere in the captured output. This
// exercises the real downloadPDF, not a reimplementation.
//
// [P1-6] Updated for the CAMDocument schema. downloadPDF now renders the
// institutional CAM (document_control / executive_summary / recommendation) and
// rejects the legacy flat shape outright:
//
//     if (!camReport || !camReport.document_control) { alert(...); return; }
//
// The previous fixture used the legacy shape, so every test hit that guard and
// captured nothing. The implementation is correct; the fixture was stale.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const capturedText = [];

const record = (value) => {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) value.forEach(record);
  else if (typeof value === 'object') Object.values(value).forEach(record);
  else capturedText.push(String(value));
};

vi.mock('jspdf', () => {
  function MockJsPDF() {
    this.internal = {
      pageSize: { width: 210, height: 297, getWidth: () => 210, getHeight: () => 297 },
      getNumberOfPages: () => 1,
    };
    this.lastAutoTable = { finalY: 40 };
    this.text = (content) => record(content);
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
    this.getTextWidth = () => 10;
    this.save = () => {};
  }
  return { default: MockJsPDF, jsPDF: MockJsPDF };
});

// Most CAM content is written through autoTable rows rather than doc.text.
vi.mock('jspdf-autotable', () => {
  const autoTable = (doc, options = {}) => {
    record(options.head);
    record(options.body);
    if (doc) doc.lastAutoTable = { finalY: 60 };
  };
  return { default: autoTable, autoTable };
});

const { downloadPDF } = await import('../utils/generatePdf');

beforeEach(() => {
  capturedText.length = 0;
});

const joined = () => capturedText.join('\n');

// Mirrors what the dashboard shows for a selected appraisal.
const DASHBOARD_DETECTED_PARAMS = {
  company: 'Vikram Precision Engineering Pvt Ltd',
  sector: 'Manufacturing',
  baseScore: 92,
  revenue: 100000000,
  debt: 12000000,
  worth: 18000000,
};

const DASHBOARD_CAM_REPORT = {
  document_control: {
    borrower_name: 'Vikram Precision Engineering Pvt Ltd',
    case_id: 'CRESEM-2026-0042',
    appraisal_date: '2026-08-23',
    status: 'PENDING',
    version: 'v1.0',
  },
  executive_summary: {
    industry: 'Manufacturing',
    revenue: '₹10.00 Cr',
    ebitda: '₹1.20 Cr',
    pat: '₹0.80 Cr',
    net_worth: '₹1.80 Cr',
    total_debt: '₹1.20 Cr',
    dscr: '1.85',
    current_ratio: '1.42',
    strengths: ['Consistent revenue growth'],
    key_concerns: ['Sector cyclicality'],
    critical_conditions: [],
  },
  borrower_profile: {
    legal_name: 'Vikram Precision Engineering Pvt Ltd',
    business_activity: 'Precision component manufacturing',
  },
  five_cs: {
    character: { evidence: 'CMR-3', assessment: 'Strong', risk_implication: 'Low' },
    capacity: { evidence: 'DSCR 1.85', assessment: 'Strong', risk_implication: 'Low' },
    capital: { evidence: 'Net worth 1.8 Cr', assessment: 'Adequate', risk_implication: 'Medium' },
    collateral: { evidence: 'Plant and machinery', assessment: 'Sufficient', risk_implication: 'Low' },
    conditions: { evidence: 'Manufacturing outlook', assessment: 'Favorable', risk_implication: 'Low' },
  },
  recommendation: {
    decision: 'APPROVE',
    rationale: 'Strong financials across all five Cs.',
    conditions: [],
  },
  // Flat mirrors the backend also sets for legacy callers.
  decision: 'APPROVE',
  recommended_loan_amount: 'INR 50,00,000',
  recommended_interest_rate: '12.5%',
  decision_rationale: 'Strong financials across all five Cs.',
};

describe('downloadPDF — data invariance with dashboard', () => {
  it('company name shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(joined()).toContain(DASHBOARD_DETECTED_PARAMS.company);
  });

  it('sector shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(joined()).toContain(DASHBOARD_DETECTED_PARAMS.sector);
  });

  it('case id is carried into the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(joined()).toContain('CRESEM-2026-0042');
  });

  it('final decision shown on screen appears identically in the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(joined()).toContain('APPROVE');
  });

  it('decision rationale text matches between screen and PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    expect(joined()).toContain('Strong financials across all five Cs.');
  });

  it('all five Cs assessments reach the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    const text = joined();
    for (const marker of ['CMR-3', 'DSCR 1.85', 'Plant and machinery']) {
      expect(text).toContain(marker);
    }
  });

  it('headline financials reach the PDF', () => {
    downloadPDF(DASHBOARD_CAM_REPORT, DASHBOARD_DETECTED_PARAMS);
    const text = joined();
    expect(text).toContain('1.85');   // DSCR
    expect(text).toContain('1.42');   // current ratio
  });

  it('missing/null fields render placeholders rather than "undefined" or crashing', () => {
    const sparse = {
      document_control: { borrower_name: 'Sparse Borrower Ltd' },
      executive_summary: {},
      five_cs: {},
      recommendation: {},
    };
    expect(() => downloadPDF(sparse, {})).not.toThrow();
    const text = joined();
    expect(text).toContain('Sparse Borrower Ltd');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('NaN');
  });

  it('rejects the legacy flat CAM shape instead of emitting a malformed PDF', () => {
    // A pre-CAMDocument report must not silently produce a broken memo.
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const legacy = {
      decision: 'APPROVE',
      five_cs: { character: 'Strong' },
    };
    downloadPDF(legacy, DASHBOARD_DETECTED_PARAMS);
    expect(alertSpy).toHaveBeenCalled();
    expect(capturedText.length).toBe(0);
    alertSpy.mockRestore();
  });

  it('downloadPDF does not crash and alerts when data is entirely missing', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    expect(() => downloadPDF(null, null)).not.toThrow();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
