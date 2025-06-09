import { db } from "../../db";
import { 
  learningModules, 
  learningLessons, 
  lessonQuizzes, 
  userLearningProgress,
  learningPaths,
  learningPathModules,
  userLearningRecommendations,
  type LearningModule,
  type InsertLearningModule,
  type LearningLesson,
  type InsertLearningLesson,
  type LessonQuiz,
  type InsertLessonQuiz,
  type UserLearningProgress,
  type InsertUserLearningProgress,
  type LearningPath,
  type InsertLearningPath,
  type LearningPathModule,
  type InsertLearningPathModule,
  type UserLearningRecommendation,
  type InsertUserLearningRecommendation,
  type Analysis
} from "@shared/schema";
import { eq, and, asc, desc, lt, gt, isNull, not, inArray } from "drizzle-orm";

export class LearningPathService {
  // Module operations
  async getAllModules(): Promise<LearningModule[]> {
    return await db.select().from(learningModules).where(eq(learningModules.isActive, true)).orderBy(asc(learningModules.sortOrder));
  }

  async getModuleById(id: number): Promise<LearningModule | undefined> {
    const [module] = await db.select().from(learningModules).where(eq(learningModules.id, id));
    return module;
  }

  async createModule(data: InsertLearningModule): Promise<LearningModule> {
    const [module] = await db.insert(learningModules).values(data).returning();
    return module;
  }

  async updateModule(id: number, data: Partial<InsertLearningModule>): Promise<LearningModule | undefined> {
    const [module] = await db
      .update(learningModules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(learningModules.id, id))
      .returning();
    return module;
  }

  // Lesson operations
  async getLessonsByModuleId(moduleId: number): Promise<LearningLesson[]> {
    return await db
      .select()
      .from(learningLessons)
      .where(and(
        eq(learningLessons.moduleId, moduleId),
        eq(learningLessons.isActive, true)
      ))
      .orderBy(asc(learningLessons.sortOrder));
  }

  async getLessonById(id: number): Promise<LearningLesson | undefined> {
    const [lesson] = await db.select().from(learningLessons).where(eq(learningLessons.id, id));
    return lesson;
  }

  async createLesson(data: InsertLearningLesson): Promise<LearningLesson> {
    const [lesson] = await db.insert(learningLessons).values(data).returning();
    return lesson;
  }

  async updateLesson(id: number, data: Partial<InsertLearningLesson>): Promise<LearningLesson | undefined> {
    const [lesson] = await db
      .update(learningLessons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(learningLessons.id, id))
      .returning();
    return lesson;
  }

  // Quiz operations
  async getQuizzesByLessonId(lessonId: number): Promise<LessonQuiz[]> {
    return await db
      .select()
      .from(lessonQuizzes)
      .where(eq(lessonQuizzes.lessonId, lessonId))
      .orderBy(asc(lessonQuizzes.sortOrder));
  }

  async createQuiz(data: InsertLessonQuiz): Promise<LessonQuiz> {
    const [quiz] = await db.insert(lessonQuizzes).values(data).returning();
    return quiz;
  }

  // User Progress operations
  async getUserProgress(userId: string): Promise<UserLearningProgress[]> {
    return await db
      .select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, userId))
      .orderBy(desc(userLearningProgress.lastAccessedAt));
  }

  async getUserModuleProgress(userId: string, moduleId: number): Promise<UserLearningProgress[]> {
    return await db
      .select()
      .from(userLearningProgress)
      .where(and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.moduleId, moduleId)
      ))
      .orderBy(asc(userLearningProgress.lessonId));
  }

  async getUserLessonProgress(userId: string, lessonId: number): Promise<UserLearningProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userLearningProgress)
      .where(and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.lessonId, lessonId)
      ));
    return progress;
  }

  async createOrUpdateUserProgress(data: InsertUserLearningProgress): Promise<UserLearningProgress> {
    // Check if progress record exists
    const existingProgress = await this.getUserLessonProgress(data.userId, data.lessonId);
    
    if (existingProgress) {
      // Update existing progress
      const [progress] = await db
        .update(userLearningProgress)
        .set({ 
          ...data, 
          lastAccessedAt: new Date(),
          completedAt: data.status === 'completed' ? new Date() : existingProgress.completedAt
        })
        .where(eq(userLearningProgress.id, existingProgress.id))
        .returning();
      return progress;
    } else {
      // Create new progress
      const [progress] = await db
        .insert(userLearningProgress)
        .values({
          ...data,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
          completedAt: data.status === 'completed' ? new Date() : null
        })
        .returning();
      return progress;
    }
  }

  // Learning Paths operations
  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.isActive, true))
      .orderBy(asc(learningPaths.name));
  }

  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return path;
  }

  async getModulesByLearningPathId(pathId: number): Promise<LearningModule[]> {
    // Join learning_path_modules with learning_modules to get all modules in a path
    const result = await db
      .select({
        module: learningModules
      })
      .from(learningPathModules)
      .innerJoin(
        learningModules,
        eq(learningPathModules.moduleId, learningModules.id)
      )
      .where(and(
        eq(learningPathModules.pathId, pathId),
        eq(learningModules.isActive, true)
      ))
      .orderBy(asc(learningPathModules.sortOrder));
    
    return result.map((r: any) => r.module);
  }

  // User Recommendations operations
  async getUserRecommendations(userId: string): Promise<UserLearningRecommendation[]> {
    return await db
      .select()
      .from(userLearningRecommendations)
      .where(and(
        eq(userLearningRecommendations.userId, userId),
        eq(userLearningRecommendations.isCompleted, false),
        eq(userLearningRecommendations.isDismmised, false)
      ))
      .orderBy(desc(userLearningRecommendations.priority));
  }

  async createRecommendation(data: InsertUserLearningRecommendation): Promise<UserLearningRecommendation> {
    const [recommendation] = await db
      .insert(userLearningRecommendations)
      .values(data)
      .returning();
    return recommendation;
  }

  async markRecommendationCompleted(id: number): Promise<UserLearningRecommendation | undefined> {
    const [recommendation] = await db
      .update(userLearningRecommendations)
      .set({ 
        isCompleted: true,
        clickedAt: new Date()
      })
      .where(eq(userLearningRecommendations.id, id))
      .returning();
    return recommendation;
  }

  async dismissRecommendation(id: number): Promise<UserLearningRecommendation | undefined> {
    const [recommendation] = await db
      .update(userLearningRecommendations)
      .set({ isDismmised: true })
      .where(eq(userLearningRecommendations.id, id))
      .returning();
    return recommendation;
  }

  // Helper method to generate personalized recommendations based on analysis results
  async generateRecommendationsFromAnalysis(userId: string, analysis: Analysis): Promise<UserLearningRecommendation[]> {
    const recommendations: UserLearningRecommendation[] = [];
    const results = analysis.results;
    
    // Based on low scores in different areas, recommend relevant modules
    // This is a simplified example - in a real implementation, you would have more complex logic
    // to match analysis results with appropriate learning modules
    
    // Get all active modules to match against
    const allModules = await this.getAllModules();
    
    // Create a map of module titles to their IDs for easier lookup
    const moduleMap = new Map<string, number>();
    allModules.forEach(module => {
      moduleMap.set(module.title.toLowerCase(), module.id);
    });
    
    // Example: Check if keyword analysis score is low
    const keywordAnalysisScore = (results as any).keywordAnalysis?.overallScore.score || 0;
    if (keywordAnalysisScore < 70 && moduleMap.has('keyword research fundamentals')) {
      const moduleId = moduleMap.get('keyword research fundamentals')!;
      recommendations.push({
        id: 0, // Will be set by database
        userId,
        moduleId,
        reasonCode: 'based_on_analysis',
        reasonText: 'Your keyword optimization score is low. Learning keyword research can help improve your ranking.',
        priority: 10 - Math.floor(keywordAnalysisScore / 10), // Higher priority for lower scores
        analysisId: analysis.id,
        isCompleted: false,
        isDismmised: false,
        createdAt: new Date(),
        clickedAt: null
      });
    }
    
    // Example: Check if meta tags analysis score is low
    const metaTagsScore = (results as any).metaTagsAnalysis?.overallScore.score || 0;
    if (metaTagsScore < 70 && moduleMap.has('meta tag optimization')) {
      const moduleId = moduleMap.get('meta tag optimization')!;
      recommendations.push({
        id: 0,
        userId,
        moduleId,
        reasonCode: 'based_on_analysis',
        reasonText: 'Your meta tags need improvement. Learning about meta tag optimization can help increase your click-through rate.',
        priority: 10 - Math.floor(metaTagsScore / 10),
        analysisId: analysis.id,
        isCompleted: false,
        isDismmised: false,
        createdAt: new Date(),
        clickedAt: null
      });
    }
    
    // Example: Check if content analysis score is low
    const contentScore = (results as any).contentAnalysis?.overallScore.score || 0;
    if (contentScore < 70 && moduleMap.has('content writing for seo')) {
      const moduleId = moduleMap.get('content writing for seo')!;
      recommendations.push({
        id: 0,
        userId,
        moduleId,
        reasonCode: 'based_on_analysis',
        reasonText: 'Your content score could be improved. Learning about content writing for SEO can help engage users and rank better.',
        priority: 10 - Math.floor(contentScore / 10),
        analysisId: analysis.id,
        isCompleted: false,
        isDismmised: false,
        createdAt: new Date(),
        clickedAt: null
      });
    }
    
    // Add more recommendation logic based on other analysis factors
    
    return recommendations;
  }

  // Get user's overall learning progress summary
  async getUserProgressSummary(userId: string) {
    // Get all modules
    const allModules = await this.getAllModules();
    
    // Get user's progress for all modules
    const userProgress = await this.getUserProgress(userId);
    
    // Map to track completion status by module
    const moduleCompletionMap = new Map<number, {
      totalLessons: number;
      completedLessons: number;
      inProgressLessons: number;
      percentComplete: number;
    }>();
    
    // Initialize map with all modules (0% complete)
    allModules.forEach(module => {
      moduleCompletionMap.set(module.id, {
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        percentComplete: 0
      });
    });
    
    // Get count of lessons for each module
    for (const module of allModules) {
      const lessons = await this.getLessonsByModuleId(module.id);
      if (moduleCompletionMap.has(module.id)) {
        moduleCompletionMap.get(module.id)!.totalLessons = lessons.length;
      }
    }
    
    // Update progress based on user's progress records
    userProgress.forEach(progress => {
      const moduleProgress = moduleCompletionMap.get(progress.moduleId);
      if (moduleProgress) {
        if (progress.status === 'completed') {
          moduleProgress.completedLessons++;
        } else if (progress.status === 'in_progress') {
          moduleProgress.inProgressLessons++;
        }
        
        // Calculate percentage complete
        if (moduleProgress.totalLessons > 0) {
          moduleProgress.percentComplete = Math.round(
            (moduleProgress.completedLessons / moduleProgress.totalLessons) * 100
          );
        }
      }
    });
    
    // Convert map to array of objects for the response
    const progressSummary = allModules.map(module => {
      const progress = moduleCompletionMap.get(module.id) || {
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        percentComplete: 0
      };
      
      return {
        moduleId: module.id,
        moduleTitle: module.title,
        moduleDifficulty: module.difficulty,
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons,
        inProgressLessons: progress.inProgressLessons,
        notStartedLessons: progress.totalLessons - progress.completedLessons - progress.inProgressLessons,
        percentComplete: progress.percentComplete,
        status: progress.percentComplete === 100 
          ? 'completed' 
          : progress.percentComplete > 0 
            ? 'in_progress' 
            : 'not_started'
      };
    });
    
    // Calculate overall progress
    const totalLessons = progressSummary.reduce((sum, module) => sum + module.totalLessons, 0);
    const completedLessons = progressSummary.reduce((sum, module) => sum + module.completedLessons, 0);
    const overallPercentComplete = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
    
    return {
      userId,
      overallProgress: {
        totalModules: allModules.length,
        completedModules: progressSummary.filter(m => m.status === 'completed').length,
        inProgressModules: progressSummary.filter(m => m.status === 'in_progress').length,
        notStartedModules: progressSummary.filter(m => m.status === 'not_started').length,
        totalLessons,
        completedLessons,
        percentComplete: overallPercentComplete
      },
      moduleProgress: progressSummary
    };
  }
}

export const learningPathService = new LearningPathService();