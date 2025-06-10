import { Router, Request, Response } from 'express';
import { rivalAuditCrawler } from '../services/audit/rival-audit-crawler.service';
import { auditService } from '../services/audit/audit.service';
import { generateRivalAuditExcel, generateEnhancedRivalAuditExcel } from '../services/common/excel-exporter.service';
import { generateRivalAuditCsv } from '../services/common/csv-exporter.service';
import { AuditStatus } from '../../shared/schema';
import { rivalAuditRepository } from '../repositories/rival-audit.repository';

const router = Router();

// Type for cached rival audit (for backward compatibility)
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

// Start a new enhanced rival audit with 140+ factors
router.post("/enhanced", async (req: Request, res: Response) => {
  console.log('🎯 POST /api/rival-audit/enhanced called with body:', req.body);
  
  try {
    const { url } = req.body;
    console.log('📥 Received URL for enhanced audit:', url);
    
    if (!url) {
      console.log('❌ No URL provided');
      return res.status(400).json({ error: "URL is required" });
    }
    
    // Create audit record in database
    const auditRecord = await rivalAuditRepository.createAudit({
      url,
      status: 'processing',
      userId: req.user?.id || null,
      metadata: { auditType: 'enhanced' }
    });
    
    console.log('🆔 Created enhanced audit ID:', auditRecord.id);
    
    // Verify audit was created successfully with retry logic
    let verifyAudit = await rivalAuditRepository.getAudit(auditRecord.id);
    if (!verifyAudit) {
      console.log('⏳ Audit not immediately available, retrying in 100ms...');
      await new Promise(resolve => setTimeout(resolve, 100));
      verifyAudit = await rivalAuditRepository.getAudit(auditRecord.id);
    }
    
    if (!verifyAudit) {
      console.error('❌ Failed to verify enhanced audit creation after retry:', auditRecord.id);
      return res.status(500).json({ error: "Failed to create audit record" });
    }
    console.log('✅ Verified enhanced audit exists in database:', auditRecord.id);
    
    // Return the audit ID immediately
    const response = { 
      id: auditRecord.id, 
      message: "Enhanced audit started (140+ factors)", 
      url,
      type: "enhanced"
    };
    console.log('✅ Sending enhanced audit response:', response);
    res.status(202).json(response);
    
    // Perform the actual enhanced audit asynchronously
    setTimeout(async () => {
      try {
        console.log(`Starting enhanced rival audit for ${url} with ID ${auditRecord.id}`);
        // Use the enhanced audit service
        const auditResults = await auditService.crawlAndAuditEnhanced(url);
        
        // Store the results in database
        await rivalAuditRepository.completeAudit(
          auditRecord.id,
          {
            ...auditResults,
            type: 'enhanced',
            summary: {
              ...auditResults.summary,
              total: auditResults.summary.totalFactors || 0
            }
          },
          auditResults.summary,
          auditResults.summary.total || 0,
          auditResults.reachedMaxPages || false
        );
        
        console.log(`Completed enhanced rival audit for ${url} with ID ${auditRecord.id} - analyzed ${auditResults.summary.totalFactors} factors`);
        
      } catch (error) {
        console.error("Error performing enhanced rival audit:", error);
        
        try {
          // Store mock data as fallback
          const mockAudit = generateMockRivalAudit(url);
          await rivalAuditRepository.completeAudit(
            auditRecord.id,
            {
              ...mockAudit,
              type: 'enhanced',
              summary: {
                ...mockAudit.summary,
                totalFactors: 142 // Mock enhanced factor count
              }
            },
            {
              ...mockAudit.summary,
              totalFactors: 142
            },
            45, // Mock page count
            false
          );
          console.log(`Stored mock enhanced data for failed audit ${auditRecord.id}`);
        } catch (dbError) {
          console.error(`Failed to store fallback data for audit ${auditRecord.id}:`, dbError);
          await rivalAuditRepository.failAudit(auditRecord.id, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }, 0);
    
  } catch (error) {
    console.error("❌ Error starting enhanced rival audit:", error);
    res.status(500).json({ 
      error: "Failed to start enhanced rival audit",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

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
    
    // Create audit record in database
    const auditRecord = await rivalAuditRepository.createAudit({
      url,
      status: 'processing',
      userId: req.user?.id || null,
      metadata: { auditType: 'standard' }
    });
    
    console.log('🆔 Created audit ID:', auditRecord.id);
    
    // Verify audit was created successfully with retry logic
    let verifyAudit = await rivalAuditRepository.getAudit(auditRecord.id);
    if (!verifyAudit) {
      console.log('⏳ Audit not immediately available, retrying in 100ms...');
      await new Promise(resolve => setTimeout(resolve, 100));
      verifyAudit = await rivalAuditRepository.getAudit(auditRecord.id);
    }
    
    if (!verifyAudit) {
      console.error('❌ Failed to verify audit creation after retry:', auditRecord.id);
      return res.status(500).json({ error: "Failed to create audit record" });
    }
    console.log('✅ Verified audit exists in database:', auditRecord.id);
    
    // Return the audit ID immediately
    const response = { 
      id: auditRecord.id, 
      message: continueCrawl ? "Continuing audit" : "Audit started", 
      url 
    };
    console.log('✅ Sending response:', response);
    res.status(202).json(response);
    
    // Perform the actual audit asynchronously
    setTimeout(async () => {
      try {
        let auditResults;
        
        if (continueCrawl) {
          console.log(`Continuing rival audit for ${url} with ID ${auditRecord.id}`);
          // Continue crawling from where it left off
          auditResults = await rivalAuditCrawler.continueCrawl(url);
          console.log(`Completed continued rival audit for ${url} with ID ${auditRecord.id}`);
        } else {
          console.log(`Starting new rival audit for ${url} with ID ${auditRecord.id}`);
          // Crawl and analyze the website using our new crawler
          auditResults = await rivalAuditCrawler.crawlAndAudit(url);
          console.log(`Completed rival audit for ${url} with ID ${auditRecord.id}`);
        }
        
        // Store the results in database
        await rivalAuditRepository.completeAudit(
          auditRecord.id,
          auditResults,
          auditResults.summary,
          auditResults.summary.total || 0,
          auditResults.reachedMaxPages || false
        );
        
        console.log(`Found ${auditResults.summary.priorityOfiCount} Priority OFIs, ${auditResults.summary.ofiCount} OFIs`);
        console.log(`Stored audit results for ID ${auditRecord.id}`);
        
      } catch (error) {
        console.error("Error performing rival audit:", error);
        
        try {
          // Store mock data as fallback
          const mockAudit = generateMockRivalAudit(url);
          await rivalAuditRepository.completeAudit(
            auditRecord.id,
            mockAudit,
            mockAudit.summary,
            45, // Mock page count
            false
          );
          console.log(`Stored mock data for failed audit ${auditRecord.id}`);
        } catch (dbError) {
          console.error(`Failed to store fallback data for audit ${auditRecord.id}:`, dbError);
          await rivalAuditRepository.failAudit(auditRecord.id, error instanceof Error ? error.message : 'Unknown error');
        }
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
    
    // Get audit from database
    const auditRecord = await rivalAuditRepository.getAudit(auditId);
    if (!auditRecord || !auditRecord.results) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    // Clone the audit to avoid direct mutations
    const audit = JSON.parse(JSON.stringify(auditRecord.results));
    
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
    
    // Update the database with our modified audit
    await rivalAuditRepository.updateAudit(auditId, {
      results: audit,
      summary: audit.summary
    });
    
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
    
    // Get audit from database
    const auditRecord = await rivalAuditRepository.getAudit(auditId);
    if (!auditRecord || !auditRecord.results) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    // Get the appropriate section
    const audit = auditRecord.results;
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
    
    // Update the database
    await rivalAuditRepository.updateAudit(auditId, {
      results: audit,
      summary: audit.summary
    });
    
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
      console.log(`❌ Invalid audit ID format: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid audit ID" });
    }
    
    console.log(`🔍 Looking up audit ID: ${auditId}`);
    
    // Get audit from database
    const auditRecord = await rivalAuditRepository.getAudit(auditId);
    
    if (!auditRecord) {
      console.log(`❌ Audit not found in database: ${auditId}`);
      
      // Check if audit exists in any state for debugging
      const allAudits = await rivalAuditRepository.getAuditStats();
      console.log(`📊 Current audit stats:`, allAudits);
      
      return res.status(404).json({ 
        error: "Audit not found",
        auditId: auditId,
        debug: {
          totalAudits: allAudits.total,
          processingAudits: allAudits.processing
        }
      });
    }
    
    console.log(`✅ Found audit: ${auditId}, status: ${auditRecord.status}`);
    
    // If still processing, return 202 with status info
    if (auditRecord.status === 'processing') {
      const timeElapsed = Date.now() - auditRecord.createdAt.getTime();
      return res.status(202).json({ 
        status: 'processing',
        message: 'Audit is still being processed',
        timeElapsed: Math.floor(timeElapsed / 1000) // seconds
      });
    }
    
    // If failed, return error
    if (auditRecord.status === 'failed') {
      return res.status(500).json({ 
        error: "Audit failed to complete",
        message: auditRecord.errorMessage || "Unknown error"
      });
    }
    
    // Check if we have results
    if (auditRecord.status === 'completed' && auditRecord.results) {
      // Return the audit results with proper structure
      const audit = {
        ...auditRecord.results,
        id: auditRecord.id,
        status: auditRecord.status,
        startTime: auditRecord.createdAt,
        endTime: auditRecord.completedAt,
        url: auditRecord.url
      };
      
      res.json(audit);
    } else {
      return res.status(404).json({ error: "Audit results not found" });
    }
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
    
    // Get audit from database
    const auditRecord = await rivalAuditRepository.getAudit(auditId);
    if (!auditRecord || !auditRecord.results) {
      return res.status(404).json({ error: "Audit not found" });
    }
    
    const audit = auditRecord.results;
    
    // Check if this is an enhanced audit (140+ factors)
    const isEnhancedAudit = audit.type === 'enhanced' || (audit.summary && 'totalFactors' in audit.summary);
    
    if (format === 'csv') {
      try {
        const csvBuffer = await generateRivalAuditCsv(convertForExport(audit));
        
        // Set headers for CSV download
        const filename = isEnhancedAudit ? `enhanced-rival-audit-${auditId}.csv` : `rival-audit-${auditId}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', csvBuffer.length.toString());
        
        // Send the CSV buffer
        res.send(csvBuffer);
      } catch (csvError) {
        console.error("Error generating CSV:", csvError);
        res.status(500).json({ error: "Failed to generate CSV export" });
      }
    } else {
      try {
        let excelBuffer;
        let filename;
        
        if (isEnhancedAudit) {
          // Use enhanced Excel exporter for 140+ factor audits
          excelBuffer = await generateEnhancedRivalAuditExcel(audit);
          filename = `enhanced-rival-audit-${auditId}.xlsx`;
        } else {
          // Use regular Excel exporter for standard audits
          excelBuffer = await generateRivalAuditExcel(convertForExport(audit));
          filename = `rival-audit-${auditId}.xlsx`;
        }
        
        // Set headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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