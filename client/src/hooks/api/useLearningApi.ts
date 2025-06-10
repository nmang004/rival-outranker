/**
 * Learning API hooks for educational content and progress tracking
 */

import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useApiQuery, useApiMutation, queryKeys } from './useApiData';

// Types
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  lessons: Lesson[];
  prerequisites: string[];
  learningObjectives: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: 'reading' | 'video' | 'interactive' | 'quiz';
  duration: number;
  order: number;
  resources: Resource[];
  quiz?: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'link' | 'document' | 'video' | 'tool';
  url: string;
  description?: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

export interface UserProgress {
  userId: string;
  moduleId: string;
  lessonId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  timeSpent: number;
  completedAt?: string;
  lastAccessedAt: string;
  quiz_scores?: Record<string, number>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: {
    type: 'lessons_completed' | 'modules_completed' | 'quiz_score' | 'streak_days';
    value: number;
    category?: string;
  };
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  unlockedAt: string;
  isNew: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: LearningModule[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  prerequisites: string[];
}

export interface LearningRecommendation {
  id: string;
  userId: string;
  type: 'next_lesson' | 'review' | 'skill_gap' | 'trending';
  title: string;
  description: string;
  moduleId?: string;
  lessonId?: string;
  priority: number;
  reason: string;
}

// Learning modules and paths
export function useLearningModules(category?: string) {
  return useApiQuery<LearningModule[]>(
    queryKeys.learning.modules(),
    '/api/learning/modules',
    category ? { category } : undefined,
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );
}

export function useLearningModule(moduleId: string) {
  return useApiQuery<LearningModule>(
    [...queryKeys.learning.modules(), moduleId],
    `/api/learning/modules/${moduleId}`,
    undefined,
    {
      enabled: !!moduleId,
      staleTime: 30 * 60 * 1000,
    }
  );
}

export function useLearningPaths() {
  return useApiQuery<LearningPath[]>(
    queryKeys.learning.paths(),
    '/api/learning/paths',
    undefined,
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}

export function useLearningPath(pathId: string) {
  return useApiQuery<LearningPath>(
    [...queryKeys.learning.paths(), pathId],
    `/api/learning/paths/${pathId}`,
    undefined,
    {
      enabled: !!pathId,
      staleTime: 60 * 60 * 1000,
    }
  );
}

// Individual lessons
export function useLesson(lessonId: string) {
  return useApiQuery<Lesson>(
    [...queryKeys.learning.all(), 'lesson', lessonId],
    `/api/learning/lessons/${lessonId}`,
    undefined,
    {
      enabled: !!lessonId,
      staleTime: 30 * 60 * 1000,
    }
  );
}

// User progress tracking
export function useUserProgress(userId: string) {
  return useApiQuery<UserProgress[]>(
    queryKeys.learning.progress(userId),
    '/api/learning/progress',
    { userId },
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useModuleProgress(moduleId: string, userId: string) {
  return useApiQuery<UserProgress>(
    [...queryKeys.learning.progress(userId), 'module', moduleId],
    `/api/learning/progress/modules/${moduleId}`,
    { userId },
    {
      enabled: !!(moduleId && userId),
      staleTime: 2 * 60 * 1000,
    }
  );
}

export function useLessonProgress(lessonId: string, userId: string) {
  return useApiQuery<UserProgress>(
    [...queryKeys.learning.progress(userId), 'lesson', lessonId],
    `/api/learning/progress/lessons/${lessonId}`,
    { userId },
    {
      enabled: !!(lessonId && userId),
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}

// Progress updates
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useApiMutation<UserProgress, {
    userId: string;
    moduleId?: string;
    lessonId?: string;
    progress: number;
    timeSpent?: number;
    status?: 'in_progress' | 'completed';
  }>(
    async (variables) => {
      return apiClient.post('/api/learning/progress', variables);
    },
    {
      onSuccess: (data, variables) => {
        // Update progress cache
        const userId = variables.userId;
        
        if (variables.lessonId) {
          queryClient.setQueryData(
            [...queryKeys.learning.progress(userId), 'lesson', variables.lessonId],
            data
          );
        }
        
        if (variables.moduleId) {
          queryClient.setQueryData(
            [...queryKeys.learning.progress(userId), 'module', variables.moduleId],
            data
          );
        }

        // Invalidate overall progress
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.learning.progress(userId) 
        });
      },
    }
  );
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useApiMutation<{ progress: UserProgress; achievements?: UserAchievement[] }, {
    userId: string;
    lessonId: string;
    timeSpent: number;
    quizScore?: number;
  }>(
    async (variables) => {
      return apiClient.post(`/api/learning/lessons/${variables.lessonId}/complete`, variables);
    },
    {
      onSuccess: (data, variables) => {
        const userId = variables.userId;
        
        // Update lesson progress
        queryClient.setQueryData(
          [...queryKeys.learning.progress(userId), 'lesson', variables.lessonId],
          { data: data.data.progress }
        );

        // Invalidate related caches
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.learning.progress(userId) 
        });

        // Update achievements if any were unlocked
        if (data.data.achievements?.length) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.learning.achievements(userId) 
          });
        }
      },
    }
  );
}

// Quiz operations
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useApiMutation<{ score: number; passed: boolean; achievements?: UserAchievement[] }, {
    userId: string;
    lessonId: string;
    quizId: string;
    answers: Record<string, string | string[]>;
  }>(
    async (variables) => {
      return apiClient.post(`/api/learning/quizzes/${variables.quizId}/submit`, variables);
    },
    {
      onSuccess: (data, variables) => {
        // Invalidate lesson progress to reflect quiz completion
        queryClient.invalidateQueries({ 
          queryKey: [...queryKeys.learning.progress(variables.userId), 'lesson', variables.lessonId] 
        });

        // Update achievements if any were unlocked
        if (data.data.achievements?.length) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.learning.achievements(variables.userId) 
          });
        }
      },
    }
  );
}

// Achievements
export function useUserAchievements(userId: string) {
  return useApiQuery<UserAchievement[]>(
    queryKeys.learning.achievements(userId),
    '/api/learning/achievements',
    { userId },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useAllAchievements() {
  return useApiQuery<Achievement[]>(
    [...queryKeys.learning.all(), 'all-achievements'],
    '/api/learning/achievements/all',
    undefined,
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}

// Learning recommendations
export function useLearningRecommendations(userId: string) {
  return useApiQuery<LearningRecommendation[]>(
    [...queryKeys.learning.all(), 'recommendations', userId],
    '/api/learning/recommendations',
    { userId },
    {
      enabled: !!userId,
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
}

// Learning analytics
export function useLearningAnalytics(userId: string, timeframe = '30d') {
  return useApiQuery<{
    totalTimeSpent: number;
    lessonsCompleted: number;
    modulesCompleted: number;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
    progressByCategory: Record<string, number>;
    activityHistory: Array<{ date: string; timeSpent: number; lessonsCompleted: number }>;
  }>(
    [...queryKeys.learning.all(), 'analytics', userId, timeframe],
    '/api/learning/analytics',
    { userId, timeframe },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000,
    }
  );
}

// Bookmarks and favorites
export function useBookmarkLesson() {
  const queryClient = useQueryClient();

  return useApiMutation<void, { userId: string; lessonId: string }>(
    async (variables) => {
      return apiClient.post('/api/learning/bookmarks', variables);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: [...queryKeys.learning.all(), 'bookmarks', variables.userId] 
        });
      },
    }
  );
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useApiMutation<void, { userId: string; lessonId: string }>(
    async (variables) => {
      return apiClient.delete(`/api/learning/bookmarks/${variables.lessonId}`, {
        body: JSON.stringify({ userId: variables.userId }),
      });
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: [...queryKeys.learning.all(), 'bookmarks', variables.userId] 
        });
      },
    }
  );
}

export function useUserBookmarks(userId: string) {
  return useApiQuery<Lesson[]>(
    [...queryKeys.learning.all(), 'bookmarks', userId],
    '/api/learning/bookmarks',
    { userId },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

// Search learning content
export function useSearchLearningContent(query: string, filters?: {
  category?: string;
  difficulty?: string;
  type?: string;
}) {
  return useApiQuery<{
    modules: LearningModule[];
    lessons: Lesson[];
  }>(
    [...queryKeys.learning.all(), 'search', query, filters],
    '/api/learning/search',
    { query, ...filters },
    {
      enabled: !!query && query.length > 2,
      staleTime: 5 * 60 * 1000,
    }
  );
}