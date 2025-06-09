import * as cheerio from 'cheerio';

// Define ContentAnnotation interface in the server context
interface ContentAnnotation {
  content: string;
  issue: string;
  suggestion: string;
  position: number;
  severity: 'high' | 'medium' | 'low';
  type: 'structure' | 'readability' | 'semantics' | 'engagement';
}

/**
 * Service for generating content annotations
 */
export class ContentAnnotationService {
  /**
   * Generate annotations for header content
   */
  generateHeaderAnnotations(
    headerText: string, 
    primaryKeyword: string
  ): ContentAnnotation[] {
    const annotations: ContentAnnotation[] = [];
    
    // Check for primary keyword in header
    if (!headerText.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      annotations.push({
        content: headerText,
        issue: 'Missing primary keyword',
        suggestion: `Consider including your target keyword "${primaryKeyword}" in this header for better SEO`,
        position: 0,
        severity: 'high',
        type: 'semantics'
      });
    }
    
    // Check header length
    if (headerText.length > 60) {
      annotations.push({
        content: headerText,
        issue: 'Header too long',
        suggestion: 'Keep headers under 60 characters for better readability and SEO',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    } else if (headerText.length < 20 && headerText.split(' ').length < 3) {
      annotations.push({
        content: headerText,
        issue: 'Header too short',
        suggestion: 'Consider making your header more descriptive and informative',
        position: 0,
        severity: 'low',
        type: 'structure'
      });
    }
    
    // Check for "power words" in header
    const powerWords = [
      'amazing', 'exclusive', 'free', 'guaranteed', 'incredible', 'new', 'powerful', 
      'proven', 'secret', 'ultimate', 'unique', 'essential', 'best', 'instant', 'easy'
    ];
    
    const hasPowerWord = powerWords.some(word => 
      headerText.toLowerCase().includes(word.toLowerCase())
    );
    
    if (!hasPowerWord) {
      annotations.push({
        content: headerText,
        issue: 'Lacks emotional appeal',
        suggestion: 'Add emotional trigger words (e.g., "amazing", "proven", "essential") to make your header more compelling',
        position: 0,
        severity: 'low',
        type: 'engagement'
      });
    }
    
    // Check for numbers in header (which often improve CTR)
    const hasNumbers = /\d+/.test(headerText);
    if (!hasNumbers) {
      annotations.push({
        content: headerText,
        issue: 'No numbers in header',
        suggestion: 'Consider adding numbers (e.g., "7 Ways to..." or "5 Best...") to increase click-through rates',
        position: 0,
        severity: 'low',
        type: 'engagement'
      });
    }
    
    return annotations;
  }
  
  /**
   * Generate annotations for paragraph content
   */
  generateParagraphAnnotations(
    paragraphText: string, 
    primaryKeyword: string
  ): ContentAnnotation[] {
    const annotations: ContentAnnotation[] = [];
    
    // Check paragraph length
    const wordCount = paragraphText.split(/\s+/).length;
    
    if (wordCount > 150) {
      annotations.push({
        content: paragraphText.substring(0, 50) + "...",
        issue: 'Paragraph too long',
        suggestion: 'Break this paragraph into smaller chunks of 2-4 sentences for better readability',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    }
    
    // Check for passive voice (simple detection)
    const passiveVoiceIndicators = [
      ' was ', ' were ', ' is ', ' are ', ' has been ', ' have been ', 
      ' will be ', ' had been ', ' being '
    ];
    
    const passiveVoiceWords = [
      'made', 'done', 'created', 'written', 'provided', 'given', 'shown', 
      'seen', 'found', 'produced', 'established', 'formed', 'sold', 'used'
    ];
    
    const hasPassiveVoiceIndicator = passiveVoiceIndicators.some(indicator => 
      paragraphText.includes(indicator)
    );
    
    const hasPassiveVoiceWord = passiveVoiceWords.some(word => 
      paragraphText.includes(` ${word} `) || 
      paragraphText.includes(` ${word} by `)
    );
    
    if (hasPassiveVoiceIndicator && hasPassiveVoiceWord) {
      let passiveExample = "";
      // Find an example of passive voice in the paragraph
      for (const indicator of passiveVoiceIndicators) {
        if (paragraphText.includes(indicator)) {
          const sentenceStart = paragraphText.indexOf(indicator);
          const startPoint = Math.max(0, paragraphText.lastIndexOf('.', sentenceStart) + 1);
          const endPoint = paragraphText.indexOf('.', sentenceStart + 1);
          passiveExample = paragraphText.substring(startPoint, endPoint > 0 ? endPoint + 1 : paragraphText.length);
          break;
        }
      }
      
      annotations.push({
        content: passiveExample || paragraphText.substring(0, 50) + "...",
        issue: 'Passive voice detected',
        suggestion: 'Convert passive voice to active voice for more engaging and direct content',
        position: 0,
        severity: 'medium',
        type: 'readability'
      });
    }
    
    // Check for long sentences
    const sentences = paragraphText.split(/[.!?]+/).filter((s: any) => s.trim().length > 0);
    const longSentences = sentences.filter((s: any) => s.split(/\s+/).length > 25);
    
    if (longSentences.length > 0) {
      annotations.push({
        content: longSentences[0].substring(0, 60) + "...",
        issue: 'Long sentences detected',
        suggestion: 'Break down complex sentences for better readability. Aim for 15-20 words per sentence',
        position: 0,
        severity: 'medium',
        type: 'readability'
      });
    }
    
    // Check for transition words
    const transitionWords = [
      'additionally', 'consequently', 'furthermore', 'moreover', 'similarly', 
      'likewise', 'in contrast', 'conversely', 'on the other hand', 'however', 
      'nevertheless', 'nonetheless', 'therefore', 'thus', 'in conclusion', 
      'finally', 'in summary', 'to summarize', 'for example', 'for instance', 
      'specifically', 'in particular', 'notably', 'indeed'
    ];
    
    const hasTransitionWord = transitionWords.some(word => 
      paragraphText.toLowerCase().includes(word)
    );
    
    if (!hasTransitionWord && paragraphText.length > 80) {
      annotations.push({
        content: paragraphText.substring(0, 50) + "...",
        issue: 'Lacks transition words',
        suggestion: 'Add transition words (e.g., "furthermore", "however", "for example") to improve flow and readability',
        position: 0,
        severity: 'low',
        type: 'readability'
      });
    }
    
    // Check for keyword density (simple)
    const keywordAppearances = (paragraphText.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
    const keywordDensity = (keywordAppearances / wordCount) * 100;
    
    if (keywordDensity > 5) {
      annotations.push({
        content: paragraphText.substring(0, 50) + "...",
        issue: 'Keyword stuffing',
        suggestion: `Reduce usage of "${primaryKeyword}" as it appears excessive. Aim for natural inclusion`,
        position: 0,
        severity: 'high',
        type: 'semantics'
      });
    } else if (paragraphText.length > 100 && keywordAppearances === 0) {
      annotations.push({
        content: paragraphText.substring(0, 50) + "...",
        issue: 'Missing target keyword',
        suggestion: `Try to naturally include your target keyword "${primaryKeyword}" in this paragraph`,
        position: 0,
        severity: 'medium',
        type: 'semantics'
      });
    }
    
    return annotations;
  }
  
  /**
   * Generate annotations for CTA content
   */
  generateCTAAnnotations(
    ctaText: string, 
    primaryKeyword: string
  ): ContentAnnotation[] {
    const annotations: ContentAnnotation[] = [];
    
    // Check if CTA has action verbs
    const actionVerbs = [
      'get', 'download', 'subscribe', 'join', 'buy', 'order', 'register', 
      'sign up', 'start', 'try', 'contact', 'discover', 'learn', 'find out', 
      'explore', 'read', 'watch', 'view', 'see', 'check out'
    ];
    
    const hasActionVerb = actionVerbs.some(verb => 
      ctaText.toLowerCase().includes(verb)
    );
    
    if (!hasActionVerb) {
      annotations.push({
        content: ctaText,
        issue: 'Missing action verb',
        suggestion: 'Add a clear action verb (e.g., "Get", "Download", "Subscribe") to make your CTA more effective',
        position: 0,
        severity: 'high',
        type: 'engagement'
      });
    }
    
    // Check for urgency/scarcity indicators
    const urgencyWords = [
      'now', 'today', 'limited', 'exclusive', 'only', 'hurry', 'last chance', 
      'limited time', 'closing soon', 'expires', 'ends', 'don\'t miss', 'few left',
      'running out', 'soon', 'fast', 'instant', 'immediately', 'quick'
    ];
    
    const hasUrgency = urgencyWords.some(word => 
      ctaText.toLowerCase().includes(word)
    );
    
    if (!hasUrgency) {
      annotations.push({
        content: ctaText,
        issue: 'No sense of urgency',
        suggestion: 'Add urgency indicators (e.g., "today", "limited time", "now") to encourage immediate action',
        position: 0,
        severity: 'medium',
        type: 'engagement'
      });
    }
    
    // Check CTA length
    if (ctaText.length > 50) {
      annotations.push({
        content: ctaText,
        issue: 'CTA too long',
        suggestion: 'Keep your CTA text brief and direct, ideally under 50 characters',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    } else if (ctaText.length < 10) {
      annotations.push({
        content: ctaText,
        issue: 'CTA too short',
        suggestion: 'Make your CTA more descriptive of the value users will receive',
        position: 0,
        severity: 'low',
        type: 'structure'
      });
    }
    
    // Check if CTA contains value proposition
    if (!ctaText.includes('free') && 
        !ctaText.includes('save') && 
        !ctaText.includes('discount') && 
        !ctaText.includes('offer') && 
        !ctaText.includes('benefit') && 
        !ctaText.includes('improve') && 
        !ctaText.includes('boost') &&
        !ctaText.includes('increase') &&
        !ctaText.includes('learn') &&
        !ctaText.includes('discover')) {
      annotations.push({
        content: ctaText,
        issue: 'Missing value proposition',
        suggestion: 'Clearly communicate the value users will get from clicking (e.g., "Get Free Guide", "Save 20% Today")',
        position: 0,
        severity: 'medium',
        type: 'engagement'
      });
    }
    
    return annotations;
  }
  
  /**
   * Identify if text contains paragraphs with introduction characteristics
   */
  identifyIntroductionParagraphs(
    paragraphs: string[],
    pageTitle: string,
    primaryKeyword: string
  ): { introContent: string, annotations: ContentAnnotation[] } {
    if (paragraphs.length === 0) {
      return { 
        introContent: "No introduction content found", 
        annotations: [{
          content: "Missing introduction",
          issue: "No introduction content found",
          suggestion: "Add an engaging introduction that includes your primary keyword",
          position: 0,
          severity: 'high',
          type: 'structure'
        }]
      };
    }
    
    // Typically the first 1-2 paragraphs form the introduction
    const introductionParagraphs = paragraphs.slice(0, Math.min(2, paragraphs.length));
    const introductionText = introductionParagraphs.join('\n\n');
    const annotations: ContentAnnotation[] = [];
    
    // Check if introduction contains the primary keyword
    if (!introductionText.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      annotations.push({
        content: introductionText,
        issue: 'Introduction missing primary keyword',
        suggestion: `Include your primary keyword "${primaryKeyword}" early in the introduction`,
        position: 0,
        severity: 'high',
        type: 'semantics'
      });
    }
    
    // Check if introduction addresses the topic in the title
    if (pageTitle && !introductionText.toLowerCase().includes(pageTitle.toLowerCase().substring(0, 15))) {
      annotations.push({
        content: introductionText,
        issue: 'Introduction not aligned with title',
        suggestion: 'Make sure your introduction clearly addresses the topic promised in your title',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    }
    
    // Check if introduction has a hook
    const hasQuestion = introductionText.includes('?');
    const hasStatistic = /\d+%|\d+\s+out of|\d+\s+of/.test(introductionText);
    const hasQuote = introductionText.includes('"') || introductionText.includes('"') || introductionText.includes("'");
    
    if (!hasQuestion && !hasStatistic && !hasQuote) {
      annotations.push({
        content: introductionText,
        issue: 'Missing engaging hook',
        suggestion: 'Add a question, statistic, or quote to hook readers from the start',
        position: 0,
        severity: 'medium',
        type: 'engagement'
      });
    }
    
    // Check introduction length
    const wordCount = introductionText.split(/\s+/).length;
    if (wordCount < 30) {
      annotations.push({
        content: introductionText,
        issue: 'Introduction too short',
        suggestion: 'Expand your introduction to at least 40-60 words to properly set context',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    } else if (wordCount > 150) {
      annotations.push({
        content: introductionText,
        issue: 'Introduction too long',
        suggestion: 'Keep your introduction concise, ideally 60-120 words',
        position: 0,
        severity: 'low',
        type: 'structure'
      });
    }
    
    return { introContent: introductionText, annotations };
  }
  
  /**
   * Identify if text contains paragraphs with conclusion characteristics
   */
  identifyConclusionParagraphs(
    paragraphs: string[],
    primaryKeyword: string
  ): { conclusionContent: string, annotations: ContentAnnotation[] } {
    if (paragraphs.length <= 1) {
      return { 
        conclusionContent: "No conclusion content found", 
        annotations: [{
          content: "Missing conclusion",
          issue: "No conclusion content found",
          suggestion: "Add a conclusion that summarizes key points and includes a clear call-to-action",
          position: 0,
          severity: 'high',
          type: 'structure'
        }]
      };
    }
    
    // Typically the last 1-2 paragraphs form the conclusion
    const conclusionParagraphs = paragraphs.slice(-Math.min(2, paragraphs.length));
    const conclusionText = conclusionParagraphs.join('\n\n');
    const annotations: ContentAnnotation[] = [];
    
    // Check for conclusion indicators
    const conclusionIndicators = [
      'in conclusion', 'to summarize', 'to sum up', 'finally', 'in summary',
      'overall', 'in the end', 'as a result', 'ultimately', 'in closing'
    ];
    
    const hasIndicator = conclusionIndicators.some(indicator => 
      conclusionText.toLowerCase().includes(indicator)
    );
    
    if (!hasIndicator) {
      annotations.push({
        content: conclusionText,
        issue: 'Missing conclusion indicator',
        suggestion: 'Use a clear transition phrase (e.g., "In conclusion", "To summarize") to signal the conclusion',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    }
    
    // Check if conclusion mentions the primary keyword
    if (!conclusionText.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      annotations.push({
        content: conclusionText,
        issue: 'Conclusion missing primary keyword',
        suggestion: `Include your primary keyword "${primaryKeyword}" in the conclusion for reinforcement`,
        position: 0,
        severity: 'medium',
        type: 'semantics'
      });
    }
    
    // Check if conclusion has a call-to-action
    const ctaIndicators = [
      'contact', 'call', 'email', 'click', 'buy', 'sign up', 'register',
      'download', 'get', 'try', 'visit', 'learn more', 'find out', 'discover'
    ];
    
    const hasCTA = ctaIndicators.some(indicator => 
      conclusionText.toLowerCase().includes(indicator)
    );
    
    if (!hasCTA) {
      annotations.push({
        content: conclusionText,
        issue: 'Missing call-to-action',
        suggestion: 'Add a clear call-to-action directing readers on what to do next',
        position: 0,
        severity: 'high',
        type: 'engagement'
      });
    }
    
    // Check conclusion length
    const wordCount = conclusionText.split(/\s+/).length;
    if (wordCount < 30) {
      annotations.push({
        content: conclusionText,
        issue: 'Conclusion too short',
        suggestion: 'Expand your conclusion to at least 40-60 words to properly summarize and direct readers',
        position: 0,
        severity: 'medium',
        type: 'structure'
      });
    } else if (wordCount > 150) {
      annotations.push({
        content: conclusionText,
        issue: 'Conclusion too long',
        suggestion: 'Keep your conclusion concise, ideally 60-120 words',
        position: 0,
        severity: 'low',
        type: 'structure'
      });
    }
    
    return { conclusionContent: conclusionText, annotations };
  }
}

export const contentAnnotationService = new ContentAnnotationService();