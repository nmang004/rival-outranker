import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { SeoAnalysisResult, Competitor, ContentAnnotation } from '@shared/schema';

// Brand colors for PDF
const BRAND_COLORS = {
  primary: '#0f172a',    // Dark blue/slate
  secondary: '#1e40af',  // Medium blue
  accent: '#3b82f6',     // Lighter blue
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Yellow/amber
  danger: '#ef4444',     // Red
  text: '#1e293b',       // Dark slate
  muted: '#64748b',      // Slate gray
  light: '#f8fafc',      // Very light slate
  // Category colors
  excellent: '#10b981',  // Green
  good: '#3b82f6',       // Blue
  needsWork: '#f59e0b',  // Yellow/Amber
  poor: '#ef4444',       // Red
};

export interface PDFExportOptions {
  includeLogo?: boolean;
  includeScore?: boolean;
  includeKeywordAnalysis?: boolean;
  includeContentAnalysis?: boolean;
  includeTechnicalAnalysis?: boolean;
  includeCompetitors?: boolean;
  includeActionPlan?: boolean;
  customTitle?: string;
  companyName?: string;
  showPriority?: boolean;
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  includeLogo: true,
  includeScore: true,
  includeKeywordAnalysis: true,
  includeContentAnalysis: true,
  includeTechnicalAnalysis: true,
  includeCompetitors: true,
  includeActionPlan: true,
  showPriority: true,
};

/**
 * Export SEO analysis results to a branded PDF document
 */
export async function exportToPDF(
  analysisResult: SeoAnalysisResult,
  options: PDFExportOptions = DEFAULT_OPTIONS
): Promise<void> {
  const {
    includeLogo,
    includeScore,
    includeKeywordAnalysis,
    includeContentAnalysis,
    includeTechnicalAnalysis,
    includeCompetitors,
    includeActionPlan,
    customTitle,
    companyName,
    showPriority,
  } = { ...DEFAULT_OPTIONS, ...options };

  // Create new PDF document - use A4 landscape for better layout
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set some basic document properties
  pdf.setProperties({
    title: customTitle || `SEO Analysis for ${analysisResult.url}`,
    subject: 'SEO Best Practices Assessment',
    author: companyName || 'SEO Analysis Tool',
    keywords: analysisResult.keywordAnalysis.primaryKeyword,
    creator: 'SEO Analysis Tool',
  });

  // Add document header with logo
  await addHeader(pdf, analysisResult, includeLogo);
  
  // Current vertical position tracker
  let yPos = 45;
  
  // Add title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text(customTitle || `SEO Analysis for ${analysisResult.url}`, 14, yPos);
  yPos += 10;

  // Add timestamp
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(BRAND_COLORS.muted);
  const date = new Date(analysisResult.timestamp);
  pdf.text(`Analysis Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, 14, yPos);
  yPos += 12;

  // Add overall score if requested
  if (includeScore) {
    yPos = addOverallScore(pdf, analysisResult, yPos);
    yPos += 10;
  }

  // Add keyword analysis if requested
  if (includeKeywordAnalysis) {
    yPos = addKeywordAnalysis(pdf, analysisResult, yPos);
    yPos += 10;
  }

  // Add content analysis if requested
  if (includeContentAnalysis) {
    yPos = addContentAnalysis(pdf, analysisResult, yPos);
    yPos += 10;
  }

  // Check if we need a new page before technical analysis
  if (yPos > 250) {
    pdf.addPage();
    yPos = 20;
  }

  // Add technical analysis if requested
  if (includeTechnicalAnalysis) {
    yPos = addTechnicalAnalysis(pdf, analysisResult, yPos);
    yPos += 10;
  }

  // Check if we need a new page before competitors
  if (yPos > 200 && includeCompetitors) {
    pdf.addPage();
    yPos = 20;
  }

  // Add competitor analysis if requested
  if (includeCompetitors && analysisResult.competitorAnalysis) {
    yPos = addCompetitorAnalysis(pdf, analysisResult, yPos);
    yPos += 10;
  }

  // Check if we need a new page before action plan
  if (yPos > 200 && includeActionPlan) {
    pdf.addPage();
    yPos = 20;
  }

  // Add action plan if requested
  if (includeActionPlan) {
    addActionPlan(pdf, analysisResult, yPos, showPriority);
  }

  // Add footer to each page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, pageCount, companyName);
  }

  // Save the PDF
  pdf.save(`seo-analysis-${formatFileName(analysisResult.url)}.pdf`);
}

/**
 * Add header with logo to the PDF
 */
async function addHeader(pdf: jsPDF, analysis: SeoAnalysisResult, includeLogo: boolean = true): Promise<void> {
  // Add logo if requested
  if (includeLogo) {
    // Use an SVG logo embedded directly
    const logoSvg = \`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#0f172a"/>
      <path d="M12 12L24 6L36 12V24L24 30L12 24V12Z" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <path d="M24 30V42" stroke="white" stroke-width="2"/>
      <path d="M36 24L42 28" stroke="white" stroke-width="2"/>
      <path d="M12 24L6 28" stroke="white" stroke-width="2"/>
    </svg>\`;
    
    // Convert SVG to data URL
    const svgBlob = new Blob([logoSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create an image element
    const img = new Image();
    img.src = url;
    
    // Wait for image to load
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Add the logo to the PDF
    pdf.addImage(img, 'SVG', 14, 10, 15, 15);
    
    // Cleanup
    URL.revokeObjectURL(url);
  }
  
  // Add app name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('SEO Best Practices Assessment', includeLogo ? 34 : 14, 18);
  
  // Add horizontal line
  pdf.setDrawColor(BRAND_COLORS.accent);
  pdf.setLineWidth(0.5);
  pdf.line(14, 26, 196, 26);
}

/**
 * Add footer to the PDF
 */
function addFooter(pdf: jsPDF, pageNumber: number, totalPages: number, companyName?: string): void {
  const footerText = companyName ? `© ${new Date().getFullYear()} ${companyName}` : 'SEO Best Practices Assessment';
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(BRAND_COLORS.muted);
  
  // Add company name/copyright on left
  pdf.text(footerText, 14, 287);
  
  // Add page number on right
  pdf.text(`Page ${pageNumber} of ${totalPages}`, 196, 287, { align: 'right' });
}

/**
 * Add overall score section
 */
function addOverallScore(pdf: jsPDF, analysis: SeoAnalysisResult, yPos: number): number {
  pdf.setFillColor(BRAND_COLORS.light);
  pdf.setDrawColor(BRAND_COLORS.primary);
  pdf.roundedRect(14, yPos, 182, 30, 3, 3, 'FD');
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('Overall SEO Score', 20, yPos + 10);
  
  // Score
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  
  // Set color based on score category
  switch(analysis.score.category) {
    case 'excellent':
      pdf.setTextColor(BRAND_COLORS.excellent);
      break;
    case 'good':
      pdf.setTextColor(BRAND_COLORS.good);
      break;
    case 'needs-work':
      pdf.setTextColor(BRAND_COLORS.needsWork);
      break;
    case 'poor':
      pdf.setTextColor(BRAND_COLORS.danger);
      break;
    default:
      pdf.setTextColor(BRAND_COLORS.muted);
  }
  
  // Score value
  pdf.text(`${analysis.score.score}/100`, 150, yPos + 16);
  
  // Category label
  pdf.setFontSize(14);
  pdf.text(getCategoryLabel(analysis.score.category), 150, yPos + 24);
  
  return yPos + 30;
}

/**
 * Add keyword analysis section
 */
function addKeywordAnalysis(pdf: jsPDF, analysis: SeoAnalysisResult, yPos: number): number {
  // Section title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('Keyword Analysis', 14, yPos);
  yPos += 8;
  
  // Create keyword table
  const keywordData = [
    ['Primary Keyword', analysis.keywordAnalysis.primaryKeyword],
    ['Keyword Density', `${analysis.keywordAnalysis.density.toFixed(2)}%`],
    ['Title Includes Keyword', analysis.keywordAnalysis.titlePresent ? 'Yes' : 'No'],
    ['Description Includes Keyword', analysis.keywordAnalysis.descriptionPresent ? 'Yes' : 'No'],
    ['H1 Includes Keyword', analysis.keywordAnalysis.h1Present ? 'Yes' : 'No'],
    ['URL Includes Keyword', analysis.keywordAnalysis.urlPresent ? 'Yes' : 'No'],
  ];
  
  autoTable(pdf, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: keywordData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.primary,
      textColor: BRAND_COLORS.light,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });
  
  return pdf.lastAutoTable?.finalY || yPos + 50;
}

/**
 * Add content analysis section
 */
function addContentAnalysis(pdf: jsPDF, analysis: SeoAnalysisResult, yPos: number): number {
  // Section title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('Content Analysis', 14, yPos);
  yPos += 8;
  
  // Create content metrics table
  const contentData = [
    ['Word Count', analysis.contentAnalysis.wordCount.toString()],
    ['Paragraph Count', analysis.contentAnalysis.paragraphCount.toString()],
    ['H1 Tags', analysis.contentAnalysis.headingStructure?.h1Count.toString() || '0'],
    ['H2 Tags', analysis.contentAnalysis.headingStructure?.h2Count.toString() || '0'],
    ['H3 Tags', analysis.contentAnalysis.headingStructure?.h3Count.toString() || '0'],
    ['Readability Score', analysis.contentAnalysis.readabilityScore.toFixed(1)],
    ['Multimedia Content', analysis.contentAnalysis.hasMultimedia ? 'Yes' : 'No'],
  ];
  
  autoTable(pdf, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: contentData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.primary,
      textColor: BRAND_COLORS.light,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });
  
  return pdf.lastAutoTable?.finalY || yPos + 50;
}

/**
 * Add technical analysis section
 */
function addTechnicalAnalysis(pdf: jsPDF, analysis: SeoAnalysisResult, yPos: number): number {
  // Section title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('Technical SEO Analysis', 14, yPos);
  yPos += 8;
  
  // Create technical metrics table
  const technicalData = [
    ['Mobile Friendly', analysis.mobileAnalysis.isMobileFriendly ? 'Yes' : 'No'],
    ['Viewport Set', analysis.mobileAnalysis.viewportSet ? 'Yes' : 'No'],
    ['Schema Markup', analysis.schemaMarkupAnalysis.hasSchemaMarkup ? 'Yes' : 'No'],
    ['Internal Links', analysis.internalLinksAnalysis.count.toString()],
    ['Images with Alt Text', `${analysis.imageAnalysis.withAltCount}/${analysis.imageAnalysis.count}`],
    ['Page Speed Score', analysis.pageSpeedAnalysis.score.toString()],
  ];
  
  autoTable(pdf, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: technicalData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.primary,
      textColor: BRAND_COLORS.light,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });
  
  return pdf.lastAutoTable?.finalY || yPos + 50;
}

/**
 * Add competitor analysis section
 */
function addCompetitorAnalysis(pdf: jsPDF, analysis: SeoAnalysisResult, yPos: number): number {
  // Skip if no competitors
  if (!analysis.competitorAnalysis || analysis.competitorAnalysis.competitors.length === 0) {
    return yPos;
  }
  
  // Section title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('Competitor Analysis', 14, yPos);
  yPos += 6;
  
  // Add keyword info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(BRAND_COLORS.text);
  pdf.text(`Based on keyword: "${analysis.competitorAnalysis.keyword}" in ${analysis.competitorAnalysis.location}`, 14, yPos);
  yPos += 8;
  
  // Create competitor table
  const competitorTableData = analysis.competitorAnalysis.competitors.map((competitor, index) => [
    index + 1,
    competitor.name || `Competitor ${index + 1}`,
    competitor.url,
    competitor.score.toString(),
  ]);
  
  autoTable(pdf, {
    startY: yPos,
    head: [['#', 'Competitor', 'URL', 'Score']],
    body: competitorTableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.primary,
      textColor: BRAND_COLORS.light,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });
  
  return pdf.lastAutoTable?.finalY || yPos + 50;
}

/**
 * Add action plan section
 */
function addActionPlan(pdf: jsPDF, analysis: SeoAnalysisResult, yPos: number, showPriority: boolean = true): number {
  // Section title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(BRAND_COLORS.primary);
  pdf.text('Action Plan & Recommendations', 14, yPos);
  yPos += 8;
  
  // Create action items
  const actionItems: [string, string, string][] = [];
  
  // Get all recommendations from different analysis sections
  if (analysis.keywordAnalysis.overallScore.score < 90) {
    actionItems.push(['Keyword', 'Optimize keyword usage and placement', analysis.keywordAnalysis.overallScore.score < 70 ? 'High' : 'Medium']);
  }
  
  if (analysis.metaTagsAnalysis.overallScore.score < 90) {
    actionItems.push(['Meta Tags', 'Improve title and meta description', analysis.metaTagsAnalysis.overallScore.score < 70 ? 'High' : 'Medium']);
  }
  
  if (analysis.contentAnalysis.overallScore.score < 90) {
    actionItems.push(['Content', 'Enhance content structure and readability', analysis.contentAnalysis.overallScore.score < 70 ? 'High' : 'Medium']);
  }
  
  if (analysis.internalLinksAnalysis.overallScore.score < 90) {
    actionItems.push(['Links', 'Improve internal linking structure', analysis.internalLinksAnalysis.overallScore.score < 70 ? 'Medium' : 'Low']);
  }
  
  if (analysis.imageAnalysis.overallScore.score < 90) {
    actionItems.push(['Images', 'Add alt text to images and optimize size', analysis.imageAnalysis.overallScore.score < 70 ? 'Medium' : 'Low']);
  }
  
  if (analysis.schemaMarkupAnalysis.overallScore.score < 90) {
    actionItems.push(['Schema', 'Implement schema markup for better rich results', analysis.schemaMarkupAnalysis.overallScore.score < 70 ? 'Medium' : 'Low']);
  }
  
  if (analysis.mobileAnalysis.overallScore.score < 90) {
    actionItems.push(['Mobile', 'Improve mobile friendliness', analysis.mobileAnalysis.overallScore.score < 70 ? 'High' : 'Medium']);
  }
  
  if (analysis.pageSpeedAnalysis.overallScore.score < 90) {
    actionItems.push(['Speed', 'Optimize page loading speed', analysis.pageSpeedAnalysis.overallScore.score < 70 ? 'High' : 'Medium']);
  }
  
  // Sort by priority
  actionItems.sort((a, b) => {
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return priorityOrder[a[2] as keyof typeof priorityOrder] - priorityOrder[b[2] as keyof typeof priorityOrder];
  });
  
  // Create table with or without priority column
  if (showPriority) {
    autoTable(pdf, {
      startY: yPos,
      head: [['Category', 'Recommendation', 'Priority']],
      body: actionItems,
      theme: 'grid',
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.light,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
      },
      // Color the priority cell based on the priority level
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const priority = data.cell.raw as string;
          if (priority === 'High') {
            pdf.setFillColor(BRAND_COLORS.danger);
            pdf.setTextColor(255, 255, 255);
          } else if (priority === 'Medium') {
            pdf.setFillColor(BRAND_COLORS.warning);
          } else if (priority === 'Low') {
            pdf.setFillColor(BRAND_COLORS.good);
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    // Without priority column
    autoTable(pdf, {
      startY: yPos,
      head: [['Category', 'Recommendation']],
      body: actionItems.map(item => [item[0], item[1]]),
      theme: 'grid',
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.light,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });
  }
  
  return pdf.lastAutoTable?.finalY || yPos + 50;
}

// Helper functions
function getCategoryLabel(category: string): string {
  switch(category) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'needs-work':
      return 'Needs Work';
    case 'poor':
      return 'Poor';
    default:
      return 'N/A';
  }
}

function formatFileName(url: string): string {
  // Remove http/https and domain extensions
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}