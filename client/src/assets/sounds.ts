// Sound asset paths for achievement and milestone animations
export const SOUND_PATHS = {
  // Achievement sounds
  ACHIEVEMENT_UNLOCKED: '/sounds/achievement-unlocked.mp3',
  LEVEL_UP: '/sounds/level-up.mp3',
  MODULE_COMPLETED: '/sounds/module-completed.mp3',
  FIRST_LESSON: '/sounds/first-lesson.mp3',
  MILESTONE: '/sounds/milestone.mp3',
  
  // Lesson completion sounds
  LESSON_COMPLETED: '/sounds/lesson-completed.mp3',
  QUIZ_PASSED: '/sounds/quiz-passed.mp3',
  
  // Interactive feedback sounds
  CORRECT_ANSWER: '/sounds/correct-answer.mp3',
  INCORRECT_ANSWER: '/sounds/incorrect-answer.mp3',
  CLICK: '/sounds/click.mp3',
};

// Animation configurations for different achievement types
export const ANIMATION_CONFIGS = {
  ACHIEVEMENT_UNLOCKED: {
    particleCount: 100,
    spread: 100,
    colors: ['#FFD700', '#FFA500', '#FF4500'],
    origin: { y: 0.6 },
  },
  
  MODULE_COMPLETED: {
    particleCount: 200,
    spread: 160,
    startVelocity: 30,
    decay: 0.94,
    gravity: 1,
    drift: 0,
    ticks: 200,
    shapes: ['circle', 'square'],
    colors: ['#5D3FD3', '#9370DB', '#E6E6FA'],
    origin: { y: 0.7 },
  },
  
  MILESTONE: {
    particleCount: 150,
    spread: 120,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 150,
    colors: ['#00BFFF', '#1E90FF', '#4169E1'],
    origin: { y: 0.6 },
    scalar: 0.8,
  },
  
  QUIZ_COMPLETED: {
    particleCount: 80,
    spread: 100,
    startVelocity: 25,
    decay: 0.92,
    gravity: 1,
    ticks: 100,
    shapes: ['star'],
    colors: ['#FFD700', '#FFFF00', '#FAFAD2'],
    origin: { y: 0.65 },
  },
  
  LEVEL_UP: {
    particleCount: 120,
    spread: 140,
    startVelocity: 35,
    decay: 0.91,
    gravity: 0.8,
    drift: 0.1,
    ticks: 180,
    shapes: ['circle'],
    colors: ['#32CD32', '#7CFC00', '#98FB98'],
    origin: { y: 0.7 },
    zIndex: 999,
    scalar: 1.2,
  },
};

// Helper function to get animation config by achievement type
export function getAnimationConfigByType(type: string): any {
  switch(type) {
    case 'module_complete':
      return ANIMATION_CONFIGS.MODULE_COMPLETED;
    case 'milestone':
      return ANIMATION_CONFIGS.MILESTONE;
    case 'quiz_complete':
      return ANIMATION_CONFIGS.QUIZ_COMPLETED;
    case 'level_up':
      return ANIMATION_CONFIGS.LEVEL_UP;
    default:
      return ANIMATION_CONFIGS.ACHIEVEMENT_UNLOCKED;
  }
}

// Helper function to get sound path by achievement type
export function getSoundPathByType(type: string): string {
  switch(type) {
    case 'module_complete':
      return SOUND_PATHS.MODULE_COMPLETED;
    case 'first_lesson':
      return SOUND_PATHS.FIRST_LESSON;
    case 'milestone':
      return SOUND_PATHS.MILESTONE;
    case 'quiz_complete':
      return SOUND_PATHS.QUIZ_PASSED;
    case 'level_up':
      return SOUND_PATHS.LEVEL_UP;
    default:
      return SOUND_PATHS.ACHIEVEMENT_UNLOCKED;
  }
}