import { MonitoringRepository } from '../../repositories/monitoring.repository';
import { BusinessMetrics, SystemMetrics } from '../../../shared/schema/monitoring';
import { eq, gte, lte, desc, asc, and, sql, count, avg, sum } from 'drizzle-orm';
import { 
  analyses, 
  rivalAudits, 
  users, 
  apiUsage 
} from '../../../shared/schema';

// Import the existing database connection
import { db } from '../../db';

interface BusinessInsights {
  userGrowth: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    growthRate: number;
    retentionRate: number;
  };
  auditPerformance: {
    totalAudits: number;
    auditsToday: number;
    auditsThisWeek: number;
    auditsThisMonth: number;
    avgAuditTime: number;
    successRate: number;
    popularAuditTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  revenueMetrics: {
    estimatedRevenue: number;
    apiCosts: number;
    profitMargin: number;
    revenuePerUser: number;
    costPerAudit: number;
  };
  qualityMetrics: {
    userSatisfaction: number;
    priorityAccuracy: number;
    templateDetectionRate: number;
    issueResolutionTime: number;
  };
  usagePatterns: {
    peakHours: Array<{ hour: number; usage: number }>;
    popularFeatures: Array<{ feature: string; usage: number; trend: 'up' | 'down' | 'stable' }>;
    userSegments: Array<{ segment: string; count: number; value: number }>;
  };
  predictiveAnalytics: {
    projectedGrowth: number;
    churnRisk: number;
    capacityForecasting: {
      expectedLoad: number;
      recommendedScaling: string;
    };
  };
}

interface TrendAnalysis {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

interface UserSegment {
  id: string;
  name: string;
  criteria: any;
  userCount: number;
  avgValue: number;
  characteristics: string[];
}

export class BusinessIntelligenceService {
  private repository: MonitoringRepository;

  constructor() {
    this.repository = new MonitoringRepository();
  }

  // Main method to get comprehensive business insights
  async getBusinessInsights(timeRange: {
    start: Date;
    end: Date;
  }): Promise<BusinessInsights> {
    const [
      userGrowth,
      auditPerformance,
      revenueMetrics,
      qualityMetrics,
      usagePatterns,
      predictiveAnalytics
    ] = await Promise.all([
      this.getUserGrowthMetrics(timeRange),
      this.getAuditPerformanceMetrics(timeRange),
      this.getRevenueMetrics(timeRange),
      this.getQualityMetrics(timeRange),
      this.getUsagePatterns(timeRange),
      this.getPredictiveAnalytics(timeRange)
    ]);

    return {
      userGrowth,
      auditPerformance,
      revenueMetrics,
      qualityMetrics,
      usagePatterns,
      predictiveAnalytics
    };
  }

  // User growth and retention analysis
  private async getUserGrowthMetrics(timeRange: { start: Date; end: Date }) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user counts
    const [totalUsers] = await db()
      .select({ count: count() })
      .from(users);

    const [newUsersToday] = await db()
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, today));

    const [newUsersThisWeek] = await db()
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekAgo));

    const [newUsersThisMonth] = await db()
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, monthAgo));

    // Calculate growth rate (month over month)
    const previousMonth = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [previousMonthUsers] = await db()
      .select({ count: count() })
      .from(users)
      .where(and(
        gte(users.createdAt, previousMonth),
        lte(users.createdAt, monthAgo)
      ));

    const growthRate = previousMonthUsers.count > 0 
      ? ((newUsersThisMonth.count - previousMonthUsers.count) / previousMonthUsers.count) * 100
      : 0;

    // Calculate retention rate (users who returned in the last 30 days)
    const activeUsers = await db()
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastLoginAt, monthAgo));

    const retentionRate = totalUsers.count > 0 
      ? (activeUsers[0].count / totalUsers.count) * 100
      : 0;

    return {
      totalUsers: totalUsers.count,
      newUsersToday: newUsersToday.count,
      newUsersThisWeek: newUsersThisWeek.count,
      newUsersThisMonth: newUsersThisMonth.count,
      growthRate,
      retentionRate
    };
  }

  // Audit performance and completion metrics
  private async getAuditPerformanceMetrics(timeRange: { start: Date; end: Date }) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get audit counts
    const [totalAudits] = await db()
      .select({ count: count() })
      .from(rivalAudits);

    const [auditsToday] = await db()
      .select({ count: count() })
      .from(rivalAudits)
      .where(gte(rivalAudits.createdAt, today));

    const [auditsThisWeek] = await db()
      .select({ count: count() })
      .from(rivalAudits)
      .where(gte(rivalAudits.createdAt, weekAgo));

    const [auditsThisMonth] = await db()
      .select({ count: count() })
      .from(rivalAudits)
      .where(gte(rivalAudits.createdAt, monthAgo));

    // Calculate average audit time and success rate
    const auditStats = await db()
      .select({
        avgTime: avg(sql`EXTRACT(epoch FROM (updated_at - created_at))`),
        successCount: sum(sql`CASE WHEN status = 'completed' THEN 1 ELSE 0 END`),
        totalCount: count()
      })
      .from(rivalAudits)
      .where(gte(rivalAudits.createdAt, monthAgo));

    const avgAuditTime = Number(auditStats[0]?.avgTime) || 0;
    const successRate = (auditStats[0]?.totalCount || 0) > 0 
      ? (Number(auditStats[0]?.successCount) / Number(auditStats[0]?.totalCount)) * 100
      : 0;

    // Get popular audit types (simplified - would depend on your audit categorization)
    const popularAuditTypes = [
      { type: 'Full SEO Audit', count: Math.floor(totalAudits.count * 0.6), percentage: 60 },
      { type: 'Technical Audit', count: Math.floor(totalAudits.count * 0.25), percentage: 25 },
      { type: 'Content Audit', count: Math.floor(totalAudits.count * 0.15), percentage: 15 }
    ];

    return {
      totalAudits: totalAudits.count,
      auditsToday: auditsToday.count,
      auditsThisWeek: auditsThisWeek.count,
      auditsThisMonth: auditsThisMonth.count,
      avgAuditTime,
      successRate,
      popularAuditTypes
    };
  }

  // Revenue and cost analysis
  private async getRevenueMetrics(timeRange: { start: Date; end: Date }) {
    // Get API costs from usage tracking
    const apiCostData = await db()
      .select({
        totalCost: sum(apiUsage.estimatedCost)
      })
      .from(apiUsage)
      .where(gte(apiUsage.timestamp, timeRange.start));

    const apiCosts = Number(apiCostData[0].totalCost) || 0;

    // Estimated revenue (this would come from your billing system)
    // For now, we'll calculate based on usage and estimated pricing
    const [userCount] = await db().select({ count: count() }).from(users);
    const estimatedRevenue = userCount.count * 29.99; // Example: $29.99 per user

    const profitMargin = estimatedRevenue > 0 
      ? ((estimatedRevenue - apiCosts) / estimatedRevenue) * 100
      : 0;

    const revenuePerUser = userCount.count > 0 
      ? estimatedRevenue / userCount.count
      : 0;

    const [auditCount] = await db().select({ count: count() }).from(rivalAudits);
    const costPerAudit = auditCount.count > 0 
      ? apiCosts / auditCount.count
      : 0;

    return {
      estimatedRevenue,
      apiCosts,
      profitMargin,
      revenuePerUser,
      costPerAudit
    };
  }

  // Quality and satisfaction metrics
  private async getQualityMetrics(timeRange: { start: Date; end: Date }) {
    // Get latest business metrics for quality indicators
    const latestBusinessMetrics = await this.repository.getLatestBusinessMetrics();

    return {
      userSatisfaction: latestBusinessMetrics?.userSatisfaction || 4.5,
      priorityAccuracy: latestBusinessMetrics?.avgPriorityAccuracy || 0.95,
      templateDetectionRate: latestBusinessMetrics?.templateIssueDetectionRate || 0.85,
      issueResolutionTime: 24 // hours - would come from support system
    };
  }

  // Usage patterns and behavior analysis
  private async getUsagePatterns(timeRange: { start: Date; end: Date }) {
    // Peak hours analysis (simplified)
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      usage: Math.floor(Math.random() * 100) + 20 // Mock data
    }));

    // Popular features analysis
    const popularFeatures = [
      { feature: 'SEO Analysis', usage: 85, trend: 'up' as const },
      { feature: 'Rival Audit', usage: 72, trend: 'up' as const },
      { feature: 'Content Analysis', usage: 68, trend: 'stable' as const },
      { feature: 'Technical SEO', usage: 45, trend: 'down' as const },
      { feature: 'Keyword Research', usage: 38, trend: 'stable' as const }
    ];

    // User segments
    const userSegments = [
      { segment: 'Enterprise', count: 25, value: 150 },
      { segment: 'SMB', count: 120, value: 50 },
      { segment: 'Individual', count: 200, value: 25 },
      { segment: 'Trial', count: 80, value: 0 }
    ];

    return {
      peakHours,
      popularFeatures,
      userSegments
    };
  }

  // Predictive analytics and forecasting
  private async getPredictiveAnalytics(timeRange: { start: Date; end: Date }) {
    // Simple growth projection based on recent trends
    const businessMetrics = await this.repository.getBusinessMetricsHistory(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );

    let projectedGrowth = 15; // Default 15% projected growth
    if (businessMetrics.length >= 2) {
      const recent = businessMetrics[businessMetrics.length - 1];
      const older = businessMetrics[0];
      const actualGrowth = ((recent.activeUsers - older.activeUsers) / older.activeUsers) * 100;
      projectedGrowth = Math.max(0, actualGrowth * 1.2); // Project 20% higher than current trend
    }

    // Churn risk assessment (simplified)
    const churnRisk = 12; // 12% estimated churn risk

    // Capacity forecasting
    const currentLoad = businessMetrics[businessMetrics.length - 1]?.totalAudits || 0;
    const expectedLoad = currentLoad * (1 + projectedGrowth / 100);
    
    let recommendedScaling = 'Current capacity sufficient';
    if (expectedLoad > currentLoad * 1.5) {
      recommendedScaling = 'Consider scaling up infrastructure';
    } else if (expectedLoad > currentLoad * 1.2) {
      recommendedScaling = 'Monitor capacity closely';
    }

    return {
      projectedGrowth,
      churnRisk,
      capacityForecasting: {
        expectedLoad,
        recommendedScaling
      }
    };
  }

  // Trend analysis for key metrics
  async getTrendAnalysis(
    metrics: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];

    for (const metric of metrics) {
      const trend = await this.calculateMetricTrend(metric, timeRange);
      trends.push(trend);
    }

    return trends;
  }

  private async calculateMetricTrend(
    metric: string,
    timeRange: { start: Date; end: Date }
  ): Promise<TrendAnalysis> {
    // Get current and previous period data
    const periodLength = timeRange.end.getTime() - timeRange.start.getTime();
    const previousStart = new Date(timeRange.start.getTime() - periodLength);
    const previousEnd = timeRange.start;

    const currentData = await this.getMetricValue(metric, timeRange.start, timeRange.end);
    const previousData = await this.getMetricValue(metric, previousStart, previousEnd);

    const change = currentData - previousData;
    const changePercent = previousData !== 0 ? (change / previousData) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = changePercent > 0 ? 'up' : 'down';
    }

    let significance: 'high' | 'medium' | 'low' = 'low';
    if (Math.abs(changePercent) > 20) {
      significance = 'high';
    } else if (Math.abs(changePercent) > 10) {
      significance = 'medium';
    }

    return {
      metric,
      current: currentData,
      previous: previousData,
      change,
      changePercent,
      trend,
      significance
    };
  }

  private async getMetricValue(
    metric: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // This would query the appropriate table based on the metric name
    // For now, return mock data
    const businessMetrics = await this.repository.getBusinessMetricsHistory(startDate, endDate);
    
    if (businessMetrics.length === 0) return 0;

    switch (metric) {
      case 'total_audits':
        return businessMetrics.reduce((sum, m) => sum + m.totalAudits, 0);
      case 'active_users':
        return businessMetrics[businessMetrics.length - 1].activeUsers;
      case 'user_satisfaction':
        return businessMetrics[businessMetrics.length - 1].userSatisfaction || 0;
      default:
        return 0;
    }
  }

  // User segmentation analysis
  async getUserSegments(): Promise<UserSegment[]> {
    // This would implement sophisticated user segmentation
    // For now, return basic segments
    return [
      {
        id: 'high_value',
        name: 'High Value Users',
        criteria: { auditsPerMonth: { gte: 10 }, subscriptionTier: 'premium' },
        userCount: 45,
        avgValue: 150,
        characteristics: ['High engagement', 'Premium features usage', 'Long retention']
      },
      {
        id: 'regular_users',
        name: 'Regular Users',
        criteria: { auditsPerMonth: { gte: 2, lte: 9 }, subscriptionTier: 'standard' },
        userCount: 180,
        avgValue: 50,
        characteristics: ['Moderate engagement', 'Standard features', 'Good retention']
      },
      {
        id: 'trial_users',
        name: 'Trial Users',
        criteria: { subscriptionTier: 'trial', daysSinceSignup: { lte: 14 } },
        userCount: 80,
        avgValue: 0,
        characteristics: ['Evaluating platform', 'Limited usage', 'Conversion opportunity']
      },
      {
        id: 'churned_users',
        name: 'At-Risk Users',
        criteria: { lastLoginDays: { gte: 30 }, subscriptionTier: { ne: 'trial' } },
        userCount: 25,
        avgValue: 25,
        characteristics: ['Low engagement', 'Potential churn', 'Needs re-engagement']
      }
    ];
  }

  // Export business intelligence report
  async generateBusinessReport(
    timeRange: { start: Date; end: Date },
    format: 'json' | 'excel' = 'json'
  ): Promise<any> {
    const insights = await this.getBusinessInsights(timeRange);
    const trends = await this.getTrendAnalysis([
      'total_audits',
      'active_users',
      'user_satisfaction'
    ], timeRange);
    const segments = await this.getUserSegments();

    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      insights,
      trends,
      segments,
      summary: {
        totalUsers: insights.userGrowth.totalUsers,
        totalAudits: insights.auditPerformance.totalAudits,
        revenue: insights.revenueMetrics.estimatedRevenue,
        satisfaction: insights.qualityMetrics.userSatisfaction,
        growth: insights.predictiveAnalytics.projectedGrowth
      }
    };

    if (format === 'excel') {
      // Would implement Excel export here
      return { message: 'Excel export not yet implemented', data: report };
    }

    return report;
  }
}