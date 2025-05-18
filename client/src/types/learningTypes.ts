// Types for the SEO learning path feature

export interface LearningModule {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: string;
  estimatedTime: number;
  prerequisiteIds: number[];
  sortOrder: number;
  isActive: boolean;
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'tool' | 'guide' | 'ebook';
  description: string;
}

export interface LearningLesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  estimatedTime: number;
  sortOrder: number;
  isActive: boolean;
  quiz?: LessonQuiz;
  additionalResources?: LearningResource[];
}

export interface LearningPath {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  targetAudience?: string;
  isActive: boolean;
  moduleIds: number[];
}

export interface LessonQuiz {
  id: number;
  lessonId: number;
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface UserLearningProgress {
  id: number;
  userId: string;
  moduleId: number;
  lessonId: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completionPercentage: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface ProgressSummary {
  userId: string;
  overallProgress: {
    totalModules: number;
    completedModules: number;
    inProgressModules: number;
    notStartedModules: number;
    totalLessons: number;
    completedLessons: number;
    percentComplete: number;
  };
  moduleProgress: Array<{
    moduleId: number;
    moduleTitle: string;
    moduleDifficulty: string;
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    notStartedLessons: number;
    percentComplete: number;
    status: 'completed' | 'in_progress' | 'not_started';
  }>;
}

export interface LearningRecommendation {
  id: number;
  userId: string;
  moduleId: number;
  reasonCode: string;
  reasonText: string;
  priority: number;
  analysisId?: number;
  isCompleted: boolean;
  isDismmised: boolean;
}