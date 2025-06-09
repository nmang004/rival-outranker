import { RivalAudit, AuditItem } from '@shared/schema';

/**
 * Generate a CSV file from a Rival Audit
 * 
 * @param audit The rival audit data to export
 * @returns CSV content as a string
 */
export function generateRivalAuditCsv(audit: RivalAudit): string {
  // Helper function to escape CSV fields
  const escapeField = (field: string | undefined | null) => {
    if (field === undefined || field === null) return '';
    const escaped = String(field).replace(/"/g, '""');
    return `"${escaped}"`;
  };
  
  // CSV header row
  const csvRows = [
    '"Category","Item","Description","Status","Importance","Notes"'
  ];
  
  // Helper function to add items from a category
  const addCategoryItems = (category: string, items: AuditItem[]) => {
    items.forEach(item => {
      csvRows.push([
        escapeField(category),
        escapeField(item.name),
        escapeField(item.description),
        escapeField(item.status),
        escapeField(item.importance),
        escapeField(item.notes)
      ].join(','));
    });
  };
  
  // Add each audit category
  addCategoryItems('On-Page', audit.onPage.items);
  addCategoryItems('Structure & Navigation', audit.structureNavigation.items);
  addCategoryItems('Contact Page', audit.contactPage.items);
  addCategoryItems('Service Pages', audit.servicePages.items);
  addCategoryItems('Location Pages', audit.locationPages.items);
  
  // Add summary section
  csvRows.push('');
  csvRows.push('"Summary"');
  csvRows.push('"Priority OFI","OFI","OK","N/A","Total"');
  
  const total = audit.summary.priorityOfiCount + 
                audit.summary.ofiCount + 
                audit.summary.okCount + 
                audit.summary.naCount;
  
  csvRows.push([
    escapeField(String(audit.summary.priorityOfiCount)),
    escapeField(String(audit.summary.ofiCount)),
    escapeField(String(audit.summary.okCount)),
    escapeField(String(audit.summary.naCount)),
    escapeField(String(total))
  ].join(','));
  
  return csvRows.join('\n');
}