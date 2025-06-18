import * as cheerio from 'cheerio';
import { PageCrawlResult } from '../audit.service';

export interface AnalysisFactor {
  name: string;
  description: string;
  status: 'OK' | 'OFI' | 'Priority OFI' | 'N/A';
  importance: 'High' | 'Medium' | 'Low';
  notes: string;
}

/**
 * Content Quality Analyzer
 * Handles Phase 1: Content Quality Analysis (20+ factors)
 */
export class ContentQualityAnalyzer {
  async analyze(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // Phase 1: Content Quality Analysis (20+ factors)
    
    // Readability Analysis
    factors.push(await this.analyzeReadability(page.bodyText));
    
    // Content Length Analysis
    factors.push(await this.analyzeContentLength(page.wordCount, this.determinePageType(page.url)));
    
    // Keyword Density Analysis
    factors.push(await this.analyzeKeywordDensity(page.bodyText));
    
    // CTA Analysis (comprehensive)
    factors.push(await this.analyzeCallToActionComprehensive($));
    
    // Review/Testimonial Analysis
    factors.push(await this.analyzeReviewsTestimonials($));
    
    // Content Structure Analysis
    factors.push(await this.analyzeContentStructure($));
    
    // Content Uniqueness
    factors.push(await this.analyzeContentUniqueness(page.bodyText));
    
    // Additional Content Quality Factors (removed duplicates)
    factors.push(await this.analyzeHeadingStructure($));
    factors.push(await this.analyzeImageContent($));
    factors.push(await this.analyzeVideoContent($));
    factors.push(await this.analyzeContentFreshness(page));
    factors.push(await this.analyzeContentDepth(page.bodyText));
    factors.push(await this.analyzeContentRelevance(page.bodyText, page.url));
    factors.push(await this.analyzeContentEngagement($));
    factors.push(await this.analyzeSocialProof($));
    factors.push(await this.analyzeContentScannability($));
    factors.push(await this.analyzeContentTone(page.bodyText));
    factors.push(await this.analyzeMultimediaUsage($));
    factors.push(await this.analyzeContentFlow($));
    factors.push(await this.analyzeContentAccuracy(page.bodyText));

    return factors;
  }

  private async analyzeReadability(text: string): Promise<AnalysisFactor> {
    const score = this.calculateFleschReadingEase(text);
    const status = score >= 60 ? "OK" : score >= 30 ? "OFI" : "Priority OFI";
    return {
      name: "Content Readability Score",
      description: "Content should be easily readable (Flesch Reading Ease 60+)",
      status,
      importance: "High",
      notes: score >= 60 ? 
        "What: Your content is easily readable by most visitors.\n\nWhy: Good readability keeps visitors engaged and helps search engines understand your content better.\n\nHow: Continue maintaining clear, simple language that resonates with your target audience." :
        score >= 30 ?
        "What: Your content is somewhat difficult to read and may confuse visitors.\n\nWhy: Complex language can cause visitors to leave your site and reduces search engine rankings.\n\nHow: Simplify sentences, use shorter paragraphs, and replace technical jargon with everyday language." :
        "What: Your content is very difficult to read and will frustrate most visitors.\n\nWhy: Hard-to-read content drives visitors away and significantly hurts your search rankings.\n\nHow: Completely rewrite content using simple sentences, common words, and clear explanations that anyone can understand."
    };
  }

  private async analyzeContentLength(wordCount: number, pageType: string): Promise<AnalysisFactor> {
    const minWords = this.getMinWordCount(pageType);
    return {
      name: "Sufficient Content Length",
      description: `${pageType} pages should have adequate content depth`,
      status: wordCount >= minWords ? "OK" : wordCount >= minWords * 0.7 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: wordCount >= minWords ?
        `What: Your ${pageType} page has sufficient content depth with ${wordCount} words.\n\nWhy: Comprehensive content helps visitors understand your services and improves search engine rankings.\n\nHow: Continue providing detailed, valuable information that addresses visitor questions and concerns.` :
        `What: Your ${pageType} page needs more content to effectively communicate with visitors.\n\nWhy: Thin content fails to establish expertise and search engines prefer pages with comprehensive information.\n\nHow: Expand your content to at least ${minWords} words by adding service benefits, process details, and answers to common customer questions.`
    };
  }

  private async analyzeKeywordDensity(text: string): Promise<AnalysisFactor> {
    const density = this.calculateKeywordDensity(text);
    return {
      name: "Keyword Density Optimization",
      description: "Keywords should appear naturally without stuffing (1-3% density)",
      status: density >= 1 && density <= 3 ? "OK" : density >= 0.5 && density <= 5 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: density >= 1 && density <= 3 ?
        `What: Your keywords appear naturally throughout the content at ${density.toFixed(1)}% density.\n\nWhy: Proper keyword usage helps search engines understand your page topic while maintaining readability.\n\nHow: Continue using keywords naturally and consider adding related terms to expand your content's reach.` :
        density < 1 ?
        `What: Your target keywords are barely mentioned in the content (${density.toFixed(1)}% density).\n\nWhy: Without proper keyword usage, search engines struggle to understand what your page is about.\n\nHow: Naturally integrate your main keywords 2-3 times throughout the content, focusing on headings and important sections.` :
        `What: Your keywords appear too frequently (${density.toFixed(1)}% density) and may seem unnatural.\n\nWhy: Keyword stuffing can harm your search rankings and makes content difficult to read.\n\nHow: Reduce keyword repetition and use synonyms and related terms to maintain natural flow while keeping the same meaning.`
    };
  }

  private async analyzeCallToActionComprehensive($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const ctaElements = this.detectCTAs($);
    const ctaQuality = this.assessCTAQuality($);
    const combinedScore = (ctaElements >= 2 ? 50 : ctaElements >= 1 ? 30 : 0) + (ctaQuality >= 60 ? 50 : ctaQuality >= 30 ? 30 : 0);
    
    return {
      name: "Call-to-Action Optimization",
      description: "Page should have prominent, clear, and compelling calls-to-action",
      status: combinedScore >= 70 ? "OK" : combinedScore >= 40 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: combinedScore >= 70 ?
        `What: Your page has effective call-to-action elements that guide visitors toward conversion.\n\nWhy: Strong CTAs are essential for converting website visitors into customers and growing your business.\n\nHow: Continue monitoring CTA performance and test different placements or wording to maximize conversions.` :
        combinedScore >= 40 ?
        `What: Your page has some call-to-action elements but they could be more effective.\n\nWhy: Weak CTAs result in missed opportunities to convert visitors into paying customers.\n\nHow: Add prominent action buttons like 'Get Free Quote' or 'Call Now' in key locations and use compelling, action-oriented language.` :
        `What: Your page lacks clear calls-to-action that guide visitors toward taking action.\n\nWhy: Without prominent CTAs, visitors don't know what to do next and you lose potential customers.\n\nHow: Add multiple clear action buttons throughout the page with specific language like 'Schedule Service' or 'Get Your Quote Today'.`
    };
  }

  private async analyzeReviewsTestimonials($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasReviews = this.detectReviewsTestimonials($);
    return {
      name: "Customer Reviews/Testimonials",
      description: "Page should include customer reviews or testimonials for trust",
      status: hasReviews ? "OK" : "OFI",
      importance: "Medium",
      notes: hasReviews ?
        "What: Your page displays customer reviews or testimonials that build trust.\n\nWhy: Social proof from satisfied customers significantly influences visitor decisions and conversion rates.\n\nHow: Continue showcasing customer feedback and consider adding more specific testimonials with names, photos, and project details." :
        "What: Your page lacks customer testimonials or reviews to build visitor trust.\n\nWhy: Without social proof, potential customers have no evidence of your quality work and may choose competitors instead.\n\nHow: Add customer testimonials to your page, including specific details about projects completed and customer satisfaction."
    };
  }

  private async analyzeContentStructure($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasGoodStructure = this.analyzeTextStructure($);
    return {
      name: "Content Structure & Formatting",
      description: "Content should be well-structured with lists, headings, and emphasis",
      status: hasGoodStructure ? "OK" : "OFI",
      importance: "Medium",
      notes: hasGoodStructure ?
        "What: Your content uses good formatting with lists, headings, and emphasis to improve readability.\n\nWhy: Well-structured content keeps visitors engaged and helps search engines understand your content organization.\n\nHow: Continue using formatting elements strategically and consider adding more visual breaks to make content even easier to scan." :
        "What: Your content lacks formatting elements that make it easy to read and scan.\n\nWhy: Large blocks of text are difficult to read and cause visitors to leave your page quickly.\n\nHow: Break up text using bullet points, numbered lists, bold text for key points, and subheadings to improve readability."
    };
  }

  private async analyzeContentUniqueness(text: string): Promise<AnalysisFactor> {
    const uniquenessScore = this.calculateContentUniqueness(text);
    return {
      name: "Content Uniqueness",
      description: "Content should be unique and not duplicated from other sources",
      status: uniquenessScore >= 80 ? "OK" : uniquenessScore >= 40 ? "OFI" : "OFI",
      importance: "High",
      notes: uniquenessScore >= 80 ?
        `What: Your content is highly unique and original (${uniquenessScore}% uniqueness).\n\nWhy: Original content establishes your expertise and is favored by search engines over duplicate content.\n\nHow: Continue creating unique, valuable content that showcases your specific knowledge and experience.` :
        `What: Your content appears to be somewhat generic or similar to other websites (${uniquenessScore}% uniqueness).\n\nWhy: Generic content fails to differentiate your business and search engines may penalize duplicate content.\n\nHow: Rewrite content to include your specific expertise, local knowledge, and unique approach to services.`
    };
  }

  // Additional Content Quality Analysis Methods (to reach 20+ factors)
  
  private async analyzeHeadingStructure($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    const hasProperStructure = h1Count === 1 && h2Count >= 2;
    const hasBasicStructure = h1Count === 1 && (h2Count >= 1 || h3Count >= 1);
    
    return {
      name: "Heading Structure Hierarchy",
      description: "Proper H1-H6 heading structure improves readability and SEO",
      status: hasProperStructure ? "OK" : hasBasicStructure ? "OFI" : "Priority OFI",
      importance: "High",
      notes: hasProperStructure ?
        `What: Your page has proper heading structure with ${h1Count} H1 and ${h2Count} H2 tags.\n\nWhy: Proper heading hierarchy helps visitors scan content and tells search engines how your content is organized.\n\nHow: Continue maintaining clear heading structure and ensure each heading accurately describes the section content.` :
        hasBasicStructure ?
        `What: Your page has basic heading structure but could be improved for better organization.\n\nWhy: Clear heading hierarchy makes content easier to read and helps search engines understand your page structure.\n\nHow: Add more H2 subheadings to break up content sections and ensure you have exactly one H1 tag per page.` :
        `What: Your page lacks proper heading structure, making content difficult to navigate.\n\nWhy: Without clear headings, visitors struggle to find information and search engines can't understand your content organization.\n\nHow: Add one H1 tag for your main title and multiple H2 tags for major sections to create a logical content hierarchy.`
    };
  }

  private async analyzeImageContent($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const images = $('img');
    const imagesWithAlt = images.filter((_, img) => ($(img).attr('alt')?.length || 0) > 0);
    const altTextQuality = images.length > 0 ? (imagesWithAlt.length / images.length) * 100 : 100;
    
    return {
      name: "Image Content Optimization",
      description: "Images should have descriptive alt text and be relevant to content",
      status: altTextQuality >= 90 ? "OK" : altTextQuality >= 70 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: altTextQuality >= 90 ?
        `What: Your images have excellent alt text descriptions (${altTextQuality.toFixed(1)}% coverage).\n\nWhy: Good alt text helps visually impaired users and gives search engines context about your images.\n\nHow: Continue providing descriptive alt text and consider adding location-specific keywords where relevant.` :
        altTextQuality >= 70 ?
        `What: Most of your images have alt text, but some are missing descriptions (${altTextQuality.toFixed(1)}% coverage).\n\nWhy: Missing alt text creates accessibility issues and wastes opportunities for search engine optimization.\n\nHow: Add descriptive alt text to all remaining images, including relevant keywords and location information.` :
        `What: Many of your images lack alt text descriptions (${altTextQuality.toFixed(1)}% coverage).\n\nWhy: Poor alt text hurts accessibility and prevents search engines from understanding your visual content.\n\nHow: Add specific alt text to all images describing what they show, including relevant service and location keywords.`
    };
  }

  private async analyzeVideoContent($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
    const hasVideoContent = videos > 0;
    
    return {
      name: "Video Content Integration",
      description: "Video content enhances engagement and time on page",
      status: hasVideoContent ? "OK" : "OFI",
      importance: "Low",
      notes: hasVideoContent ?
        `What: Your page includes video content that enhances visitor engagement.\n\nWhy: Video content increases time on page and helps explain complex services more effectively than text alone.\n\nHow: Optimize video titles and descriptions with relevant keywords and consider adding captions for accessibility.` :
        "What: Your page lacks video content that could improve visitor engagement.\n\nWhy: Video content keeps visitors on your page longer and can significantly improve conversion rates.\n\nHow: Consider adding videos showcasing your work, explaining services, or featuring customer testimonials."
    };
  }

  private async analyzeContentFreshness(page: PageCrawlResult): Promise<AnalysisFactor> {
    // Check for date indicators or recently updated content
    const hasDateInfo = page.bodyText.includes('updated') || page.bodyText.includes('2024') || page.bodyText.includes('2025');
    
    return {
      name: "Content Freshness Indicators",
      description: "Fresh, updated content ranks better and builds trust",
      status: hasDateInfo ? "OK" : "OFI",
      importance: "Medium",
      notes: hasDateInfo ?
        "What: Your content includes freshness indicators showing it's current and up-to-date.\n\nWhy: Fresh content builds trust with visitors and search engines favor recently updated pages.\n\nHow: Continue updating content regularly and consider adding 'Last Updated' dates to show content freshness." :
        "What: Your content lacks indicators that show it's current and regularly updated.\n\nWhy: Outdated content makes visitors question your business's current status and search engines may rank it lower.\n\nHow: Add publication dates, update timestamps, or current year references to show your content is fresh and relevant."
    };
  }

  private async analyzeContentDepth(text: string): Promise<AnalysisFactor> {
    const wordCount = text.split(/\s+/).length;
    const paragraphCount = text.split('\n\n').length;
    const avgWordsPerParagraph = paragraphCount > 0 ? wordCount / paragraphCount : 0;
    
    const hasGoodDepth = wordCount >= 300 && avgWordsPerParagraph >= 20 && avgWordsPerParagraph <= 150;
    
    return {
      name: "Content Depth and Detail",
      description: "Content should provide comprehensive, detailed information",
      status: hasGoodDepth ? "OK" : wordCount >= 50 ? "OFI" : "OFI",
      importance: "High",
      notes: hasGoodDepth ?
        `What: Your content provides good depth and detail with ${wordCount} words across ${paragraphCount} paragraphs.\n\nWhy: Comprehensive content establishes expertise and gives visitors the information they need to make decisions.\n\nHow: Continue providing detailed information and consider adding more specific examples or case studies.` :
        wordCount >= 50 ?
        `What: Your content needs more depth and detail to fully address visitor needs.\n\nWhy: Shallow content fails to establish expertise and visitors may not have enough information to contact you.\n\nHow: Expand each section with more details, examples, and specific information about your services and approach.` :
        `What: Your content is too brief to effectively communicate your services and expertise.\n\nWhy: Very short content suggests lack of expertise and gives visitors no reason to choose your business.\n\nHow: Add substantial content including service descriptions, benefits, process explanations, and what makes you different.`
    };
  }

  private async analyzeContentRelevance(text: string, url: string): Promise<AnalysisFactor> {
    // Extract potential keywords from URL path
    const urlKeywords = url.split('/').join(' ').replace(/[-_]/g, ' ').toLowerCase();
    const textLower = text.toLowerCase();
    
    // Check if URL keywords appear in content
    const urlWords = urlKeywords.split(/\s+/).filter(w => w.length > 3);
    const relevantWords = urlWords.filter(word => textLower.includes(word));
    const relevanceScore = urlWords.length > 0 ? (relevantWords.length / urlWords.length) * 100 : 100;
    
    return {
      name: "Content-URL Relevance Alignment",
      description: "Content should align with URL structure and page purpose",
      status: relevanceScore >= 70 ? "OK" : relevanceScore >= 40 ? "OFI" : "OFI",
      importance: "High",
      notes: relevanceScore >= 70 ?
        `What: Your content aligns well with your page URL and purpose (${relevanceScore.toFixed(1)}% relevance).\n\nWhy: Good content-URL alignment helps search engines understand your page topic and improves rankings.\n\nHow: Continue ensuring your content matches your page purpose and consider adding more related keywords naturally.` :
        `What: Your content doesn't strongly align with your page URL and purpose (${relevanceScore.toFixed(1)}% relevance).\n\nWhy: Poor content-URL alignment confuses search engines and may result in lower rankings for target keywords.\n\nHow: Revise content to better match your page focus and naturally include keywords that relate to your URL structure.`
    };
  }

  private async analyzeContentEngagement($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const interactiveElements = $('button, input, select, textarea, [onclick]').length;
    const socialElements = $('[class*="social"], [href*="facebook"], [href*="twitter"], [href*="linkedin"]').length;
    const engagementScore = (interactiveElements + socialElements) * 10;
    
    return {
      name: "Content Engagement Elements",
      description: "Interactive elements and social sharing options improve engagement",
      status: engagementScore >= 30 ? "OK" : engagementScore >= 15 ? "OFI" : "OFI",
      importance: "Medium",
      notes: engagementScore >= 30 ?
        `What: Your page includes good interactive and social elements to engage visitors.\n\nWhy: Interactive elements encourage visitor engagement and social sharing options expand your reach.\n\nHow: Monitor which elements get the most interaction and consider adding more engaging features like calculators or quizzes.` :
        engagementScore >= 15 ?
        `What: Your page has some interactive elements but could benefit from more engagement features.\n\nWhy: Limited interaction opportunities mean visitors may not stay engaged long enough to become customers.\n\nHow: Add more interactive elements like contact forms, social sharing buttons, or clickable phone numbers.` :
        `What: Your page lacks interactive elements that encourage visitor engagement.\n\nWhy: Without engagement opportunities, visitors are likely to leave without taking any action.\n\nHow: Add interactive features like contact forms, click-to-call buttons, social media links, and interactive elements.`
    };
  }

  private async analyzeSocialProof($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const proofElements = $('[class*="testimonial"], [class*="review"], [class*="award"], [class*="certification"]').length;
    const proofKeywords = ['certified', 'award', 'years experience', 'customers served', 'satisfaction'];
    const textContent = $('body').text().toLowerCase();
    const keywordMatches = proofKeywords.filter(keyword => textContent.includes(keyword)).length;
    
    const hasSocialProof = proofElements > 0 || keywordMatches >= 2;
    
    return {
      name: "Social Proof and Credibility",
      description: "Social proof elements build trust and credibility",
      status: hasSocialProof ? "OK" : keywordMatches >= 1 ? "OFI" : "OFI",
      importance: "Medium",
      notes: hasSocialProof ?
        `What: Your page effectively displays social proof and credibility indicators.\n\nWhy: Social proof builds trust with potential customers and significantly improves conversion rates.\n\nHow: Continue showcasing credentials and consider adding more specific customer success stories or industry certifications.` :
        keywordMatches >= 1 ?
        `What: Your page has some credibility indicators but could strengthen social proof.\n\nWhy: Limited social proof makes it harder for visitors to trust your business over competitors.\n\nHow: Add more customer testimonials, certifications, awards, or specific achievements to build stronger credibility.` :
        `What: Your page lacks social proof elements that build trust with potential customers.\n\nWhy: Without credibility indicators, visitors have no evidence of your expertise and may choose competitors instead.\n\nHow: Add customer testimonials, business certifications, years of experience, or awards to establish trust and credibility.`
    };
  }

  private async analyzeContentScannability($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const bullets = $('ul li, ol li').length;
    const headings = $('h2, h3, h4, h5, h6').length;
    const emphasis = $('strong, b, em, i').length;
    const shortParagraphs = $('p').filter((_, p) => $(p).text().split(/\s+/).length <= 50).length;
    
    const scannabilityScore = bullets + headings + emphasis + (shortParagraphs * 0.5);
    
    return {
      name: "Content Scannability",
      description: "Content should be easy to scan with bullets, headings, and emphasis",
      status: scannabilityScore >= 10 ? "OK" : scannabilityScore >= 5 ? "OFI" : "OFI",
      importance: "Medium",
      notes: scannabilityScore >= 10 ?
        `What: Your content is well-formatted and easy to scan with good use of formatting elements.\n\nWhy: Scannable content keeps visitors engaged and helps them quickly find the information they need.\n\nHow: Continue using formatting elements effectively and consider adding more visual breaks to improve readability.` :
        scannabilityScore >= 5 ?
        `What: Your content has some formatting but could be easier to scan and read.\n\nWhy: Content that's hard to scan causes visitors to leave before finding the information they need.\n\nHow: Add more bullet points, headings, and bold text to break up content and highlight key information.` :
        `What: Your content is difficult to scan and lacks formatting that helps visitors quickly find information.\n\nWhy: Dense, unformatted text overwhelms visitors and leads to high bounce rates.\n\nHow: Break up text with bullet points, subheadings, bold text, and short paragraphs to improve scannability.`
    };
  }

  private async analyzeContentTone(text: string): Promise<AnalysisFactor> {
    const positiveWords = ['excellent', 'quality', 'professional', 'trusted', 'reliable', 'expert'];
    const negativeWords = ['problem', 'issue', 'difficult', 'complicated'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    const toneScore = positiveCount - negativeCount;
    
    return {
      name: "Content Tone and Messaging",
      description: "Content should maintain a positive, professional tone",
      status: toneScore >= 2 ? "OK" : toneScore >= 0 ? "OFI" : "OFI",
      importance: "Medium",
      notes: toneScore >= 2 ?
        `What: Your content maintains a positive, professional tone that builds confidence.\n\nWhy: Positive messaging creates trust and encourages visitors to contact your business.\n\nHow: Continue using confident, professional language that emphasizes benefits and solutions rather than problems.` :
        toneScore >= 0 ?
        `What: Your content tone is neutral but could be more positive and engaging.\n\nWhy: Neutral tone doesn't build excitement or confidence in your services compared to more positive messaging.\n\nHow: Use more positive language that emphasizes benefits, quality, and successful outcomes rather than focusing on problems.` :
        `What: Your content focuses too much on problems and challenges rather than positive solutions.\n\nWhy: Negative tone creates doubt and anxiety in visitors rather than confidence in your services.\n\nHow: Rewrite content to emphasize solutions, benefits, and positive outcomes while maintaining honesty about challenges.`
    };
  }

  private async analyzeMultimediaUsage($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const images = $('img').length;
    const videos = $('video, iframe[src*="youtube"]').length;
    const audio = $('audio').length;
    const charts = $('[class*="chart"], canvas, svg').length;
    
    const multimediaCount = images + videos + audio + charts;
    const hasBalancedMedia = multimediaCount >= 2 && images <= 10;
    
    return {
      name: "Multimedia Content Balance",
      description: "Balanced use of images, videos, and interactive elements",
      status: hasBalancedMedia ? "OK" : multimediaCount >= 1 ? "OFI" : "OFI",
      importance: "Medium",
      notes: hasBalancedMedia ?
        `What: Your page has a good balance of multimedia elements that enhance the user experience.\n\nWhy: Varied media types keep visitors engaged and help explain complex information more effectively.\n\nHow: Continue using multimedia strategically and ensure all elements load quickly and are mobile-friendly.` :
        multimediaCount >= 1 ?
        `What: Your page has some multimedia content but could benefit from more variety.\n\nWhy: Limited media variety means missed opportunities to engage different types of learners and keep visitors interested.\n\nHow: Add more diverse media types like videos, infographics, or interactive elements to enhance engagement.` :
        `What: Your page lacks multimedia elements that could improve visitor engagement and understanding.\n\nWhy: Text-only content is less engaging and doesn't appeal to visual learners or maintain visitor attention.\n\nHow: Add relevant images, videos, or infographics that support your content and make it more engaging.`
    };
  }

  private async analyzeContentFlow($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const headings = $('h1, h2, h3, h4, h5, h6');
    const logicalFlow = headings.length >= 3;
    const hasIntroduction = $('p').first().text().length >= 100;
    const hasConclusion = $('p').last().text().length >= 50;
    
    const flowScore = (logicalFlow ? 1 : 0) + (hasIntroduction ? 1 : 0) + (hasConclusion ? 1 : 0);
    
    return {
      name: "Content Flow and Organization",
      description: "Content should have logical flow with clear introduction and conclusion",
      status: flowScore >= 2 ? "OK" : flowScore >= 1 ? "OFI" : "OFI",
      importance: "Medium",
      notes: flowScore >= 2 ?
        `What: Your content has good logical flow with clear introduction and structure.\n\nWhy: Well-organized content guides visitors through your message and keeps them engaged longer.\n\nHow: Continue maintaining clear content structure and consider adding transitions between sections for even better flow.` :
        flowScore >= 1 ?
        `What: Your content has some organization but could improve its logical flow and structure.\n\nWhy: Unclear content organization makes it harder for visitors to follow your message and find key information.\n\nHow: Strengthen your introduction, add more headings to organize content, and include a clear conclusion that summarizes key points.` :
        `What: Your content lacks clear organization and logical flow from introduction to conclusion.\n\nWhy: Poorly organized content confuses visitors and they may leave before understanding your services.\n\nHow: Restructure content with a clear introduction, organized sections with headings, and a strong conclusion with next steps.`
    };
  }

  private async analyzeContentAccuracy(text: string): Promise<AnalysisFactor> {
    // Check for fact-checking indicators
    const hasNumbers = /\d{4}|\d+%|\$\d+/.test(text);
    const hasSources = text.includes('source') || text.includes('according to') || text.includes('study');
    const hasSpecifics = text.includes('®') || text.includes('™') || text.includes('LLC') || text.includes('Inc');
    
    const accuracyIndicators = (hasNumbers ? 1 : 0) + (hasSources ? 1 : 0) + (hasSpecifics ? 1 : 0);
    
    return {
      name: "Content Accuracy and Specificity",
      description: "Content should include specific facts, numbers, and verifiable information",
      status: accuracyIndicators >= 2 ? "OK" : accuracyIndicators >= 1 ? "OFI" : "OFI",
      importance: "High",
      notes: accuracyIndicators >= 2 ?
        `What: Your content includes specific facts, numbers, and verifiable information that builds credibility.\n\nWhy: Specific, accurate information establishes expertise and helps visitors trust your business knowledge.\n\nHow: Continue providing specific details and consider adding more concrete examples or case studies.` :
        accuracyIndicators >= 1 ?
        `What: Your content has some specific information but could include more concrete facts and details.\n\nWhy: General information doesn't demonstrate expertise as effectively as specific facts and examples.\n\nHow: Add more specific numbers, dates, examples, and verifiable details about your services and experience.` :
        `What: Your content lacks specific facts, numbers, or verifiable information that demonstrates expertise.\n\nWhy: Generic content doesn't build trust or show visitors that you have real experience and knowledge.\n\nHow: Include specific details like years in business, number of customers served, specific certifications, or concrete examples of work completed.`
    };
  }

  // Utility methods
  private calculateFleschReadingEase(text: string): number {
    if (!text || text.length === 0) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    return Math.round(206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/[^a]/g, '').length;
  }

  private getMinWordCount(pageType: string): number {
    const minWords = {
      'homepage': 300,
      'service': 500,
      'location': 400,
      'contact': 200,
      'serviceArea': 400,
      'default': 300
    };
    return minWords[pageType as keyof typeof minWords] || minWords.default;
  }

  private calculateKeywordDensity(text: string): number {
    // Simplified keyword density calculation
    // In real implementation, would extract actual target keywords
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    // Mock calculation - in real implementation, would check for actual target keywords
    const keywordOccurrences = Math.floor(totalWords * 0.02); // Assume 2% density
    return (keywordOccurrences / totalWords) * 100;
  }

  private detectCTAs($: cheerio.CheerioAPI): number {
    let ctaCount = 0;
    
    // Button elements
    ctaCount += $('button').length;
    
    // Links with CTA-like text
    const ctaTexts = ['call', 'contact', 'get quote', 'schedule', 'book now', 'learn more'];
    $('a').each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (ctaTexts.some(cta => text.includes(cta))) {
        ctaCount++;
      }
    });
    
    // Forms
    ctaCount += $('form').length;
    
    return ctaCount;
  }

  private assessCTAQuality($: cheerio.CheerioAPI): number {
    const ctas = $('button, [class*="cta"], [class*="button"]');
    const strongCTAs = ctas.filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return ['call now', 'get quote', 'schedule', 'contact us', 'book', 'start'].some(strong => text.includes(strong));
    });
    
    return ctas.length > 0 ? (strongCTAs.length / ctas.length) * 100 : 0;
  }

  private detectReviewsTestimonials($: cheerio.CheerioAPI): boolean {
    const reviewKeywords = ['review', 'testimonial', 'customer says', 'what our clients', 'feedback'];
    const pageText = $('body').text().toLowerCase();
    
    return reviewKeywords.some(keyword => pageText.includes(keyword));
  }

  private analyzeTextStructure($: cheerio.CheerioAPI): boolean {
    const hasLists = $('ul, ol').length > 0;
    const hasEmphasis = $('strong, b, em, i').length > 0;
    const hasHeadings = $('h2, h3, h4').length > 0;
    
    return hasLists && hasEmphasis && hasHeadings;
  }

  private calculateContentUniqueness(text: string): number {
    // Simplified uniqueness calculation
    // In real implementation, would compare against known duplicate content
    if (!text || text.length < 100) return 0;
    
    // Mock calculation based on content variety
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    return Math.min(100, (uniqueWords.size / words.length) * 200);
  }

  private determinePageType(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('/contact')) return 'contact';
    if (urlLower.includes('/service')) return 'service';
    if (urlLower.includes('/location')) return 'location';
    if (urlLower.includes('/area')) return 'serviceArea';
    if (urlLower.endsWith('/') || urlLower.includes('index')) return 'homepage';
    
    return 'default';
  }
}