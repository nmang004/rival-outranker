import express, { Request, Response } from "express";
import { backlinkService } from "../services/backlinkService";
import { authenticate } from "../middleware/auth";
import { insertBacklinkProfileSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const router = express.Router();

// Create a new backlink profile to track
router.post("/profiles", authenticate, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertBacklinkProfileSchema.parse(req.body);
    
    // Create the profile
    const profile = await backlinkService.createProfile({
      ...validatedData,
      userId: req.user?.userId as string
    });
    
    res.status(201).json(profile);
  } catch (error) {
    console.error("Error creating backlink profile:", error);
    
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    res.status(500).json({ error: "Failed to create backlink profile" });
  }
});

// Get all backlink profiles for the current user
router.get("/profiles", authenticate, async (req: Request, res: Response) => {
  try {
    const profiles = await backlinkService.getProfilesByUser(req.user?.userId as string);
    res.json(profiles);
  } catch (error) {
    console.error("Error fetching backlink profiles:", error);
    res.status(500).json({ error: "Failed to fetch backlink profiles" });
  }
});

// Get a specific backlink profile
router.get("/profiles/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const profileId = parseInt(req.params.id);
    
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }
    
    const profile = await backlinkService.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: "Backlink profile not found" });
    }
    
    // Verify that profile belongs to the authenticated user
    if (profile.userId !== req.user?.userId) {
      return res.status(403).json({ error: "You don't have permission to access this profile" });
    }
    
    res.json(profile);
  } catch (error) {
    console.error("Error fetching backlink profile:", error);
    res.status(500).json({ error: "Failed to fetch backlink profile" });
  }
});

// Get backlinks for a specific profile
router.get("/profiles/:id/backlinks", authenticate, async (req: Request, res: Response) => {
  try {
    const profileId = parseInt(req.params.id);
    
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }
    
    // Get the profile to check ownership
    const profile = await backlinkService.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: "Backlink profile not found" });
    }
    
    // Verify that profile belongs to the authenticated user
    if (profile.userId !== req.user?.userId) {
      return res.status(403).json({ error: "You don't have permission to access this profile" });
    }
    
    // Parse query parameters
    const status = req.query.status as string | undefined;
    const dofollow = req.query.dofollow === 'true' ? true : 
                     req.query.dofollow === 'false' ? false : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const backlinks = await backlinkService.getBacklinks(profileId, {
      status,
      dofollow,
      limit,
      offset
    });
    
    res.json(backlinks);
  } catch (error) {
    console.error("Error fetching backlinks:", error);
    res.status(500).json({ error: "Failed to fetch backlinks" });
  }
});

// Get outgoing links for a specific profile
router.get("/profiles/:id/outgoing", authenticate, async (req: Request, res: Response) => {
  try {
    const profileId = parseInt(req.params.id);
    
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }
    
    // Get the profile to check ownership
    const profile = await backlinkService.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: "Backlink profile not found" });
    }
    
    // Verify that profile belongs to the authenticated user
    if (profile.userId !== req.user?.userId) {
      return res.status(403).json({ error: "You don't have permission to access this profile" });
    }
    
    // Parse query parameters
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const links = await backlinkService.getOutgoingLinks(profileId, {
      status,
      limit,
      offset
    });
    
    res.json(links);
  } catch (error) {
    console.error("Error fetching outgoing links:", error);
    res.status(500).json({ error: "Failed to fetch outgoing links" });
  }
});

// Get backlink history for a specific profile
router.get("/profiles/:id/history", authenticate, async (req: Request, res: Response) => {
  try {
    const profileId = parseInt(req.params.id);
    
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }
    
    // Get the profile to check ownership
    const profile = await backlinkService.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: "Backlink profile not found" });
    }
    
    // Verify that profile belongs to the authenticated user
    if (profile.userId !== req.user?.userId) {
      return res.status(403).json({ error: "You don't have permission to access this profile" });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const history = await backlinkService.getBacklinkHistory(profileId, limit);
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching backlink history:", error);
    res.status(500).json({ error: "Failed to fetch backlink history" });
  }
});

// Discover backlinks for a domain
router.post("/discover", authenticate, async (req: Request, res: Response) => {
  try {
    const { domain, apiKey } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }
    
    const result = await backlinkService.discoverBacklinks(domain, apiKey);
    res.json(result);
  } catch (error) {
    console.error("Error discovering backlinks:", error);
    res.status(500).json({ error: "Failed to discover backlinks" });
  }
});

// Scan a URL for outgoing links
router.post("/scan-outgoing", authenticate, async (req: Request, res: Response) => {
  try {
    const { url, profileId } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    if (!profileId) {
      return res.status(400).json({ error: "Profile ID is required" });
    }
    
    // Get the profile to check ownership
    const profile = await backlinkService.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: "Backlink profile not found" });
    }
    
    // Verify that profile belongs to the authenticated user
    if (profile.userId !== req.user?.userId) {
      return res.status(403).json({ error: "You don't have permission to access this profile" });
    }
    
    const result = await backlinkService.scanOutgoingLinks(url, profileId);
    res.json(result);
  } catch (error) {
    console.error("Error scanning outgoing links:", error);
    res.status(500).json({ error: "Failed to scan outgoing links" });
  }
});

// Update profile statistics
router.post("/profiles/:id/update-stats", authenticate, async (req: Request, res: Response) => {
  try {
    const profileId = parseInt(req.params.id);
    
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }
    
    // Get the profile to check ownership
    const profile = await backlinkService.getProfile(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: "Backlink profile not found" });
    }
    
    // Verify that profile belongs to the authenticated user
    if (profile.userId !== req.user?.userId) {
      return res.status(403).json({ error: "You don't have permission to access this profile" });
    }
    
    const result = await backlinkService.updateProfileStats(profileId);
    res.json(result);
  } catch (error) {
    console.error("Error updating profile stats:", error);
    res.status(500).json({ error: "Failed to update profile statistics" });
  }
});

export const backlinkRouter = router;