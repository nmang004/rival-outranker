import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertKeywordSchema, insertKeywordSuggestionSchema } from '@shared/schema';
import { isAuthenticated } from '../replitAuth';

export const keywordRouter = Router();

// Middleware to ensure all routes require authentication
keywordRouter.use(isAuthenticated);

// Get all keywords for a user
keywordRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const keywords = await storage.getKeywordsByUserId(userId);
    res.json(keywords);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({ message: 'Failed to fetch keywords', error: String(error) });
  }
});

// Get keywords by project
keywordRouter.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const keywords = await storage.getKeywordsByProjectId(projectId);
    res.json(keywords);
  } catch (error) {
    console.error('Error fetching project keywords:', error);
    res.status(500).json({ message: 'Failed to fetch project keywords', error: String(error) });
  }
});

// Add a new keyword to track
keywordRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const parsedData = insertKeywordSchema.parse({
      ...req.body,
      userId
    });

    const keyword = await storage.createKeyword(parsedData);
    res.status(201).json(keyword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid keyword data', errors: error.errors });
    }
    console.error('Error creating keyword:', error);
    res.status(500).json({ message: 'Failed to create keyword', error: String(error) });
  }
});

// Get a specific keyword by ID
keywordRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    if (isNaN(keywordId)) {
      return res.status(400).json({ message: 'Invalid keyword ID' });
    }

    const keyword = await storage.getKeyword(keywordId);
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }

    const userId = req.user.claims.sub;
    if (keyword.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this keyword' });
    }

    res.json(keyword);
  } catch (error) {
    console.error('Error fetching keyword:', error);
    res.status(500).json({ message: 'Failed to fetch keyword', error: String(error) });
  }
});

// Update a keyword
keywordRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    if (isNaN(keywordId)) {
      return res.status(400).json({ message: 'Invalid keyword ID' });
    }

    const keyword = await storage.getKeyword(keywordId);
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }

    const userId = req.user.claims.sub;
    if (keyword.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this keyword' });
    }

    const updatedKeyword = await storage.updateKeyword(keywordId, req.body);
    res.json(updatedKeyword);
  } catch (error) {
    console.error('Error updating keyword:', error);
    res.status(500).json({ message: 'Failed to update keyword', error: String(error) });
  }
});

// Delete a keyword
keywordRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    if (isNaN(keywordId)) {
      return res.status(400).json({ message: 'Invalid keyword ID' });
    }

    const keyword = await storage.getKeyword(keywordId);
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }

    const userId = req.user.claims.sub;
    if (keyword.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this keyword' });
    }

    await storage.deleteKeyword(keywordId);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting keyword:', error);
    res.status(500).json({ message: 'Failed to delete keyword', error: String(error) });
  }
});

// Get keyword metrics
keywordRouter.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    if (isNaN(keywordId)) {
      return res.status(400).json({ message: 'Invalid keyword ID' });
    }

    const keyword = await storage.getKeyword(keywordId);
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }

    const userId = req.user.claims.sub;
    if (keyword.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this keyword' });
    }

    const metrics = await storage.getKeywordMetrics(keywordId);
    if (!metrics) {
      return res.status(404).json({ message: 'No metrics found for this keyword' });
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching keyword metrics:', error);
    res.status(500).json({ message: 'Failed to fetch keyword metrics', error: String(error) });
  }
});

// Get keyword rankings history
keywordRouter.get('/:id/rankings', async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    if (isNaN(keywordId)) {
      return res.status(400).json({ message: 'Invalid keyword ID' });
    }

    const keyword = await storage.getKeyword(keywordId);
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }

    const userId = req.user.claims.sub;
    if (keyword.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this keyword' });
    }

    // Parse optional query parameters
    let startDate = undefined;
    let endDate = undefined;
    let limit = undefined;

    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
      if (isNaN(limit)) {
        return res.status(400).json({ message: 'Invalid limit parameter' });
      }
    }

    // Get ranking history based on params
    let rankings;
    if (startDate || endDate) {
      rankings = await storage.getRankingHistory(keywordId, startDate, endDate);
    } else if (limit) {
      rankings = await storage.getKeywordRankings(keywordId, limit);
    } else {
      rankings = await storage.getKeywordRankings(keywordId);
    }

    res.json(rankings);
  } catch (error) {
    console.error('Error fetching keyword rankings:', error);
    res.status(500).json({ message: 'Failed to fetch keyword rankings', error: String(error) });
  }
});

// Get competitor rankings for a keyword
keywordRouter.get('/:id/competitors', async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.id);
    if (isNaN(keywordId)) {
      return res.status(400).json({ message: 'Invalid keyword ID' });
    }

    const keyword = await storage.getKeyword(keywordId);
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }

    const userId = req.user.claims.sub;
    if (keyword.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this keyword' });
    }

    const competitorRankings = await storage.getCompetitorRankingsByKeyword(keywordId);
    res.json(competitorRankings);
  } catch (error) {
    console.error('Error fetching competitor rankings:', error);
    res.status(500).json({ message: 'Failed to fetch competitor rankings', error: String(error) });
  }
});

// Get keyword suggestions
keywordRouter.get('/suggestions/:baseKeyword', async (req: Request, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const baseKeyword = req.params.baseKeyword;
    const suggestions = await storage.getKeywordSuggestions(userId, baseKeyword);
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching keyword suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch keyword suggestions', error: String(error) });
  }
});

// Create keyword suggestions
keywordRouter.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const parsedData = insertKeywordSuggestionSchema.parse({
      ...req.body,
      userId
    });

    const suggestion = await storage.createKeywordSuggestion(parsedData);
    res.status(201).json(suggestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid suggestion data', errors: error.errors });
    }
    console.error('Error creating keyword suggestion:', error);
    res.status(500).json({ message: 'Failed to create keyword suggestion', error: String(error) });
  }
});

// Save a keyword suggestion
keywordRouter.put('/suggestions/:id/save', async (req: Request, res: Response) => {
  try {
    const suggestionId = parseInt(req.params.id);
    if (isNaN(suggestionId)) {
      return res.status(400).json({ message: 'Invalid suggestion ID' });
    }

    const suggestion = await storage.saveKeywordSuggestion(suggestionId);
    res.json(suggestion);
  } catch (error) {
    console.error('Error saving keyword suggestion:', error);
    res.status(500).json({ message: 'Failed to save keyword suggestion', error: String(error) });
  }
});