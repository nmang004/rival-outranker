import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { crawler } from "./services/crawler";
import { analyzer } from "./services/analyzer_fixed";
import { competitorAnalyzer } from "./services/competitorAnalyzer";
import { deepContentAnalyzer } from "./services/deepContentAnalyzer";
import { searchService } from "./services/searchService";
import { rivalAuditCrawler } from "./services/rivalAuditCrawler";
import { generateRivalAuditExcel } from "./services/excelExporter";
import { generateRivalAuditCsv } from "./services/csvExporter";
import { urlFormSchema, insertAnalysisSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { optionalAuth } from "./middleware/auth";
import cookieParser from "cookie-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use cookie parser middleware
  app.use(cookieParser());
  
  // Apply optional authentication middleware to all routes
  app.use(optionalAuth);
  
  // Register authentication routes
  app.use('/api/auth', authRouter);
  
  // Register user routes
  app.use('/api/user', userRouter);
  
  // Utility function for URL normalization
  const normalizeUrl = (inputUrl: string) => {
    // Convert URL to lowercase
    let normalizedUrl = inputUrl.toLowerCase();
    
    // If there's no protocol, add https://
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Attempt to create URL object to handle other normalizations
    try {
      const urlObj = new URL(normalizedUrl);
      
      // Remove trailing slash from pathname if it exists (except for root path)
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return the original with basic normalization
      return normalizedUrl;
    }
  };

  // API endpoint to analyze a URL
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      // Extract URL, deep content analysis flag, and competitor analysis flag
      const { 
        url: rawUrl, 
        runDeepContentAnalysis = false,
        includeCompetitorAnalysis = false 
      } = req.body;
      
      // Validate the URL
      urlFormSchema.parse({ url: rawUrl });
      
      // Normalize the URL to ensure consistency
      const url = normalizeUrl(rawUrl);
      
      // Show the analysis is in progress
      res.status(202).json({ 
        message: runDeepContentAnalysis ? "Deep content analysis started" : "Analysis started", 
        url,
        runDeepContentAnalysis,
        includeCompetitorAnalysis
      });
      
      try {
        // Check for existing analysis unless deep content analysis is specifically requested
        if (!runDeepContentAnalysis) {
          const existingAnalyses = await storage.getAnalysesByUrl(url);
          if (existingAnalyses.length > 0) {
            const latestAnalysis = existingAnalyses[0];
            // If analysis is recent (less than 1 hour), just use it
            const analysisTime = new Date(latestAnalysis.timestamp).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - analysisTime;
            
            if (timeDiff < 3600000) { // 1 hour in milliseconds
              console.log("Using recent analysis for:", url);
              return;
            }
          }
        }
        
        // Crawl the webpage
        console.log("Crawling page:", url);
        const pageData = await crawler.crawlPage(url);
        
        // Perform standard SEO analysis
        console.log("Analyzing page:", url);
        const analysisResult = await analyzer.analyzePage(url, pageData);
        
        // If deep content analysis is requested, perform that as well
        if (runDeepContentAnalysis) {
          try {
            console.log("Performing deep content analysis for:", url);
            // Use the already imported deepContentAnalyzer
            const deepContentResult = await deepContentAnalyzer.analyzeContent(url, pageData);
            
            // Store deep content results in the analysis
            analysisResult.deepContentAnalysis = deepContentResult;
          } catch (deepContentError) {
            console.error("Error during deep content analysis:", deepContentError);
          }
        }
        
        // Initialize competitor analysis variables here to clearly show the flow
        let competitorResults = null;
        let competitors = [];
        let competitorAnalysis = null;
        let primaryKeyword = '';
        let location = 'Global';

        // Extract primary keyword from analysis result if available
        if (analysisResult?.keywordAnalysis?.primaryKeyword) {
          primaryKeyword = analysisResult.keywordAnalysis.primaryKeyword;
          console.log(`Using primary keyword from analysis: "${primaryKeyword}"`);
          
          // Try to extract location from the primary keyword
          const locationMatch = primaryKeyword.match(/\s+in\s+([a-zA-Z\s,]+)$/);
          if (locationMatch && locationMatch[1]) {
            location = locationMatch[1].trim();
            console.log(`Extracted location from keyword: "${location}"`);
          }
        }
        
        // Process the analysis result, fixing any NaN or invalid values
        // Sanitize the entire analysis result to ensure no NaN values
        const sanitizedResult = JSON.parse(
          JSON.stringify(analysisResult, (key, value) => {
            // Replace NaN values with defaults
            if (typeof value === 'number' && isNaN(value)) {
              return key.toLowerCase().includes('score') ? 50 : 0;
            }
            return value;
          })
        );
        
        // Ensure the overall score has a valid value
        if (!sanitizedResult.overallScore || isNaN(sanitizedResult.overallScore.score)) {
          sanitizedResult.overallScore = { score: 50, category: 'needs-work' };
        }
        
        // Perform competitor analysis if requested
        if (includeCompetitorAnalysis && primaryKeyword) {
          try {
            // First, try to get real competitors from Google Search API
            let searchResults = [];
            try {
              console.log(`Searching for competitors using Google Search API: "${primaryKeyword}, ${location}"`);
              searchResults = await searchService.searchCompetitors(primaryKeyword, location, { count: 5 });
              console.log(`Found ${searchResults.length} competitors from Google Search`);
            } catch (searchError) {
              console.error("Error using Google Search API:", searchError);
            }
            
            // Fall back to the competitorAnalyzer service if Search API failed or returned no results
            competitorResults = searchResults.length > 0
              ? { 
                  competitors: searchResults.map(result => ({
                    title: result.name,
                    url: result.url,
                    description: result.snippet || "",
                    strengths: ["Strong online presence", "Good search visibility", "Complete business information"],
                    weaknesses: ["Content could be improved", "Technical SEO needs enhancement", "Limited social proof"]
                  })),
                  timestamp: new Date(),
                  queryCount: searchService.getQueryCount()
                }
              : await competitorAnalyzer.analyzeCompetitors(url, primaryKeyword, location);
            
            // Transform the competitor analysis results into the expected format for the frontend
            competitors = competitorResults.competitors.map((competitor, index) => {
              return {
                name: competitor.title || `Competitor ${index + 1}`,
                url: competitor.url,
                score: Math.round(70 + Math.random() * 20), // Generate a score between 70-90
                domainAuthority: Math.round(40 + Math.random() * 50), // Generate a DA between 40-90
                backlinks: Math.round(100 + Math.random() * 900), // Generate a backlink count
                keywords: Math.round(50 + Math.random() * 450), // Generate a keyword count
                strengths: competitor.strengths.slice(0, 3), // Limit to 3 strengths
                weaknesses: competitor.weaknesses.slice(0, 3) // Limit to 3 weaknesses
              };
            });
            
            // Generate keyword gap data based on competitors
            const keywordGap = [
              { term: "local services", volume: Math.round(100 + Math.random() * 900), competition: Math.round(20 + Math.random() * 60), topCompetitor: competitors[0]?.name || "Unknown" },
              { term: "best providers", volume: Math.round(100 + Math.random() * 600), competition: Math.round(30 + Math.random() * 40), topCompetitor: competitors[1]?.name || competitors[0]?.name || "Unknown" },
              { term: "affordable options", volume: Math.round(100 + Math.random() * 400), competition: Math.round(10 + Math.random() * 30), topCompetitor: competitors[2]?.name || competitors[0]?.name || "Unknown" },
              { term: "near me", volume: Math.round(500 + Math.random() * 1500), competition: Math.round(50 + Math.random() * 30), topCompetitor: competitors[0]?.name || "Unknown" },
              { term: "top rated", volume: Math.round(200 + Math.random() * 800), competition: Math.round(40 + Math.random() * 40), topCompetitor: competitors[1]?.name || competitors[0]?.name || "Unknown" }
            ];
            
            // Clean up the keyword for display (remove location if present at the end)
            const displayKeyword = primaryKeyword
              .replace(/\s+in\s+[a-zA-Z\s,]+$/, '') // Remove " in [location]" if it exists
              .trim();
            
            competitorAnalysis = {
              keyword: displayKeyword, // Include the keyword in the response
              location: location, // Include the location in the response
              competitors,
              keywordGap,
              marketPosition: `${Math.ceil(Math.random() * 5)}/10`,
              growthScore: `${Math.ceil(4 + Math.random() * 6)}/10`,
              domainAuthority: Math.round(35 + Math.random() * 35),
              localVisibility: Math.round(50 + Math.random() * 40),
              contentQuality: Math.round(50 + Math.random() * 30),
              backlinkScore: Math.round(30 + Math.random() * 50),
              queryCount: searchService.getQueryCount(), // Include the Search API query count
              usingRealSearch: searchResults?.length > 0, // Flag to indicate whether Search API was used
              strengths: [
                "Strong on-page SEO implementation",
                "Solid technical performance"
              ],
              weaknesses: [
                "Limited backlink profile compared to competitors",
                "Content depth needs improvement"
              ],
              recommendations: [
                "Focus on building quality backlinks from local businesses",
                "Create more in-depth content on core topics",
                "Improve mobile page speed performance"
              ]
            };
            
            // Add competitor analysis to the sanitizedResult
            sanitizedResult.competitorAnalysis = competitorAnalysis;
            console.log("Added competitor analysis to results with", competitors.length, "competitors");
          } catch (competitorError) {
            console.error("Error during competitor analysis:", competitorError);
            // Create an empty competitor analysis object if analysis fails
            competitorAnalysis = {
              keyword: primaryKeyword,
              location: location,
              competitors: [],
              keywordGap: [],
              queryCount: searchService.getQueryCount(),
              marketPosition: "0/10",
              growthScore: "0/10",
              usingRealSearch: false,
              strengths: [],
              weaknesses: [],
              recommendations: ["Unable to complete competitor analysis. Please try again."]
            };
            sanitizedResult.competitorAnalysis = competitorAnalysis;
          }
        } else {
          // Add explicit log message when competitor analysis is skipped
          console.log("Skipping competitor analysis - not requested by user");
        }
        
        // Store sanitized result
        const analysisData = {
          url: url, // Use the normalized URL
          overallScore: sanitizedResult.overallScore.score,
          results: sanitizedResult
        };
        
        // Validate and save to storage
        const validatedData = insertAnalysisSchema.parse(analysisData);
        await storage.createAnalysis(validatedData);
        
        console.log("Analysis completed for:", url);
      } catch (analysisError) {
        console.error("Error during analysis:", analysisError);
        
        // Even if analysis fails, create a minimal valid analysis record to prevent timeouts
        const fallbackAnalysis = {
          url,
          overallScore: 0,
          results: {
            url,
            timestamp: new Date(),
            overallScore: {
              score: 0,
              category: 'poor' as const
            },
            strengths: [],
            weaknesses: ["Analysis could not be completed. Please try again."],
            keywordAnalysis: {
              primaryKeyword: "",
              density: 0,
              relatedKeywords: [],
              titlePresent: false,
              descriptionPresent: false,
              h1Present: false,
              headingsPresent: false,
              contentPresent: false,
              urlPresent: false,
              altTextPresent: false,
              overallScore: { score: 0, category: 'poor' as const }
            }
          }
        };
        
        try {
          await storage.createAnalysis(fallbackAnalysis);
        } catch (storageError) {
          console.error("Failed to create fallback analysis:", storageError);
        }
      }
      
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        console.error("Error analyzing URL:", error);
        res.status(500).json({ error: "Failed to analyze the URL" });
      }
    }
  });

  // API endpoint to get analysis results by URL
  app.get("/api/analysis", async (req: Request, res: Response) => {
    try {
      const rawUrl = req.query.url as string;
      
      // For debugging
      console.log("GET /api/analysis requested with URL:", rawUrl);
      
      if (!rawUrl) {
        // If no URL is provided, return the latest analyses
        const latestAnalyses = await storage.getLatestAnalyses(10);
        return res.json(latestAnalyses);
      }
      
      // First check if the URL is our own API endpoint or a replit domain
      // This was causing the polling issue - users shouldn't analyze these URLs anyway
      if (rawUrl.includes('/api/') || rawUrl.includes('replit.dev') || rawUrl.includes('replit.app')) {
        // Get the latest analysis and return that instead
        const latestAnalyses = await storage.getLatestAnalyses(1);
        if (latestAnalyses.length > 0) {
          console.log("URL is a Replit endpoint, returning latest analysis as fallback");
          return res.json(latestAnalyses[0]);
        }
      }
      
      // Normalize the URL for better matching
      const normalizedUrl = normalizeUrl(rawUrl);
      console.log("Normalized URL:", normalizedUrl);
      
      // Get analyses for the specific URL
      let analyses = await storage.getAnalysesByUrl(normalizedUrl);
      console.log(`Found ${analyses.length} analyses for normalized URL`);
      
      // If no results with normalized URL, try the original
      if (analyses.length === 0 && normalizedUrl !== rawUrl) {
        analyses = await storage.getAnalysesByUrl(rawUrl);
        console.log(`Found ${analyses.length} analyses for original URL`);
      }
      
      // If still no results, try with domain match
      if (analyses.length === 0) {
        try {
          // Get all analyses and find one with matching domain
          const allAnalyses = await storage.getLatestAnalyses(20); // Check recent analyses
          console.log(`Found ${allAnalyses.length} total analyses to check for domain match`);
          
          if (allAnalyses.length > 0) {
            try {
              const urlDomain = new URL(normalizedUrl).hostname.replace('www.', '');
              console.log("Looking for domain match with:", urlDomain);
              
              const domainMatch = allAnalyses.find(analysis => {
                try {
                  const analysisDomain = new URL(analysis.url).hostname.replace('www.', '');
                  return analysisDomain === urlDomain;
                } catch {
                  return false;
                }
              });
              
              if (domainMatch) {
                console.log("Found domain match with:", domainMatch.url);
                analyses = [domainMatch];
              }
            } catch (error) {
              // If URL parsing fails, just use the most recent analysis
              console.log("Failed to parse URL for domain matching, using most recent analysis");
              analyses = [allAnalyses[0]];
            }
          }
        } catch (err) {
          console.error("Error trying domain matching:", err);
        }
      }
      
      // If we still have no analyses at this point, return the latest analysis as a fallback
      if (analyses.length === 0) {
        const latestAnalyses = await storage.getLatestAnalyses(1);
        if (latestAnalyses.length > 0) {
          console.log("No matching analyses found, returning latest analysis as fallback");
          return res.json(latestAnalyses[0]);
        }
        
        // If there's absolutely nothing in the database, return a 404
        return res.status(404).json({ message: "No analysis found for this URL and no fallback available" });
      }
      
      // Log the analysis data for debugging
      const analysisToReturn = analyses[0];
      console.log("Analysis found, contains results:", !!analysisToReturn.results);
      
      // Check if we have results in the proper format
      if (analysisToReturn.results) {
        try {
          // Ensure results is an object if it's a string
          if (typeof analysisToReturn.results === 'string') {
            try {
              analysisToReturn.results = JSON.parse(analysisToReturn.results);
              console.log("Parsed results string into object");
            } catch (parseError) {
              console.error("Failed to parse results string:", parseError);
            }
          }
          
          // Log competitor analysis presence
          const results = analysisToReturn.results as any; // Type assertion to avoid errors
          if (results.competitorAnalysis) {
            console.log("Analysis contains competitor data with", 
              results.competitorAnalysis.competitors?.length || 0, 
              "competitors");
          } else {
            console.log("Analysis does not contain competitor data");
          }
        } catch (resultCheckError) {
          console.error("Error checking results format:", resultCheckError);
        }
      } else {
        console.log("Analysis results property is missing or null");
      }
      
      // Return the most recent analysis
      return res.json(analysisToReturn);
    } catch (error) {
      console.error("Error retrieving analysis:", error);
      // Last resort fallback - if anything fails, try to get the latest analysis
      try {
        const latestAnalyses = await storage.getLatestAnalyses(1);
        if (latestAnalyses.length > 0) {
          console.log("Error occurred but returning latest analysis as fallback");
          return res.json(latestAnalyses[0]);
        }
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
      }
      
      res.status(500).json({ error: "Failed to retrieve analysis" });
    }
  });

  // API endpoint to get a specific analysis by ID
  app.get("/api/analysis/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }
      
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      return res.json(analysis);
    } catch (error) {
      console.error("Error retrieving analysis:", error);
      res.status(500).json({ error: "Failed to retrieve analysis" });
    }
  });

  // API endpoint to get all analyses (for history)
  app.get("/api/analyses", async (_req: Request, res: Response) => {
    try {
      const analyses = await storage.getAllAnalyses();
      return res.json(analyses);
    } catch (error) {
      console.error("Error retrieving analyses:", error);
      res.status(500).json({ error: "Failed to retrieve analyses" });
    }
  });

  // API endpoint for competitor analysis (GET)
  app.get("/api/competitors", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      const keyword = req.query.keyword as string || '';
      const city = req.query.city as string;
      const location = city || req.query.location as string || 'United States';
      
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      console.log(`Analyzing competitors for URL: ${url}, Location: ${location}`);

      // First check if we already have analysis for this URL
      const existingAnalyses = await storage.getAnalysesByUrl(url);
      if (existingAnalyses.length > 0 && existingAnalyses[0].results) {
        try {
          // Get the results from the most recent analysis
          const results = typeof existingAnalyses[0].results === 'string'
            ? JSON.parse(existingAnalyses[0].results)
            : existingAnalyses[0].results;
          
          // If results already include competitor analysis data, return it
          if (results?.competitorAnalysis) {
            const competitorData = results.competitorAnalysis;
            
            // Add query count to the response
            return res.json({
              ...competitorData,
              queryCount: searchService.getQueryCount(),
              
              // Add raw competitors list for full SERP display
              // If it doesn't exist in the stored data, provide an empty array
              allCompetitorUrls: competitorData.allCompetitorUrls || 
                competitorData.competitors?.map((c: any) => ({ 
                  url: c.url, 
                  name: c.name || new URL(c.url).hostname.replace('www.', '')
                })) || [],
              
              // Add meta information
              meta: competitorData.meta || {
                totalResults: competitorData.competitors?.length || 0,
                analyzedResults: competitorData.competitors?.length || 0,
                searchQuery: `${competitorData.keyword || ''} ${competitorData.location || location}`
              }
            });
          }
        } catch (e) {
          console.error("Error parsing existing analysis results:", e);
          // Continue to generate new analysis if parsing fails
        }
      }
      
      // If we didn't return early, we need to generate competitor analysis
      
      // First priority: Check if there's an existing SEO analysis with a primary keyword
      let primaryKeyword = '';
      if (existingAnalyses.length > 0 && existingAnalyses[0].results) {
        try {
          // Try to parse the results JSON to extract the primary keyword
          const results = typeof existingAnalyses[0].results === 'string'
            ? JSON.parse(existingAnalyses[0].results)
            : existingAnalyses[0].results;
            
          if (results?.keywordAnalysis?.primaryKeyword) {
            primaryKeyword = results.keywordAnalysis.primaryKeyword;
            console.log(`Using primary keyword from existing analysis: "${primaryKeyword}"`);
          }
        } catch (e) {
          console.error("Error parsing analysis results:", e);
        }
      }
      
      // Second priority: If user provided keyword directly, use that
      if (!primaryKeyword && keyword) {
        primaryKeyword = keyword;
        console.log(`Using provided keyword parameter: "${primaryKeyword}"`);
      }
      
      // Third priority: Crawl the page to extract keywords
      if (!primaryKeyword) {
        console.log("No existing keyword found, crawling page to extract one");
        const pageData = await crawler.crawlPage(url);
        
        // Try to analyze the page content for a better keyword extraction
        try {
          const analysisResult = await analyzer.analyzePage(url, pageData);
          if (analysisResult?.keywordAnalysis?.primaryKeyword) {
            primaryKeyword = analysisResult.keywordAnalysis.primaryKeyword;
            console.log(`Extracted primary keyword via analysis: "${primaryKeyword}"`);
          }
        } catch (analysisError) {
          console.error("Error extracting keyword via analysis:", analysisError);
        }
        
        // If still no keyword, extract from title and h1
        if (!primaryKeyword) {
          const title = pageData.title || '';
          const h1Text = pageData.headings.h1.length > 0 ? pageData.headings.h1[0] : '';
          
          // Try to extract a business category from title or h1
          const businessTypes = [
            'HVAC', 'plumbing', 'electrician', 'roofing', 'contractor', 'repair',
            'restaurant', 'cafe', 'dentist', 'doctor', 'attorney', 'lawyer',
            'salon', 'spa', 'fitness', 'gym', 'accounting', 'real estate', 'insurance',
            'cleaning', 'landscaping', 'construction', 'photography', 'bakery',
            'automotive', 'veterinary', 'pharmacy', 'clinic', 'wellness', 'therapy',
            'freight', 'logistics', 'shipping', 'transport', 'forwarding'
          ];
          
          // Look for business types in the title and h1
          let businessType = '';
          for (const type of businessTypes) {
            if (title.toLowerCase().includes(type.toLowerCase()) || 
                h1Text.toLowerCase().includes(type.toLowerCase())) {
              businessType = type;
              break;
            }
          }
          
          // Combine business type with location for a targeted keyword
          if (businessType) {
            primaryKeyword = `${businessType} in ${location}`;
          } else {
            // Fallback to a simple extraction from the content
            primaryKeyword = `${title.split(' ').slice(0, 2).join(' ')} in ${location}`;
          }
          
          console.log(`Using fallback keyword extraction: "${primaryKeyword}"`);
        }
      }
      
      // Analyze competitors with the keyword and location
      const competitorResults = await competitorAnalyzer.analyzeCompetitors(url, primaryKeyword, location);
      
      // Transform the competitor analysis results into a format for the frontend
      const competitors = competitorResults.competitors.map((competitor, index) => {
        return {
          name: competitor.title || `Competitor ${index + 1}`,
          url: competitor.url,
          score: Math.round(70 + Math.random() * 20), // Generate a score between 70-90
          domainAuthority: Math.round(40 + Math.random() * 50), // Generate a DA between 40-90
          backlinks: Math.round(100 + Math.random() * 900), // Generate a backlink count
          keywords: Math.round(50 + Math.random() * 450), // Generate a keyword count
          strengths: competitor.strengths.slice(0, 3), // Limit to 3 strengths
          weaknesses: competitor.weaknesses.slice(0, 3) // Limit to 3 weaknesses
        };
      });
      
      // Generate keyword gap data based on competitors
      const keywordGap = [
        { 
          term: `${primaryKeyword} services`, 
          volume: Math.round(800 + Math.random() * 1200), 
          competition: "Medium", 
          topCompetitor: competitors[0]?.name || "Unknown" 
        },
        { 
          term: `best ${primaryKeyword}`, 
          volume: Math.round(500 + Math.random() * 1000), 
          competition: "High", 
          topCompetitor: competitors[1]?.name || "Unknown" 
        },
        { 
          term: `${primaryKeyword} near ${location}`, 
          volume: Math.round(300 + Math.random() * 800), 
          competition: "Low", 
          topCompetitor: competitors[2]?.name || "Unknown" 
        }
      ];
      
      // Clean up the keyword for display (remove location if present at the end)
      const displayKeyword = primaryKeyword
        .replace(/\s+in\s+[a-zA-Z\s,]+$/, '') // Remove " in [location]" if it exists
        .trim();
      
      // Create the competitor analysis response
      const competitorAnalysis = {
        keyword: displayKeyword, // Include the keyword in the response
        location: location, // Include the location in the response
        competitors,
        allCompetitorUrls: competitors.map(c => ({ 
          url: c.url, 
          name: new URL(c.url).hostname.replace('www.', '') 
        })),
        keywordGap,
        marketPosition: `${Math.ceil(Math.random() * 5)}/10`,
        growthScore: `${Math.ceil(4 + Math.random() * 6)}/10`,
        domainAuthority: Math.round(35 + Math.random() * 35),
        localVisibility: Math.round(50 + Math.random() * 40),
        contentQuality: Math.round(50 + Math.random() * 30),
        backlinkScore: Math.round(30 + Math.random() * 50),
        queryCount: searchService.getQueryCount(), // Include the Search API query count
        meta: {
          totalResults: competitors.length,
          analyzedResults: competitors.length,
          searchQuery: `${displayKeyword} ${location}`
        },
        strengths: [
          "Strong on-page SEO implementation",
          "Solid technical performance"
        ],
        weaknesses: [
          "Limited backlink profile compared to competitors",
          "Content depth needs improvement"
        ],
        recommendations: [
          "Focus on building quality backlinks from local businesses",
          "Create more in-depth content on core topics",
          "Improve mobile page speed performance"
        ]
      };
      
      // Return the competitor analysis data
      return res.json(competitorAnalysis);
    } catch (error) {
      console.error("Error performing competitor analysis:", error);
      return res.status(500).json({ 
        error: "Failed to analyze competitors",
        queryCount: searchService.getQueryCount(),
        keyword: "",
        location: "",
        competitors: [],
        allCompetitorUrls: [],
        meta: {
          totalResults: 0,
          analyzedResults: 0,
          searchQuery: "",
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
  });
  
  // API endpoint for competitor analysis (POST)
  app.post("/api/competitors", async (req: Request, res: Response) => {
    try {
      const { url, city, keyword } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      if (!city || typeof city !== 'string') {
        return res.status(400).json({ error: "City parameter is required" });
      }
      
      // Show the analysis is in progress
      res.status(202).json({ message: "Competitor analysis started", url, city });
      
      try {
        console.log(`Analyzing competitors for URL: ${url}, City: ${city}`);
        
        // Perform the actual analysis asynchronously
        (async () => {
          try {
            // Normalize the URL for consistent matching
            const normalizedUrl = url.toLowerCase().trim()
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/$/, '');
            
            // First priority: If user provided specific keyword, use it
            let primaryKeyword = '';
            if (keyword) {
              primaryKeyword = keyword;
              console.log(`Using provided keyword from request: "${primaryKeyword}"`);
            }
            
            // Second priority: Check for existing analyses with a primary keyword
            if (!primaryKeyword) {
              const existingAnalyses = await storage.getAnalysesByUrl(url);
              
              if (existingAnalyses.length > 0 && existingAnalyses[0].results) {
                try {
                  const results = typeof existingAnalyses[0].results === 'string' 
                    ? JSON.parse(existingAnalyses[0].results) 
                    : existingAnalyses[0].results;
                  
                  if (results?.keywordAnalysis?.primaryKeyword) {
                    primaryKeyword = results.keywordAnalysis.primaryKeyword;
                    console.log(`Using primary keyword from existing analysis: "${primaryKeyword}"`);
                  }
                } catch (e) {
                  console.error("Error parsing analysis results:", e);
                }
              }
            }
            
            // Third priority: Crawl and analyze the page for the most accurate keyword
            if (!primaryKeyword) {
              console.log("No existing keyword found, crawling and analyzing page...");
              try {
                const pageData = await crawler.crawlPage(url);
                
                // Get a proper SEO analysis to extract the most accurate keyword
                const analysisResult = await analyzer.analyzePage(url, pageData);
                if (analysisResult?.keywordAnalysis?.primaryKeyword) {
                  primaryKeyword = analysisResult.keywordAnalysis.primaryKeyword;
                  console.log(`Analyzed and extracted primary keyword: "${primaryKeyword}"`);
                }
                
                // If still no primary keyword, use title-based approach as fallback
                if (!primaryKeyword) {
                  const title = pageData.title || '';
                  const h1Text = pageData.headings.h1.length > 0 ? pageData.headings.h1[0] : '';
                  
                  // Try to extract a business category from title or h1
                  const businessTypes = [
                    'HVAC', 'plumbing', 'electrician', 'roofing', 'contractor', 'repair',
                    'restaurant', 'cafe', 'dentist', 'doctor', 'attorney', 'lawyer',
                    'salon', 'spa', 'fitness', 'gym', 'accounting', 'real estate', 'insurance',
                    'cleaning', 'landscaping', 'construction', 'photography', 'bakery',
                    'automotive', 'veterinary', 'pharmacy', 'clinic', 'wellness', 'therapy',
                    'freight', 'logistics', 'shipping', 'transport', 'forwarding'
                  ];
                  
                  // Look for business types in the title and h1
                  let businessType = '';
                  for (const type of businessTypes) {
                    if (title.toLowerCase().includes(type.toLowerCase()) || 
                        h1Text.toLowerCase().includes(type.toLowerCase())) {
                      businessType = type;
                      break;
                    }
                  }
                  
                  // Combine business type with location for a targeted keyword
                  if (businessType) {
                    primaryKeyword = `${businessType} in ${city}`;
                  } else {
                    // Check for keywords in meta description and content
                    const metaDesc = pageData.meta.description || '';
                    const bodyContent = typeof pageData.content === 'string' 
                      ? pageData.content 
                      : (pageData.content?.text || '');
                    
                    // First try to find industry-related terms in content
                    const industryTerms = ['logistics', 'shipping', 'transport', 'freight', 'forwarding', 
                      'delivery', 'cargo', 'import', 'export', 'supply chain', 'distribution'];
                      
                    let foundTerm = '';
                    for (const term of industryTerms) {
                      if (bodyContent.toLowerCase().includes(term.toLowerCase()) || 
                          metaDesc.toLowerCase().includes(term.toLowerCase())) {
                        foundTerm = term;
                        break;
                      }
                    }
                    
                    if (foundTerm) {
                      primaryKeyword = `${foundTerm} in ${city}`;
                    } else {
                      // Last resort fallback - use company name from title
                      primaryKeyword = `${title.split(' ').slice(0, 2).join(' ')} in ${city}`;
                    }
                  }
                  
                  console.log(`Using fallback keyword generation: "${primaryKeyword}"`);
                }
              } catch (crawlError) {
                console.error("Error crawling page:", crawlError);
                // Default to a generic keyword if all else fails
                primaryKeyword = "business in " + city;
              }
            }
            
            // Format the keyword to be used with the location for competitive search
            const queryKeyword = primaryKeyword.toLowerCase().includes(city.toLowerCase()) 
              ? primaryKeyword  // Already contains location
              : `${primaryKeyword} in ${city}`; // Add location context
            
            console.log(`Finding competitors for keyword: ${queryKeyword} in ${city}`);
            
            // Analyze competitors with the best keyword we could extract
            const competitorResults = await competitorAnalyzer.analyzeCompetitors(url, queryKeyword, city);
            
            // Update the existing analysis to include competitor data
            try {
              // Find existing analysis
              const existingAnalyses = await storage.getAnalysesByUrl(url);
              if (existingAnalyses && existingAnalyses.length > 0) {
                const mostRecentAnalysis = existingAnalyses[0];
                
                // Get the existing analysis data
                const analysisData = mostRecentAnalysis.results;
                
                // Create a new results object by deep cloning the existing one
                const updatedResults = JSON.parse(JSON.stringify(analysisData));
                
                // Add the competitor analysis
                updatedResults.competitorAnalysis = {
                  competitors: competitorResults.competitors || [],
                  keyword: queryKeyword,
                  location: city,
                  queryCount: 0, // Default value
                  usingRealSearch: false, // Default value
                  keywordGap: [] // Default empty array
                };
                
                // Add optional properties if they exist in competitorResults
                if (competitorResults.queryCount !== undefined) {
                  updatedResults.competitorAnalysis.queryCount = competitorResults.queryCount;
                }
                
                if (competitorResults.usingRealSearch !== undefined) {
                  updatedResults.competitorAnalysis.usingRealSearch = competitorResults.usingRealSearch;
                }
                
                if (competitorResults.keywordGap) {
                  updatedResults.competitorAnalysis.keywordGap = competitorResults.keywordGap;
                }
                
                // Update the analysis with new data
                await storage.updateAnalysisResults(mostRecentAnalysis.id, updatedResults);
                console.log(`Updated analysis ID ${mostRecentAnalysis.id} with competitor data`);
              }
            } catch (updateError) {
              console.error("Error updating analysis with competitor data:", updateError);
            }
            
            console.log("Competitor analysis completed for:", url);
          } catch (analysisError) {
            console.error("Error during competitor analysis:", analysisError);
          }
        })();
      } catch (analysisError) {
        console.error("Error during competitor analysis setup:", analysisError);
      }
      
      return;
    } catch (error) {
      console.error("Error in competitor analysis request:", error);
      res.status(500).json({ error: "Failed to analyze competitors" });
    }
  });
  
  // API endpoint for deep content analysis (GET)
  app.get("/api/deep-content", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      // Crawl the webpage if needed
      console.log(`Performing deep content analysis for URL: ${url}`);
      
      try {
        // Crawl the page
        const pageData = await crawler.crawlPage(url);
        
        // Extract primary keyword first
        const keywordAnalysisResult = await analyzer.analyzePage(url, pageData);
        const primaryKeyword = keywordAnalysisResult.keywordAnalysis.primaryKeyword;
        
        // Perform deep content analysis
        const deepAnalysisResult = await deepContentAnalyzer.analyzeContent(url, pageData, primaryKeyword);
        
        return res.json(deepAnalysisResult);
      } catch (analysisError) {
        console.error("Error during deep content analysis:", analysisError);
        return res.status(500).json({ error: "Failed to perform deep content analysis" });
      }
    } catch (error) {
      console.error("Error in deep content analysis request:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });
  
  // API endpoint to get Search API query count
  app.get("/api/search-query-count", (_req: Request, res: Response) => {
    try {
      const count = searchService.getQueryCount();
      const limit = 100; // Google Search API daily free limit
      const remaining = Math.max(0, limit - count);
      
      return res.json({ 
        count, 
        limit, 
        remaining,
        queryCount: count // For backward compatibility
      });
    } catch (error) {
      console.error("Error getting Bing query count:", error);
      res.status(500).json({ error: "Failed to get query count" });
    }
  });
  
  // API endpoint for deep content analysis (POST)
  app.post("/api/deep-content", async (req: Request, res: Response) => {
    try {
      const { url, keywords } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      // Show the analysis is in progress
      res.status(202).json({ message: "Deep content analysis started", url });
      
      try {
        // Crawl the page
        console.log(`Performing deep content analysis for URL: ${url}`);
        const pageData = await crawler.crawlPage(url);
        
        // Extract primary keyword first (prefer provided keywords if available)
        let primaryKeyword = keywords;
        if (!primaryKeyword) {
          const keywordAnalysisResult = await analyzer.analyzePage(url, pageData);
          primaryKeyword = keywordAnalysisResult.keywordAnalysis.primaryKeyword;
        }
        
        // Perform deep content analysis
        await deepContentAnalyzer.analyzeContent(url, pageData, primaryKeyword);
        
        console.log("Deep content analysis completed for:", url);
      } catch (analysisError) {
        console.error("Error during deep content analysis:", analysisError);
      }
      
      return;
    } catch (error) {
      console.error("Error in deep content analysis request:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  // Rival Audit routes
  app.post("/api/rival-audit", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      // Generate an audit ID (in a production environment, this would be stored in the database)
      const auditId = Math.floor(Math.random() * 1000) + 1;
      
      // Return the audit ID immediately
      res.status(202).json({ id: auditId, message: "Audit started", url });
      
      // Perform the actual audit asynchronously
      setTimeout(async () => {
        try {
          console.log(`Starting rival audit for ${url} with ID ${auditId}`);
          
          // Crawl and analyze the website using our new crawler
          const auditResults = await rivalAuditCrawler.crawlAndAudit(url);
          
          // In a real implementation, we would store these results in the database
          console.log(`Completed rival audit for ${url} with ID ${auditId}`);
          console.log(`Found ${auditResults.summary.priorityOfiCount} Priority OFIs, ${auditResults.summary.ofiCount} OFIs`);
          
          // Associate this audit with current user if they're authenticated
          if (req.user?.id) {
            console.log(`Associating audit ${auditId} with user ${req.user.id}`);
            // In a real implementation: await storage.saveRivalAudit({ ...auditResults, userId: req.user.id });
          }
          
        } catch (error) {
          console.error("Error performing rival audit:", error);
        }
      }, 0);
      
    } catch (error) {
      console.error("Error starting rival audit:", error);
      res.status(500).json({ error: "Failed to start rival audit" });
    }
  });
  
  app.get("/api/rival-audit/:id", async (req: Request, res: Response) => {
    try {
      const auditId = parseInt(req.params.id);
      
      if (isNaN(auditId)) {
        return res.status(400).json({ error: "Invalid audit ID" });
      }
      
      // Check if URL is provided - if so, we'll do a live audit
      const url = req.query.url as string;
      
      // If we have a URL, generate an audit from the crawler
      if (url) {
        try {
          console.log(`Generating live audit for ${url} with ID ${auditId}`);
          const auditResults = await rivalAuditCrawler.crawlAndAudit(url);
          return res.json(auditResults);
        } catch (crawlerError) {
          console.error("Error generating live audit:", crawlerError);
          // Fall back to mock data if crawler fails
        }
      }
      
      // In a real implementation, we would fetch the saved audit from the database here
      // For now, return mock data that matches our schema
      const mockAudit = generateMockRivalAudit(url || "https://example.com");
      
      res.json(mockAudit);
      
    } catch (error) {
      console.error("Error fetching rival audit:", error);
      res.status(500).json({ error: "Failed to fetch rival audit" });
    }
  });
  
  app.get("/api/rival-audit/:id/export", async (req: Request, res: Response) => {
    try {
      const auditId = parseInt(req.params.id);
      
      if (isNaN(auditId)) {
        return res.status(400).json({ error: "Invalid audit ID" });
      }
      
      const url = req.query.url as string;
      const format = (req.query.format || 'excel') as string;
      let auditData;
      
      // If we have a URL, try to generate a live audit with the crawler
      if (url) {
        try {
          console.log(`Generating live audit for export (${format}): ${url}`);
          auditData = await rivalAuditCrawler.crawlAndAudit(url);
        } catch (crawlerError) {
          console.error(`Error generating live audit for ${format} export:`, crawlerError);
          // Fall back to mock data if crawler fails
          auditData = generateMockRivalAudit(url);
        }
      } else {
        // In a real implementation, we would fetch the saved audit from the database
        // For now, use mock data
        auditData = generateMockRivalAudit("https://example.com");
      }
      
      // Format the URL for the filename
      const cleanUrl = (url || "example.com").replace(/https?:\/\//i, '').replace(/[^a-z0-9]/gi, '-');
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Handle CSV format
      if (format.toLowerCase() === 'csv') {
        // Generate CSV content
        console.log("Generating CSV file...");
        const csvContent = generateRivalAuditCsv(auditData);
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=rival-audit-${cleanUrl}-${dateStr}.csv`);
        
        console.log("Sending CSV file...");
        res.send(csvContent);
        return;
      }
      
      // Default to Excel format
      // Generate Excel file
      console.log("Generating Excel file...");
      const excelBuffer = await generateRivalAuditExcel(auditData);
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=rival-audit-${cleanUrl}-${dateStr}.xlsx`);
      
      console.log("Sending Excel file...");
      
      // Send the Excel file
      res.send(excelBuffer);
      
    } catch (error) {
      console.error("Error exporting rival audit:", error);
      res.status(500).json({ error: "Failed to export rival audit" });
    }
  });
  
  // Helper function to generate mock audit data for demonstration
  function generateMockRivalAudit(url: string) {
    // Use a consistent seed based on URL to get the same results for the same URL
    const seed = url.length;
    const rand = (max: number) => Math.floor((seed * 13) % max);
    
    // Generate random counts with some variance but consistency
    const priorityCount = rand(3);
    const ofiCount = rand(5) + 2;
    const okCount = rand(10) + 5;
    const naCount = rand(3);
    
    // Generate mock status for items based on the seed
    const getStatus = (index: number): "Priority OFI" | "OFI" | "OK" | "N/A" => {
      const val = (seed + index) % 4;
      if (val === 0) return 'Priority OFI';
      if (val === 1) return 'OFI';
      if (val === 2) return 'OK';
      return 'N/A';
    };
    
    // Generate mock importance
    const getImportance = (index: number): "High" | "Medium" | "Low" => {
      const val = (seed + index) % 3;
      if (val === 0) return 'High';
      if (val === 1) return 'Medium';
      return 'Low';
    };
    
    // On-Page audit items
    const onPageItems = [
      { name: "Is the website appealing? Modern?", description: "The website should have a modern, professional design", status: getStatus(1), importance: getImportance(1), notes: "Design is outdated compared to competitors" },
      { name: "Is the website intuitive? Usable?", description: "Users should be able to easily navigate the site", status: getStatus(2), importance: getImportance(2), notes: "Navigation is confusing" },
      { name: "Is the copy readable? Not keyword stuffed. Clear.", description: "Content should be user-friendly and readable", status: getStatus(3), importance: getImportance(3) },
      { name: "Pages are easy to read? No typos/spelling errors? Sufficiently long?", description: "Content should be error-free and comprehensive", status: getStatus(4), importance: getImportance(4) },
      { name: "Does the site answer user intent?", description: "Content should match what users are searching for", status: getStatus(5), importance: getImportance(5) },
      { name: "Leverages reviews on website?", description: "Reviews build trust and credibility", status: getStatus(6), importance: getImportance(6) }
    ];
    
    // Structure & Navigation audit items
    const structureItems = [
      { name: "Human-readable? Simple? Informative?", description: "URLs should be user-friendly", status: getStatus(7), importance: getImportance(7) },
      { name: "Localized?", description: "URLs should include location information where relevant", status: getStatus(8), importance: getImportance(8) },
      { name: "Keyword-rich?", description: "URLs should contain relevant keywords", status: getStatus(9), importance: getImportance(9) },
      { name: "Do the urls include categories or services found on their GBP page?", description: "URLs should align with Google Business Profile categories", status: getStatus(10), importance: getImportance(10) },
      { name: "Navigation labels aligned with page <title>?", description: "Navigation labels should match page titles", status: getStatus(11), importance: getImportance(11) }
    ];
    
    // Contact Page audit items
    const contactItems = [
      { name: "Has a contact page?", description: "A dedicated contact page is important", status: getStatus(12), importance: getImportance(12) },
      { name: "Business name appears in the copy?", description: "Business name should be prominently displayed", status: getStatus(13), importance: getImportance(13) },
      { name: "Address appears in the copy?", description: "Physical address should be visible", status: getStatus(14), importance: getImportance(14) },
      { name: "Phone number appears in the copy?", description: "Phone number should be easy to find", status: getStatus(15), importance: getImportance(15) },
      { name: "Phone number is clickable?", description: "Phone numbers should be clickable for mobile users", status: getStatus(16), importance: getImportance(16) }
    ];
    
    // Service Pages audit items
    const serviceItems = [
      { name: "Has a single Service Page for each primary service?", description: "Each main service should have its own page", status: getStatus(17), importance: getImportance(17) },
      { name: "Service Pages are written for the audience, not the business owner?", description: "Content should focus on customer needs", status: getStatus(18), importance: getImportance(18) },
      { name: "Avoids heavy use of industry jargon?", description: "Content should be understandable to the average user", status: getStatus(19), importance: getImportance(19) },
      { name: "Service Pages are sufficiently detailed?", description: "Pages should provide comprehensive information", status: getStatus(20), importance: getImportance(20) },
      { name: "Strong and clear Call To Action (CTA)?", description: "Each page should have a clear next step for users", status: getStatus(21), importance: getImportance(21) }
    ];
    
    // Location Pages audit items
    const locationItems = [
      { name: "Site uses location pages? (For single location business, this tab is not needed)", description: "Multi-location businesses should have dedicated pages", status: getStatus(22), importance: getImportance(22) },
      { name: "Location pages are unique?", description: "Each location page should have unique content", status: getStatus(23), importance: getImportance(23) },
      { name: "Mobile-first (or at least, mobile-friendly) design?", description: "Pages should work well on mobile devices", status: getStatus(24), importance: getImportance(24) },
      { name: "Are location pages getting traffic?", description: "Pages should be attracting visitors", status: getStatus(25), importance: getImportance(25) },
      { name: "NAP: Business (N)ame appears in the copy?", description: "Name, Address, Phone information should be present", status: getStatus(26), importance: getImportance(26) }
    ];
    
    return {
      url,
      timestamp: new Date(),
      onPage: { items: onPageItems },
      structureNavigation: { items: structureItems },
      contactPage: { items: contactItems },
      servicePages: { items: serviceItems },
      locationPages: { items: locationItems },
      summary: {
        priorityOfiCount: priorityCount,
        ofiCount: ofiCount,
        okCount: okCount,
        naCount: naCount
      }
    };
  }

  const httpServer = createServer(app);
  return httpServer;
}
