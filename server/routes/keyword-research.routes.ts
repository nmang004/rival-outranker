import { Router, Request, Response } from 'express';
import { keywordService } from '../services/keywords/keyword.service';
import { 
  getKeywordData as getGoogleAdsKeywordData,
  getKeywordSuggestions as getGoogleAdsKeywordSuggestions,
  isGoogleAdsApiReady
} from '../services/external/google-ads.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// API endpoint for checking keyword ranking
router.post("/keywords/:id/check-ranking", authenticate, async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    
    if (isNaN(keywordId)) {
      return res.status(400).json({ error: "Invalid keyword ID" });
    }
    
    // Check keyword ranking using the keyword service
    const rankingResult = await keywordService.checkKeywordRanking(keywordId);
    
    res.json(rankingResult);
  } catch (error) {
    console.error("Error checking keyword ranking:", error);
    res.status(500).json({ error: "Failed to check keyword ranking" });
  }
});

// API endpoint for keyword research
router.post("/keyword-research", async (req: Request, res: Response) => {
  try {
    const { keyword, location = "US", language = "en" } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }
    
    console.log(`Keyword research for: ${keyword}, Location: ${location}, Language: ${language}`);
    
    // Try to get keyword data using DataForSEO service first
    try {
      const keywordData = await keywordService.getKeywordData(keyword, location, language);
      
      if (keywordData && keywordData.length > 0) {
        return res.json({
          keyword,
          location,
          language,
          data: keywordData,
          source: 'DataForSEO',
          timestamp: new Date()
        });
      }
    } catch (dataForSeoError) {
      console.error("DataForSEO keyword research failed:", dataForSeoError);
    }
    
    // Fallback to Google Ads API if available
    if (isGoogleAdsApiReady()) {
      try {
        const googleAdsData = await getGoogleAdsKeywordData([keyword], location);
        
        return res.json({
          keyword,
          location,
          language,
          data: googleAdsData,
          source: 'Google Ads API',
          timestamp: new Date()
        });
      } catch (googleAdsError) {
        console.error("Google Ads keyword research failed:", googleAdsError);
      }
    }
    
    // Return mock data as final fallback
    const mockData = [{
      keyword,
      search_volume: Math.floor(Math.random() * 10000) + 100,
      competition: Math.random(),
      cpc: Math.random() * 5 + 0.1,
      difficulty: Math.floor(Math.random() * 100),
      location_code: location === 'US' ? 2840 : 2840
    }];
    
    res.json({
      keyword,
      location,
      language,
      data: mockData,
      source: 'Mock Data',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error("Error in keyword research:", error);
    res.status(500).json({ error: "Failed to perform keyword research" });
  }
});

// API endpoint for keyword suggestions
router.post("/keyword-suggestions", async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }
    
    console.log(`Generating keyword suggestions for: ${keyword}`);
    
    // Try to get suggestions using DataForSEO service first
    try {
      const suggestions = await keywordService.getKeywordSuggestions(keyword);
      
      if (suggestions && suggestions.length > 0) {
        return res.json({
          keyword,
          suggestions,
          source: 'DataForSEO',
          timestamp: new Date()
        });
      }
    } catch (dataForSeoError) {
      console.error("DataForSEO keyword suggestions failed:", dataForSeoError);
    }
    
    // Fallback to Google Ads API if available
    if (isGoogleAdsApiReady()) {
      try {
        const googleAdsSuggestions = await getGoogleAdsKeywordSuggestions(keyword);
        
        return res.json({
          keyword,
          suggestions: googleAdsSuggestions,
          source: 'Google Ads API',
          timestamp: new Date()
        });
      } catch (googleAdsError) {
        console.error("Google Ads keyword suggestions failed:", googleAdsError);
      }
    }
    
    // Return mock suggestions as final fallback
    const mockSuggestions = [
      `${keyword} services`,
      `best ${keyword}`,
      `${keyword} near me`,
      `${keyword} reviews`,
      `${keyword} cost`,
      `affordable ${keyword}`,
      `professional ${keyword}`,
      `${keyword} company`
    ].map(suggestion => ({
      keyword: suggestion,
      search_volume: Math.floor(Math.random() * 5000) + 50,
      competition: Math.random(),
      cpc: Math.random() * 3 + 0.1
    }));
    
    res.json({
      keyword,
      suggestions: mockSuggestions,
      source: 'Mock Data',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error("Error generating keyword suggestions:", error);
    res.status(500).json({ error: "Failed to generate keyword suggestions" });
  }
});

// API endpoint for authenticated keyword suggestions
router.post("/keywords/suggest", authenticate, async (req: Request, res: Response) => {
  try {
    const { keyword, location = "US" } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }
    
    console.log(`Authenticated keyword suggestions for: ${keyword}, Location: ${location}`);
    
    // Use the same logic as the public endpoint but with user context
    try {
      const suggestions = await keywordService.getKeywordSuggestions(keyword, location);
      
      if (suggestions && suggestions.length > 0) {
        return res.json({
          keyword,
          location,
          suggestions,
          source: 'DataForSEO',
          timestamp: new Date(),
          userId: req.user?.id
        });
      }
    } catch (error) {
      console.error("Error getting authenticated keyword suggestions:", error);
    }
    
    // Fallback to mock data
    const mockSuggestions = [
      `${keyword} services`,
      `best ${keyword}`,
      `${keyword} near me`,
      `${keyword} reviews`,
      `${keyword} cost`
    ].map(suggestion => ({
      keyword: suggestion,
      search_volume: Math.floor(Math.random() * 5000) + 50,
      competition: Math.random(),
      cpc: Math.random() * 3 + 0.1
    }));
    
    res.json({
      keyword,
      location,
      suggestions: mockSuggestions,
      source: 'Mock Data',
      timestamp: new Date(),
      userId: req.user?.id
    });
    
  } catch (error) {
    console.error("Error in authenticated keyword suggestions:", error);
    res.status(500).json({ error: "Failed to generate keyword suggestions" });
  }
});

export { router as keywordResearchRoutes };