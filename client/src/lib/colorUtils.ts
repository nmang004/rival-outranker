/**
 * Color utilities for performance indicators
 */

export type PerformanceCategory = 'excellent' | 'good' | 'needs-work' | 'poor';

/**
 * Get the appropriate color for a performance category
 */
export function getColorForCategory(category: PerformanceCategory): string {
  switch (category) {
    case 'excellent':
      return 'text-emerald-600 bg-emerald-50';
    case 'good':
      return 'text-blue-600 bg-blue-50';
    case 'needs-work':
      return 'text-amber-600 bg-amber-50';
    case 'poor':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get the appropriate border color for a performance category
 */
export function getBorderColorForCategory(category: PerformanceCategory): string {
  switch (category) {
    case 'excellent':
      return 'border-emerald-200';
    case 'good':
      return 'border-blue-200';
    case 'needs-work':
      return 'border-amber-200';
    case 'poor':
      return 'border-red-200';
    default:
      return 'border-gray-200';
  }
}

/**
 * Get the appropriate icon color for a performance category
 */
export function getIconColorForCategory(category: PerformanceCategory): string {
  switch (category) {
    case 'excellent':
      return 'text-emerald-500';
    case 'good':
      return 'text-blue-500';
    case 'needs-work':
      return 'text-amber-500';
    case 'poor':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get the appropriate emoji for a performance category
 */
export function getEmojiForCategory(category: PerformanceCategory): string {
  switch (category) {
    case 'excellent':
      return '🚀'; // Rocket for excellent
    case 'good':
      return '👍'; // Thumbs up for good
    case 'needs-work':
      return '🔧'; // Wrench for needs work
    case 'poor':
      return '⚠️'; // Warning for poor
    default:
      return '❓'; // Question mark for unknown
  }
}

/**
 * Get the appropriate text for a performance category
 */
export function getTextForCategory(category: PerformanceCategory): string {
  switch (category) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'needs-work':
      return 'Needs Work';
    case 'poor':
      return 'Poor';
    default:
      return 'Unknown';
  }
}

/**
 * Map a numeric score (0-100) to a performance category
 */
export function scoreToCategory(score: number): PerformanceCategory {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-work';
  return 'poor';
}