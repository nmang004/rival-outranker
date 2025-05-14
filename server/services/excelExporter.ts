import Excel from 'exceljs';
import { RivalAudit, AuditItem } from '@shared/schema';
import { Buffer } from 'buffer';

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
  
  // Format the title
  summarySheet.mergeCells('A1:F1');
  summarySheet.getCell('A1').value = `SEO Audit Report: ${audit.url}`;
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  
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
  
  // Add title
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = `${name.replace('-', ' & ')} SEO Audit`;
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Add headers
  sheet.getCell('A3').value = 'Item';
  sheet.getCell('B3').value = 'Description';
  sheet.getCell('C3').value = 'Status';
  sheet.getCell('D3').value = 'Importance';
  sheet.getCell('E3').value = 'Notes';
  
  // Style the header row
  for (let col = 1; col <= 5; col++) {
    sheet.getCell(3, col).font = { bold: true };
    sheet.getCell(3, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    sheet.getCell(3, col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Add data rows
  items.forEach((item, index) => {
    const row = index + 4;
    
    sheet.getCell(row, 1).value = item.name;
    sheet.getCell(row, 2).value = item.description;
    sheet.getCell(row, 3).value = item.status;
    sheet.getCell(row, 4).value = item.importance;
    sheet.getCell(row, 5).value = item.notes || '';
    
    // Color-code status cells
    let statusColor = '';
    if (item.status === 'Priority OFI') {
      statusColor = 'FFFF9999';  // Light red
    } else if (item.status === 'OFI') {
      statusColor = 'FFFFCC99';  // Light orange
    } else if (item.status === 'OK') {
      statusColor = 'FF99CC99';  // Light green
    }
    
    if (statusColor) {
      sheet.getCell(row, 3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor }
      };
    }
    
    // Style importance cells
    let importanceColor = '';
    if (item.importance === 'High') {
      importanceColor = 'FFFF9999';  // Light red
    } else if (item.importance === 'Medium') {
      importanceColor = 'FFFFCC99';  // Light orange
    } else if (item.importance === 'Low') {
      importanceColor = 'FFEEEEBB';  // Light yellow
    }
    
    if (importanceColor) {
      sheet.getCell(row, 4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: importanceColor }
      };
    }
  });
  
  // Set column widths
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 50;
  
  // Auto-fit rows
  sheet.eachRow((row) => {
    row.height = 24;  // Minimum height for readability
  });
}