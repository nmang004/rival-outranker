import Excel from 'exceljs';
import { RivalAudit, AuditItem, EnhancedRivalAudit, EnhancedAuditItem } from '../../../shared/schema';
import { Buffer } from 'buffer';

/**
 * Generate an Excel file from an Enhanced Rival Audit (140+ factors)
 * 
 * @param audit The enhanced rival audit data to export
 * @returns Excel workbook as a buffer
 */
export async function generateEnhancedRivalAuditExcel(audit: EnhancedRivalAudit): Promise<any> {
  // Create a new workbook
  const workbook = new Excel.Workbook();
  
  // Add a summary worksheet
  const summarySheet = workbook.addWorksheet('Summary');
  
  // Format the title with the actual queried URL (removing http/https prefix for cleaner display)
  summarySheet.mergeCells('A1:G1');
  const displayUrl = audit.url.replace(/^https?:\/\//, '');
  summarySheet.getCell('A1').value = `Comprehensive SEO Audit (140+ Factors) for ${displayUrl}`;
  summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2D5699' } };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  summarySheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7EEF6' }
  };
  
  // Add generated date and analysis version
  summarySheet.mergeCells('A2:G2');
  summarySheet.getCell('A2').value = `Generated: ${new Date(audit.timestamp).toLocaleDateString()} | Analysis Version: ${audit.analysisMetadata?.analysisVersion || '2.0'}`;
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add summary section
  summarySheet.mergeCells('A4:G4');
  summarySheet.getCell('A4').value = 'Enhanced Audit Summary';
  summarySheet.getCell('A4').font = { size: 14, bold: true };
  
  // Add summary counts with enhanced metrics
  summarySheet.getCell('A6').value = 'Category';
  summarySheet.getCell('B6').value = 'Priority OFI';
  summarySheet.getCell('C6').value = 'OFI';
  summarySheet.getCell('D6').value = 'OK';
  summarySheet.getCell('E6').value = 'N/A';
  summarySheet.getCell('F6').value = 'Total';
  summarySheet.getCell('G6').value = 'Score';
  
  // Style the header row
  for (let col = 1; col <= 7; col++) {
    summarySheet.getCell(6, col).font = { bold: true };
    summarySheet.getCell(6, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    summarySheet.getCell(6, col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Get counts for each category - UPDATED for enhanced categories
  const categoryData = [];
  
  // Add enhanced categories if they exist (new structure)
  if (audit.contentQuality && audit.contentQuality.items) {
    categoryData.push({
      name: 'Content Quality',
      items: audit.contentQuality.items,
      score: audit.contentQuality.score,
      icon: '📝'
    });
  }
  
  if (audit.technicalSEO && audit.technicalSEO.items) {
    categoryData.push({
      name: 'Technical SEO',
      items: audit.technicalSEO.items,
      score: audit.technicalSEO.score,
      icon: '⚙️'
    });
  }
  
  if (audit.localSEO && audit.localSEO.items) {
    categoryData.push({
      name: 'Local SEO & E-E-A-T',
      items: audit.localSEO.items,
      score: audit.localSEO.score,
      icon: '📍'
    });
  }
  
  if (audit.uxPerformance && audit.uxPerformance.items) {
    categoryData.push({
      name: 'UX & Performance',
      items: audit.uxPerformance.items,
      score: audit.uxPerformance.score,
      icon: '🚀'
    });
  }
  
  // Fallback to legacy categories if enhanced categories don't exist
  if (categoryData.length === 0) {
    categoryData.push(
      {
        name: 'On-Page',
        items: audit.onPage?.items || [],
        score: audit.onPage?.score,
        icon: '📄'
      },
      {
        name: 'Structure & Navigation',
        items: audit.structureNavigation?.items || [],
        score: audit.structureNavigation?.score,
        icon: '🧭'
      },
      {
        name: 'Contact Page',
        items: audit.contactPage?.items || [],
        score: audit.contactPage?.score,
        icon: '📞'
      },
      {
        name: 'Service Pages',
        items: audit.servicePages?.items || [],
        score: audit.servicePages?.score,
        icon: '🛠️'
      },
      {
        name: 'Location Pages',
        items: audit.locationPages?.items || [],
        score: audit.locationPages?.score,
        icon: '📍'
      }
    );
  }
  
  // Add service area pages to category data if they exist and have meaningful content
  if (audit.serviceAreaPages && audit.serviceAreaPages.items && audit.serviceAreaPages.items.length > 0) {
    // Only include if there are items that aren't all N/A
    const relevantItems = audit.serviceAreaPages.items.filter(item => item.status !== 'N/A');
    if (relevantItems.length > 0) {
      categoryData.push({
        name: 'Service Area Pages',
        items: audit.serviceAreaPages.items,
        score: audit.serviceAreaPages.score,
        icon: '🌐'
      });
    }
  }
  
  // Add data rows
  let rowIndex = 7;
  categoryData.forEach(category => {
    const priorityOfiCount = category.items.filter(item => item.status === 'Priority OFI').length;
    const ofiCount = category.items.filter(item => item.status === 'OFI').length;
    const okCount = category.items.filter(item => item.status === 'OK').length;
    const naCount = category.items.filter(item => item.status === 'N/A').length;
    const total = category.items.length;
    
    summarySheet.getCell(rowIndex, 1).value = `${category.icon} ${category.name}`;
    summarySheet.getCell(rowIndex, 2).value = priorityOfiCount;
    summarySheet.getCell(rowIndex, 3).value = ofiCount;
    summarySheet.getCell(rowIndex, 4).value = okCount;
    summarySheet.getCell(rowIndex, 5).value = naCount;
    summarySheet.getCell(rowIndex, 6).value = total;
    summarySheet.getCell(rowIndex, 7).value = category.score ? `${Math.round(category.score)}/100` : 'N/A';
    
    // Style priority cells
    if (priorityOfiCount > 0) {
      summarySheet.getCell(rowIndex, 2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9999' }
      };
    }
    
    rowIndex++;
  });
  
  // Add total row with overall score
  summarySheet.getCell(rowIndex, 1).value = 'Total';
  summarySheet.getCell(rowIndex, 1).font = { bold: true };
  summarySheet.getCell(rowIndex, 2).value = audit.summary.priorityOfiCount;
  summarySheet.getCell(rowIndex, 2).font = { bold: true };
  summarySheet.getCell(rowIndex, 3).value = audit.summary.ofiCount;
  summarySheet.getCell(rowIndex, 3).font = { bold: true };
  summarySheet.getCell(rowIndex, 4).value = audit.summary.okCount;
  summarySheet.getCell(rowIndex, 4).font = { bold: true };
  summarySheet.getCell(rowIndex, 5).value = audit.summary.naCount;
  summarySheet.getCell(rowIndex, 5).font = { bold: true };
  summarySheet.getCell(rowIndex, 6).value = audit.summary.totalFactors;
  summarySheet.getCell(rowIndex, 6).font = { bold: true };
  summarySheet.getCell(rowIndex, 7).value = audit.summary.overallScore ? `${Math.round(audit.summary.overallScore)}/100` : 'N/A';
  summarySheet.getCell(rowIndex, 7).font = { bold: true };
  
  // Style the totals row
  for (let col = 1; col <= 7; col++) {
    summarySheet.getCell(rowIndex, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' }
    };
    summarySheet.getCell(rowIndex, col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Add analysis metadata section
  rowIndex += 2;
  summarySheet.mergeCells(`A${rowIndex}:G${rowIndex}`);
  summarySheet.getCell(rowIndex, 1).value = 'Analysis Metadata';
  summarySheet.getCell(rowIndex, 1).font = { size: 12, bold: true };
  
  if (audit.analysisMetadata) {
    rowIndex++;
    summarySheet.getCell(rowIndex, 1).value = 'Factor Count:';
    summarySheet.getCell(rowIndex, 2).value = audit.analysisMetadata.factorCount;
    
    if (audit.analysisMetadata.crawlerStats) {
      rowIndex++;
      summarySheet.getCell(rowIndex, 1).value = 'Pages Crawled:';
      summarySheet.getCell(rowIndex, 2).value = audit.analysisMetadata.crawlerStats.pagesCrawled;
      
      rowIndex++;
      summarySheet.getCell(rowIndex, 1).value = 'Analysis Time:';
      summarySheet.getCell(rowIndex, 2).value = audit.analysisMetadata.analysisTime ? `${Math.round(audit.analysisMetadata.analysisTime / 1000)}s` : 'N/A';
    }
  }
  
  // Set column widths
  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 15;
  summarySheet.getColumn(3).width = 15;
  summarySheet.getColumn(4).width = 15;
  summarySheet.getColumn(5).width = 15;
  summarySheet.getColumn(6).width = 15;
  summarySheet.getColumn(7).width = 15;
  
  // Add detailed worksheets for each category - UPDATED for enhanced categories
  categoryData.forEach(category => {
    if (category.items && category.items.length > 0) {
      const sheetName = category.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      addEnhancedCategoryWorksheet(workbook, sheetName, category.items);
    }
  });
  
  // Note: Service area pages are now included in the main categoryData loop above, no need for duplicate worksheet
  
  // Add Priority OFI Summary worksheet for quick review
  addEnhancedPriorityOfiWorksheet(workbook, audit);
  
  // Get the buffer
  return await workbook.xlsx.writeBuffer();
}

/**
 * Generate an Excel file from a Rival Audit
 * 
 * @param audit The rival audit data to export
 * @returns Excel workbook as a buffer
 */
export async function generateRivalAuditExcel(audit: RivalAudit): Promise<any> {
  // Create a new workbook
  const workbook = new Excel.Workbook();
  
  // Add a summary worksheet
  const summarySheet = workbook.addWorksheet('Summary');
  
  // Format the title with the actual queried URL (removing http/https prefix for cleaner display)
  summarySheet.mergeCells('A1:F1');
  const displayUrl = audit.url.replace(/^https?:\/\//, '');
  summarySheet.getCell('A1').value = `Comprehensive SEO Audit for ${displayUrl}`;
  summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2D5699' } };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  summarySheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7EEF6' }
  };
  
  // Add generated date
  summarySheet.mergeCells('A2:F2');
  summarySheet.getCell('A2').value = `Generated: ${new Date(audit.timestamp).toLocaleDateString()}`;
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add summary section
  summarySheet.mergeCells('A4:F4');
  summarySheet.getCell('A4').value = 'Audit Summary';
  summarySheet.getCell('A4').font = { size: 14, bold: true };
  
  // Add summary counts
  summarySheet.getCell('A6').value = 'Category';
  summarySheet.getCell('B6').value = 'Priority OFI';
  summarySheet.getCell('C6').value = 'OFI';
  summarySheet.getCell('D6').value = 'OK';
  summarySheet.getCell('E6').value = 'N/A';
  summarySheet.getCell('F6').value = 'Total';
  
  // Style the header row
  for (let col = 1; col <= 6; col++) {
    summarySheet.getCell(6, col).font = { bold: true };
    summarySheet.getCell(6, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    summarySheet.getCell(6, col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Get counts for each category
  const categoryData = [
    {
      name: 'On-Page',
      items: audit.onPage.items,
      icon: '📄'
    },
    {
      name: 'Structure & Navigation',
      items: audit.structureNavigation.items,
      icon: '🧭'
    },
    {
      name: 'Contact Page',
      items: audit.contactPage.items,
      icon: '📞'
    },
    {
      name: 'Service Pages',
      items: audit.servicePages.items,
      icon: '🛠️'
    },
    {
      name: 'Location Pages',
      items: audit.locationPages.items,
      icon: '📍'
    }
  ];
  
  // Add service area pages to category data if they exist and have meaningful content
  if (audit.serviceAreaPages && audit.serviceAreaPages.items && audit.serviceAreaPages.items.length > 0) {
    // Only include if there are items that aren't all N/A
    const relevantItems = audit.serviceAreaPages.items.filter(item => item.status !== 'N/A');
    if (relevantItems.length > 0) {
      categoryData.push({
        name: 'Service Area Pages',
        items: audit.serviceAreaPages.items,
        icon: '🌐'
      });
    }
  }
  
  // Add data rows
  let rowIndex = 7;
  categoryData.forEach(category => {
    const priorityOfiCount = category.items.filter(item => item.status === 'Priority OFI').length;
    const ofiCount = category.items.filter(item => item.status === 'OFI').length;
    const okCount = category.items.filter(item => item.status === 'OK').length;
    const naCount = category.items.filter(item => item.status === 'N/A').length;
    const total = category.items.length;
    
    summarySheet.getCell(rowIndex, 1).value = `${category.icon} ${category.name}`;
    summarySheet.getCell(rowIndex, 2).value = priorityOfiCount;
    summarySheet.getCell(rowIndex, 3).value = ofiCount;
    summarySheet.getCell(rowIndex, 4).value = okCount;
    summarySheet.getCell(rowIndex, 5).value = naCount;
    summarySheet.getCell(rowIndex, 6).value = total;
    
    // Style priority cells
    if (priorityOfiCount > 0) {
      summarySheet.getCell(rowIndex, 2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9999' }
      };
    }
    
    rowIndex++;
  });
  
  // Add total row
  summarySheet.getCell(rowIndex, 1).value = 'Total';
  summarySheet.getCell(rowIndex, 1).font = { bold: true };
  summarySheet.getCell(rowIndex, 2).value = audit.summary.priorityOfiCount;
  summarySheet.getCell(rowIndex, 2).font = { bold: true };
  summarySheet.getCell(rowIndex, 3).value = audit.summary.ofiCount;
  summarySheet.getCell(rowIndex, 3).font = { bold: true };
  summarySheet.getCell(rowIndex, 4).value = audit.summary.okCount;
  summarySheet.getCell(rowIndex, 4).font = { bold: true };
  summarySheet.getCell(rowIndex, 5).value = audit.summary.naCount;
  summarySheet.getCell(rowIndex, 5).font = { bold: true };
  summarySheet.getCell(rowIndex, 6).value = { formula: `SUM(F7:F${rowIndex-1})` };
  summarySheet.getCell(rowIndex, 6).font = { bold: true };
  
  // Style the totals row
  for (let col = 1; col <= 6; col++) {
    summarySheet.getCell(rowIndex, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' }
    };
    summarySheet.getCell(rowIndex, col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Set column widths
  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 15;
  summarySheet.getColumn(3).width = 15;
  summarySheet.getColumn(4).width = 15;
  summarySheet.getColumn(5).width = 15;
  summarySheet.getColumn(6).width = 15;
  
  // Add detailed worksheets for each category
  addCategoryWorksheet(workbook, 'On-Page', audit.onPage.items);
  addCategoryWorksheet(workbook, 'Structure-Navigation', audit.structureNavigation.items);
  addCategoryWorksheet(workbook, 'Contact-Page', audit.contactPage.items);
  addCategoryWorksheet(workbook, 'Service-Pages', audit.servicePages.items);
  addCategoryWorksheet(workbook, 'Location-Pages', audit.locationPages.items);
  
  // Note: Service area pages are now included in the main categoryData loop above, no need for duplicate worksheet
  
  // Add Priority OFI Summary worksheet for quick review
  addPriorityOfiWorksheet(workbook, audit);
  
  // Get the buffer
  return await workbook.xlsx.writeBuffer();
}

/**
 * Add a worksheet for a specific audit category
 * 
 * @param workbook The Excel workbook
 * @param name The name of the category
 * @param items The audit items for this category
 */
function addCategoryWorksheet(workbook: Excel.Workbook, name: string, items: AuditItem[]): void {
  const sheet = workbook.addWorksheet(name);
  
  // Add title with logo-like styling
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = `${name.replace('-', ' & ')} SEO Audit`;
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2D5699' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7EEF6' }
  };
  
  // Add instructions
  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = 'Items marked as "Priority OFI" require immediate attention for SEO improvement.';
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add headers
  sheet.getCell('A4').value = 'Item';
  sheet.getCell('B4').value = 'Description';
  sheet.getCell('C4').value = 'Status';
  sheet.getCell('D4').value = 'Importance';
  sheet.getCell('E4').value = 'Notes';
  
  // Style the header row
  for (let col = 1; col <= 5; col++) {
    sheet.getCell(4, col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell(4, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D5699' } // Dark blue
    };
    sheet.getCell(4, col).border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'thin', color: { argb: 'FF999999' } }
    };
    sheet.getCell(4, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
  
  // Add data rows with improved formatting
  items.forEach((item, index) => {
    const row = index + 5;
    
    sheet.getCell(row, 1).value = item.name;
    sheet.getCell(row, 2).value = item.description;
    sheet.getCell(row, 3).value = item.status;
    sheet.getCell(row, 4).value = item.importance;
    sheet.getCell(row, 5).value = item.notes || '';
    
    // Set wrap text for all cells
    for (let col = 1; col <= 5; col++) {
      sheet.getCell(row, col).alignment = { vertical: 'middle', wrapText: true };
      sheet.getCell(row, col).border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
    }
    
    // Color-code status cells with improved colors
    let statusColor = '';
    let statusTextColor = 'FF000000'; // Default black
    
    if (item.status === 'Priority OFI') {
      statusColor = 'FFFFD7D7';  // Light red
      statusTextColor = 'FFCC0000'; // Darker red text
      // Make entire row have light pink background if Priority OFI
      for (let col = 1; col <= 5; col++) {
        sheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF5F5' } // Very light pink
        };
      }
    } else if (item.status === 'OFI') {
      statusColor = 'FFFFEBD7';  // Light orange
      statusTextColor = 'FFBB7700'; // Darker orange text
    } else if (item.status === 'OK') {
      statusColor = 'FFE6FFDD';  // Light green
      statusTextColor = 'FF007700'; // Darker green text
    } else if (item.status === 'N/A') {
      statusColor = 'FFF0F0F0';  // Light gray
      statusTextColor = 'FF777777'; // Dark gray text
    }
    
    if (statusColor) {
      sheet.getCell(row, 3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor }
      };
      sheet.getCell(row, 3).font = { color: { argb: statusTextColor }, bold: true };
      sheet.getCell(row, 3).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Style importance cells with improved colors
    let importanceColor = '';
    let importanceTextColor = 'FF000000'; // Default black
    
    if (item.importance === 'High') {
      importanceColor = 'FFFFD7D7';  // Light red
      importanceTextColor = 'FFCC0000'; // Darker red text
    } else if (item.importance === 'Medium') {
      importanceColor = 'FFFFEBD7';  // Light orange
      importanceTextColor = 'FFBB7700'; // Darker orange text
    } else if (item.importance === 'Low') {
      importanceColor = 'FFF7F7E7';  // Light yellow
      importanceTextColor = 'FF777700'; // Darker yellow text
    }
    
    if (importanceColor) {
      sheet.getCell(row, 4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: importanceColor }
      };
      sheet.getCell(row, 4).font = { color: { argb: importanceTextColor }, bold: true };
      sheet.getCell(row, 4).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Add special formatting for notes
    if (item.notes) {
      sheet.getCell(row, 5).font = { size: 9 };
      
      // Highlight specific URLs or examples in the notes
      if (item.status === 'Priority OFI' || item.status === 'OFI') {
        // Bold text for critical points
        if (item.notes.includes('Example') || item.notes.includes('page') || item.notes.includes('URL')) {
          sheet.getCell(row, 5).font = { size: 9, color: { argb: 'FF555555' } };
        }
      }
    }
    
    // Add zebra striping for better readability (alternate row colors)
    if (index % 2 === 1 && item.status !== 'Priority OFI') {
      for (let col = 1; col <= 5; col++) {
        if (col !== 3 && col !== 4) { // Skip status and importance columns
          sheet.getCell(row, col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' } // Very light gray for zebra striping
          };
        }
      }
    }
  });
  
  // Set column widths
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 60;
  
  // Auto-fit rows with increased height for Priority OFI items
  sheet.eachRow((row, rowNum) => {
    if (rowNum >= 5) { // Data rows
      const statusCell = row.getCell(3);
      if (statusCell.value === 'Priority OFI') {
        row.height = 36; // Taller row for Priority OFI
      } else {
        row.height = 24; // Standard height for other rows
      }
    } else if (rowNum === 1) {
      row.height = 30; // Title row
    } else if (rowNum === 4) {
      row.height = 28; // Header row
    }
  });
}

/**
 * Add a Priority OFI Summary worksheet
 * 
 * @param workbook The Excel workbook
 * @param audit The complete rival audit
 */
function addPriorityOfiWorksheet(workbook: Excel.Workbook, audit: RivalAudit): void {
  // Collect all Priority OFI items from each section
  const priorityOfiItems: AuditItem[] = [
    ...audit.onPage.items.filter(item => item.status === 'Priority OFI'),
    ...audit.structureNavigation.items.filter(item => item.status === 'Priority OFI'),
    ...audit.contactPage.items.filter(item => item.status === 'Priority OFI'),
    ...audit.servicePages.items.filter(item => item.status === 'Priority OFI'),
    ...audit.locationPages.items.filter(item => item.status === 'Priority OFI')
  ];
  
  // Add service area pages items if they exist and have meaningful content
  if (audit.serviceAreaPages && audit.serviceAreaPages.items && audit.serviceAreaPages.items.length > 0) {
    const relevantServiceAreaItems = audit.serviceAreaPages.items.filter(item => item.status !== 'N/A');
    if (relevantServiceAreaItems.length > 0) {
      priorityOfiItems.push(...audit.serviceAreaPages.items.filter(item => item.status === 'Priority OFI'));
    }
  }
  
  if (priorityOfiItems.length === 0) {
    return; // No Priority OFI items found
  }
  
  const sheet = workbook.addWorksheet('🚨 Priority OFIs', {
    properties: { tabColor: { argb: 'FFFF9999' } } // Light red tab color
  });
  
  // Add title with eye-catching styling
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = '🚨 PRIORITY OPPORTUNITIES FOR IMPROVEMENT 🚨';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFCC0000' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD7D7' }
  };
  
  // Add explanation
  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = `This worksheet summarizes the highest priority SEO issues requiring immediate attention (${priorityOfiItems.length} issues identified).`;
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add headers
  sheet.getCell('A4').value = 'Category';
  sheet.getCell('B4').value = 'Item';
  sheet.getCell('C4').value = 'Importance';
  sheet.getCell('D4').value = 'Description';
  sheet.getCell('E4').value = 'Action Required';
  
  // Style the header row
  for (let col = 1; col <= 5; col++) {
    sheet.getCell(4, col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell(4, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC0000' } // Red for Priority OFI sheet
    };
    sheet.getCell(4, col).border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'thin', color: { argb: 'FF999999' } }
    };
    sheet.getCell(4, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
  
  // Add data rows with detailed action items
  priorityOfiItems.forEach((item, index) => {
    const row = index + 5;
    
    // Determine which category this item belongs to
    let category = 'Unknown';
    if (audit.onPage.items.includes(item)) {
      category = 'On-Page';
    } else if (audit.structureNavigation.items.includes(item)) {
      category = 'Structure & Navigation';
    } else if (audit.contactPage.items.includes(item)) {
      category = 'Contact Page';
    } else if (audit.servicePages.items.includes(item)) {
      category = 'Service Pages';
    } else if (audit.locationPages.items.includes(item)) {
      category = 'Location Pages';
    } else if (audit.serviceAreaPages && audit.serviceAreaPages.items && audit.serviceAreaPages.items.includes(item)) {
      category = 'Service Area Pages';
    }
    
    sheet.getCell(row, 1).value = category;
    sheet.getCell(row, 2).value = item.name;
    sheet.getCell(row, 3).value = item.importance;
    sheet.getCell(row, 4).value = item.description;
    
    // Create a detailed action required field based on the notes
    const actionRequired = item.notes ? 
      item.notes.replace(/No |not |missing |lacks /gi, '') : 
      `Implement ${item.name.toLowerCase()} on the website`;
      
    sheet.getCell(row, 5).value = actionRequired;
    
    // Set wrap text and styling for all cells
    for (let col = 1; col <= 5; col++) {
      sheet.getCell(row, col).alignment = { vertical: 'middle', wrapText: true };
      sheet.getCell(row, col).border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
    }
    
    // Add zebra striping for better readability
    if (index % 2 === 1) {
      for (let col = 1; col <= 5; col++) {
        sheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF5F5' } // Very light pink
        };
      }
    } else {
      for (let col = 1; col <= 5; col++) {
        sheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' } // White
        };
      }
    }
    
    // Style importance cells
    let importanceColor = '';
    if (item.importance === 'High') {
      importanceColor = 'FFFFD7D7';  // Light red
    } else if (item.importance === 'Medium') {
      importanceColor = 'FFFFEBD7';  // Light orange
    } else if (item.importance === 'Low') {
      importanceColor = 'FFF7F7E7';  // Light yellow
    }
    
    if (importanceColor) {
      sheet.getCell(row, 3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: importanceColor }
      };
      sheet.getCell(row, 3).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Style category column
    sheet.getCell(row, 1).font = { bold: true };
    sheet.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  
  // Set column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 40;
  sheet.getColumn(5).width = 60;
  
  // Set row heights for better readability
  sheet.eachRow((row, rowNum) => {
    if (rowNum >= 5) { // Data rows
      row.height = 36; // Taller rows for better readability
    } else if (rowNum === 1) {
      row.height = 32; // Title row
    } else if (rowNum === 4) {
      row.height = 28; // Header row
    }
  });
}

/**
 * Add a worksheet for a specific enhanced audit category
 * 
 * @param workbook The Excel workbook
 * @param name The name of the category
 * @param items The enhanced audit items for this category
 */
function addEnhancedCategoryWorksheet(workbook: Excel.Workbook, name: string, items: EnhancedAuditItem[]): void {
  const sheet = workbook.addWorksheet(name);
  
  // Add title with logo-like styling
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `${name.replace('-', ' & ')} SEO Audit (Enhanced)`;
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2D5699' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7EEF6' }
  };
  
  // Add instructions
  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = 'Enhanced analysis with 140+ factors. Items marked as "Priority OFI" require immediate attention for SEO improvement.';
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add headers with enhanced columns
  sheet.getCell('A4').value = 'Item';
  sheet.getCell('B4').value = 'Description';
  sheet.getCell('C4').value = 'Status';
  sheet.getCell('D4').value = 'Importance';
  sheet.getCell('E4').value = 'Category';
  sheet.getCell('F4').value = 'Notes';
  
  // Style the header row
  for (let col = 1; col <= 6; col++) {
    sheet.getCell(4, col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell(4, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D5699' } // Dark blue
    };
    sheet.getCell(4, col).border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'thin', color: { argb: 'FF999999' } }
    };
    sheet.getCell(4, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
  
  // Add data rows with improved formatting
  items.forEach((item, index) => {
    const row = index + 5;
    
    sheet.getCell(row, 1).value = item.name;
    sheet.getCell(row, 2).value = item.description;
    sheet.getCell(row, 3).value = item.status;
    sheet.getCell(row, 4).value = item.importance;
    sheet.getCell(row, 5).value = item.category || 'General';
    sheet.getCell(row, 6).value = item.notes || '';
    
    // Set wrap text for all cells
    for (let col = 1; col <= 6; col++) {
      sheet.getCell(row, col).alignment = { vertical: 'middle', wrapText: true };
      sheet.getCell(row, col).border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
    }
    
    // Color-code status cells with improved colors
    let statusColor = '';
    let statusTextColor = 'FF000000'; // Default black
    
    if (item.status === 'Priority OFI') {
      statusColor = 'FFFFD7D7';  // Light red
      statusTextColor = 'FFCC0000'; // Darker red text
      // Make entire row have light pink background if Priority OFI
      for (let col = 1; col <= 6; col++) {
        sheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF5F5' } // Very light pink
        };
      }
    } else if (item.status === 'OFI') {
      statusColor = 'FFFFEBD7';  // Light orange
      statusTextColor = 'FFBB7700'; // Darker orange text
    } else if (item.status === 'OK') {
      statusColor = 'FFE6FFDD';  // Light green
      statusTextColor = 'FF007700'; // Darker green text
    } else if (item.status === 'N/A') {
      statusColor = 'FFF0F0F0';  // Light gray
      statusTextColor = 'FF777777'; // Dark gray text
    }
    
    if (statusColor) {
      sheet.getCell(row, 3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor }
      };
      sheet.getCell(row, 3).font = { color: { argb: statusTextColor }, bold: true };
      sheet.getCell(row, 3).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Style importance cells with improved colors
    let importanceColor = '';
    let importanceTextColor = 'FF000000'; // Default black
    
    if (item.importance === 'High') {
      importanceColor = 'FFFFD7D7';  // Light red
      importanceTextColor = 'FFCC0000'; // Darker red text
    } else if (item.importance === 'Medium') {
      importanceColor = 'FFFFEBD7';  // Light orange
      importanceTextColor = 'FFBB7700'; // Darker orange text
    } else if (item.importance === 'Low') {
      importanceColor = 'FFF7F7E7';  // Light yellow
      importanceTextColor = 'FF777700'; // Darker yellow text
    }
    
    if (importanceColor) {
      sheet.getCell(row, 4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: importanceColor }
      };
      sheet.getCell(row, 4).font = { color: { argb: importanceTextColor }, bold: true };
      sheet.getCell(row, 4).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Style category cells
    sheet.getCell(row, 5).font = { size: 9, italic: true };
    sheet.getCell(row, 5).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add special formatting for notes
    if (item.notes) {
      sheet.getCell(row, 6).font = { size: 9 };
      
      // Highlight specific URLs or examples in the notes
      if (item.status === 'Priority OFI' || item.status === 'OFI') {
        // Bold text for critical points
        if (item.notes.includes('Example') || item.notes.includes('page') || item.notes.includes('URL')) {
          sheet.getCell(row, 6).font = { size: 9, color: { argb: 'FF555555' } };
        }
      }
    }
    
    // Add zebra striping for better readability (alternate row colors)
    if (index % 2 === 1 && item.status !== 'Priority OFI') {
      for (let col = 1; col <= 6; col++) {
        if (col !== 3 && col !== 4) { // Skip status and importance columns
          sheet.getCell(row, col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' } // Very light gray for zebra striping
          };
        }
      }
    }
  });
  
  // Set column widths
  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 45;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 20;
  sheet.getColumn(6).width = 60;
  
  // Auto-fit rows with increased height for Priority OFI items
  sheet.eachRow((row, rowNum) => {
    if (rowNum >= 5) { // Data rows
      const statusCell = row.getCell(3);
      if (statusCell.value === 'Priority OFI') {
        row.height = 36; // Taller row for Priority OFI
      } else {
        row.height = 24; // Standard height for other rows
      }
    } else if (rowNum === 1) {
      row.height = 30; // Title row
    } else if (rowNum === 4) {
      row.height = 28; // Header row
    }
  });
}

/**
 * Add an Enhanced Priority OFI Summary worksheet
 * 
 * @param workbook The Excel workbook
 * @param audit The complete enhanced rival audit
 */
function addEnhancedPriorityOfiWorksheet(workbook: Excel.Workbook, audit: EnhancedRivalAudit): void {
  // Collect all Priority OFI items from enhanced categories first, then fallback to legacy
  const priorityOfiItems: EnhancedAuditItem[] = [];
  
  // Enhanced categories (new structure)
  if (audit.contentQuality && audit.contentQuality.items) {
    priorityOfiItems.push(...audit.contentQuality.items.filter(item => item.status === 'Priority OFI'));
  }
  if (audit.technicalSEO && audit.technicalSEO.items) {
    priorityOfiItems.push(...audit.technicalSEO.items.filter(item => item.status === 'Priority OFI'));
  }
  if (audit.localSEO && audit.localSEO.items) {
    priorityOfiItems.push(...audit.localSEO.items.filter(item => item.status === 'Priority OFI'));
  }
  if (audit.uxPerformance && audit.uxPerformance.items) {
    priorityOfiItems.push(...audit.uxPerformance.items.filter(item => item.status === 'Priority OFI'));
  }
  
  // Fallback to legacy categories if no enhanced categories found
  if (priorityOfiItems.length === 0) {
    if (audit.onPage?.items) priorityOfiItems.push(...audit.onPage.items.filter(item => item.status === 'Priority OFI'));
    if (audit.structureNavigation?.items) priorityOfiItems.push(...audit.structureNavigation.items.filter(item => item.status === 'Priority OFI'));
    if (audit.contactPage?.items) priorityOfiItems.push(...audit.contactPage.items.filter(item => item.status === 'Priority OFI'));
    if (audit.servicePages?.items) priorityOfiItems.push(...audit.servicePages.items.filter(item => item.status === 'Priority OFI'));
    if (audit.locationPages?.items) priorityOfiItems.push(...audit.locationPages.items.filter(item => item.status === 'Priority OFI'));
  }
  
  // Add service area pages items if they exist and have meaningful content
  if (audit.serviceAreaPages && audit.serviceAreaPages.items && audit.serviceAreaPages.items.length > 0) {
    const relevantServiceAreaItems = audit.serviceAreaPages.items.filter(item => item.status !== 'N/A');
    if (relevantServiceAreaItems.length > 0) {
      priorityOfiItems.push(...audit.serviceAreaPages.items.filter(item => item.status === 'Priority OFI'));
    }
  }
  
  if (priorityOfiItems.length === 0) {
    return; // No Priority OFI items found
  }
  
  const sheet = workbook.addWorksheet('🚨 Priority OFIs', {
    properties: { tabColor: { argb: 'FFFF9999' } } // Light red tab color
  });
  
  // Add title with eye-catching styling
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = '🚨 PRIORITY OPPORTUNITIES FOR IMPROVEMENT (Enhanced) 🚨';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFCC0000' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD7D7' }
  };
  
  // Add explanation
  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `Enhanced analysis identified ${priorityOfiItems.length} high-priority SEO issues requiring immediate attention from ${audit.summary.totalFactors} total factors analyzed.`;
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add headers
  sheet.getCell('A4').value = 'Category';
  sheet.getCell('B4').value = 'Item';
  sheet.getCell('C4').value = 'Importance';
  sheet.getCell('D4').value = 'Analysis Category';
  sheet.getCell('E4').value = 'Description';
  sheet.getCell('F4').value = 'Action Required';
  
  // Style the header row
  for (let col = 1; col <= 6; col++) {
    sheet.getCell(4, col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell(4, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC0000' } // Red for Priority OFI sheet
    };
    sheet.getCell(4, col).border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'thin', color: { argb: 'FF999999' } }
    };
    sheet.getCell(4, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
  
  // Add data rows with detailed action items
  priorityOfiItems.forEach((item, index) => {
    const row = index + 5;
    
    // Determine which category this item belongs to
    let category = 'Unknown';
    if (audit.onPage.items.includes(item)) {
      category = 'On-Page';
    } else if (audit.structureNavigation.items.includes(item)) {
      category = 'Structure & Navigation';
    } else if (audit.contactPage.items.includes(item)) {
      category = 'Contact Page';
    } else if (audit.servicePages.items.includes(item)) {
      category = 'Service Pages';
    } else if (audit.locationPages.items.includes(item)) {
      category = 'Location Pages';
    } else if (audit.serviceAreaPages && audit.serviceAreaPages.items && audit.serviceAreaPages.items.includes(item)) {
      category = 'Service Area Pages';
    }
    
    sheet.getCell(row, 1).value = category;
    sheet.getCell(row, 2).value = item.name;
    sheet.getCell(row, 3).value = item.importance;
    sheet.getCell(row, 4).value = item.category || 'General';
    sheet.getCell(row, 5).value = item.description;
    
    // Create a detailed action required field based on the notes
    const actionRequired = item.notes ? 
      item.notes.replace(/No |not |missing |lacks /gi, '') : 
      `Implement ${item.name.toLowerCase()} on the website`;
      
    sheet.getCell(row, 6).value = actionRequired;
    
    // Set wrap text and styling for all cells
    for (let col = 1; col <= 6; col++) {
      sheet.getCell(row, col).alignment = { vertical: 'middle', wrapText: true };
      sheet.getCell(row, col).border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
    }
    
    // Add zebra striping for better readability
    if (index % 2 === 1) {
      for (let col = 1; col <= 6; col++) {
        sheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF5F5' } // Very light pink
        };
      }
    } else {
      for (let col = 1; col <= 6; col++) {
        sheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' } // White
        };
      }
    }
    
    // Style importance cells
    let importanceColor = '';
    if (item.importance === 'High') {
      importanceColor = 'FFFFD7D7';  // Light red
    } else if (item.importance === 'Medium') {
      importanceColor = 'FFFFEBD7';  // Light orange
    } else if (item.importance === 'Low') {
      importanceColor = 'FFF7F7E7';  // Light yellow
    }
    
    if (importanceColor) {
      sheet.getCell(row, 3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: importanceColor }
      };
      sheet.getCell(row, 3).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Style category column
    sheet.getCell(row, 1).font = { bold: true };
    sheet.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Style analysis category column
    sheet.getCell(row, 4).font = { size: 9, italic: true };
    sheet.getCell(row, 4).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  
  // Set column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 35;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 40;
  sheet.getColumn(6).width = 60;
  
  // Set row heights for better readability
  sheet.eachRow((row, rowNum) => {
    if (rowNum >= 5) { // Data rows
      row.height = 36; // Taller rows for better readability
    } else if (rowNum === 1) {
      row.height = 32; // Title row
    } else if (rowNum === 4) {
      row.height = 28; // Header row
    }
  });
}