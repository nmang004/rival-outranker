import Excel from 'exceljs';
import { RivalAudit, AuditItem, EnhancedRivalAudit, EnhancedAuditItem } from '../../../shared/schema';
import { Buffer } from 'buffer';

// Professional color scheme
const COLORS = {
  primary: 'FF2D5699',      // Professional blue
  primaryLight: 'FFE7EEF6', // Light blue background
  success: 'FF28A745',      // Green for OK status
  successLight: 'FFE6FFDD', // Light green
  warning: 'FFFFC107',      // Yellow/orange for OFI
  warningLight: 'FFFFEBD7', // Light orange
  danger: 'FFDC3545',       // Red for Priority OFI
  dangerLight: 'FFFFD7D7',  // Light red
  neutral: 'FF6C757D',      // Gray for N/A
  neutralLight: 'FFF8F9FA', // Light gray
  white: 'FFFFFFFF',
  headerDark: 'FF343A40'    // Dark header
};

// Chart colors for visual elements
const CHART_COLORS = [
  'FF2E86AB', 'FFA23B72', 'FFF18F01', 'FFC73E1D', 
  'FF4ECDC4', 'FF45B7D1', 'FF96CEB4', 'FFFFEAA7'
];

/**
 * Enhanced Excel Exporter Service
 * Completely overhauled for professional audit reports
 */

/**
 * Generate a comprehensive Excel report from Enhanced Rival Audit (200+ factors)
 */
export async function generateEnhancedRivalAuditExcel(audit: EnhancedRivalAudit): Promise<Buffer> {
  console.log('[ExcelExporter] Starting enhanced audit Excel generation with 200+ factors');
  
  const workbook = new Excel.Workbook();
  const displayUrl = audit.url.replace(/^https?:\/\//, '');
  
  // Set workbook metadata
  workbook.creator = 'Rival Outranker';
  workbook.created = new Date();
  workbook.title = `SEO Audit Report - ${displayUrl}`;
  workbook.description = 'Comprehensive SEO analysis with 200+ ranking factors';
  
  // Create all worksheets
  await createExecutiveSummaryTab(workbook, audit, displayUrl);
  await createEnhancedCategoryTabs(workbook, audit);
  await createPageLevelAnalysisTab(workbook, audit);
  await createPriorityActionsTab(workbook, audit);
  await createTechnicalMetadataTab(workbook, audit);
  
  console.log('[ExcelExporter] Enhanced Excel generation complete');
  return await workbook.xlsx.writeBuffer() as Buffer;
}

/**
 * Generate Excel report from Standard Rival Audit (legacy compatibility)
 */
export async function generateRivalAuditExcel(audit: RivalAudit): Promise<Buffer> {
  console.log('[ExcelExporter] Starting standard audit Excel generation');
  
  const workbook = new Excel.Workbook();
  const displayUrl = audit.url.replace(/^https?:\/\//, '');
  
  // Set workbook metadata
  workbook.creator = 'Rival Outranker';
  workbook.created = new Date();
  workbook.title = `SEO Audit Report - ${displayUrl}`;
  workbook.description = 'Standard SEO analysis report';
  
  // Create worksheets for legacy format
  await createLegacyExecutiveSummaryTab(workbook, audit, displayUrl);
  await createLegacyCategoryTabs(workbook, audit);
  await createLegacyPriorityActionsTab(workbook, audit);
  
  console.log('[ExcelExporter] Standard Excel generation complete');
  return await workbook.xlsx.writeBuffer() as Buffer;
}

/**
 * EXECUTIVE SUMMARY TAB - Professional dashboard with key insights
 */
async function createExecutiveSummaryTab(workbook: Excel.Workbook, audit: EnhancedRivalAudit, displayUrl: string): Promise<void> {
  const sheet = workbook.addWorksheet('📊 Executive Summary');
  if (sheet.properties) {
    sheet.properties.tabColor = { argb: COLORS.primary };
  }
  
  let currentRow = 1;
  
  // Main title section
  sheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = `🎯 SEO AUDIT REPORT - ${displayUrl.toUpperCase()}`;
  titleCell.font = { size: 18, bold: true, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } };
  sheet.getRow(currentRow).height = 35;
  currentRow += 2;
  
  // Report metadata
  sheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const metaCell = sheet.getCell(`A${currentRow}`);
  metaCell.value = `Generated: ${new Date().toLocaleDateString()} | Analysis Version: ${audit.analysisMetadata?.analysisVersion || '3.0'} | Total Factors: ${audit.summary.totalFactors || 'N/A'}`;
  metaCell.alignment = { horizontal: 'center' };
  metaCell.font = { italic: true, color: { argb: COLORS.neutral } };
  currentRow += 3;
  
  // Key Performance Indicators
  await addKPISection(sheet, audit, currentRow);
  currentRow += 8;
  
  // Category Performance Overview
  await addCategoryOverviewSection(sheet, audit, currentRow);
  currentRow += 12;
  
  // Priority Actions Summary
  await addPriorityActionsSummary(sheet, audit, currentRow);
  
  // Set column widths for optimal viewing
  sheet.getColumn('A').width = 25;
  sheet.getColumn('B').width = 15;
  sheet.getColumn('C').width = 15;
  sheet.getColumn('D').width = 15;
  sheet.getColumn('E').width = 15;
  sheet.getColumn('F').width = 15;
  sheet.getColumn('G').width = 15;
  sheet.getColumn('H').width = 20;
}

/**
 * Add KPI section to executive summary
 */
async function addKPISection(sheet: Excel.Worksheet, audit: EnhancedRivalAudit, startRow: number): Promise<void> {
  // Section header
  sheet.mergeCells(`A${startRow}:H${startRow}`);
  const headerCell = sheet.getCell(`A${startRow}`);
  headerCell.value = '📈 KEY PERFORMANCE INDICATORS';
  headerCell.font = { size: 14, bold: true, color: { argb: COLORS.headerDark } };
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
  sheet.getRow(startRow).height = 25;
  
  const kpiRow = startRow + 2;
  
  // Overall Score KPI
  const overallScore = audit.summary.overallScore || 0;
  sheet.getCell(`A${kpiRow}`).value = 'Overall SEO Score';
  sheet.getCell(`B${kpiRow}`).value = `${Math.round(overallScore)}/100`;
  sheet.getCell(`B${kpiRow}`).font = { size: 16, bold: true };
  sheet.getCell(`B${kpiRow}`).fill = { 
    type: 'pattern', 
    pattern: 'solid', 
    fgColor: { argb: overallScore >= 80 ? COLORS.successLight : overallScore >= 60 ? COLORS.warningLight : COLORS.dangerLight }
  };
  
  // Priority Issues KPI
  sheet.getCell(`D${kpiRow}`).value = 'Critical Issues';
  sheet.getCell(`E${kpiRow}`).value = audit.summary.priorityOfiCount;
  sheet.getCell(`E${kpiRow}`).font = { size: 16, bold: true, color: { argb: COLORS.danger } };
  
  // Opportunities KPI
  sheet.getCell(`F${kpiRow}`).value = 'Opportunities';
  sheet.getCell(`G${kpiRow}`).value = audit.summary.ofiCount;
  sheet.getCell(`G${kpiRow}`).font = { size: 16, bold: true, color: { argb: COLORS.warning } };
  
  // Pages Analyzed KPI
  const pagesAnalyzed = audit.analysisMetadata?.crawlerStats?.pagesCrawled || 'N/A';
  sheet.getCell(`H${kpiRow}`).value = `${pagesAnalyzed} Pages Analyzed`;
  sheet.getCell(`H${kpiRow}`).font = { size: 12, bold: true };
  
  // Add data bars for visual impact
  addDataBar(sheet, `B${kpiRow}`, overallScore, 100, COLORS.primary);
}

/**
 * Add category overview section
 */
async function addCategoryOverviewSection(sheet: Excel.Worksheet, audit: EnhancedRivalAudit, startRow: number): Promise<void> {
  // Section header
  sheet.mergeCells(`A${startRow}:H${startRow}`);
  const headerCell = sheet.getCell(`A${startRow}`);
  headerCell.value = '🎯 CATEGORY PERFORMANCE OVERVIEW';
  headerCell.font = { size: 14, bold: true, color: { argb: COLORS.headerDark } };
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
  sheet.getRow(startRow).height = 25;
  
  // Table headers
  const headerRow = startRow + 2;
  const headers = ['Category', 'Score', 'Critical', 'Issues', 'Passed', 'Total', 'Priority', 'Status'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(headerRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerDark } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });
  
  // Get category data
  const categories = getEnhancedCategoryData(audit);
  
  categories.forEach((category, index) => {
    const row = headerRow + 1 + index;
    const score = category.score || 0;
    
    // Category name with icon
    sheet.getCell(row, 1).value = `${category.icon} ${category.name}`;
    sheet.getCell(row, 1).font = { bold: true };
    
    // Score with conditional formatting
    sheet.getCell(row, 2).value = `${Math.round(score)}/100`;
    sheet.getCell(row, 2).font = { bold: true };
    sheet.getCell(row, 2).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: score >= 80 ? COLORS.successLight : score >= 60 ? COLORS.warningLight : COLORS.dangerLight }
    };
    
    // Issue counts with color coding
    sheet.getCell(row, 3).value = category.priorityOfiCount;
    if (category.priorityOfiCount > 0) {
      sheet.getCell(row, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
      sheet.getCell(row, 3).font = { bold: true, color: { argb: COLORS.danger } };
    }
    
    sheet.getCell(row, 4).value = category.ofiCount;
    if (category.ofiCount > 0) {
      sheet.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningLight } };
    }
    
    sheet.getCell(row, 5).value = category.okCount;
    if (category.okCount > 0) {
      sheet.getCell(row, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } };
    }
    
    sheet.getCell(row, 6).value = category.total;
    sheet.getCell(row, 6).font = { bold: true };
    
    // Priority level
    const priority = category.priorityOfiCount > 3 ? 'HIGH' : category.priorityOfiCount > 0 ? 'MEDIUM' : 'LOW';
    sheet.getCell(row, 7).value = priority;
    sheet.getCell(row, 7).font = { bold: true };
    sheet.getCell(row, 7).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: priority === 'HIGH' ? COLORS.dangerLight : priority === 'MEDIUM' ? COLORS.warningLight : COLORS.successLight }
    };
    
    // Overall status
    const status = score >= 80 ? '✅ EXCELLENT' : score >= 60 ? '⚠️ GOOD' : '🚨 NEEDS WORK';
    sheet.getCell(row, 8).value = status;
    sheet.getCell(row, 8).font = { bold: true };
    
    // Add data bar for score visualization
    addDataBar(sheet, sheet.getCell(row, 2).address, score, 100, COLORS.primary);
    
    // Add borders to all cells
    for (let col = 1; col <= 8; col++) {
      sheet.getCell(row, col).border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    }
  });
}

/**
 * Add priority actions summary
 */
async function addPriorityActionsSummary(sheet: Excel.Worksheet, audit: EnhancedRivalAudit, startRow: number): Promise<void> {
  // Get all priority OFI items
  const priorityItems = getAllPriorityOFIItems(audit);
  
  if (priorityItems.length === 0) {
    sheet.mergeCells(`A${startRow}:H${startRow}`);
    const cell = sheet.getCell(`A${startRow}`);
    cell.value = '🎉 EXCELLENT! No critical issues found in your SEO audit.';
    cell.font = { size: 14, bold: true, color: { argb: COLORS.success } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } };
    cell.alignment = { horizontal: 'center' };
    return;
  }
  
  // Section header
  sheet.mergeCells(`A${startRow}:H${startRow}`);
  const headerCell = sheet.getCell(`A${startRow}`);
  headerCell.value = `🚨 TOP ${Math.min(priorityItems.length, 5)} CRITICAL ACTIONS REQUIRED`;
  headerCell.font = { size: 14, bold: true, color: { argb: COLORS.danger } };
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
  sheet.getRow(startRow).height = 25;
  
  // Display top 5 priority items
  const topPriorityItems = priorityItems.slice(0, 5);
  topPriorityItems.forEach((item, index) => {
    const row = startRow + 2 + index;
    sheet.getCell(row, 1).value = `${index + 1}.`;
    sheet.getCell(row, 1).font = { bold: true, color: { argb: COLORS.danger } };
    
    sheet.mergeCells(row, 2, row, 6);
    sheet.getCell(row, 2).value = item.name;
    sheet.getCell(row, 2).font = { bold: true };
    
    sheet.getCell(row, 7).value = item.importance;
    sheet.getCell(row, 7).font = { bold: true };
    sheet.getCell(row, 7).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: item.importance === 'High' ? COLORS.dangerLight : COLORS.warningLight }
    };
    
    const category = getCategoryForItem(audit, item);
    sheet.getCell(row, 8).value = category;
    sheet.getCell(row, 8).font = { italic: true };
  });
}

/**
 * ENHANCED CATEGORY TABS - Detailed analysis for each category
 */
async function createEnhancedCategoryTabs(workbook: Excel.Workbook, audit: EnhancedRivalAudit): Promise<void> {
  const categories = getEnhancedCategoryData(audit);
  
  for (const category of categories) {
    if (category.items && category.items.length > 0) {
      await createEnhancedCategoryTab(workbook, category, audit.url);
    }
  }
}

/**
 * Create individual enhanced category tab
 */
async function createEnhancedCategoryTab(workbook: Excel.Workbook, category: any, url: string): Promise<void> {
  const sheetName = `${category.icon} ${category.name}`.substring(0, 31); // Excel sheet name limit
  const sheet = workbook.addWorksheet(sheetName);
  
  // Tab styling
  const tabColor = category.priorityOfiCount > 0 ? COLORS.danger : 
                   category.ofiCount > 0 ? COLORS.warning : COLORS.success;
  if (sheet.properties) {
    sheet.properties.tabColor = { argb: tabColor };
  }
  
  let currentRow = 1;
  
  // Header section
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = `${category.icon} ${category.name.toUpperCase()} ANALYSIS`;
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } };
  sheet.getRow(currentRow).height = 30;
  currentRow += 2;
  
  // Category summary
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const summaryCell = sheet.getCell(`A${currentRow}`);
  const score = category.score || 0;
  summaryCell.value = `Score: ${Math.round(score)}/100 | Critical: ${category.priorityOfiCount} | Issues: ${category.ofiCount} | Passed: ${category.okCount} | Total: ${category.total}`;
  summaryCell.alignment = { horizontal: 'center' };
  summaryCell.font = { bold: true };
  summaryCell.fill = { 
    type: 'pattern', pattern: 'solid', 
    fgColor: { argb: score >= 80 ? COLORS.successLight : score >= 60 ? COLORS.warningLight : COLORS.dangerLight }
  };
  currentRow += 3;
  
  // Column headers
  const headers = ['Factor', 'Description', 'Status', 'Importance', 'Page', 'Category', 'Action Required'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerDark } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    addBorderToCell(cell);
  });
  sheet.getRow(currentRow).height = 25;
  currentRow++;
  
  // Data rows
  category.items.forEach((item: EnhancedAuditItem, index: number) => {
    // Factor name
    sheet.getCell(currentRow, 1).value = item.name;
    sheet.getCell(currentRow, 1).font = { bold: true };
    
    // Description
    sheet.getCell(currentRow, 2).value = item.description;
    
    // Status with conditional formatting
    const statusCell = sheet.getCell(currentRow, 3);
    statusCell.value = item.status;
    statusCell.font = { bold: true };
    statusCell.alignment = { horizontal: 'center' };
    
    switch (item.status) {
      case 'Priority OFI':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
        statusCell.font = { ...statusCell.font, color: { argb: COLORS.danger } };
        break;
      case 'OFI':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningLight } };
        statusCell.font = { ...statusCell.font, color: { argb: COLORS.warning } };
        break;
      case 'OK':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } };
        statusCell.font = { ...statusCell.font, color: { argb: COLORS.success } };
        break;
      case 'N/A':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
        statusCell.font = { ...statusCell.font, color: { argb: COLORS.neutral } };
        break;
    }
    
    // Importance
    const importanceCell = sheet.getCell(currentRow, 4);
    importanceCell.value = item.importance;
    importanceCell.alignment = { horizontal: 'center' };
    importanceCell.font = { bold: true };
    importanceCell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { 
        argb: item.importance === 'High' ? COLORS.dangerLight : 
              item.importance === 'Medium' ? COLORS.warningLight : COLORS.neutralLight
      }
    };
    
    // Page URL (if available)
    sheet.getCell(currentRow, 5).value = item.pageUrl ? item.pageUrl.substring(0, 50) : 'Site-wide';
    sheet.getCell(currentRow, 5).font = { size: 10 };
    
    // Category
    sheet.getCell(currentRow, 6).value = item.category || 'General';
    sheet.getCell(currentRow, 6).font = { italic: true };
    sheet.getCell(currentRow, 6).alignment = { horizontal: 'center' };
    
    // Action required (derived from notes)
    const actionRequired = generateActionFromNotes(item);
    sheet.getCell(currentRow, 7).value = actionRequired;
    sheet.getCell(currentRow, 7).font = { size: 10 };
    
    // Add borders and styling
    for (let col = 1; col <= 7; col++) {
      addBorderToCell(sheet.getCell(currentRow, col));
      sheet.getCell(currentRow, col).alignment = { ...sheet.getCell(currentRow, col).alignment, wrapText: true };
    }
    
    // Highlight entire row for Priority OFI
    if (item.status === 'Priority OFI') {
      for (let col = 1; col <= 7; col++) {
        if (col !== 3) { // Skip status column (already colored)
          sheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } };
        }
      }
      sheet.getRow(currentRow).height = 30;
    } else {
      sheet.getRow(currentRow).height = 20;
    }
    
    // Zebra striping for better readability
    if (index % 2 === 1 && item.status !== 'Priority OFI') {
      for (let col = 1; col <= 7; col++) {
        if (col !== 3 && col !== 4) { // Skip already colored status and importance
          const currentFill = sheet.getCell(currentRow, col).fill;
          if (!currentFill || (currentFill as any).fgColor?.argb === COLORS.white) {
            sheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
          }
        }
      }
    }
    
    currentRow++;
  });
  
  // Set optimal column widths
  sheet.getColumn(1).width = 35; // Factor name
  sheet.getColumn(2).width = 50; // Description
  sheet.getColumn(3).width = 15; // Status
  sheet.getColumn(4).width = 12; // Importance
  sheet.getColumn(5).width = 30; // Page URL
  sheet.getColumn(6).width = 15; // Category
  sheet.getColumn(7).width = 60; // Action required
  
  // Freeze header rows
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
}

/**
 * PAGE-LEVEL ANALYSIS TAB - Detailed page breakdowns
 */
async function createPageLevelAnalysisTab(workbook: Excel.Workbook, audit: EnhancedRivalAudit): Promise<void> {
  const sheet = workbook.addWorksheet('📄 Page Analysis');
  if (sheet.properties) {
    sheet.properties.tabColor = { argb: COLORS.primary };
  }
  
  // Extract page-level data from enhanced audit items
  const pageData = extractPageLevelData(audit);
  
  let currentRow = 1;
  
  // Header
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = '📄 PAGE-LEVEL SEO ANALYSIS';
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } };
  sheet.getRow(currentRow).height = 30;
  currentRow += 3;
  
  if (pageData.length === 0) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'No page-specific data available. This analysis was performed at the site level.';
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${currentRow}`).font = { italic: true };
    return;
  }
  
  // Column headers
  const headers = ['Page URL', 'Page Type', 'Critical Issues', 'Issues', 'Passed', 'Total Factors'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerDark } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    addBorderToCell(cell);
  });
  currentRow++;
  
  // Page data rows
  pageData.forEach((page, index) => {
    sheet.getCell(currentRow, 1).value = page.url;
    sheet.getCell(currentRow, 2).value = page.type;
    
    // Critical issues with color coding
    const criticalCell = sheet.getCell(currentRow, 3);
    criticalCell.value = page.criticalIssues;
    if (page.criticalIssues > 0) {
      criticalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
      criticalCell.font = { bold: true, color: { argb: COLORS.danger } };
    }
    
    // Regular issues
    const issuesCell = sheet.getCell(currentRow, 4);
    issuesCell.value = page.issues;
    if (page.issues > 0) {
      issuesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningLight } };
    }
    
    // Passed items
    const passedCell = sheet.getCell(currentRow, 5);
    passedCell.value = page.passed;
    if (page.passed > 0) {
      passedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } };
    }
    
    sheet.getCell(currentRow, 6).value = page.total;
    sheet.getCell(currentRow, 6).font = { bold: true };
    
    // Add borders
    for (let col = 1; col <= 6; col++) {
      addBorderToCell(sheet.getCell(currentRow, col));
    }
    
    // Zebra striping
    if (index % 2 === 1) {
      for (let col = 1; col <= 6; col++) {
        const cell = sheet.getCell(currentRow, col);
        const currentFill = cell.fill;
        if (!currentFill || (currentFill as any).fgColor?.argb === COLORS.white) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
        }
      }
    }
    
    currentRow++;
  });
  
  // Set column widths
  sheet.getColumn(1).width = 50; // URL
  sheet.getColumn(2).width = 15; // Type
  sheet.getColumn(3).width = 15; // Critical
  sheet.getColumn(4).width = 15; // Issues
  sheet.getColumn(5).width = 15; // Passed
  sheet.getColumn(6).width = 15; // Total
}

/**
 * PRIORITY ACTIONS TAB - Consolidated priority issues with action plans
 */
async function createPriorityActionsTab(workbook: Excel.Workbook, audit: EnhancedRivalAudit): Promise<void> {
  const priorityItems = getAllPriorityOFIItems(audit);
  
  const sheet = workbook.addWorksheet('🚨 Priority Actions');
  if (sheet.properties) {
    sheet.properties.tabColor = { argb: COLORS.danger };
  }
  
  let currentRow = 1;
  
  // Header
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = `🚨 CRITICAL SEO ISSUES REQUIRING IMMEDIATE ATTENTION (${priorityItems.length} FOUND)`;
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.danger } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
  sheet.getRow(currentRow).height = 30;
  currentRow += 2;
  
  if (priorityItems.length === 0) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const congratsCell = sheet.getCell(`A${currentRow}`);
    congratsCell.value = '🎉 EXCELLENT! No critical SEO issues found. Your website is performing well!';
    congratsCell.font = { size: 14, bold: true, color: { argb: COLORS.success } };
    congratsCell.alignment = { horizontal: 'center' };
    congratsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } };
    sheet.getRow(currentRow).height = 25;
    return;
  }
  
  // Instructions
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const instructionsCell = sheet.getCell(`A${currentRow}`);
  instructionsCell.value = 'These critical issues have the highest impact on your SEO performance. Address them in priority order for maximum improvement.';
  instructionsCell.font = { italic: true };
  instructionsCell.alignment = { horizontal: 'center' };
  currentRow += 3;
  
  // Column headers
  const headers = ['Priority', 'Issue', 'Impact', 'Category', 'Affected Page', 'Action Required', 'Business Value'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.danger } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    addBorderToCell(cell);
  });
  sheet.getRow(currentRow).height = 25;
  currentRow++;
  
  // Priority items
  priorityItems.forEach((item, index) => {
    // Priority rank
    const priorityCell = sheet.getCell(currentRow, 1);
    priorityCell.value = `#${index + 1}`;
    priorityCell.font = { bold: true, size: 12, color: { argb: COLORS.danger } };
    priorityCell.alignment = { horizontal: 'center' };
    
    // Issue name
    sheet.getCell(currentRow, 2).value = item.name;
    sheet.getCell(currentRow, 2).font = { bold: true };
    
    // Impact level
    const impactCell = sheet.getCell(currentRow, 3);
    impactCell.value = item.importance;
    impactCell.font = { bold: true };
    impactCell.alignment = { horizontal: 'center' };
    impactCell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: item.importance === 'High' ? COLORS.dangerLight : COLORS.warningLight }
    };
    
    // Category
    const category = getCategoryForItem(audit, item);
    sheet.getCell(currentRow, 4).value = category;
    sheet.getCell(currentRow, 4).font = { italic: true };
    sheet.getCell(currentRow, 4).alignment = { horizontal: 'center' };
    
    // Affected page
    sheet.getCell(currentRow, 5).value = item.pageUrl || 'Site-wide';
    sheet.getCell(currentRow, 5).font = { size: 10 };
    
    // Action required
    const actionRequired = generateDetailedAction(item);
    sheet.getCell(currentRow, 6).value = actionRequired;
    
    // Business value
    const businessValue = generateBusinessValue(item);
    sheet.getCell(currentRow, 7).value = businessValue;
    sheet.getCell(currentRow, 7).font = { size: 10, italic: true };
    
    // Add borders and styling
    for (let col = 1; col <= 7; col++) {
      addBorderToCell(sheet.getCell(currentRow, col));
      sheet.getCell(currentRow, col).alignment = { ...sheet.getCell(currentRow, col).alignment, wrapText: true };
    }
    
    // Row height for readability
    sheet.getRow(currentRow).height = 35;
    
    // Highlight row
    for (let col = 1; col <= 7; col++) {
      if (col !== 3) { // Skip impact column (already colored)
        sheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } };
      }
    }
    
    currentRow++;
  });
  
  // Set column widths
  sheet.getColumn(1).width = 10; // Priority
  sheet.getColumn(2).width = 40; // Issue
  sheet.getColumn(3).width = 12; // Impact
  sheet.getColumn(4).width = 20; // Category
  sheet.getColumn(5).width = 30; // Page
  sheet.getColumn(6).width = 50; // Action
  sheet.getColumn(7).width = 40; // Business value
  
  // Freeze headers
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
}

/**
 * TECHNICAL METADATA TAB - Analysis details and performance metrics
 */
async function createTechnicalMetadataTab(workbook: Excel.Workbook, audit: EnhancedRivalAudit): Promise<void> {
  const sheet = workbook.addWorksheet('⚙️ Technical Data');
  if (sheet.properties) {
    sheet.properties.tabColor = { argb: COLORS.neutral };
  }
  
  let currentRow = 1;
  
  // Header
  sheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = '⚙️ TECHNICAL ANALYSIS METADATA';
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.headerDark } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
  sheet.getRow(currentRow).height = 30;
  currentRow += 3;
  
  // Analysis information
  const analysisData = [
    { label: 'Analysis Date', value: new Date().toLocaleString() },
    { label: 'Analysis Version', value: audit.analysisMetadata?.analysisVersion || '3.0' },
    { label: 'Total Factors Analyzed', value: audit.summary.totalFactors || 'N/A' },
    { label: 'Pages Crawled', value: audit.analysisMetadata?.crawlerStats?.pagesCrawled || 'N/A' },
    { label: 'Analysis Duration', value: audit.analysisMetadata?.analysisTime ? `${Math.round(audit.analysisMetadata.analysisTime / 1000)}s` : 'N/A' },
    { label: 'Website URL', value: audit.url },
    { label: 'Report Generated By', value: 'Rival Outranker SEO Platform' },
    { label: 'Overall SEO Score', value: audit.summary.overallScore ? `${Math.round(audit.summary.overallScore)}/100` : 'N/A' },
    { label: 'Weighted Score', value: audit.summary.weightedOverallScore ? `${Math.round(audit.summary.weightedOverallScore)}/100` : 'N/A' },
    { label: 'Critical Issues Found', value: audit.summary.priorityOfiCount },
    { label: 'Improvement Opportunities', value: audit.summary.ofiCount },
    { label: 'Passed Checks', value: audit.summary.okCount },
    { label: 'Non-Applicable Items', value: audit.summary.naCount }
  ];
  
  // Add analysis data
  analysisData.forEach((item, index) => {
    sheet.getCell(currentRow, 1).value = item.label;
    sheet.getCell(currentRow, 1).font = { bold: true };
    sheet.getCell(currentRow, 2).value = item.value;
    
    // Add borders
    addBorderToCell(sheet.getCell(currentRow, 1));
    addBorderToCell(sheet.getCell(currentRow, 2));
    
    // Zebra striping
    if (index % 2 === 1) {
      sheet.getCell(currentRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
      sheet.getCell(currentRow, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
    }
    
    currentRow++;
  });
  
  currentRow += 2;
  
  // Category breakdown
  sheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const categoryHeaderCell = sheet.getCell(`A${currentRow}`);
  categoryHeaderCell.value = 'Category Score Breakdown';
  categoryHeaderCell.font = { size: 14, bold: true };
  categoryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } };
  currentRow += 2;
  
  // Category breakdown data
  const categories = getEnhancedCategoryData(audit);
  sheet.getCell(currentRow, 1).value = 'Category';
  sheet.getCell(currentRow, 2).value = 'Score';
  sheet.getCell(currentRow, 3).value = 'Factors';
  sheet.getCell(currentRow, 4).value = 'Status';
  
  // Header styling
  for (let col = 1; col <= 4; col++) {
    const cell = sheet.getCell(currentRow, col);
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerDark } };
    cell.alignment = { horizontal: 'center' };
    addBorderToCell(cell);
  }
  currentRow++;
  
  categories.forEach((category, index) => {
    sheet.getCell(currentRow, 1).value = `${category.icon} ${category.name}`;
    sheet.getCell(currentRow, 2).value = category.score ? `${Math.round(category.score)}/100` : 'N/A';
    sheet.getCell(currentRow, 3).value = category.total;
    
    const status = (category.score || 0) >= 80 ? 'Excellent' : (category.score || 0) >= 60 ? 'Good' : 'Needs Work';
    sheet.getCell(currentRow, 4).value = status;
    
    // Add borders
    for (let col = 1; col <= 4; col++) {
      addBorderToCell(sheet.getCell(currentRow, col));
    }
    
    // Zebra striping
    if (index % 2 === 1) {
      for (let col = 1; col <= 4; col++) {
        sheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
      }
    }
    
    currentRow++;
  });
  
  // Set column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
}

/**
 * LEGACY COMPATIBILITY FUNCTIONS
 */
async function createLegacyExecutiveSummaryTab(workbook: Excel.Workbook, audit: RivalAudit, displayUrl: string): Promise<void> {
  // Simplified version for legacy audits
  const sheet = workbook.addWorksheet('📊 Summary');
  
  // Title
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `SEO Audit Report - ${displayUrl}`;
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } };
  
  // Add summary data for legacy format
  const categories = getLegacyCategoryData(audit);
  
  let currentRow = 4;
  
  // Headers
  const headers = ['Category', 'Critical', 'Issues', 'Passed', 'N/A', 'Total'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerDark } };
    addBorderToCell(cell);
  });
  currentRow++;
  
  // Category data
  categories.forEach((category, index) => {
    sheet.getCell(currentRow, 1).value = `${category.icon} ${category.name}`;
    sheet.getCell(currentRow, 2).value = category.priorityOfiCount;
    sheet.getCell(currentRow, 3).value = category.ofiCount;
    sheet.getCell(currentRow, 4).value = category.okCount;
    sheet.getCell(currentRow, 5).value = category.naCount;
    sheet.getCell(currentRow, 6).value = category.total;
    
    // Color coding for critical issues
    if (category.priorityOfiCount > 0) {
      sheet.getCell(currentRow, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
    }
    
    for (let col = 1; col <= 6; col++) {
      addBorderToCell(sheet.getCell(currentRow, col));
    }
    
    currentRow++;
  });
  
  // Set column widths
  for (let col = 1; col <= 6; col++) {
    sheet.getColumn(col).width = 15;
  }
  sheet.getColumn(1).width = 25;
}

async function createLegacyCategoryTabs(workbook: Excel.Workbook, audit: RivalAudit): Promise<void> {
  const categories = getLegacyCategoryData(audit);
  
  for (const category of categories) {
    if (category.items && category.items.length > 0) {
      await createLegacyCategoryTab(workbook, category, audit.url);
    }
  }
}

async function createLegacyCategoryTab(workbook: Excel.Workbook, category: any, url: string): Promise<void> {
  const sheetName = category.name.substring(0, 31);
  const sheet = workbook.addWorksheet(sheetName);
  
  // Similar to enhanced but simplified for legacy items
  let currentRow = 1;
  
  // Header
  sheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = `${category.name} Analysis`;
  titleCell.font = { size: 14, bold: true, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } };
  currentRow += 3;
  
  // Column headers
  const headers = ['Item', 'Description', 'Status', 'Importance', 'Notes'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerDark } };
    addBorderToCell(cell);
  });
  currentRow++;
  
  // Data rows
  category.items.forEach((item: AuditItem) => {
    sheet.getCell(currentRow, 1).value = item.name;
    sheet.getCell(currentRow, 2).value = item.description || '';
    
    // Status with color coding
    const statusCell = sheet.getCell(currentRow, 3);
    statusCell.value = item.status;
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = { bold: true };
    
    switch (item.status) {
      case 'Priority OFI':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
        break;
      case 'OFI':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningLight } };
        break;
      case 'OK':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } };
        break;
      case 'N/A':
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.neutralLight } };
        break;
    }
    
    sheet.getCell(currentRow, 4).value = item.importance;
    sheet.getCell(currentRow, 5).value = item.notes || '';
    
    for (let col = 1; col <= 5; col++) {
      addBorderToCell(sheet.getCell(currentRow, col));
      sheet.getCell(currentRow, col).alignment = { ...sheet.getCell(currentRow, col).alignment, wrapText: true };
    }
    
    currentRow++;
  });
  
  // Set column widths
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 60;
}

async function createLegacyPriorityActionsTab(workbook: Excel.Workbook, audit: RivalAudit): Promise<void> {
  const priorityItems = getAllLegacyPriorityOFIItems(audit);
  
  const sheet = workbook.addWorksheet('🚨 Priority Actions');
  
  // Similar structure but for legacy audit items
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Priority Issues (${priorityItems.length} found)`;
  titleCell.font = { size: 14, bold: true, color: { argb: COLORS.danger } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dangerLight } };
  
  if (priorityItems.length === 0) {
    sheet.getCell('A3').value = 'No critical issues found!';
    return;
  }
  
  // Headers
  const headers = ['Issue', 'Category', 'Importance', 'Action Required'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(4, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.danger } };
    addBorderToCell(cell);
  });
  
  // Priority items
  priorityItems.forEach((item, index) => {
    const row = 5 + index;
    sheet.getCell(row, 1).value = item.name;
    sheet.getCell(row, 2).value = getLegacyCategoryForItem(audit, item);
    sheet.getCell(row, 3).value = item.importance;
    sheet.getCell(row, 4).value = item.notes || 'Requires attention';
    
    for (let col = 1; col <= 4; col++) {
      addBorderToCell(sheet.getCell(row, col));
      sheet.getCell(row, col).alignment = { wrapText: true };
    }
  });
  
  // Set column widths
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 50;
}

/**
 * UTILITY FUNCTIONS
 */

function getEnhancedCategoryData(audit: EnhancedRivalAudit): any[] {
  const categories = [];
  
  // CRITICAL FIX: Use categoryScores from summary instead of individual category scores
  const categoryScores = (audit.summary as any).categoryScores || {};
  
  // Enhanced categories (priority)
  if (audit.contentQuality && audit.contentQuality.items) {
    categories.push({
      name: 'Content Quality',
      items: audit.contentQuality.items,
      score: categoryScores['Content Quality'] || 0,
      icon: '📝',
      priorityOfiCount: audit.contentQuality.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.contentQuality.items.filter(item => item.status === 'OFI').length,
      okCount: audit.contentQuality.items.filter(item => item.status === 'OK').length,
      naCount: audit.contentQuality.items.filter(item => item.status === 'N/A').length,
      total: audit.contentQuality.items.length
    });
  }
  
  if (audit.technicalSEO && audit.technicalSEO.items) {
    categories.push({
      name: 'Technical SEO',
      items: audit.technicalSEO.items,
      score: categoryScores['Technical SEO'] || 0,
      icon: '⚙️',
      priorityOfiCount: audit.technicalSEO.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.technicalSEO.items.filter(item => item.status === 'OFI').length,
      okCount: audit.technicalSEO.items.filter(item => item.status === 'OK').length,
      naCount: audit.technicalSEO.items.filter(item => item.status === 'N/A').length,
      total: audit.technicalSEO.items.length
    });
  }
  
  if (audit.localSEO && audit.localSEO.items) {
    categories.push({
      name: 'Local SEO & E-E-A-T',
      items: audit.localSEO.items,
      score: categoryScores['Local SEO & E-E-A-T'] || 0,
      icon: '📍',
      priorityOfiCount: audit.localSEO.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.localSEO.items.filter(item => item.status === 'OFI').length,
      okCount: audit.localSEO.items.filter(item => item.status === 'OK').length,
      naCount: audit.localSEO.items.filter(item => item.status === 'N/A').length,
      total: audit.localSEO.items.length
    });
  }
  
  if (audit.uxPerformance && audit.uxPerformance.items) {
    categories.push({
      name: 'UX & Performance',
      items: audit.uxPerformance.items,
      score: categoryScores['UX & Performance'] || 0,
      icon: '🚀',
      priorityOfiCount: audit.uxPerformance.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.uxPerformance.items.filter(item => item.status === 'OFI').length,
      okCount: audit.uxPerformance.items.filter(item => item.status === 'OK').length,
      naCount: audit.uxPerformance.items.filter(item => item.status === 'N/A').length,
      total: audit.uxPerformance.items.length
    });
  }
  
  // Fallback to legacy categories if enhanced don't exist
  if (categories.length === 0) {
    if (audit.onPage?.items) {
      categories.push({
        name: 'On-Page',
        items: audit.onPage.items,
        score: (audit.onPage as any).score || 0,
        icon: '📄',
        priorityOfiCount: audit.onPage.items.filter(item => item.status === 'Priority OFI').length,
        ofiCount: audit.onPage.items.filter(item => item.status === 'OFI').length,
        okCount: audit.onPage.items.filter(item => item.status === 'OK').length,
        naCount: audit.onPage.items.filter(item => item.status === 'N/A').length,
        total: audit.onPage.items.length
      });
    }
    
    // Add other legacy categories...
    if (audit.structureNavigation?.items) {
      categories.push({
        name: 'Structure & Navigation',
        items: audit.structureNavigation.items,
        score: (audit.structureNavigation as any).score || 0,
        icon: '🧭',
        priorityOfiCount: audit.structureNavigation.items.filter(item => item.status === 'Priority OFI').length,
        ofiCount: audit.structureNavigation.items.filter(item => item.status === 'OFI').length,
        okCount: audit.structureNavigation.items.filter(item => item.status === 'OK').length,
        naCount: audit.structureNavigation.items.filter(item => item.status === 'N/A').length,
        total: audit.structureNavigation.items.length
      });
    }
  }
  
  return categories;
}

function getLegacyCategoryData(audit: RivalAudit): any[] {
  const categories = [
    {
      name: 'On-Page',
      items: audit.onPage.items,
      icon: '📄',
      priorityOfiCount: audit.onPage.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.onPage.items.filter(item => item.status === 'OFI').length,
      okCount: audit.onPage.items.filter(item => item.status === 'OK').length,
      naCount: audit.onPage.items.filter(item => item.status === 'N/A').length,
      total: audit.onPage.items.length
    },
    {
      name: 'Structure & Navigation',
      items: audit.structureNavigation.items,
      icon: '🧭',
      priorityOfiCount: audit.structureNavigation.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.structureNavigation.items.filter(item => item.status === 'OFI').length,
      okCount: audit.structureNavigation.items.filter(item => item.status === 'OK').length,
      naCount: audit.structureNavigation.items.filter(item => item.status === 'N/A').length,
      total: audit.structureNavigation.items.length
    },
    {
      name: 'Contact Page',
      items: audit.contactPage.items,
      icon: '📞',
      priorityOfiCount: audit.contactPage.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.contactPage.items.filter(item => item.status === 'OFI').length,
      okCount: audit.contactPage.items.filter(item => item.status === 'OK').length,
      naCount: audit.contactPage.items.filter(item => item.status === 'N/A').length,
      total: audit.contactPage.items.length
    },
    {
      name: 'Service Pages',
      items: audit.servicePages.items,
      icon: '🛠️',
      priorityOfiCount: audit.servicePages.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.servicePages.items.filter(item => item.status === 'OFI').length,
      okCount: audit.servicePages.items.filter(item => item.status === 'OK').length,
      naCount: audit.servicePages.items.filter(item => item.status === 'N/A').length,
      total: audit.servicePages.items.length
    },
    {
      name: 'Location Pages',
      items: audit.locationPages.items,
      icon: '📍',
      priorityOfiCount: audit.locationPages.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.locationPages.items.filter(item => item.status === 'OFI').length,
      okCount: audit.locationPages.items.filter(item => item.status === 'OK').length,
      naCount: audit.locationPages.items.filter(item => item.status === 'N/A').length,
      total: audit.locationPages.items.length
    }
  ];
  
  if (audit.serviceAreaPages?.items && audit.serviceAreaPages.items.length > 0) {
    categories.push({
      name: 'Service Area Pages',
      items: audit.serviceAreaPages.items,
      icon: '🌐',
      priorityOfiCount: audit.serviceAreaPages.items.filter(item => item.status === 'Priority OFI').length,
      ofiCount: audit.serviceAreaPages.items.filter(item => item.status === 'OFI').length,
      okCount: audit.serviceAreaPages.items.filter(item => item.status === 'OK').length,
      naCount: audit.serviceAreaPages.items.filter(item => item.status === 'N/A').length,
      total: audit.serviceAreaPages.items.length
    });
  }
  
  return categories;
}

function getAllPriorityOFIItems(audit: EnhancedRivalAudit): EnhancedAuditItem[] {
  const priorityItems: EnhancedAuditItem[] = [];
  
  // Enhanced categories first
  if (audit.contentQuality?.items) {
    priorityItems.push(...audit.contentQuality.items.filter(item => item.status === 'Priority OFI'));
  }
  if (audit.technicalSEO?.items) {
    priorityItems.push(...audit.technicalSEO.items.filter(item => item.status === 'Priority OFI'));
  }
  if (audit.localSEO?.items) {
    priorityItems.push(...audit.localSEO.items.filter(item => item.status === 'Priority OFI'));
  }
  if (audit.uxPerformance?.items) {
    priorityItems.push(...audit.uxPerformance.items.filter(item => item.status === 'Priority OFI'));
  }
  
  // Fallback to legacy categories
  if (priorityItems.length === 0) {
    if (audit.onPage?.items) priorityItems.push(...audit.onPage.items.filter(item => item.status === 'Priority OFI'));
    if (audit.structureNavigation?.items) priorityItems.push(...audit.structureNavigation.items.filter(item => item.status === 'Priority OFI'));
    if (audit.contactPage?.items) priorityItems.push(...audit.contactPage.items.filter(item => item.status === 'Priority OFI'));
    if (audit.servicePages?.items) priorityItems.push(...audit.servicePages.items.filter(item => item.status === 'Priority OFI'));
    if (audit.locationPages?.items) priorityItems.push(...audit.locationPages.items.filter(item => item.status === 'Priority OFI'));
    if (audit.serviceAreaPages?.items) priorityItems.push(...audit.serviceAreaPages.items.filter(item => item.status === 'Priority OFI'));
  }
  
  // Sort by importance (High first)
  return priorityItems.sort((a, b) => {
    const importanceOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
  });
}

function getAllLegacyPriorityOFIItems(audit: RivalAudit): AuditItem[] {
  const priorityItems: AuditItem[] = [];
  
  priorityItems.push(...audit.onPage.items.filter(item => item.status === 'Priority OFI'));
  priorityItems.push(...audit.structureNavigation.items.filter(item => item.status === 'Priority OFI'));
  priorityItems.push(...audit.contactPage.items.filter(item => item.status === 'Priority OFI'));
  priorityItems.push(...audit.servicePages.items.filter(item => item.status === 'Priority OFI'));
  priorityItems.push(...audit.locationPages.items.filter(item => item.status === 'Priority OFI'));
  
  if (audit.serviceAreaPages?.items) {
    priorityItems.push(...audit.serviceAreaPages.items.filter(item => item.status === 'Priority OFI'));
  }
  
  return priorityItems.sort((a, b) => {
    const importanceOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
  });
}

function extractPageLevelData(audit: EnhancedRivalAudit): any[] {
  const pageMap = new Map();
  
  // Extract page data from enhanced audit items
  const allItems = [
    ...(audit.contentQuality?.items || []),
    ...(audit.technicalSEO?.items || []),
    ...(audit.localSEO?.items || []),
    ...(audit.uxPerformance?.items || [])
  ];
  
  allItems.forEach(item => {
    if (item.pageUrl) {
      const existing = pageMap.get(item.pageUrl) || {
        url: item.pageUrl,
        type: item.pageType || 'Unknown',
        criticalIssues: 0,
        issues: 0,
        passed: 0,
        total: 0
      };
      
      switch (item.status) {
        case 'Priority OFI':
          existing.criticalIssues++;
          break;
        case 'OFI':
          existing.issues++;
          break;
        case 'OK':
          existing.passed++;
          break;
      }
      existing.total++;
      
      pageMap.set(item.pageUrl, existing);
    }
  });
  
  return Array.from(pageMap.values());
}

function getCategoryForItem(audit: EnhancedRivalAudit, item: EnhancedAuditItem): string {
  if (audit.contentQuality?.items.includes(item)) return 'Content Quality';
  if (audit.technicalSEO?.items.includes(item)) return 'Technical SEO';
  if (audit.localSEO?.items.includes(item)) return 'Local SEO';
  if (audit.uxPerformance?.items.includes(item)) return 'UX & Performance';
  
  // Legacy categories
  if (audit.onPage?.items.includes(item)) return 'On-Page';
  if (audit.structureNavigation?.items.includes(item)) return 'Structure & Navigation';
  if (audit.contactPage?.items.includes(item)) return 'Contact Page';
  if (audit.servicePages?.items.includes(item)) return 'Service Pages';
  if (audit.locationPages?.items.includes(item)) return 'Location Pages';
  if (audit.serviceAreaPages?.items.includes(item)) return 'Service Area Pages';
  
  return 'General';
}

function getLegacyCategoryForItem(audit: RivalAudit, item: AuditItem): string {
  if (audit.onPage.items.includes(item)) return 'On-Page';
  if (audit.structureNavigation.items.includes(item)) return 'Structure & Navigation';
  if (audit.contactPage.items.includes(item)) return 'Contact Page';
  if (audit.servicePages.items.includes(item)) return 'Service Pages';
  if (audit.locationPages.items.includes(item)) return 'Location Pages';
  if (audit.serviceAreaPages?.items.includes(item)) return 'Service Area Pages';
  return 'General';
}

function generateActionFromNotes(item: EnhancedAuditItem): string {
  if (item.notes && item.notes.includes('How:')) {
    const howIndex = item.notes.indexOf('How:');
    return item.notes.substring(howIndex + 4).trim();
  }
  return item.notes || `Address ${item.name.toLowerCase()} on your website`;
}

function generateDetailedAction(item: EnhancedAuditItem): string {
  if (item.notes && item.notes.includes('How:')) {
    const howIndex = item.notes.indexOf('How:');
    return item.notes.substring(howIndex + 4).trim();
  }
  
  // Generate action based on item name and status
  switch (item.importance) {
    case 'High':
      return `URGENT: Fix ${item.name.toLowerCase()} immediately to prevent SEO ranking loss.`;
    case 'Medium':
      return `Improve ${item.name.toLowerCase()} to enhance SEO performance.`;
    case 'Low':
      return `Consider optimizing ${item.name.toLowerCase()} when resources allow.`;
    default:
      return `Review and address ${item.name.toLowerCase()}.`;
  }
}

function generateBusinessValue(item: EnhancedAuditItem): string {
  const businessValues = {
    'High': 'Direct impact on search rankings and organic traffic. May affect revenue.',
    'Medium': 'Noticeable improvement in search visibility and user experience.',
    'Low': 'Incremental improvement in overall SEO health and user satisfaction.'
  };
  
  return businessValues[item.importance] || 'Contributes to overall SEO performance.';
}

function addBorderToCell(cell: Excel.Cell): void {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
  };
}

function addDataBar(sheet: Excel.Worksheet, cellAddress: string, value: number, maxValue: number, color: string): void {
  // Note: ExcelJS doesn't support data bars directly, but we can simulate with conditional formatting
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  // We'll add this as a comment or future enhancement when ExcelJS supports data bars
  // For now, the conditional formatting with colors provides good visual feedback
}