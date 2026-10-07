/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportData } from './reportPdfGenerator';

/**
 * Renders a high-resolution pictorial infographic / visual decision board
 * onto an HTML5 canvas and returns the canvas element.
 */
export function renderPictorialReportCanvas(data: ReportData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // High DPI 2x scale for crisp retina display
  const scale = 2;
  const width = 1200;
  const height = 1500;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0f172a'); // slate-900
  bgGrad.addColorStop(0.18, '#1e1b4b'); // indigo-950
  bgGrad.addColorStop(0.5, '#f8fafc'); // slate-50
  bgGrad.addColorStop(1, '#f1f5f9'); // slate-100
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative top accent stripe
  const stripeGrad = ctx.createLinearGradient(0, 0, width, 0);
  stripeGrad.addColorStop(0, '#f59e0b'); // amber-500
  stripeGrad.addColorStop(0.5, '#3b82f6'); // blue-500
  stripeGrad.addColorStop(1, '#10b981'); // emerald-500
  ctx.fillStyle = stripeGrad;
  ctx.fillRect(0, 0, width, 8);

  // Header Title Area
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('PREMIER INTERNATIONAL SCHOOL', 50, 65);

  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f59e0b'; // amber-400
  ctx.fillText('STRATEGIC LIBRARY INTELLIGENCE & DECISION-MAKING INFOGRAPHIC', 50, 95);

  // Metadata Badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  roundRect(ctx, width - 380, 40, 330, 75, 12, true, false);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('TARGET CAMPUS PERSPECTIVE:', width - 365, 62);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  const campusLabel = data.campusSection === 'primary' 
    ? 'Primary School (Years 1–6)' 
    : data.campusSection === 'college' 
      ? 'Secondary College (Years 7–12)' 
      : 'All Campuses (Consolidated)';
  ctx.fillText(campusLabel, width - 365, 84);

  ctx.fillStyle = '#38bdf8'; // sky-400
  ctx.font = '11px monospace';
  ctx.fillText(`Date: ${data.generatedDate}  |  ${data.reportId}`, width - 365, 103);

  // Report Main Title Banner
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 50, 140, width - 100, 110, 16, true, false);

  // Soft shadow under banner
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  roundRect(ctx, 50, 140, width - 100, 110, 16, false, true);

  // Left accent bar
  ctx.fillStyle = '#4f46e5'; // indigo-600
  roundRect(ctx, 50, 140, 8, 110, 4, true, false);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(data.title, 75, 178);

  ctx.fillStyle = '#475569';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(data.subtitle, 75, 205);

  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 12px system-ui, sans-serif';
  ctx.fillText(`Executive Brief: "${data.executiveSummary.substring(0, 140)}..."`, 75, 232);

  // 4 Visual KPI Cards
  const kpiCount = Math.min(data.kpis.length, 4);
  const cardGap = 20;
  const totalCardsWidth = width - 100;
  const kpiWidth = (totalCardsWidth - (kpiCount - 1) * cardGap) / kpiCount;
  const kpiY = 275;
  const kpiH = 120;

  const cardColors = [
    { bg: '#eff6ff', border: '#bfdbfe', num: '#1e40af', iconBg: '#3b82f6' },
    { bg: '#f0fdf4', border: '#bbf7d0', num: '#166534', iconBg: '#22c55e' },
    { bg: '#fefce8', border: '#fef08a', num: '#854d0e', iconBg: '#eab308' },
    { bg: '#fdf2f8', border: '#fbcfe8', num: '#9d174d', iconBg: '#ec4899' },
  ];

  data.kpis.slice(0, 4).forEach((kpi, idx) => {
    const kX = 50 + idx * (kpiWidth + cardGap);
    const color = cardColors[idx % cardColors.length];

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, kX, kpiY, kpiWidth, kpiH, 14, true, false);

    ctx.strokeStyle = color.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, kX, kpiY, kpiWidth, kpiH, 14, false, true);

    // Accent header inside card
    ctx.fillStyle = color.bg;
    roundRect(ctx, kX + 1, kpiY + 1, kpiWidth - 2, 28, 12, true, false);

    ctx.fillStyle = color.num;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(kpi.label.toUpperCase(), kX + 14, kpiY + 19);

    // Big Number Value
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(String(kpi.value), kX + 14, kpiY + 74);

    if (kpi.sublabel) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(kpi.sublabel, kX + 14, kpiY + 98);
    }
  });

  // Visual Chart Section (Subject Reads / Holdings Bar Visualization)
  const chartY = 425;
  const chartH = 340;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 50, chartY, width - 100, chartH, 16, true, false);
  ctx.strokeStyle = '#e2e8f0';
  roundRect(ctx, 50, chartY, width - 100, chartH, 16, false, true);

  // Chart Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('PICTORIAL UTILIZATION & HOLDINGS VISUALIZER', 75, chartY + 38);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Subject Category Circulation Velocity (Dewey Decimal Classes)', 75, chartY + 60);

  // Draw visual horizontal bars from database records
  const subjects = data.subjectBreakdown && data.subjectBreakdown.length > 0 
    ? data.subjectBreakdown.slice(0, 6) 
    : [];

  const maxReads = Math.max(...subjects.map(s => s.reads), 1);
  const barStartY = chartY + 90;
  const barH = 22;
  const barSpacing = 38;
  const maxBarWidth = width - 420;

  if (subjects.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.fillText('No category holdings registered for this campus section in database.', 75, chartY + 120);
  } else {
    subjects.forEach((subj, i) => {
      const curY = barStartY + i * barSpacing;
      const barW = maxReads > 0 ? Math.max(10, (subj.reads / maxReads) * maxBarWidth) : 10;

      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(subj.code, 75, curY + 16);

      ctx.fillStyle = '#475569';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(subj.name.substring(0, 26), 160, curY + 16);

      // Bar background
      ctx.fillStyle = '#f1f5f9';
      roundRect(ctx, 360, curY, maxBarWidth, barH, 6, true, false);

      // Colored Fill Bar
      const isUnder = subj.status === 'Underutilized';
      const barGrad = ctx.createLinearGradient(360, 0, 360 + barW, 0);
      if (isUnder) {
        barGrad.addColorStop(0, '#fbbf24');
        barGrad.addColorStop(1, '#f97316');
      } else {
        barGrad.addColorStop(0, '#6366f1');
        barGrad.addColorStop(1, '#3b82f6');
      }
      ctx.fillStyle = barGrad;
      roundRect(ctx, 360, curY, barW, barH, 6, true, false);

      // Bar value text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`${subj.reads} reads`, 370, curY + 15);

      // Stock & status badge
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`${subj.stock} in stock`, 360 + maxBarWidth + 15, curY + 15);
    });
  }

  // Decision Matrix Callouts Section (The heart of the decision-making report)
  const matrixY = 795;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 50, matrixY, width - 100, 480, 16, true, false);
  ctx.strokeStyle = '#e2e8f0';
  roundRect(ctx, 50, matrixY, width - 100, 480, 16, false, true);

  // Matrix Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('ACTIONABLE DECISION MATRIX FOR SCHOOL LEADERSHIP', 75, matrixY + 42);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Immediate executive decisions, budget shifts, and curriculum interventions derived from catalog metrics', 75, matrixY + 68);

  const decs = data.decisions.slice(0, 3);
  const decCardY = matrixY + 95;
  const decCardH = 110;
  const decGap = 16;

  decs.forEach((dec, idx) => {
    const curY = decCardY + idx * (decCardH + decGap);

    ctx.fillStyle = idx === 0 ? '#fef2f2' : idx === 1 ? '#eff6ff' : '#f0fdf4';
    roundRect(ctx, 75, curY, width - 150, decCardH, 12, true, false);

    ctx.strokeStyle = idx === 0 ? '#fecaca' : idx === 1 ? '#bfdbfe' : '#bbf7d0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 75, curY, width - 150, decCardH, 12, false, true);

    // Number Badge
    ctx.fillStyle = idx === 0 ? '#dc2626' : idx === 1 ? '#2563eb' : '#16a34a';
    roundRect(ctx, 95, curY + 18, 38, 38, 8, true, false);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(String(dec.decisionNumber), 107, curY + 44);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(dec.actionTitle, 150, curY + 36);

    // Department & Urgency Badges
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`Target Dept: ${dec.targetDepartment}  •  Urgency: ${dec.urgency.toUpperCase()}`, 150, curY + 58);

    // Rationale text
    ctx.fillStyle = '#334155';
    ctx.font = '13px system-ui, sans-serif';
    const splitText = wrapText(ctx, dec.rationale, width - 300);
    splitText.slice(0, 2).forEach((line, lineIdx) => {
      ctx.fillText(line, 150, curY + 80 + lineIdx * 18);
    });
  });

  // Footer & Institutional Sign-off Block
  const footerY = 1300;
  ctx.fillStyle = '#1e293b'; // slate-800
  roundRect(ctx, 50, footerY, width - 100, 150, 16, true, false);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('EXECUTIVE RATIFICATION & COMPLIANCE SIGN-OFF', 80, footerY + 38);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('This pictorial report represents certified data from Premier International School Library Management System.', 80, footerY + 62);

  // Signatures line
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, footerY + 105);
  ctx.lineTo(420, footerY + 105);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width - 450, footerY + 105);
  ctx.lineTo(width - 80, footerY + 105);
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`Prepared by: ${data.generatedBy} (Head Librarian)`, 80, footerY + 125);
  ctx.fillText('Authorized: Principal & School Management Board', width - 450, footerY + 125);

  return canvas;
}

/**
 * Downloads the pictorial report as a high-resolution PNG image
 */
export function downloadPictorialReportPng(data: ReportData): void {
  const canvas = renderPictorialReportCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');
  const sanitizedTitle = data.title.replace(/[^a-zA-Z0-9]/g, '_');
  
  const link = document.createElement('a');
  link.download = `Premier_Pictorial_Decision_Report_${sanitizedTitle}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Returns a data URL of the canvas image for embedding in PDF or preview modal
 */
export function getPictorialReportDataUrl(data: ReportData): string {
  const canvas = renderPictorialReportCanvas(data);
  return canvas.toDataURL('image/png');
}

/**
 * Helper to draw rounded rectangle on canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Word wrap helper for canvas
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
