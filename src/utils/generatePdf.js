/**
 * ============================================================
 *  CREDENT — AI Credit Appraisal Engine
 *  © 2026 Asenra. All Rights Reserved.
 *  https://asenra.in
 *
 *  This source code is the exclusive intellectual property of
 *  Asenra. Unauthorized reproduction, distribution, or use
 *  of this code, in whole or in part, is strictly prohibited.
 * ============================================================
 */
import { jsPDF } from 'jspdf';

export const downloadPDF = (camReport, detectedParams) => {
  if (!camReport || !detectedParams) {
    alert('No report data available to download.');
    return;
  }

  try {
    const doc = new jsPDF();
    const margin = 20; 
    let y = 20;
    const pageWidth = doc.internal.pageSize.width;
    
    // Colors
    const primaryColor = [13, 33, 63]; // #0d213f (Credent dark blue)
    const secondaryColor = [71, 85, 105]; // Slate 600
    const lightBg = [241, 245, 249]; // Slate 100
    const accentColor = [16, 185, 129]; // Emerald 500
    const dangerColor = [239, 68, 68]; // Red 500
    const warningColor = [245, 158, 11]; // Amber 500

    // Safe string accessor
    const str = (val, fallback = 'N/A') => {
      if (val === null || val === undefined || val === '') return fallback;
      return String(val);
    };
    
    const formatCurrency = (val) => {
      if (val === null || val === undefined || isNaN(val)) return 'N/A';
      return `INR ${(Number(val) / 10000000).toFixed(2)} Cr`;
    };

    const addWrappedText = (text, x, yOffset, maxWidth, lineHeight = 5) => {
      const safeText = str(text, 'No information available.');
      const lines = doc.splitTextToSize(safeText, maxWidth);
      doc.text(lines, x, yOffset); 
      return lines.length * lineHeight;
    };

    const checkPageBreak = (needed = 30) => {
      if (y + needed > 280) { 
        doc.addPage(); 
        y = 20; 
      }
    };

    // ---------------------------------------------------------
    // 1. PROFESSIONAL HEADER
    // ---------------------------------------------------------
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CREDIT APPRAISAL MEMORANDUM", margin, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("CREDENT COMMERCIAL UNDERWRITING ENGINE", margin, 30);
    
    y = 50;
    doc.setTextColor(30, 41, 59);

    // ---------------------------------------------------------
    // 2. BORROWER PROFILE GRID
    // ---------------------------------------------------------
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. BORROWER PROFILE", margin, y);
    y += 6;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Entity Name:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(str(detectedParams.company, 'Unknown'), margin + 35, y);

    doc.setFont("helvetica", "bold");
    doc.text("Date:", margin + 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), margin + 125, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Sector:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(str(detectedParams.sector, 'Unknown'), margin + 35, y);
    
    doc.setFont("helvetica", "bold");
    doc.text("Risk Score:", margin + 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${str(detectedParams.baseScore, 'N/A')} / 100`, margin + 135, y);
    y += 12;

    // Financial Snapshot Sub-grid
    doc.setFillColor(...lightBg);
    doc.rect(margin, y, pageWidth - (margin * 2), 20, 'F');
    
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Declared Revenue", margin + 10, y);
    doc.text("Financial Borrowings", margin + 70, y);
    doc.text("Net Worth", margin + 130, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(detectedParams.revenue), margin + 10, y);
    doc.text(formatCurrency(detectedParams.debt), margin + 70, y);
    doc.text(formatCurrency(detectedParams.worth), margin + 130, y);
    
    y += 15;

    // ---------------------------------------------------------
    // 3. EXECUTIVE DECISION
    // ---------------------------------------------------------
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. EXECUTIVE DECISION", margin, y);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const decision = str(camReport.decision, 'PENDING').toUpperCase();
    
    // Draw a colored box for decision
    if (decision.includes('APPROVE')) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(...accentColor);
      doc.setTextColor(...accentColor);
    } else if (decision.includes('REJECT')) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(...dangerColor);
      doc.setTextColor(...dangerColor);
    } else {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(...warningColor);
      doc.setTextColor(...warningColor);
    }
    
    doc.rect(margin, y, pageWidth - (margin * 2), 22, 'FD');
    
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`DECISION: ${decision}`, margin + 5, y);
    
    doc.setFontSize(10);
    y += 8;
    doc.text(`Approved Limit:`, margin + 5, y);
    doc.setFont("helvetica", "normal");
    doc.text(str(camReport.recommended_loan_amount), margin + 35, y);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Pricing/Rate:`, margin + 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(str(camReport.recommended_interest_rate), margin + 135, y);
    
    y += 15;
    
    // Rationale
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Decision Rationale:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += addWrappedText(camReport.decision_rationale, margin, y, pageWidth - (margin * 2), 5);
    y += 5;

    // ---------------------------------------------------------
    // 4. FIVE C's ANALYSIS
    // ---------------------------------------------------------
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. DETAILED CREDIT ASSESSMENT (THE 5 C's)", margin, y);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const fiveCs = camReport.five_cs || {};
    
    const parseC = (obj) => {
      if (!obj) return { text: "No information available.", citations: [] };
      if (typeof obj === 'string') return { text: obj, citations: [] };
      return {
        text: obj.text || obj.assessment || JSON.stringify(obj),
        citations: Array.isArray(obj.citations) ? obj.citations : []
      };
    };

    const cs = [
      { title: "CHARACTER", data: parseC(fiveCs.character) },
      { title: "CAPACITY", data: parseC(fiveCs.capacity) },
      { title: "CAPITAL", data: parseC(fiveCs.capital) },
      { title: "COLLATERAL", data: parseC(fiveCs.collateral) },
      { title: "CONDITIONS", data: parseC(fiveCs.conditions) }
    ];

    cs.forEach(c => {
      checkPageBreak(35);
      
      // Title with slight background highlight
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, pageWidth - (margin * 2), 8, 'F');
      
      doc.setFont("helvetica", "bold"); 
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.text(c.title, margin + 2, y + 2); 
      y += 10;
      
      // Content
      doc.setFont("helvetica", "normal"); 
      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      y += addWrappedText(c.data.text, margin, y, pageWidth - (margin * 2), 5);
      
      // Citations (if any)
      if (c.data.citations.length > 0) {
        y += 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        c.data.citations.forEach(cit => {
          checkPageBreak(15);
          const citText = `[${cit.id}] Page ${cit.page}: "${cit.snippet}"`;
          y += addWrappedText(citText, margin + 5, y, pageWidth - (margin * 2) - 5, 4);
        });
        y += 2;
      }
      y += 6;
    });

    // ---------------------------------------------------------
    // FOOTER (Applied to all pages)
    // ---------------------------------------------------------
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 280, pageWidth - margin, 280);
      
      doc.setFontSize(8); 
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate 400
      
      doc.text('CONFIDENTIAL & PROPRIETARY — INTERNAL USE ONLY', margin, 285);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, 285);
      
      doc.setFont("helvetica", "bold");
      doc.text('Generated by Credent — an Asenra product', margin, 290);
    }

    // Generate safe filename
    const companyName = str(detectedParams.company, 'Report').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    doc.save(`CAM_${companyName}_${new Date().toISOString().slice(0,10)}.pdf`);

  } catch (err) {
    console.error('PDF generation error:', err);
    alert(`Failed to generate PDF: ${err.message}. Please try again.`);
  }
};