import { CrawlerOutput } from '@/lib/types';

/**
 * Content optimization analyzer for detecting and fixing common SEO content issues
 */
class ContentOptimizationAnalyzer {
  /**
   * Primary method to analyze content for various SEO optimizations
   */
  analyzeContent(pageData: CrawlerOutput, primaryKeyword?: string): any {
    // Don't analyze if there was an error fetching the page
    if (pageData.error) {
      return {
        score: 0,
        message: `Cannot analyze content: ${pageData.error}`,
        issues: [],
        recommendations: []
      };
    }

    const contentText = pageData.content.text;
    const wordCount = pageData.content.wordCount;
    const paragraphs = pageData.content.paragraphs;
    
    const title = pageData.title || '';
    const description = pageData.meta.description || '';
    
    // Gather all issues
    const issues = [];
    const recommendations = [];
    
    // Check content length
    if (wordCount < 300) {
      issues.push(`Thin content detected: Only ${wordCount} words.`);
      recommendations.push('Expand content to at least 600 words for better keyword coverage and relevance.');
    }
    
    // Check for title issues
    if (!title) {
      issues.push('Missing title tag.');
      recommendations.push('Add a descriptive title tag that includes your primary keyword.');
    } else if (title.length < 30) {
      issues.push(`Title tag is too short (${title.length} characters).`);
      recommendations.push('Expand your title to 50-60 characters to better target keywords and improve CTR.');
    } else if (title.length > 70) {
      issues.push(`Title tag is too long (${title.length} characters) and may be truncated in search results.`);
      recommendations.push('Keep your title under 60 characters to ensure it displays properly in search results.');
    }
    
    // Check for meta description issues
    if (!description) {
      issues.push('Missing meta description.');
      recommendations.push('Add a meta description that summarizes the page content and includes your primary keyword.');
    } else if (description.length < 70) {
      issues.push(`Meta description is too short (${description.length} characters).`);
      recommendations.push('Expand your meta description to 120-160 characters for better visibility in search results.');
    } else if (description.length > 320) {
      issues.push(`Meta description is too long (${description.length} characters) and may be truncated in search results.`);
      recommendations.push('Keep your meta description under 160 characters to ensure it displays properly in search results.');
    }
    
    // Check for proper heading structure
    this.analyzeHeadingStructure(pageData, issues, recommendations);
    
    // Check for keyword usage if a primary keyword is provided
    if (primaryKeyword) {
      this.analyzeKeywordUsage(pageData, primaryKeyword, issues, recommendations);
    }
    
    // Check for proper paragraph structure
    if (paragraphs.length === 0) {
      issues.push('No paragraphs detected in content.');
      recommendations.push('Structure your content with clear paragraphs using proper HTML <p> tags.');
    } else {
      const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 200).length;
      if (longParagraphs > 0) {
        issues.push(`${longParagraphs} extremely long paragraphs detected.`);
        recommendations.push('Break up long paragraphs into smaller, more digestible chunks of 3-5 sentences each.');
      }
    }
    
    // Check for proper internal linking
    this.analyzeInternalLinking(pageData, issues, recommendations);
    
    // Check for image optimization
    this.analyzeImageOptimization(pageData, issues, recommendations);
    
    // Calculate overall content quality score (0-100)
    const score = this.calculateContentScore(issues.length, wordCount, pageData);
    
    // Determine content quality assessment
    let assessment = '';
    if (score >= 90) {
      assessment = 'Excellent';
    } else if (score >= 80) {
      assessment = 'Good';
    } else if (score >= 60) {
      assessment = 'Needs improvement';
    } else {
      assessment = 'Poor';
    }
    
    // Return comprehensive analysis
    return {
      score,
      assessment,
      wordCount,
      readability: this.analyzeReadability(contentText),
      issues,
      recommendations,
      keywordAnalysis: primaryKeyword 
        ? this.getKeywordStats(pageData, primaryKeyword) 
        : null
    };
  }
  
  /**
   * Analyze heading structure and hierarchy
   */
  private analyzeHeadingStructure(pageData: CrawlerOutput, issues: string[], recommendations: string[]): void {
    const { h1, h2, h3, h4, h5, h6 } = pageData.headings;
    
    // Check for H1 tag
    if (h1.length === 0) {
      issues.push('Missing H1 heading.');
      recommendations.push('Add a single H1 heading that clearly describes the page and includes your primary keyword.');
    } else if (h1.length > 1) {
      issues.push(`Multiple H1 headings detected (${h1.length}).`);
      recommendations.push('Use only one H1 heading per page as a main topic identifier.');
    }
    
    // Check for proper heading hierarchy
    if (h2.length === 0 && (h3.length > 0 || h4.length > 0)) {
      issues.push('Improper heading hierarchy: H3 or H4 tags used without H2 tags.');
      recommendations.push('Structure your headings properly: H1 → H2 → H3, etc.');
    }
    
    // Check for excessive headings
    const totalHeadings = h1.length + h2.length + h3.length + h4.length + h5.length + h6.length;
    if (totalHeadings > 20) {
      issues.push(`Excessive number of headings (${totalHeadings}).`);
      recommendations.push('Consider consolidating your content structure for better readability.');
    }
    
    // Check for empty headings
    const emptyHeadings = [
      ...h1.filter(h => h.trim() === ''),
      ...h2.filter(h => h.trim() === ''),
      ...h3.filter(h => h.trim() === ''),
      ...h4.filter(h => h.trim() === ''),
      ...h5.filter(h => h.trim() === ''),
      ...h6.filter(h => h.trim() === '')
    ].length;
    
    if (emptyHeadings > 0) {
      issues.push(`Empty headings detected (${emptyHeadings}).`);
      recommendations.push('Remove or add content to empty heading tags.');
    }
  }
  
  /**
   * Analyze keyword usage throughout the page
   */
  private analyzeKeywordUsage(pageData: CrawlerOutput, keyword: string, issues: string[], recommendations: string[]): void {
    const keywordLower = keyword.toLowerCase();
    const title = (pageData.title || '').toLowerCase();
    const description = (pageData.meta.description || '').toLowerCase();
    const h1 = pageData.headings.h1.map(h => h.toLowerCase()).join(' ');
    const contentText = pageData.content.text.toLowerCase();
    
    // Check keyword presence in title
    if (!title.includes(keywordLower)) {
      issues.push('Primary keyword missing from title tag.');
      recommendations.push(`Include your primary keyword "${keyword}" in the title tag.`);
    }
    
    // Check keyword presence in meta description
    if (!description.includes(keywordLower)) {
      issues.push('Primary keyword missing from meta description.');
      recommendations.push(`Include your primary keyword "${keyword}" in the meta description.`);
    }
    
    // Check keyword presence in H1
    if (!h1.includes(keywordLower)) {
      issues.push('Primary keyword missing from H1 heading.');
      recommendations.push(`Include your primary keyword "${keyword}" in the H1 heading.`);
    }
    
    // Check keyword presence in first 100 words
    const first100Words = contentText.split(/\s+/).slice(0, 100).join(' ');
    if (!first100Words.includes(keywordLower)) {
      issues.push('Primary keyword not found in the first 100 words of content.');
      recommendations.push(`Include your primary keyword "${keyword}" within the first paragraph of your content.`);
    }
    
    // Calculate keyword density
    const wordCount = contentText.split(/\s+/).length;
    const keywordCount = (contentText.match(new RegExp(keywordLower, 'g')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;
    
    if (keywordDensity > 3) {
      issues.push(`Keyword stuffing detected: Keyword density is ${keywordDensity.toFixed(1)}%.`);
      recommendations.push('Reduce keyword density to 1-2% to avoid over-optimization penalties.');
    } else if (keywordCount === 0) {
      issues.push('Primary keyword not found in content.');
      recommendations.push(`Include your primary keyword "${keyword}" naturally throughout your content.`);
    } else if (keywordDensity < 0.5 && wordCount > 300) {
      issues.push(`Low keyword density: ${keywordDensity.toFixed(1)}%.`);
      recommendations.push('Increase keyword usage naturally throughout your content to reach 0.5-2% density.');
    }
  }
  
  /**
   * Analyze internal linking structure
   */
  private analyzeInternalLinking(pageData: CrawlerOutput, issues: string[], recommendations: string[]): void {
    const internalLinks = pageData.links.internal;
    const contentWords = pageData.content.wordCount;
    
    // Check for broken internal links
    const brokenLinks = internalLinks.filter(link => link.broken);
    if (brokenLinks.length > 0) {
      issues.push(`${brokenLinks.length} broken internal ${brokenLinks.length === 1 ? 'link' : 'links'} detected.`);
      recommendations.push('Fix all broken internal links to improve user experience and site crawlability.');
    }
    
    // Check link-to-text ratio
    if (contentWords > 500 && internalLinks.length === 0) {
      issues.push('No internal links in content.');
      recommendations.push('Add relevant internal links to help users and search engines navigate your site.');
    } else if (contentWords > 1000) {
      const linkRatio = internalLinks.length / (contentWords / 1000);
      if (linkRatio < 1) {
        issues.push('Low internal linking ratio for content length.');
        recommendations.push('Add more internal links to related content (aim for 2-3 links per 1,000 words).');
      } else if (linkRatio > 8) {
        issues.push('Excessive internal linking detected.');
        recommendations.push('Reduce the number of internal links to avoid looking spammy to search engines.');
      }
    }
    
    // Check for duplicate identical links
    const linkUrls = internalLinks.map(link => link.url);
    const duplicateLinks = linkUrls.filter((url, index) => linkUrls.indexOf(url) !== index);
    const uniqueDuplicates = [...new Set(duplicateLinks)];
    
    if (uniqueDuplicates.length > 0) {
      issues.push(`${uniqueDuplicates.length} duplicate internal ${uniqueDuplicates.length === 1 ? 'link was' : 'links were'} found.`);
      recommendations.push('Avoid linking to the same URL multiple times with identical anchor text.');
    }
  }
  
  /**
   * Analyze image optimization
   */
  private analyzeImageOptimization(pageData: CrawlerOutput, issues: string[], recommendations: string[]): void {
    const images = pageData.images;
    
    // Check for images without alt text
    const missingAltImages = images.filter(img => !img.alt || img.alt.trim() === '');
    if (missingAltImages.length > 0) {
      issues.push(`${missingAltImages.length} ${missingAltImages.length === 1 ? 'image is' : 'images are'} missing alt text.`);
      recommendations.push('Add descriptive alt text to all images for better accessibility and SEO.');
    }
    
    // Check for pages with lots of content but no images
    if (images.length === 0 && pageData.content.wordCount > 600) {
      issues.push('No images found in content-heavy page.');
      recommendations.push('Add relevant images to break up text and improve engagement (aim for at least one image per 300-500 words).');
    }
    
    // Check for oversized images
    const largeImages = images.filter(img => img.size && img.size > 200000); // Over 200KB
    if (largeImages.length > 0) {
      issues.push(`${largeImages.length} ${largeImages.length === 1 ? 'image is' : 'images are'} oversized (>200KB).`);
      recommendations.push('Optimize large images to under 100KB when possible to improve page load speed.');
    }
  }
  
  /**
   * Analyze content readability
   */
  private analyzeReadability(text: string): any {
    // Simple syllable counter
    const countSyllables = (word: string): number => {
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) return 1;
      
      // Count vowel groups
      const vowelGroups = word.replace(/[^aeiouy]+/g, '.').replace(/\\.+/g, '.').replace(/^\\.|\\.$/, '');
      let count = vowelGroups.length;
      
      // Apply common English syllable adjustments
      if (word.endsWith('e')) count--;
      if (word.endsWith('le') && word.length > 2) count++;
      if (word.endsWith('y') && !isVowel(word.charAt(word.length - 2))) count++;
      
      return Math.max(1, count);
    };
    
    const isVowel = (char: string): boolean => {
      return 'aeiouy'.includes(char);
    };
    
    // Prepare text
    const cleanText = text.replace(/[^a-zA-Z0-9 .!?]/g, '');
    const words = cleanText.match(/\b\w+\b/g) || [];
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length === 0 || sentences.length === 0) {
      return {
        score: 0,
        grade: 'Not applicable',
        averageWordsPerSentence: 0,
        complexWordPercentage: 0,
        fleschKincaidGrade: 0
      };
    }
    
    // Calculate basic metrics
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const complexWords = words.filter(word => countSyllables(word) > 2).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    const complexWordPercentage = (complexWords / wordCount) * 100;
    
    // Calculate Flesch-Kincaid Grade Level
    const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * (syllableCount / wordCount) - 15.59;
    
    // Determine readability assessment
    let grade: string;
    let score: number;
    
    if (fleschKincaidGrade <= 6) {
      grade = 'Very Easy';
      score = 90;
    } else if (fleschKincaidGrade <= 8) {
      grade = 'Easy';
      score = 80;
    } else if (fleschKincaidGrade <= 10) {
      grade = 'Fairly Easy';
      score = 70;
    } else if (fleschKincaidGrade <= 12) {
      grade = 'Medium';
      score = 60;
    } else if (fleschKincaidGrade <= 14) {
      grade = 'Fairly Difficult';
      score = 50;
    } else if (fleschKincaidGrade <= 17) {
      grade = 'Difficult';
      score = 40;
    } else {
      grade = 'Very Difficult';
      score = 30;
    }
    
    return {
      score,
      grade,
      averageWordsPerSentence: avgWordsPerSentence.toFixed(1),
      complexWordPercentage: complexWordPercentage.toFixed(1),
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade.toFixed(1))
    };
  }
  
  /**
   * Calculate overall content quality score
   */
  private calculateContentScore(issueCount: number, wordCount: number, pageData: CrawlerOutput): number {
    // Start with base score of 100
    let score = 100;
    
    // Deduct points for issues (more issues = more deductions)
    score -= Math.min(50, issueCount * 5);
    
    // Adjust for content length
    if (wordCount < 300) {
      score -= 30;
    } else if (wordCount < 600) {
      score -= 15;
    } else if (wordCount < 900) {
      score -= 5;
    }
    
    // Adjust for page title
    if (!pageData.title) {
      score -= 15;
    } else if (pageData.title.length < 20 || pageData.title.length > 70) {
      score -= 5;
    }
    
    // Adjust for meta description
    if (!pageData.meta.description) {
      score -= 10;
    } else if (pageData.meta.description.length < 70 || pageData.meta.description.length > 320) {
      score -= 5;
    }
    
    // Adjust for heading structure
    if (pageData.headings.h1.length === 0) {
      score -= 10;
    } else if (pageData.headings.h1.length > 1) {
      score -= 5;
    }
    
    if (pageData.headings.h2.length === 0) {
      score -= 5;
    }
    
    // Adjust for broken internal links
    const brokenLinksCount = pageData.links.internal.filter(link => link.broken).length;
    score -= Math.min(15, brokenLinksCount * 3);
    
    // Adjust for missing image alt text
    const missingAltTextCount = pageData.images.filter(img => !img.alt || img.alt.trim() === '').length;
    score -= Math.min(10, missingAltTextCount);
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Get detailed keyword statistics
   */
  private getKeywordStats(pageData: CrawlerOutput, keyword: string): any {
    const keywordLower = keyword.toLowerCase();
    const title = (pageData.title || '').toLowerCase();
    const description = (pageData.meta.description || '').toLowerCase();
    const contentText = pageData.content.text.toLowerCase();
    const h1 = pageData.headings.h1.map(h => h.toLowerCase()).join(' ');
    const h2 = pageData.headings.h2.map(h => h.toLowerCase()).join(' ');
    
    // Count occurrences
    const titleCount = (title.match(new RegExp(keywordLower, 'g')) || []).length;
    const descriptionCount = (description.match(new RegExp(keywordLower, 'g')) || []).length;
    const h1Count = (h1.match(new RegExp(keywordLower, 'g')) || []).length;
    const h2Count = (h2.match(new RegExp(keywordLower, 'g')) || []).length;
    const contentCount = (contentText.match(new RegExp(keywordLower, 'g')) || []).length;
    
    // Calculate density
    const wordCount = contentText.split(/\s+/).length;
    const keywordDensity = wordCount > 0 ? (contentCount / wordCount) * 100 : 0;
    
    // Check URL presence
    const url = pageData.url.toLowerCase();
    const inUrl = url.includes(keywordLower.replace(/\s+/g, '-')) || 
                 url.includes(keywordLower.replace(/\s+/g, '_')) ||
                 url.includes(keywordLower.replace(/\s+/g, ''));
    
    // Check presence in first paragraph
    const paragraphs = pageData.content.paragraphs;
    const inFirstParagraph = paragraphs.length > 0 ? 
      paragraphs[0].toLowerCase().includes(keywordLower) : false;
    
    return {
      keyword,
      inTitle: titleCount > 0,
      inDescription: descriptionCount > 0,
      inH1: h1Count > 0,
      inH2: h2Count > 0,
      inUrl,
      inFirstParagraph,
      occurrences: {
        title: titleCount,
        description: descriptionCount,
        h1: h1Count,
        h2: h2Count,
        content: contentCount
      },
      density: keywordDensity.toFixed(2) + '%',
      totalCount: titleCount + descriptionCount + h1Count + h2Count + contentCount
    };
  }
}

export const contentOptimizationAnalyzer = new ContentOptimizationAnalyzer();