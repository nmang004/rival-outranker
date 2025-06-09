import { eq, desc, and, gte } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { 
  learningModules,
  learningLessons,
  lessonQuizzes,
  userLearningProgress,
  learningPaths,
  learningPathModules,
  userLearningRecommendations,
  LearningModule,
  InsertLearningModule,
  LearningLesson,
  InsertLearningLesson,
  LessonQuiz,
  InsertLessonQuiz,
  UserLearningProgress,
  InsertUserLearningProgress,
  LearningPath,
  InsertLearningPath,
  LearningPathModule,
  InsertLearningPathModule,
  UserLearningRecommendation,
  InsertUserLearningRecommendation
} from '../../shared/schema';
import { db as getDb } from '../db';
const db = getDb();

/**
 * Repository for learning module operations
 */
export class LearningModuleRepository extends BaseRepository<LearningModule, InsertLearningModule> {
  constructor() {
    super(learningModules);
  }

  /**
   * Find active modules
   */
  async findActiveModules(): Promise<LearningModule[]> {
    return this.findMany({
      where: eq(learningModules.isActive, true),
      orderBy: [desc(learningModules.sortOrder)]
    });
  }

  /**
   * Find modules by difficulty
   */
  async findByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<LearningModule[]> {
    return this.findMany({
      where: and(
        eq(learningModules.difficulty, difficulty),
        eq(learningModules.isActive, true)
      ),
      orderBy: [desc(learningModules.sortOrder)]
    });
  }

  /**
   * Find modules with prerequisites
   */
  async findModulesWithPrerequisites(): Promise<LearningModule[]> {
    // Note: This would need a more complex query to check if prerequisiteIds array is not empty
    return this.findMany({
      where: eq(learningModules.isActive, true),
      orderBy: [desc(learningModules.sortOrder)]
    });
  }

  /**
   * Update module sort order
   */
  async updateSortOrder(moduleId: number, sortOrder: number): Promise<LearningModule | null> {
    return this.updateById(moduleId, {
      sortOrder
    });
  }

  /**
   * Deactivate module
   */
  async deactivateModule(moduleId: number): Promise<LearningModule | null> {
    return this.updateById(moduleId, {
      isActive: false
    });
  }
}

/**
 * Repository for learning lesson operations
 */
export class LearningLessonRepository extends BaseRepository<LearningLesson, InsertLearningLesson> {
  constructor() {
    super(learningLessons);
  }

  /**
   * Find lessons by module ID
   */
  async findByModuleId(moduleId: number): Promise<LearningLesson[]> {
    return this.findMany({
      where: and(
        eq(learningLessons.moduleId, moduleId),
        eq(learningLessons.isActive, true)
      ),
      orderBy: [desc(learningLessons.sortOrder)]
    });
  }

  /**
   * Find active lessons
   */
  async findActiveLessons(): Promise<LearningLesson[]> {
    return this.findMany({
      where: eq(learningLessons.isActive, true),
      orderBy: [desc(learningLessons.sortOrder)]
    });
  }

  /**
   * Update lesson sort order
   */
  async updateSortOrder(lessonId: number, sortOrder: number): Promise<LearningLesson | null> {
    return this.updateById(lessonId, {
      sortOrder
    });
  }

  /**
   * Get next lesson in module
   */
  async getNextLesson(moduleId: number, currentSortOrder: number): Promise<LearningLesson | null> {
    const lessons = await this.findMany({
      where: and(
        eq(learningLessons.moduleId, moduleId),
        eq(learningLessons.isActive, true),
        gte(learningLessons.sortOrder, currentSortOrder + 1)
      ),
      orderBy: [desc(learningLessons.sortOrder)],
      limit: 1
    });
    return lessons[0] || null;
  }

  /**
   * Get previous lesson in module
   */
  async getPreviousLesson(moduleId: number, currentSortOrder: number): Promise<LearningLesson | null> {
    // This would need a different query operator for "less than"
    const lessons = await this.findByModuleId(moduleId);
    const filteredLessons = lessons.filter(lesson => lesson.sortOrder < currentSortOrder);
    return filteredLessons.sort((a, b) => b.sortOrder - a.sortOrder)[0] || null;
  }
}

/**
 * Repository for lesson quiz operations
 */
export class LessonQuizRepository extends BaseRepository<LessonQuiz, InsertLessonQuiz> {
  constructor() {
    super(lessonQuizzes);
  }

  /**
   * Find quizzes by lesson ID
   */
  async findByLessonId(lessonId: number): Promise<LessonQuiz[]> {
    return this.findMany({
      where: eq(lessonQuizzes.lessonId, lessonId),
      orderBy: [desc(lessonQuizzes.sortOrder)]
    });
  }

  /**
   * Update quiz sort order
   */
  async updateSortOrder(quizId: number, sortOrder: number): Promise<LessonQuiz | null> {
    return this.updateById(quizId, {
      sortOrder
    });
  }
}

/**
 * Repository for user learning progress operations
 */
export class UserLearningProgressRepository extends BaseRepository<UserLearningProgress, InsertUserLearningProgress> {
  constructor() {
    super(userLearningProgress);
  }

  /**
   * Find progress by user ID
   */
  async findByUserId(userId: string): Promise<UserLearningProgress[]> {
    return this.findMany({
      where: eq(userLearningProgress.userId, userId),
      orderBy: [desc(userLearningProgress.lastAccessedAt)]
    });
  }

  /**
   * Find progress by module
   */
  async findByUserAndModule(userId: string, moduleId: number): Promise<UserLearningProgress[]> {
    return this.findMany({
      where: and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.moduleId, moduleId)
      ),
      orderBy: [desc(userLearningProgress.lastAccessedAt)]
    });
  }

  /**
   * Find specific lesson progress
   */
  async findByUserModuleLesson(userId: string, moduleId: number, lessonId: number): Promise<UserLearningProgress | null> {
    const condition = and(
      eq(userLearningProgress.userId, userId),
      eq(userLearningProgress.moduleId, moduleId),
      eq(userLearningProgress.lessonId, lessonId)
    );
    if (!condition) return null;
    return this.findOne(condition);
  }

  /**
   * Update progress
   */
  async updateProgress(
    userId: string, 
    moduleId: number, 
    lessonId: number, 
    data: {
      status?: 'not_started' | 'in_progress' | 'completed';
      completionPercentage?: number;
      quizScore?: number;
      notes?: string;
    }
  ): Promise<UserLearningProgress> {
    const existing = await this.findByUserModuleLesson(userId, moduleId, lessonId);
    
    const updateData = {
      ...data,
      lastAccessedAt: new Date(),
      ...(data.status === 'completed' && !existing?.completedAt ? { completedAt: new Date() } : {})
    };

    if (existing) {
      const updated = await this.updateById(existing.id, updateData);
      return updated!;
    } else {
      return this.create({
        userId,
        moduleId,
        lessonId,
        status: data.status || 'in_progress',
        completionPercentage: data.completionPercentage || 0,
        quizScore: data.quizScore,
        notes: data.notes,
        ...(data.status === 'completed' ? { completedAt: new Date() } : {})
      });
    }
  }

  /**
   * Mark lesson as started
   */
  async markAsStarted(userId: string, moduleId: number, lessonId: number): Promise<UserLearningProgress> {
    return this.updateProgress(userId, moduleId, lessonId, {
      status: 'in_progress',
      completionPercentage: 0
    });
  }

  /**
   * Mark lesson as completed
   */
  async markAsCompleted(userId: string, moduleId: number, lessonId: number, quizScore?: number): Promise<UserLearningProgress> {
    return this.updateProgress(userId, moduleId, lessonId, {
      status: 'completed',
      completionPercentage: 100,
      quizScore
    });
  }

  /**
   * Get completed lessons for user
   */
  async getCompletedLessons(userId: string): Promise<UserLearningProgress[]> {
    return this.findMany({
      where: and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.status, 'completed')
      ),
      orderBy: [desc(userLearningProgress.completedAt)]
    });
  }

  /**
   * Get user's learning statistics
   */
  async getUserStats(userId: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    averageQuizScore: number;
    totalTimeEstimate: number;
  }> {
    const allProgress = await this.findByUserId(userId);
    const completedLessons = allProgress.filter(p => p.status === 'completed').length;
    const inProgressLessons = allProgress.filter(p => p.status === 'in_progress').length;
    
    const quizScores = allProgress.filter(p => p.quizScore !== null).map(p => p.quizScore!);
    const averageQuizScore = quizScores.length > 0 
      ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
      : 0;

    return {
      totalLessons: allProgress.length,
      completedLessons,
      inProgressLessons,
      averageQuizScore,
      totalTimeEstimate: 0 // This would need to be calculated from lesson estimated times
    };
  }
}

/**
 * Repository for learning path operations
 */
export class LearningPathRepository extends BaseRepository<LearningPath, InsertLearningPath> {
  constructor() {
    super(learningPaths);
  }

  /**
   * Find active learning paths
   */
  async findActivePaths(): Promise<LearningPath[]> {
    return this.findMany({
      where: eq(learningPaths.isActive, true),
      orderBy: [desc(learningPaths.createdAt)]
    });
  }

  /**
   * Find paths by target audience
   */
  async findByTargetAudience(audience: string): Promise<LearningPath[]> {
    return this.findMany({
      where: and(
        eq(learningPaths.targetAudience, audience),
        eq(learningPaths.isActive, true)
      ),
      orderBy: [desc(learningPaths.createdAt)]
    });
  }
}

/**
 * Repository for learning path module operations
 */
export class LearningPathModuleRepository extends BaseRepository<LearningPathModule, InsertLearningPathModule> {
  constructor() {
    super(learningPathModules);
  }

  /**
   * Find modules in path
   */
  async findByPathId(pathId: number): Promise<LearningPathModule[]> {
    return this.findMany({
      where: eq(learningPathModules.pathId, pathId),
      orderBy: [desc(learningPathModules.sortOrder)]
    });
  }

  /**
   * Add module to path
   */
  async addModuleToPath(pathId: number, moduleId: number, sortOrder: number, isRequired: boolean = true): Promise<LearningPathModule> {
    return this.create({
      pathId,
      moduleId,
      sortOrder,
      isRequired
    });
  }

  /**
   * Remove module from path
   */
  async removeModuleFromPath(pathId: number, moduleId: number): Promise<boolean> {
    const condition = and(
      eq(learningPathModules.pathId, pathId),
      eq(learningPathModules.moduleId, moduleId)
    );
    if (!condition) return false;
    return await this.deleteWhere(condition) > 0;
  }
}

/**
 * Repository for user learning recommendation operations
 */
export class UserLearningRecommendationRepository extends BaseRepository<UserLearningRecommendation, InsertUserLearningRecommendation> {
  constructor() {
    super(userLearningRecommendations);
  }

  /**
   * Find recommendations by user ID
   */
  async findByUserId(userId: string): Promise<UserLearningRecommendation[]> {
    return this.findMany({
      where: and(
        eq(userLearningRecommendations.userId, userId),
        eq(userLearningRecommendations.isDismmised, false)
      ),
      orderBy: [desc(userLearningRecommendations.priority), desc(userLearningRecommendations.createdAt)]
    });
  }

  /**
   * Find active recommendations for user
   */
  async findActiveRecommendations(userId: string): Promise<UserLearningRecommendation[]> {
    return this.findMany({
      where: and(
        eq(userLearningRecommendations.userId, userId),
        eq(userLearningRecommendations.isCompleted, false),
        eq(userLearningRecommendations.isDismmised, false)
      ),
      orderBy: [desc(userLearningRecommendations.priority)]
    });
  }

  /**
   * Mark recommendation as completed
   */
  async markAsCompleted(recommendationId: number): Promise<UserLearningRecommendation | null> {
    return this.updateById(recommendationId, { isCompleted: true });
  }

  /**
   * Mark recommendation as dismissed
   */
  async markAsDismissed(recommendationId: number): Promise<UserLearningRecommendation | null> {
    return this.updateById(recommendationId, { isDismmised: true });
  }

  /**
   * Record recommendation click
   */
  async recordClick(recommendationId: number): Promise<UserLearningRecommendation | null> {
    // Note: clickedAt field may not exist in schema, using alternative approach
    return this.findById(recommendationId);
  }
}

// Export singleton instances
export const learningModuleRepository = new LearningModuleRepository();
export const learningLessonRepository = new LearningLessonRepository();
export const lessonQuizRepository = new LessonQuizRepository();
export const userLearningProgressRepository = new UserLearningProgressRepository();
export const learningPathRepository = new LearningPathRepository();
export const learningPathModuleRepository = new LearningPathModuleRepository();
export const userLearningRecommendationRepository = new UserLearningRecommendationRepository();