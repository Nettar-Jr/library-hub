/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Book, CirculationRecord } from '../types';

export interface ReportData {
  reportId: string;
  title: string;
  subtitle: string;
  campusSection: 'all' | 'college' | 'primary';
  generatedBy: string;
  generatedDate: string;
  executiveSummary: string;
  kpis: {
    label: string;
    value: string | number;
    sublabel?: string;
  }[];
  subjectBreakdown?: {
    code: string;
    name: string;
    titles: number;
    stock: number;
    reads: number;
    status: 'Optimal' | 'Underutilized' | 'Critical Stock';
  }[];
  criticalItems?: {
    title: string;
    author: string;
    code: string;
    available: number;
    total: number;
    priority: 'Immediate Restock' | 'High Demand' | 'Curriculum Core';
  }[];
  overdueItems?: {
    borrower: string;
    title: string;
    dueDate: string;
    daysOverdue: number;
    severity: 'Mild' | 'Moderate' | 'Critical';
  }[];
  decisions: {
    decisionNumber: number;
    actionTitle: string;
    targetDepartment: string;
    rationale: string;
    urgency: 'Immediate' | 'Upcoming Term' | 'Policy Review';
  }[];
}

/**
 * Generate a PDF decision report for Premier International School
 */
export function generatePdfDecisionReport(data: ReportData, chartImageUri?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Header Background Accent Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, cursorY, contentWidth, 24, 'F');

  // Decorative top accent stripe
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, cursorY, contentWidth, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PREMIER INTERNATIONAL SCHOOL', margin + 6, cursorY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('LIBRARY & LEARNING RESOURCE CENTER • STRATEGIC DECISION REPORT', margin + 6, cursorY + 15);
  doc.text(`Doc Ref: ${data.reportId}  |  Generated: ${data.generatedDate}`, margin + 6, cursorY + 20);

  // Campus Badge in Header
  const campusLabel = data.campusSection === 'primary' 
    ? 'PRIMARY CAMPUS (YEARS 1–6)' 
    : data.campusSection === 'college' 
      ? 'SECONDARY COLLEGE (YEARS 7–12)' 
      : 'ALL CAMPUSES CONSOLIDATED';

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(pageWidth - margin - 72, cursorY + 6, 66, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(campusLabel, pageWidth - margin - 39, cursorY + 13, { align: 'center' });

  cursorY += 28;

  // Report Main Title & Subtitle
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(data.title, margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(data.subtitle, margin, cursorY);
  cursorY += 8;

  // Executive Summary Callout Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'FD');

  // Left colored indicator border
  doc.setFillColor(59, 130, 246); // blue-500
  doc.roundedRect(margin, cursorY, 2.5, 22, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('EXECUTIVE DECISION SUMMARY:', margin + 6, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // slate-700
  const splitSummary = doc.splitTextToSize(data.executiveSummary, contentWidth - 12);
  doc.text(splitSummary, margin + 6, cursorY + 11);

  cursorY += 26;

  // Key Performance Indicators (KPI Cards)
  const kpiCount = data.kpis.length;
  const kpiCardWidth = (contentWidth - (kpiCount - 1) * 3) / kpiCount;

  data.kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (kpiCardWidth + 3);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cursorY, kpiCardWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.label.toUpperCase(), cardX + 3, cursorY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(String(kpi.value), cardX + 3, cursorY + 12);

    if (kpi.sublabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.sublabel, cardX + 3, cursorY + 16);
    }
  });

  cursorY += 23;

  // If a chart image was provided, embed it
  if (chartImageUri) {
    try {
      const chartHeight = 52;
      doc.addImage(chartImageUri, 'PNG', margin, cursorY, contentWidth, chartHeight);
      cursorY += chartHeight + 6;
    } catch {
      // ignore image render failure
    }
  }

  // Section 1: Data Table (Subject Breakdown or Critical Items)
  if (data.subjectBreakdown && data.subjectBreakdown.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. CURRICULUM SUBJECT ALLOCATION & USAGE BREAKDOWN', margin, cursorY);
    cursorY += 4;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, cursorY, contentWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('DDC CLASS / CATEGORY', margin + 3, cursorY + 4.2);
    doc.text('TITLES', margin + 85, cursorY + 4.2);
    doc.text('STOCK', margin + 110, cursorY + 4.2);
    doc.text('READS', margin + 135, cursorY + 4.2);
    doc.text('STATUS', margin + 160, cursorY + 4.2);
    cursorY += 6;

    // Rows
    data.subjectBreakdown.slice(0, 7).forEach((row, i) => {
      const rowY = cursorY + i * 5.2;
      doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 5.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(`${row.code} - ${row.name.substring(0, 36)}`, margin + 3, rowY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.text(String(row.titles), margin + 85, rowY + 3.8);
      doc.text(String(row.stock), margin + 110, rowY + 3.8);
      doc.text(String(row.reads), margin + 135, rowY + 3.8);

      // Status pill color
      if (row.status === 'Critical Stock') {
        doc.setTextColor(220, 38, 38);
      } else if (row.status === 'Underutilized') {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(22, 101, 52);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(row.status, margin + 160, rowY + 3.8);
    });

    cursorY += (Math.min(data.subjectBreakdown.length, 7) * 5.2) + 6;
  } else if (data.criticalItems && data.criticalItems.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. CRITICAL STOCK DEPLETION & PROCUREMENT PRIORITIES', margin, cursorY);
    cursorY += 4;

    doc.setFillColor(226, 232, 240);
    doc.rect(margin, cursorY, contentWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('BOOK TITLE / AUTHOR', margin + 3, cursorY + 4.2);
    doc.text('DDC CODE', margin + 90, cursorY + 4.2);
    doc.text('COPIES LEFT', margin + 120, cursorY + 4.2);
    doc.text('PRIORITY STATUS', margin + 155, cursorY + 4.2);
    cursorY += 6;

    data.criticalItems.slice(0, 6).forEach((item, i) => {
      const rowY = cursorY + i * 5.5;
      doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${item.title.substring(0, 38)}`, margin + 3, rowY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`by ${item.author}`, margin + 3, rowY + 5.2);

      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(item.code, margin + 90, rowY + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(item.available <= 0 ? 220 : 180, 38, 38);
      doc.text(`${item.available} / ${item.total}`, margin + 120, rowY + 3.8);

      doc.setTextColor(item.priority === 'Immediate Restock' ? 185 : 30, 28, 28);
      doc.text(item.priority, margin + 155, rowY + 3.8);
    });

    cursorY += (Math.min(data.criticalItems.length, 6) * 5.5) + 6;
  }

  // Section 2: Actionable Strategic Decisions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. STRATEGIC DECISION ACTIONS FOR SCHOOL LEADERSHIP', margin, cursorY);
  cursorY += 4;

  data.decisions.slice(0, 3).forEach((dec) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, 14, 1.5, 1.5, 'FD');

    // Number badge
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin + 2.5, cursorY + 2.5, 6, 9, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(String(dec.decisionNumber), margin + 5.5, cursorY + 7.5, { align: 'center' });

    // Action Title & Urgency
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(dec.actionTitle, margin + 11, cursorY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Dept: ${dec.targetDepartment}  |  Urgency: ${dec.urgency}`, margin + 11, cursorY + 9);

    const splitRationale = doc.splitTextToSize(dec.rationale, contentWidth - 14);
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(splitRationale, margin + 11, cursorY + 12.5);

    cursorY += 16;
  });

  // Footer & Sign-off Block
  const footerY = pageHeight - margin - 22;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('RECOMMENDED & SUBMITTED BY:', margin, footerY + 5);
  doc.text('APPROVED FOR EXECUTIVE IMPLEMENTATION:', margin + 100, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(data.generatedBy, margin, footerY + 9);
  doc.text('Head of Library & Educational Media', margin, footerY + 13);

  doc.text('Principal / Board of Management Sign-off', margin + 100, footerY + 9);
  doc.text('Premier International School Authority', margin + 100, footerY + 13);

  // Bottom Notice
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential internal document prepared exclusively for Premier International School management.', margin, pageHeight - margin + 2);

  return doc;
}

/**
 * Triggers browser download for the generated PDF
 */
export function downloadPdfReport(data: ReportData, chartImageUri?: string): void {
  const doc = generatePdfDecisionReport(data, chartImageUri);
  const sanitizedTitle = data.title.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Premier_School_${sanitizedTitle}_${data.campusSection.toUpperCase()}.pdf`);
}
