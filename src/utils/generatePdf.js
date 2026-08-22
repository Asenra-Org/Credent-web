import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Strict Monochrome Palette
const PALETTE = {
  primary: [24, 24, 27],     // Zinc 900
  secondary: [113, 113, 122], // Zinc 500
  light: [244, 244, 245],    // Zinc 100
  white: [255, 255, 255],
  border: [228, 228, 231],   // Zinc 200
  
  // Muted status colors (professional)
  success: [6, 78, 59],      // Emerald 900
  successBg: [236, 253, 245], // Emerald 50
  warning: [146, 64, 14],    // Amber 900
  warningBg: [255, 251, 235], // Amber 50
  danger: [153, 27, 27],     // Red 900
  dangerBg: [254, 242, 242]  // Red 50
};

/**
 * Format currency gracefully
 */
const fmtCurrency = (val) => {
  if (!val || val === "NOT PROVIDED" || val === "NOT COMPUTABLE" || val === "MISSING") return val || "NOT PROVIDED";
  if (typeof val === 'string' && val.includes('Cr')) return val;
  if (typeof val === 'string' && isNaN(Number(val))) return val;
  const num = Number(val);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

export const downloadPDF = (camReport, detectedParams) => {
  if (!camReport || !camReport.document_control) {
    alert("CAM Report data is incomplete or legacy format. Please re-run ingestion.");
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPos = 15;
  
  const caseId = camReport.document_control?.case_id || "CRESEM-XXXX";

  // --- Helpers ---
  const addHeader = () => {
    doc.setFillColor(...PALETTE.primary);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(...PALETTE.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CREDIT APPRAISAL MEMORANDUM", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("CONFIDENTIAL - INTERNAL CREDIT USE", margin, 18);
    doc.text(`CASE ID: ${caseId}`, pageWidth - margin - 40, 15);
    yPos = 35;
  };

  const addFooter = (data) => {
    doc.setDrawColor(...PALETTE.border);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setTextColor(...PALETTE.secondary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("CRESEM | EVIDENCE-BACKED UNDERWRITING", margin, pageHeight - 8);
    doc.text(`Page ${data.pageNumber} of ${data.pageCount}`, pageWidth - margin - 20, pageHeight - 8);
  };

  const checkPageBreak = (neededHeight) => {
    if (yPos + neededHeight > pageHeight - 20) {
      doc.addPage();
      addHeader();
      return true;
    }
    return false;
  };

  const drawSectionTitle = (title) => {
    checkPageBreak(15);
    doc.setFillColor(...PALETTE.light);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
    doc.setTextColor(...PALETTE.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin + 2, yPos + 5);
    yPos += 12;
  };

  // Set initial header
  addHeader();

  // ---------------------------------------------------------
  // 1. DOCUMENT CONTROL & EXECUTIVE SUMMARY
  // ---------------------------------------------------------
  drawSectionTitle("0. DOCUMENT CONTROL");
  
  const dc = camReport.document_control || {};
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin },
    tableWidth: pageWidth - (margin * 2),
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1, textColor: PALETTE.primary },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 2: { fontStyle: 'bold', cellWidth: 40 } },
    body: [
      ["Borrower Name:", dc.borrower_name || "Unknown", "Appraisal Date:", dc.appraisal_date || new Date().toISOString().slice(0,10)],
      ["Case ID:", dc.case_id || caseId, "Status:", dc.status || "PENDING"],
      ["Version:", dc.version || "v1.0", "Prepared By:", "CRESEM System"]
    ]
  });
  yPos = doc.lastAutoTable.finalY + 10;

  drawSectionTitle("1. EXECUTIVE CREDIT SUMMARY");
  
  const es = camReport.executive_summary || {};
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin },
    tableWidth: pageWidth - (margin * 2),
    theme: 'grid',
    styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
    headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
    head: [["Metric", "Value", "Metric", "Value"]],
    body: [
      ["Industry", es.industry || "NOT PROVIDED", "Requested Facility", es.facility_requested || "NOT PROVIDED"],
      ["Total Revenue", fmtCurrency(es.revenue), "Total Debt", fmtCurrency(es.total_debt)],
      ["Net Worth", fmtCurrency(es.net_worth), "EBITDA", fmtCurrency(es.ebitda)],
      ["Current Ratio", es.current_ratio || "N/A", "DSCR", es.dscr || "N/A"]
    ]
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Strengths & Concerns
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("EXECUTIVE CREDIT VIEW", margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Key Strengths:", margin, yPos);
  yPos += 4;
  doc.setFont("helvetica", "normal");
  (es.strengths || []).forEach(s => {
    checkPageBreak(5);
    const lines = doc.splitTextToSize(`• ${s}`, pageWidth - (margin * 2));
    doc.text(lines, margin + 2, yPos);
    yPos += (lines.length * 4);
  });
  yPos += 2;

  doc.setFont("helvetica", "bold");
  doc.text("Key Concerns:", margin, yPos);
  yPos += 4;
  doc.setFont("helvetica", "normal");
  (es.key_concerns || []).forEach(c => {
    checkPageBreak(5);
    const lines = doc.splitTextToSize(`• ${c}`, pageWidth - (margin * 2));
    doc.text(lines, margin + 2, yPos);
    yPos += (lines.length * 4);
  });
  yPos += 5;

  // ---------------------------------------------------------
  // 2. BORROWER PROFILE & FACILITY
  // ---------------------------------------------------------
  drawSectionTitle("2. BORROWER & FACILITY PROFILE");
  
  const bp = camReport.borrower_profile || {};
  const fac = camReport.facility || {};
  
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin },
    tableWidth: pageWidth - (margin * 2),
    theme: 'grid',
    styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
    headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
    body: [
      [{content: 'Borrower Details', colSpan: 2, styles: {fontStyle: 'bold', fillColor: PALETTE.light}}, {content: 'Facility Request', colSpan: 2, styles: {fontStyle: 'bold', fillColor: PALETTE.light}}],
      ["Legal Name", bp.legal_name, "Facility Type", fac.facility_type],
      ["Incorporation", bp.incorporation_date, "Requested Amount", fmtCurrency(fac.requested_amount)],
      ["Location", bp.registered_location, "Tenor", fac.tenor],
      ["Business Act.", bp.business_activity, "Repayment", fac.repayment_structure],
      ["Years in Ops", bp.years_in_operation, "Security", fac.security],
      ["Existing Lenders", bp.existing_lenders, "", ""]
    ]
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // ---------------------------------------------------------
  // 3. MANAGEMENT & BUSINESS ASSESSMENT
  // ---------------------------------------------------------
  drawSectionTitle("3. MANAGEMENT & BUSINESS ASSESSMENT");
  
  const mgmt = camReport.management || {};
  const bus = camReport.business || {};

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin },
    tableWidth: pageWidth - (margin * 2),
    theme: 'grid',
    styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    body: [
      ["Promoter Background", mgmt.promoter_background],
      ["Management Capability", mgmt.management_capability],
      ["Governance Indicators", mgmt.governance_indicators],
      ["Related Party Concerns", mgmt.related_party_concerns],
      ["Business Model", bus.business_model],
      ["Revenue Drivers", bus.revenue_drivers],
      ["Competitive Position", bus.competitive_position],
      ["Industry Chars.", bus.industry_characteristics]
    ]
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // ---------------------------------------------------------
  // 4. FINANCIAL ANALYSIS
  // ---------------------------------------------------------
  drawSectionTitle("4. FINANCIAL ANALYSIS");

  const fin = camReport.financial_analysis || {};
  
  if (fin.performance && fin.performance.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("FINANCIAL PERFORMANCE", margin, yPos);
    yPos += 4;
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
      head: [["Metric", "Value", "Trend"]],
      body: fin.performance.map(m => [m.metric, m.value, m.trend])
    });
    yPos = doc.lastAutoTable.finalY + 8;
  }

  if (fin.balance_sheet && fin.balance_sheet.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("BALANCE SHEET ANALYSIS", margin, yPos);
    yPos += 4;
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
      head: [["Metric", "Value", "Trend"]],
      body: fin.balance_sheet.map(m => [m.metric, m.value, m.trend])
    });
    yPos = doc.lastAutoTable.finalY + 8;
  }

  // ---------------------------------------------------------
  // 5. KEY RATIOS
  // ---------------------------------------------------------
  drawSectionTitle("5. KEY CREDIT RATIOS");
  const rat = camReport.ratios || {};
  if (rat.key_ratios && rat.key_ratios.length > 0) {
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
      head: [["Ratio", "Value", "Interpretation", "Source"]],
      body: rat.key_ratios.map(r => [r.name, r.value, r.interpretation, r.source])
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ---------------------------------------------------------
  // 6. CROSS-DOCUMENT VERIFICATION
  // ---------------------------------------------------------
  drawSectionTitle("6. CROSS-DOCUMENT CONSISTENCY REVIEW");
  const cdv = camReport.cross_document_verification || [];
  if (cdv.length > 0) {
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
      head: [["Metric", "Source A", "Source B", "Consistency", "Observation"]],
      body: cdv.map(c => [c.metric, c.source_a, c.source_b, c.consistency, c.observation]),
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'MATCH') data.cell.styles.textColor = PALETTE.success;
          if (data.cell.raw === 'VARIANCE') data.cell.styles.textColor = PALETTE.danger;
        }
      }
    });
    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No cross-document verification performed.", margin, yPos);
    yPos += 10;
  }

  // ---------------------------------------------------------
  // 7. FIVE C's ASSESSMENT
  // ---------------------------------------------------------
  drawSectionTitle("7. 5 C's CREDIT ASSESSMENT");
  const fcs = camReport.five_cs || {};
  const cs = [
    { title: "CHARACTER", data: fcs.character },
    { title: "CAPACITY", data: fcs.capacity },
    { title: "CAPITAL", data: fcs.capital },
    { title: "COLLATERAL", data: fcs.collateral },
    { title: "CONDITIONS", data: fcs.conditions }
  ];

  cs.forEach(c => {
    if (!c.data) return;
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(c.title, margin, yPos);
    yPos += 2;
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } },
      body: [
        ["Evidence / Facts", c.data.evidence || "N/A"],
        ["Assessment", c.data.assessment || "N/A"],
        ["Risk Implication", c.data.risk_implication || "N/A"]
      ]
    });
    yPos = doc.lastAutoTable.finalY + 8;
  });

  // ---------------------------------------------------------
  // 8. RISK ASSESSMENT & FLAGS
  // ---------------------------------------------------------
  drawSectionTitle("8. RISK ASSESSMENT");
  const ra = camReport.risk_assessment?.risks || [];
  if (ra.length > 0) {
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
      head: [["Risk Area", "Level", "Evidence", "Mitigation"]],
      body: ra.map(r => [r.area, r.level, r.evidence, r.mitigation]),
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw === 'HIGH') data.cell.styles.textColor = PALETTE.danger;
          if (data.cell.raw === 'MEDIUM') data.cell.styles.textColor = PALETTE.warning;
          if (data.cell.raw === 'LOW') data.cell.styles.textColor = PALETTE.success;
        }
      }
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Red Flags
  const flags = camReport.red_flags || [];
  if (flags.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.danger);
    doc.text("KEY RED FLAGS", margin, yPos);
    yPos += 4;
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.dangerBg, textColor: PALETTE.danger, fontStyle: 'bold' },
      head: [["Finding", "Evidence", "Severity", "Implication"]],
      body: flags.map(f => [f.finding, f.evidence, f.severity, f.implication])
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ---------------------------------------------------------
  // 9. INFORMATION GAPS
  // ---------------------------------------------------------
  const gaps = camReport.information_gaps || [];
  if (gaps.length > 0) {
    drawSectionTitle("9. INFORMATION GAPS / CONDITIONS PRECEDENT");
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 8, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.warningBg, textColor: PALETTE.warning, fontStyle: 'bold' },
      head: [["Information Required", "Reason", "Priority"]],
      body: gaps.map(g => [g.requirement, g.reason, g.priority])
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ---------------------------------------------------------
  // 10. EVIDENCE TRACEABILITY REGISTER
  // ---------------------------------------------------------
  drawSectionTitle("10. EVIDENCE TRACEABILITY REGISTER");
  const evi = camReport.evidence_register || [];
  if (evi.length > 0) {
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: 'grid',
      styles: { fontSize: 7, textColor: PALETTE.primary, lineColor: PALETTE.border, lineWidth: 0.1 },
      headStyles: { fillColor: PALETTE.light, textColor: PALETTE.primary, fontStyle: 'bold' },
      head: [["Finding", "Value", "Source Document", "Page", "Status"]],
      body: evi.map(e => [e.finding, e.value, e.source_document, e.page, e.status]),
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'VERIFIED') data.cell.styles.textColor = PALETTE.success;
          if (data.cell.raw === 'CONFLICTING') data.cell.styles.textColor = PALETTE.danger;
          if (data.cell.raw === 'UNVERIFIED' || data.cell.raw === 'MISSING') data.cell.styles.textColor = PALETTE.warning;
        }
      }
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ---------------------------------------------------------
  // 11. CREDIT RECOMMENDATION
  // ---------------------------------------------------------
  checkPageBreak(60);
  drawSectionTitle("11. CREDIT RECOMMENDATION");

  const rec = camReport.recommendation || {};
  const decision = (rec.decision || camReport.decision || "PENDING").toUpperCase();
  
  let recFill = PALETTE.warningBg;
  let recText = PALETTE.warning;
  if (decision.includes('APPROVE')) {
    recFill = PALETTE.successBg;
    recText = PALETTE.success;
  } else if (decision.includes('REJECT')) {
    recFill = PALETTE.dangerBg;
    recText = PALETTE.danger;
  }

  doc.setFillColor(...recFill);
  doc.setDrawColor(...recText);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 12, 'FD');
  doc.setTextColor(...recText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`DECISION: ${decision}`, margin + 5, yPos + 8);
  yPos += 18;

  doc.setTextColor(...PALETTE.primary);
  doc.setFontSize(9);
  doc.text("Rationale:", margin, yPos);
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const rationaleLines = doc.splitTextToSize(rec.rationale || camReport.decision_rationale || "N/A", pageWidth - (margin * 2));
  doc.text(rationaleLines, margin, yPos);
  yPos += (rationaleLines.length * 4) + 5;

  if (rec.conditions && rec.conditions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Conditions:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    rec.conditions.forEach(cond => {
      checkPageBreak(5);
      const cLines = doc.splitTextToSize(`• ${cond}`, pageWidth - (margin * 2));
      doc.text(cLines, margin + 2, yPos);
      yPos += (cLines.length * 4);
    });
    yPos += 5;
  }

  // Disclaimer
  checkPageBreak(15);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.secondary);
  const disclaimer = "DISCLAIMER: CRESEM provides evidence organization, analysis and decision support based on submitted documents. Final credit authority remains with the designated credit officer / approval authority.";
  const discLines = doc.splitTextToSize(disclaimer, pageWidth - (margin * 2));
  doc.text(discLines, margin, yPos);

  // Apply footers
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // This hook provided by autotable allows us to inject footer after drawing tables.
    // However, we just draw over the page manually.
    addFooter({ pageNumber: i, pageCount: pageCount });
  }

  const companyName = (dc.borrower_name || detectedParams?.company || 'Report').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  doc.save(`CAM_${companyName}_${new Date().toISOString().slice(0,10)}.pdf`);
};
