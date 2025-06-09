/**
 * Score utilities for consistent scoring and categorization across the application
 */

export type ScoreCategory = 'excellent' | 'good' | 'needs-work' | 'poor';
export type AssessmentString = 'Excellent' | 'Good' | 'Needs improvement' | 'Poor';

export interface ScoreResult {
  score: number;
  category: ScoreCategory;
}

export interface AssessmentResult {
  score: number;
  assessment: AssessmentString;
}

/**
 * Score categorization thresholds for different analysis types
 */
export const SCORE_THRESHOLDS = {
  // Standard thresholds (80/60/40) - used for general SEO analysis
  STANDARD: {
    excellent: 80,
    good: 60,
    'needs-work': 40
  },
  
  // Performance thresholds (90/70/50) - used for PageSpeed and keyword analysis
  PERFORMANCE: {
    excellent: 90,
    good: 70,
    'needs-work': 50
  },
  
  // Technical thresholds (90/80/60) - used for technical SEO and content optimization
  TECHNICAL: {
    excellent: 90,
    good: 80,
    'needs-work': 60
  }
} as const;

/**
 * Color mapping for score categories
 */
export const SCORE_COLORS = {
  excellent: '#22c55e', // Green
  good: '#3b82f6',      // Blue
  'needs-work': '#f59e0b', // Orange/Amber
  poor: '#ef4444'       // Red
} as const;

/**
 * Score utility class providing consistent scoring methods
 */
export class ScoreUtils {
  /**
   * Get score category using standard thresholds (80/60/40)
   */
  static getCategory(score: number): ScoreCategory {
    return this.getCategoryWithThresholds(score, SCORE_THRESHOLDS.STANDARD);
  }

  /**
   * Get score category using performance thresholds (90/70/50)
   */
  static getPerformanceCategory(score: number): ScoreCategory {
    return this.getCategoryWithThresholds(score, SCORE_THRESHOLDS.PERFORMANCE);
  }

  /**
   * Get score category using technical thresholds (90/80/60)
   */
  static getTechnicalCategory(score: number): ScoreCategory {
    return this.getCategoryWithThresholds(score, SCORE_THRESHOLDS.TECHNICAL);
  }

  /**
   * Get score category with custom thresholds
   */
  static getCategoryWithThresholds(
    score: number, 
    thresholds: typeof SCORE_THRESHOLDS.STANDARD
  ): ScoreCategory {
    if (score >= thresholds.excellent) return 'excellent';
    if (score >= thresholds.good) return 'good';
    if (score >= thresholds['needs-work']) return 'needs-work';
    return 'poor';
  }

  /**
   * Get score with category using standard thresholds
   */
  static getScoreResult(score: number): ScoreResult {
    return {
      score,
      category: this.getCategory(score)
    };
  }

  /**
   * Get score with category using performance thresholds
   */
  static getPerformanceScoreResult(score: number): ScoreResult {
    return {
      score,
      category: this.getPerformanceCategory(score)
    };
  }

  /**
   * Get score with category using technical thresholds
   */
  static getTechnicalScoreResult(score: number): ScoreResult {
    return {
      score,
      category: this.getTechnicalCategory(score)
    };
  }

  /**
   * Get assessment string for technical analysis
   */
  static getAssessment(score: number): AssessmentString {
    const category = this.getTechnicalCategory(score);
    return this.categoryToAssessment(category);
  }

  /**
   * Get assessment result with score and string
   */
  static getAssessmentResult(score: number): AssessmentResult {
    return {
      score,
      assessment: this.getAssessment(score)
    };
  }

  /**
   * Convert category to assessment string
   */
  static categoryToAssessment(category: ScoreCategory): AssessmentString {
    const mapping: Record<ScoreCategory, AssessmentString> = {
      excellent: 'Excellent',
      good: 'Good',
      'needs-work': 'Needs improvement',
      poor: 'Poor'
    };
    return mapping[category];
  }

  /**
   * Convert assessment string to category
   */
  static assessmentToCategory(assessment: AssessmentString): ScoreCategory {
    const mapping: Record<AssessmentString, ScoreCategory> = {
      'Excellent': 'excellent',
      'Good': 'good',
      'Needs improvement': 'needs-work',
      'Poor': 'poor'
    };
    return mapping[assessment];
  }

  /**
   * Get color for score category
   */
  static getColor(category: ScoreCategory): string {
    return SCORE_COLORS[category];
  }

  /**
   * Get color for score value
   */
  static getColorForScore(score: number, thresholds = SCORE_THRESHOLDS.STANDARD): string {
    const category = this.getCategoryWithThresholds(score, thresholds);
    return this.getColor(category);
  }

  /**
   * Calculate overall score from multiple metrics
   */
  static calculateOverallScore(scores: Record<string, number>): number {
    const values = Object.values(scores).filter(score => 
      typeof score === 'number' && !isNaN(score)
    );
    
    if (values.length === 0) return 0;
    
    const sum = values.reduce((total, score) => total + score, 0);
    return Math.round(sum / values.length);
  }

  /**
   * Calculate weighted overall score
   */
  static calculateWeightedScore(
    scores: Record<string, number>, 
    weights: Record<string, number>
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [key, score] of Object.entries(scores)) {
      if (typeof score === 'number' && !isNaN(score) && weights[key]) {
        totalWeightedScore += score * weights[key];
        totalWeight += weights[key];
      }
    }

    if (totalWeight === 0) return 0;
    
    return Math.round(totalWeightedScore / totalWeight);
  }

  /**
   * Normalize score to 0-100 range
   */
  static normalizeScore(score: number, min = 0, max = 100): number {
    const normalized = Math.max(min, Math.min(max, score));
    return Math.round(normalized);
  }

  /**
   * Apply score penalties
   */
  static applyPenalties(baseScore: number, penalties: number[]): number {
    const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty, 0);
    const penalizedScore = baseScore - totalPenalty;
    return this.normalizeScore(penalizedScore);
  }

  /**
   * Apply score bonuses
   */
  static applyBonuses(baseScore: number, bonuses: number[]): number {
    const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus, 0);
    const bonusScore = baseScore + totalBonus;
    return this.normalizeScore(bonusScore);
  }

  /**
   * Get default score result for fallback scenarios
   */
  static getDefaultScoreResult(score = 50): ScoreResult {
    return this.getScoreResult(score);
  }

  /**
   * Get default assessment result for fallback scenarios
   */
  static getDefaultAssessmentResult(score = 50): AssessmentResult {
    return this.getAssessmentResult(score);
  }

  /**
   * Readability score categorization (Flesch Reading Ease scale)
   */
  static getReadabilityCategory(fleschScore: number): {
    category: string;
    description: string;
  } {
    if (fleschScore >= 90) {
      return { category: 'very-easy', description: 'Very Easy' };
    } else if (fleschScore >= 80) {
      return { category: 'easy', description: 'Easy' };
    } else if (fleschScore >= 70) {
      return { category: 'fairly-easy', description: 'Fairly Easy' };
    } else if (fleschScore >= 60) {
      return { category: 'standard', description: 'Standard' };
    } else if (fleschScore >= 50) {
      return { category: 'fairly-difficult', description: 'Fairly Difficult' };
    } else if (fleschScore >= 30) {
      return { category: 'difficult', description: 'Difficult' };
    } else {
      return { category: 'very-difficult', description: 'Very Difficult' };
    }
  }

  /**
   * Performance metric specific scoring
   */
  static getPerformanceMetricScore(value: number, metric: 'lcp' | 'fid' | 'cls' | 'ttfb'): number {
    switch (metric) {
      case 'lcp': // Largest Contentful Paint (ms)
        if (value <= 2500) return 100;
        if (value <= 3000) return 90;
        if (value <= 3500) return 80;
        if (value <= 4000) return 70;
        if (value <= 4500) return 60;
        if (value <= 5000) return 50;
        if (value <= 6000) return 40;
        if (value <= 7000) return 30;
        if (value <= 8000) return 20;
        return 10;

      case 'fid': // First Input Delay (ms)
        if (value <= 100) return 100;
        if (value <= 150) return 90;
        if (value <= 200) return 80;
        if (value <= 250) return 70;
        if (value <= 300) return 60;
        if (value <= 400) return 50;
        if (value <= 500) return 40;
        if (value <= 600) return 30;
        if (value <= 700) return 20;
        return 10;

      case 'cls': // Cumulative Layout Shift (unitless)
        if (value <= 0.1) return 100;
        if (value <= 0.15) return 90;
        if (value <= 0.2) return 80;
        if (value <= 0.25) return 70;
        if (value <= 0.3) return 60;
        if (value <= 0.4) return 50;
        if (value <= 0.5) return 40;
        if (value <= 0.6) return 30;
        if (value <= 0.7) return 20;
        return 10;

      case 'ttfb': // Time to First Byte (ms)
        if (value <= 600) return 100;
        if (value <= 800) return 90;
        if (value <= 1000) return 80;
        if (value <= 1200) return 70;
        if (value <= 1500) return 60;
        if (value <= 2000) return 50;
        if (value <= 2500) return 40;
        if (value <= 3000) return 30;
        if (value <= 4000) return 20;
        return 10;

      default:
        return 50; // Default fallback
    }
  }

  /**
   * Format score for display
   */
  static formatScore(score: number, precision = 0): string {
    return score.toFixed(precision);
  }

  /**
   * Format score with category for display
   */
  static formatScoreWithCategory(score: number, thresholds = SCORE_THRESHOLDS.STANDARD): string {
    const category = this.getCategoryWithThresholds(score, thresholds);
    const categoryFormatted = category.charAt(0).toUpperCase() + category.slice(1);
    return `${this.formatScore(score)} (${categoryFormatted})`;
  }
}

// Export utility functions for backward compatibility
export const getScoreCategory = ScoreUtils.getCategory;
export const getPerformanceCategory = ScoreUtils.getPerformanceCategory;
export const getTechnicalCategory = ScoreUtils.getTechnicalCategory;
export const getScoreColor = ScoreUtils.getColorForScore;
export const calculateOverallScore = ScoreUtils.calculateOverallScore;