import express from "express";
import { 
  mockModules, 
  mockLessons, 
  mockLearningPaths, 
  mockUserProgress, 
  mockRecommendations,
  generateProgressSummary
} from "../data/mockLearningData";

const router = express.Router();

// Get all learning modules
router.get("/modules", (req, res) => {
  res.json(mockModules);
});

// Get single module by ID
router.get("/modules/:id", (req, res) => {
  const moduleId = parseInt(req.params.id);
  const module = mockModules.find(m => m.id === moduleId);
  
  if (!module) {
    return res.status(404).json({ message: "Module not found" });
  }
  
  res.json(module);
});

// Get all lessons for a module
router.get("/modules/:id/lessons", (req, res) => {
  const moduleId = parseInt(req.params.id);
  const lessons = mockLessons
    .filter(l => l.moduleId === moduleId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  
  res.json(lessons);
});

// Get a specific lesson
router.get("/lessons/:id", (req, res) => {
  const lessonId = parseInt(req.params.id);
  const lesson = mockLessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    return res.status(404).json({ message: "Lesson not found" });
  }
  
  res.json(lesson);
});

// Get quizzes for a lesson
router.get("/lessons/:id/quizzes", (req, res) => {
  // We don't have quizzes in the mock data, so we'll return an empty array
  res.json([]);
});

// Get all learning paths
router.get("/paths", (req, res) => {
  res.json(mockLearningPaths);
});

// Get a specific learning path
router.get("/paths/:id", (req, res) => {
  const pathId = parseInt(req.params.id);
  const path = mockLearningPaths.find(p => p.id === pathId);
  
  if (!path) {
    return res.status(404).json({ message: "Learning path not found" });
  }
  
  res.json(path);
});

// Get modules for a learning path
router.get("/paths/:id/modules", (req, res) => {
  const pathId = parseInt(req.params.id);
  const path = mockLearningPaths.find(p => p.id === pathId);
  
  if (!path) {
    return res.status(404).json({ message: "Learning path not found" });
  }
  
  const modules = mockModules.filter(m => path.moduleIds.includes(m.id));
  res.json(modules);
});

// User progress endpoints
// (In a real app, these would check authentication)

// Get overall progress summary
router.get("/progress/summary", (req, res) => {
  // For now, we'll always return the progress for the mock user
  // In a real app, this would use req.user.id from the authentication
  const summary = generateProgressSummary("user-123");
  res.json(summary);
});

// Get progress for a specific module
router.get("/progress/modules/:id", (req, res) => {
  const moduleId = parseInt(req.params.id);
  const progress = mockUserProgress.filter(p => p.moduleId === moduleId);
  res.json(progress);
});

// Update user progress
router.post("/progress", (req, res) => {
  const { moduleId, lessonId, status, completionPercentage } = req.body;
  
  // In a real app, this would validate the input and update the database
  // For now, we'll just return a success response
  res.json({ 
    message: "Progress updated successfully", 
    progress: {
      id: Math.floor(Math.random() * 10000),
      userId: "user-123",
      moduleId,
      lessonId,
      status,
      completionPercentage,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    }
  });
});

// Get personal recommendations
router.get("/recommendations", (req, res) => {
  // For now, we'll always return the recommendations for the mock user
  // In a real app, this would use req.user.id from the authentication
  res.json(mockRecommendations);
});

module.exports = router;