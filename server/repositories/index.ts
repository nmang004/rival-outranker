/**
 * Repository Layer Index
 * 
 * Exports all repository classes and singleton instances for database operations.
 * Each repository provides type-safe, domain-specific database access methods
 * built on top of the BaseRepository pattern.
 */

// Base repository
export { BaseRepository, type IRepository } from './base.repository';

// User management
export { UserRepository, userRepository } from './user.repository';

// SEO analysis
export { AnalysisRepository, analysisRepository } from './analysis.repository';

// Project management
export { ProjectRepository, projectRepository } from './project.repository';

// Backlink management
export { 
  BacklinkProfileRepository, 
  BacklinkRepository, 
  BacklinkHistoryRepository, 
  OutgoingLinkRepository,
  backlinkProfileRepository,
  backlinkRepository,
  backlinkHistoryRepository,
  outgoingLinkRepository
} from './backlink.repository';

// Keyword tracking
export {
  KeywordRepository,
  KeywordMetricsRepository,
  KeywordRankingRepository,
  CompetitorRankingRepository,
  KeywordSuggestionRepository,
  keywordRepository,
  keywordMetricsRepository,
  keywordRankingRepository,
  competitorRankingRepository,
  keywordSuggestionRepository
} from './keyword.repository';

// Learning system
export {
  LearningModuleRepository,
  LearningLessonRepository,
  LessonQuizRepository,
  UserLearningProgressRepository,
  LearningPathRepository,
  LearningPathModuleRepository,
  UserLearningRecommendationRepository,
  learningModuleRepository,
  learningLessonRepository,
  lessonQuizRepository,
  userLearningProgressRepository,
  learningPathRepository,
  learningPathModuleRepository,
  userLearningRecommendationRepository
} from './learning.repository';

// API usage tracking
export { ApiUsageRepository, apiUsageRepository } from './api-usage.repository';

// Re-import for local use
import { userRepository } from './user.repository';
import { analysisRepository } from './analysis.repository';
import { projectRepository } from './project.repository';
import { 
  backlinkProfileRepository,
  backlinkRepository,
  backlinkHistoryRepository,
  outgoingLinkRepository
} from './backlink.repository';
import { 
  keywordRepository,
  keywordMetricsRepository,
  keywordRankingRepository,
  competitorRankingRepository,
  keywordSuggestionRepository
} from './keyword.repository';
import { 
  learningModuleRepository,
  learningLessonRepository,
  lessonQuizRepository,
  userLearningProgressRepository,
  learningPathRepository,
  learningPathModuleRepository,
  userLearningRecommendationRepository
} from './learning.repository';
import { apiUsageRepository } from './api-usage.repository';

/**
 * Repository Registry
 * 
 * Centralized access to all repository instances for dependency injection
 */
export const repositories = {
  // Core entities
  user: userRepository as any,
  analysis: analysisRepository as any,
  project: projectRepository as any,
  
  // Backlink system
  backlinkProfile: backlinkProfileRepository as any,
  backlink: backlinkRepository as any,
  backlinkHistory: backlinkHistoryRepository as any,
  outgoingLink: outgoingLinkRepository as any,
  
  // Keyword system
  keyword: keywordRepository as any,
  keywordMetrics: keywordMetricsRepository as any,
  keywordRanking: keywordRankingRepository as any,
  competitorRanking: competitorRankingRepository as any,
  keywordSuggestion: keywordSuggestionRepository as any,
  
  // Learning system
  learningModule: learningModuleRepository as any,
  learningLesson: learningLessonRepository as any,
  lessonQuiz: lessonQuizRepository as any,
  userLearningProgress: userLearningProgressRepository as any,
  learningPath: learningPathRepository as any,
  learningPathModule: learningPathModuleRepository as any,
  userLearningRecommendation: userLearningRecommendationRepository as any,
  
  // System monitoring
  apiUsage: apiUsageRepository as any
} as const;

export type RepositoryRegistry = typeof repositories;