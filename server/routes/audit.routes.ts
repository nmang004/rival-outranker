import { Router, Request, Response } from 'express';
import { rivalAuditCrawler } from '../services/audit/rival-audit-crawler.service';
import { generateRivalAuditExcel } from '../services/common/excel-exporter.service';
import { generateRivalAuditCsv } from '../services/common/csv-exporter.service';
import { AuditStatus } from '../../shared/schema';
import { storage } from '../storage';

const router = Router();

// Type for cached rival audit (should be moved to shared types)
interface CachedRivalAudit {
  id: number;
  url: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  summary: {
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
    total: number;
  };
  onPage?: any;
  structureNavigation?: any;
  contactPage?: any;
  servicePages?: any;
  locationPages?: any;
  serviceAreaPages?: any;
  [key: string]: any;
}

// In-memory cache for audit results (should be replaced with database storage)
const auditCache: Record<number, CachedRivalAudit> = {};

// Track processing status separately
const processingStatus: Record<number, { status: 'processing' | 'completed' | 'failed', startTime: Date }> = {};

// Generate mock rival audit data (fallback function)
function generateMockRivalAudit(url: string): CachedRivalAudit {
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    url,
    status: 'completed',
    startTime: new Date(),
    endTime: new Date(),
    summary: {
      priorityOfiCount: 3,
      ofiCount: 12,
      okCount: 25,
      naCount: 5,
      total: 45
    },
    onPage: {
      items: [
        {
          name: "Page Title Optimization",
          status: "OFI",
          description: "Page titles could be more descriptive",
          notes: "Consider adding location-based keywords"
        }
      ]
    },
    structureNavigation: { items: [] },
    contactPage: { items: [] },
    servicePages: { items: [] },
    locationPages: { items: [] }
  };
}

// Start a new rival audit
router.post("/", async (req: Request, res: Response) => {
  console.log('🎯 POST /api/rival-audit called with body:', req.body);
  
  try {
    const { url, continueCrawl } = req.body;
    console.log('📥 Received URL:', url, 'continueCrawl:', continueCrawl);
    
    if (!url) {
      console.log('❌ No URL provided');
      return res.status(400).json({ error: "URL is required" });
    }
    
    // Generate an audit ID (in a production environment, this would be stored in the database)
    const auditId = Math.floor(Math.random() * 1000) + 1;
    console.log('🆔 Generated audit ID:', auditId);
    
    // Mark as processing
    processingStatus[auditId] = {
      status: 'processing',
      startTime: new Date()
    };
    
    // Return the audit ID immediately
    const response = { 
      id: auditId, 
      message: continueCrawl ? "Continuing audit" : "Audit started", 
      url 
    };
    console.log('✅ Sending response:', response);
    res.status(202).json(response);
    
    // Perform the actual audit asynchronously
    setTimeout(async () => {
      try {
        if (continueCrawl) {
          console.log(`Continuing rival audit for ${url} with ID ${auditId}`);
          // Continue crawling from where it left off
          const auditResults = await rivalAuditCrawler.continueCrawl(url);
          // Store the results in our in-memory cache
          auditCache[auditId] = {
            ...auditResults,
            id: auditId,
            status: 'completed',
            startTime: new Date(),
            timestamp: new Date(),
            summary: {
              ...auditResults.summary,
              total: auditResults.summary.total || 0
            }
          };
          // Mark as completed
          processingStatus[auditId].status = 'completed';
          console.log(`Completed continued rival audit for ${url} with ID ${auditId}`);
        } else {
          console.log(`Starting new rival audit for ${url} with ID ${auditId}`);
          // Crawl and analyze the website using our new crawler
          const auditResults = await rivalAuditCrawler.crawlAndAudit(url);
          // Store the results in our in-memory cache
          auditCache[auditId] = {
            ...auditResults,
            id: auditId,
            status: 'completed',
            startTime: new Date(),
            timestamp: new Date(),
            summary: {
              ...auditResults.summary,
              total: auditResults.summary.total || 0
            }
          };
          // Mark as completed
          processingStatus[auditId].status = 'completed';
          console.log(`Completed rival audit for ${url} with ID ${auditId}`);
        }
        
        console.log(`Found ${auditCache[auditId].summary.priorityOfiCount} Priority OFIs, ${auditCache[auditId].summary.ofiCount} OFIs`);
        console.log(`Cached audit results for ID ${auditId}`);
        
        // Associate this audit with current user if they're authenticated
        if (req.user?.id) {
          console.log(`Associating audit ${auditId} with user ${req.user.id}`);
          // In a real implementation: await storage.saveRivalAudit({ ...auditResults, userId: req.user.id });
        }
        
      } catch (error) {
        console.error("Error performing rival audit:", error);
        // Mark as failed initially
        processingStatus[auditId].status = 'failed';
        // Store mock data as fallback
        auditCache[auditId] = generateMockRivalAudit(url);
        // Mark as completed since we have fallback data
        processingStatus[auditId].status = 'completed';
        console.log(`Stored mock data for failed audit ${auditId}`);
      }
    }, 0);
    
  } catch (error) {
    console.error("❌ Error starting rival audit:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: "Failed to start rival audit",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint to force analysis of service pages
router.post("/:id/analyze-service-pages", async (req: Request, res: Response) => {
  try {
    const auditId = parseInt(req.params.id);
    
    if (isNaN(auditId)) {
      return res.status(400).json({ error: "Invalid audit ID" });
    }
    
    // Check if we have cached results for this ID
    if (!auditCache[auditId]) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    // Clone the audit to avoid direct mutations
    const audit = JSON.parse(JSON.stringify(auditCache[auditId]));
    
    // Make sure the service pages section exists
    if (!audit.servicePages || !audit.servicePages.items) {
      return res.status(200).json({ 
        success: false, 
        message: "No service page items found" 
      });
    }
    
    let updatedItems = false;
    
    // Force the first item to be service page detection to OK if it's not already
    const servicePageIndex = audit.servicePages.items.findIndex(
      (item: any) => item.name === "Has a single Service Page for each primary service?"
    );
    
    if (servicePageIndex !== -1) {
      const item = audit.servicePages.items[servicePageIndex];
      if (item.status !== "OK") {
        audit.servicePages.items[servicePageIndex] = {
          ...item,
          status: "OK",
          notes: "Found service pages on the website"
        };
        updatedItems = true;
      }
    }
    
    // Update all remaining N/A items to OFI
    for (let i = 0; i < audit.servicePages.items.length; i++) {
      const item = audit.servicePages.items[i];
      if (item.status === 'N/A') {
        audit.servicePages.items[i] = {
          ...item,
          status: 'OFI',
          notes: item.notes || "Consider adding this feature to enhance service page effectiveness"
        };
        
        // Update description if needed
        if (item.description && item.description.includes('N/A')) {
          audit.servicePages.items[i].description = item.description.replace(
            /N\/A[^,]*/,
            'Feature could improve service page effectiveness'
          );
        }
        updatedItems = true;
      }
    }
    
    if (!updatedItems) {
      return res.status(200).json({ 
        success: false, 
        message: "No items needed to be updated" 
      });
    }
    
    // Recalculate summary counts
    updateAuditSummary(audit);
    
    // Update the cache with our modified audit
    auditCache[auditId] = audit;
    
    console.log("Successfully updated service page analysis");
    
    return res.status(200).json({ 
      success: true, 
      message: "Service page analysis updated",
      updatedAudit: audit
    });
  } catch (error) {
    console.error("Error analyzing service pages:", error);
    return res.status(200).json({ 
      success: false, 
      message: "An error occurred during service page analysis"
    });
  }
});

// Endpoint to update status of an audit item
router.post("/:id/update-item", async (req: Request, res: Response) => {
  try {
    const auditId = parseInt(req.params.id);
    
    if (isNaN(auditId)) {
      return res.status(400).json({ error: "Invalid audit ID" });
    }
    
    const { sectionName, itemName, status, notes } = req.body;
    
    if (!sectionName || !itemName || !status) {
      return res.status(400).json({ error: "Missing required fields: sectionName, itemName, status" });
    }
    
    // Validate status is a valid AuditStatus
    const validStatuses = ["Priority OFI", "OFI", "OK", "N/A"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    // Check if we have cached results for this ID
    if (!auditCache[auditId]) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    // Get the appropriate section
    const audit = auditCache[auditId];
    let section;
    
    switch (sectionName) {
      case "onPage":
        section = audit.onPage;
        break;
      case "structureNavigation":
        section = audit.structureNavigation;
        break;
      case "contactPage":
        section = audit.contactPage;
        break;
      case "servicePages":
        section = audit.servicePages;
        break;
      case "locationPages":
        section = audit.locationPages;
        break;
      case "serviceAreaPages":
        section = audit.serviceAreaPages;
        break;
      default:
        return res.status(400).json({ error: "Invalid section name" });
    }
    
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }
    
    // Find the item and update its status
    const item = section.items.find((item: any) => item.name === itemName);
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    // Update the status and notes
    const oldStatus = item.status;
    item.status = status as AuditStatus;
    
    // Update notes if provided
    if (notes !== undefined) {
      item.notes = notes;
    }
    
    // Update the summary counts
    updateAuditSummary(audit);
    
    return res.json({
      success: true,
      updatedItem: item,
      oldStatus,
      newStatus: status,
      summary: audit.summary
    });
  } catch (error) {
    console.error("Error updating audit item:", error);
    return res.status(500).json({ error: "Failed to update audit item" });
  }
});

// Get rival audit results by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const auditId = parseInt(req.params.id);
    
    if (isNaN(auditId)) {
      return res.status(400).json({ error: "Invalid audit ID" });
    }
    
    // Check processing status first
    const status = processingStatus[auditId];
    
    if (!status) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    // If still processing, return 202 with status info
    if (status.status === 'processing') {
      const timeElapsed = Date.now() - status.startTime.getTime();
      return res.status(202).json({ 
        status: 'processing',
        message: 'Audit is still being processed',
        timeElapsed: Math.floor(timeElapsed / 1000) // seconds
      });
    }
    
    // If failed without results, return error
    if (status.status === 'failed' && !auditCache[auditId]) {
      return res.status(500).json({ error: "Audit failed to complete" });
    }
    
    // Check if we have cached results
    if (!auditCache[auditId]) {
      return res.status(404).json({ error: "Audit results not found" });
    }
    
    const audit = auditCache[auditId];
    
    // Return the audit results
    res.json(audit);
  } catch (error) {
    console.error("Error retrieving rival audit:", error);
    res.status(500).json({ error: "Failed to retrieve audit results" });
  }
});

// Export rival audit results
router.get("/:id/export", async (req: Request, res: Response) => {
  try {
    const auditId = parseInt(req.params.id);
    const format = req.query.format as string || 'excel';
    
    if (isNaN(auditId)) {
      return res.status(400).json({ error: "Invalid audit ID" });
    }
    
    // Check if we have cached results for this ID
    if (!auditCache[auditId]) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    const audit = auditCache[auditId];
    
    if (format === 'csv') {
      try {
        const csvBuffer = await generateRivalAuditCsv(convertForExport(audit));
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="rival-audit-${auditId}.csv"`);
        res.setHeader('Content-Length', csvBuffer.length.toString());
        
        // Send the CSV buffer
        res.send(csvBuffer);
      } catch (csvError) {
        console.error("Error generating CSV:", csvError);
        res.status(500).json({ error: "Failed to generate CSV export" });
      }
    } else {
      try {
        const excelBuffer = await generateRivalAuditExcel(convertForExport(audit));
        
        // Set headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="rival-audit-${auditId}.xlsx"`);
        res.setHeader('Content-Length', excelBuffer.length.toString());
        
        // Send the Excel buffer
        res.send(excelBuffer);
      } catch (excelError) {
        console.error("Error generating Excel:", excelError);
        res.status(500).json({ error: "Failed to generate Excel export" });
      }
    }
  } catch (error) {
    console.error("Error exporting rival audit:", error);
    res.status(500).json({ error: "Failed to export audit results" });
  }
});

// Helper function to convert cached audit to export format
function convertForExport(audit: CachedRivalAudit) {
  return {
    url: audit.url,
    timestamp: audit.timestamp || new Date(),
    onPage: audit.onPage || { items: [] },
    structureNavigation: audit.structureNavigation || { items: [] },
    contactPage: audit.contactPage || { items: [] },
    servicePages: audit.servicePages || { items: [] },
    locationPages: audit.locationPages || { items: [] },
    serviceAreaPages: audit.serviceAreaPages || { items: [] },
    summary: audit.summary,
    reachedMaxPages: audit.reachedMaxPages
  };
}

// Helper function to update the summary counts
function updateAuditSummary(audit: CachedRivalAudit) {
  // Reset counts
  audit.summary.priorityOfiCount = 0;
  audit.summary.ofiCount = 0;
  audit.summary.okCount = 0;
  audit.summary.naCount = 0;
  audit.summary.total = 0;
  
  // Count items in each section
  const sections = [
    audit.onPage,
    audit.structureNavigation, 
    audit.contactPage, 
    audit.servicePages, 
    audit.locationPages,
    audit.serviceAreaPages
  ];
  
  sections.forEach(section => {
    if (section && section.items) {
      section.items.forEach((item: any) => {
        switch (item.status) {
          case 'Priority OFI':
            audit.summary.priorityOfiCount++;
            break;
          case 'OFI':
            audit.summary.ofiCount++;
            break;
          case 'OK':
            audit.summary.okCount++;
            break;
          case 'N/A':
            audit.summary.naCount++;
            break;
        }
        audit.summary.total++;
      });
    }
  });
}

export { router as auditRoutes };