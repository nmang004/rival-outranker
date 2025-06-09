import express from "express";
import { learningPathService } from "../services/common/learning-path.service";
import { authenticate } from "../middleware/auth";
import { z } from "zod";
import { insertUserLearningProgressSchema } from "../../shared/schema";

const router = express.Router();

// Public routes - available to all users
router.get("/modules", async (req, res) => {
  try {
    const modules = await learningPathService.getAllModules();
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules:", error);
    res.status(500).json({ message: "Failed to fetch learning modules" });
  }
});

router.get("/modules/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }
    const module = await learningPathService.getModuleById(id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    res.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ message: "Failed to fetch module" });
  }
});

router.get("/modules/:id/lessons", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }
    const lessons = await learningPathService.getLessonsByModuleId(id);
    res.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
});

router.get("/lessons/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid lesson ID" });
    }
    const lesson = await learningPathService.getLessonById(id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ message: "Failed to fetch lesson" });
  }
});

router.get("/lessons/:id/quizzes", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid lesson ID" });
    }
    const quizzes = await learningPathService.getQuizzesByLessonId(id);
    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
});

router.get("/paths", async (req, res) => {
  try {
    const paths = await learningPathService.getAllLearningPaths();
    res.json(paths);
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    res.status(500).json({ message: "Failed to fetch learning paths" });
  }
});

router.get("/paths/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid path ID" });
    }
    const path = await learningPathService.getLearningPathById(id);
    if (!path) {
      return res.status(404).json({ message: "Learning path not found" });
    }
    res.json(path);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ message: "Failed to fetch learning path" });
  }
});

router.get("/paths/:id/modules", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid path ID" });
    }
    const modules = await learningPathService.getModulesByLearningPathId(id);
    res.json(modules);
  } catch (error) {
    console.error("Error fetching modules for learning path:", error);
    res.status(500).json({ message: "Failed to fetch modules for learning path" });
  }
});

// Protected routes - require authentication
router.get("/progress", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const progress = await learningPathService.getUserProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching user learning progress:", error);
    res.status(500).json({ message: "Failed to fetch user learning progress" });
  }
});

router.get("/progress/summary", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const summary = await learningPathService.getUserProgressSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching user learning progress summary:", error);
    res.status(500).json({ message: "Failed to fetch user learning progress summary" });
  }
});

router.get("/progress/modules/:id", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const moduleId = parseInt(req.params.id);
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }
    const progress = await learningPathService.getUserModuleProgress(userId, moduleId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching user module progress:", error);
    res.status(500).json({ message: "Failed to fetch user module progress" });
  }
});

router.get("/progress/lessons/:id", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const lessonId = parseInt(req.params.id);
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson ID" });
    }
    const progress = await learningPathService.getUserLessonProgress(userId, lessonId);
    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }
    res.json(progress);
  } catch (error) {
    console.error("Error fetching user lesson progress:", error);
    res.status(500).json({ message: "Failed to fetch user lesson progress" });
  }
});

router.post("/progress", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    // Validate request data
    const schema = insertUserLearningProgressSchema.extend({
      moduleId: z.number(),
      lessonId: z.number(),
      status: z.enum(["not_started", "in_progress", "completed"]),
      completionPercentage: z.number().min(0).max(100),
    });
    
    const validatedData = schema.parse({
      ...req.body,
      userId
    });
    
    const progress = await learningPathService.createOrUpdateUserProgress(validatedData);
    res.status(201).json(progress);
  } catch (error) {
    console.error("Error updating user progress:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update user progress" });
  }
});

router.get("/recommendations", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const recommendations = await learningPathService.getUserRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching user recommendations:", error);
    res.status(500).json({ message: "Failed to fetch user recommendations" });
  }
});

router.post("/recommendations/:id/complete", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid recommendation ID" });
    }
    const recommendation = await learningPathService.markRecommendationCompleted(id);
    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (error) {
    console.error("Error marking recommendation as completed:", error);
    res.status(500).json({ message: "Failed to mark recommendation as completed" });
  }
});

router.post("/recommendations/:id/dismiss", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid recommendation ID" });
    }
    const recommendation = await learningPathService.dismissRecommendation(id);
    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (error) {
    console.error("Error dismissing recommendation:", error);
    res.status(500).json({ message: "Failed to dismiss recommendation" });
  }
});

// Admin-only routes
router.post("/modules", authenticate, async (req: any, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    const data = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const module = await learningPathService.createModule(data);
    res.status(201).json(module);
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ message: "Failed to create module" });
  }
});

router.put("/modules/:id", authenticate, async (req: any, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }
    
    const module = await learningPathService.updateModule(id, req.body);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    res.json(module);
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ message: "Failed to update module" });
  }
});

export default router;