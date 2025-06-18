import { AuditItem } from '../../../shared/schema';

/**
 * Represents a group of similar issues across multiple pages
 */
export interface IssueGroup {
  issueType: string;
  pages: string[];
  severity: 'low' | 'medium' | 'high';
  isTemplateIssue: boolean;
  effort: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high';
  category: string;
  subcategory: string;
  description: string;
  analysisDetails?: {
    urlPatterns: string[];
    commonCharacteristics: string[];
    templateEvidence: string[];
  };
}

/**
 * Configuration for effort estimation based on issue types
 */
export interface EffortEstimationMatrix {
  [issueType: string]: {
    baseEffort: 'low' | 'medium' | 'high';
    isTemplateEfficient: boolean; // If fixing one instance fixes all
    multiplier?: number; // Effort multiplier for non-template issues
  };
}

/**
 * Business impact assessment rules
 */
export interface BusinessImpactRules {
  [category: string]: {
    [subcategory: string]: {
      baseImpact: 'low' | 'medium' | 'high';
      pageTypeMultipliers: {
        homepage: number;
        service: number;
        contact: number;
        location: number;
        other: number;
      };
    };
  };
}

/**
 * Service for grouping similar audit issues and detecting template-level problems
 */
export class IssueGroupingService {
  
  private effortMatrix: EffortEstimationMatrix = {
    'missing_meta_title': {
      baseEffort: 'low',
      isTemplateEfficient: true
    },
    'missing_meta_description': {
      baseEffort: 'low', 
      isTemplateEfficient: true
    },
    'duplicate_title': {
      baseEffort: 'medium',
      isTemplateEfficient: true
    },
    'missing_h1': {
      baseEffort: 'low',
      isTemplateEfficient: true
    },
    'multiple_h1': {
      baseEffort: 'low',
      isTemplateEfficient: true
    },
    'missing_alt_text': {
      baseEffort: 'medium',
      isTemplateEfficient: false,
      multiplier: 0.1 // Each image is quick to fix individually
    },
    'slow_page_speed': {
      baseEffort: 'high',
      isTemplateEfficient: true
    },
    'missing_ssl': {
      baseEffort: 'medium',
      isTemplateEfficient: true
    },
    'missing_contact_info': {
      baseEffort: 'low',
      isTemplateEfficient: true
    },
    'poor_content_structure': {
      baseEffort: 'high',
      isTemplateEfficient: false,
      multiplier: 0.8
    },
    'missing_schema': {
      baseEffort: 'medium',
      isTemplateEfficient: true
    },
    'broken_links': {
      baseEffort: 'low',
      isTemplateEfficient: false,
      multiplier: 0.2
    },
    'mobile_unfriendly': {
      baseEffort: 'high',
      isTemplateEfficient: true
    }
  };

  private businessImpactRules: BusinessImpactRules = {
    'Technical SEO': {
      'Meta Tags': {
        baseImpact: 'high',
        pageTypeMultipliers: {
          homepage: 1.5,
          service: 1.3,
          contact: 1.1,
          location: 1.2,
          other: 1.0
        }
      },
      'Site Structure': {
        baseImpact: 'medium',
        pageTypeMultipliers: {
          homepage: 1.4,
          service: 1.2,
          contact: 1.0,
          location: 1.1,
          other: 0.9
        }
      },
      'Performance': {
        baseImpact: 'high',
        pageTypeMultipliers: {
          homepage: 1.5,
          service: 1.3,
          contact: 1.0,
          location: 1.2,
          other: 1.0
        }
      }
    },
    'Content & UX': {
      'Content Quality': {
        baseImpact: 'medium',
        pageTypeMultipliers: {
          homepage: 1.4,
          service: 1.5,
          contact: 1.1,
          location: 1.3,
          other: 1.0
        }
      },
      'User Experience': {
        baseImpact: 'high',
        pageTypeMultipliers: {
          homepage: 1.5,
          service: 1.3,
          contact: 1.2,
          location: 1.1,
          other: 1.0
        }
      }
    },
    'Local SEO': {
      'Contact Information': {
        baseImpact: 'high',
        pageTypeMultipliers: {
          homepage: 1.3,
          service: 1.1,
          contact: 1.5,
          location: 1.4,
          other: 0.8
        }
      },
      'Location Targeting': {
        baseImpact: 'medium',
        pageTypeMultipliers: {
          homepage: 1.2,
          service: 1.1,
          contact: 1.0,
          location: 1.5,
          other: 0.7
        }
      }
    }
  };

  /**
   * Group similar audit items and identify template issues
   */
  groupSimilarIssues(auditItems: AuditItem[]): IssueGroup[] {
    const groups = new Map<string, IssueGroup>();
    
    auditItems.forEach(item => {
      const issueKey = this.generateIssueKey(item);
      
      if (!groups.has(issueKey)) {
        groups.set(issueKey, {
          issueType: issueKey,
          pages: [],
          severity: this.assessSeverity(item),
          isTemplateIssue: false, // Will be determined after grouping
          effort: this.estimateEffort(item),
          businessImpact: this.assessBusinessImpact(item),
          category: item.category || 'Unknown',
          subcategory: this.extractSubcategory(item),
          description: item.description || item.name,
          analysisDetails: {
            urlPatterns: [],
            commonCharacteristics: [],
            templateEvidence: []
          }
        });
      }
      
      const group = groups.get(issueKey)!;
      group.pages.push(this.extractPageUrl(item));
    });
    
    // Post-process groups to detect template issues and refine analysis
    const groupArray = Array.from(groups.values());
    
    groupArray.forEach(group => {
      this.analyzeTemplateCharacteristics(group);
      this.refineEffortEstimation(group);
      this.refineSeverityAssessment(group);
    });
    
    return groupArray.sort((a, b) => this.calculateGroupPriority(b) - this.calculateGroupPriority(a));
  }

  /**
   * Generate a normalized key that groups similar issues together
   */
  private generateIssueKey(item: AuditItem): string {
    const category = item.category || 'unknown';
    const normalizedName = this.normalizeIssueDescription(item.name);
    const normalizedDesc = this.normalizeIssueDescription(item.description || '');
    
    // Combine category and normalized descriptions to create a grouping key
    return `${category.toLowerCase()}_${normalizedName}_${normalizedDesc}`.substring(0, 100);
  }

  /**
   * Normalize issue descriptions to group similar issues
   */
  private normalizeIssueDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/\d+/g, 'X') // Replace numbers with X
      .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-z_]/g, '') // Keep only letters and underscores
      .substring(0, 50); // Limit length
  }

  /**
   * Extract subcategory from item details
   */
  private extractSubcategory(item: AuditItem): string {
    // Try to extract subcategory from item name or description
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    
    if (text.includes('meta') && (text.includes('title') || text.includes('description'))) {
      return 'Meta Tags';
    } else if (text.includes('h1') || text.includes('heading')) {
      return 'Content Structure';
    } else if (text.includes('speed') || text.includes('performance') || text.includes('loading')) {
      return 'Performance';
    } else if (text.includes('mobile') || text.includes('responsive')) {
      return 'Mobile Optimization';
    } else if (text.includes('contact') || text.includes('phone') || text.includes('address')) {
      return 'Contact Information';
    } else if (text.includes('ssl') || text.includes('https') || text.includes('security')) {
      return 'Security';
    } else if (text.includes('alt') || text.includes('image')) {
      return 'Images';
    } else if (text.includes('link') || text.includes('navigation')) {
      return 'Navigation';
    } else if (text.includes('schema') || text.includes('structured')) {
      return 'Structured Data';
    }
    
    return 'Other';
  }

  /**
   * Extract page URL from audit item
   */
  private extractPageUrl(item: AuditItem): string {
    // Try to extract URL from item properties
    if ('pageUrl' in item && typeof item.pageUrl === 'string') {
      return item.pageUrl;
    }
    
    // Try to extract from notes or description
    const text = `${item.description || ''} ${item.notes || ''}`;
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
    
    return 'unknown';
  }

  /**
   * Assess the severity of an individual issue
   */
  private assessSeverity(item: AuditItem): 'low' | 'medium' | 'high' {
    if (item.importance === 'High' || item.status === 'Priority OFI') {
      return 'high';
    } else if (item.importance === 'Medium') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Estimate the effort required to fix an issue
   */
  private estimateEffort(item: AuditItem): 'low' | 'medium' | 'high' {
    const issueKey = this.classifyIssueType(item);
    const effortConfig = this.effortMatrix[issueKey];
    
    if (effortConfig) {
      return effortConfig.baseEffort;
    }
    
    // Default effort estimation based on importance
    if (item.importance === 'High') {
      return 'high';
    } else if (item.importance === 'Medium') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Assess the business impact of an issue
   */
  private assessBusinessImpact(item: AuditItem): 'low' | 'medium' | 'high' {
    const category = item.category || 'Unknown';
    const subcategory = this.extractSubcategory(item);
    const pageType = this.extractPageType(item);
    
    const rules = this.businessImpactRules[category]?.[subcategory];
    if (rules) {
      const baseImpact = rules.baseImpact;
      const multiplier = rules.pageTypeMultipliers[pageType as keyof typeof rules.pageTypeMultipliers] || 1.0;
      
      // Apply page type multiplier to determine final impact
      if (baseImpact === 'high' && multiplier >= 1.3) return 'high';
      if (baseImpact === 'medium' && multiplier >= 1.4) return 'high';
      if (baseImpact === 'high' && multiplier >= 1.0) return 'high';
      if (baseImpact === 'medium' && multiplier >= 1.1) return 'medium';
      if (baseImpact === 'low' && multiplier >= 1.3) return 'medium';
      
      return baseImpact;
    }
    
    // Fallback to importance-based assessment
    if (item.importance === 'High') return 'high';
    if (item.importance === 'Medium') return 'medium';
    return 'low';
  }

  /**
   * Extract page type from audit item
   */
  private extractPageType(item: AuditItem): string {
    if ('pageType' in item && typeof item.pageType === 'string') {
      return item.pageType;
    }
    
    const url = this.extractPageUrl(item).toLowerCase();
    if (url.includes('contact')) return 'contact';
    if (url.includes('service')) return 'service';
    if (url.includes('location')) return 'location';
    if (url === '/' || url.includes('home')) return 'homepage';
    
    return 'other';
  }

  /**
   * Classify issue type for effort matrix lookup
   */
  private classifyIssueType(item: AuditItem): string {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    
    if (text.includes('meta title') && text.includes('missing')) return 'missing_meta_title';
    if (text.includes('meta description') && text.includes('missing')) return 'missing_meta_description';
    if (text.includes('duplicate') && text.includes('title')) return 'duplicate_title';
    if (text.includes('h1') && text.includes('missing')) return 'missing_h1';
    if (text.includes('h1') && text.includes('multiple')) return 'multiple_h1';
    if (text.includes('alt') && text.includes('missing')) return 'missing_alt_text';
    if (text.includes('speed') || text.includes('slow')) return 'slow_page_speed';
    if (text.includes('ssl') || text.includes('https')) return 'missing_ssl';
    if (text.includes('contact') && text.includes('missing')) return 'missing_contact_info';
    if (text.includes('content') && text.includes('structure')) return 'poor_content_structure';
    if (text.includes('schema') && text.includes('missing')) return 'missing_schema';
    if (text.includes('broken') && text.includes('link')) return 'broken_links';
    if (text.includes('mobile') && text.includes('unfriendly')) return 'mobile_unfriendly';
    
    return 'other';
  }

  /**
   * Analyze template characteristics of a grouped issue
   */
  private analyzeTemplateCharacteristics(group: IssueGroup): void {
    if (group.pages.length < 3) {
      group.isTemplateIssue = false;
      return;
    }
    
    // Extract URL patterns
    const urlPatterns = group.pages.map(url => this.extractUrlPattern(url));
    const uniquePatterns = [...new Set(urlPatterns)];
    
    group.analysisDetails!.urlPatterns = uniquePatterns;
    
    // Determine if it's a template issue based on URL pattern similarity
    const patternSimilarity = 1 - (uniquePatterns.length / group.pages.length);
    
    // Template issue indicators
    const templateEvidence = [];
    
    if (patternSimilarity > 0.7) {
      templateEvidence.push(`High URL pattern similarity (${Math.round(patternSimilarity * 100)}%)`);
    }
    
    if (group.pages.length >= 5) {
      templateEvidence.push(`Affects ${group.pages.length} pages (template-scale impact)`);
    }
    
    const issueType = this.classifyIssueType({ name: group.description, category: group.category } as AuditItem);
    const effortConfig = this.effortMatrix[issueType];
    if (effortConfig?.isTemplateEfficient) {
      templateEvidence.push('Issue type is typically template-fixable');
    }
    
    group.analysisDetails!.templateEvidence = templateEvidence;
    group.isTemplateIssue = patternSimilarity > 0.7 || (group.pages.length >= 5 && effortConfig?.isTemplateEfficient);
  }

  /**
   * Extract URL pattern for template detection
   */
  private extractUrlPattern(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://example.com${url}`);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
      
      // Create pattern by replacing specific identifiers with placeholders
      const pattern = pathSegments.map(segment => {
        // Replace numbers and specific IDs with placeholders
        if (/^\d+$/.test(segment)) return '{id}';
        if (/^[a-z]+-\d+$/.test(segment)) return '{slug-id}';
        if (segment.length > 20) return '{long-slug}';
        return segment;
      }).join('/');
      
      return pattern || '/';
    } catch {
      return url;
    }
  }

  /**
   * Refine effort estimation based on group characteristics
   */
  private refineEffortEstimation(group: IssueGroup): void {
    const issueType = this.classifyIssueType({ name: group.description, category: group.category } as AuditItem);
    const effortConfig = this.effortMatrix[issueType];
    
    if (group.isTemplateIssue && effortConfig?.isTemplateEfficient) {
      // Template issues that can be fixed once for all pages
      group.effort = effortConfig.baseEffort;
    } else if (!group.isTemplateIssue && effortConfig?.multiplier) {
      // Individual issues that need per-page fixes
      const baseEffortScore = this.getEffortScore(effortConfig.baseEffort);
      const adjustedScore = baseEffortScore * (1 + (group.pages.length - 1) * effortConfig.multiplier);
      
      if (adjustedScore >= 2.5) group.effort = 'high';
      else if (adjustedScore >= 1.5) group.effort = 'medium';
      else group.effort = 'low';
    }
  }

  /**
   * Get numeric score for effort level
   */
  private getEffortScore(effort: 'low' | 'medium' | 'high'): number {
    switch (effort) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
    }
  }

  /**
   * Refine severity assessment based on group impact
   */
  private refineSeverityAssessment(group: IssueGroup): void {
    // Increase severity for widespread issues
    if (group.pages.length >= 10 && group.severity === 'medium') {
      group.severity = 'high';
      group.analysisDetails!.commonCharacteristics.push('Widespread impact across 10+ pages');
    } else if (group.pages.length >= 5 && group.severity === 'low') {
      group.severity = 'medium';
      group.analysisDetails!.commonCharacteristics.push('Moderate impact across 5+ pages');
    }
  }

  /**
   * Calculate overall priority score for a group
   */
  private calculateGroupPriority(group: IssueGroup): number {
    const severityWeight = group.severity === 'high' ? 3 : group.severity === 'medium' ? 2 : 1;
    const businessWeight = group.businessImpact === 'high' ? 3 : group.businessImpact === 'medium' ? 2 : 1;
    const effortWeight = group.effort === 'low' ? 3 : group.effort === 'medium' ? 2 : 1; // Lower effort = higher priority
    
    // Template issues get logarithmic scaling, individual issues get linear (capped)
    const pageImpact = group.isTemplateIssue 
      ? Math.log(group.pages.length + 1) * 2 
      : Math.min(group.pages.length, 5);
    
    return severityWeight * businessWeight * effortWeight * pageImpact;
  }

  /**
   * Generate summary report of issue grouping analysis
   */
  generateGroupingReport(groups: IssueGroup[]): {
    totalGroups: number;
    templateIssues: number;
    individualIssues: number;
    highPriorityGroups: number;
    totalPagesAffected: number;
    topPriorityGroups: IssueGroup[];
    efficiencyGains: {
      templateFixesAvailable: number;
      pagesFixedByTemplates: number;
      estimatedEffortReduction: string;
    };
  } {
    const totalGroups = groups.length;
    const templateIssues = groups.filter(g => g.isTemplateIssue).length;
    const individualIssues = totalGroups - templateIssues;
    const highPriorityGroups = groups.filter(g => g.severity === 'high').length;
    const totalPagesAffected = groups.reduce((sum, g) => sum + g.pages.length, 0);
    const topPriorityGroups = groups.slice(0, 10);
    
    const templateGroups = groups.filter(g => g.isTemplateIssue);
    const pagesFixedByTemplates = templateGroups.reduce((sum, g) => sum + g.pages.length, 0);
    const templateFixesAvailable = templateGroups.length;
    
    // Estimate effort reduction from template fixes
    const totalIndividualFixes = groups.reduce((sum, g) => sum + (g.isTemplateIssue ? 0 : g.pages.length), 0);
    const effortReduction = Math.round(((pagesFixedByTemplates) / (totalPagesAffected || 1)) * 100);
    
    return {
      totalGroups,
      templateIssues,
      individualIssues,
      highPriorityGroups,
      totalPagesAffected,
      topPriorityGroups,
      efficiencyGains: {
        templateFixesAvailable,
        pagesFixedByTemplates,
        estimatedEffortReduction: `${effortReduction}% effort reduction through template fixes`
      }
    };
  }
}