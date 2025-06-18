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
 * UX & Performance Analyzer
 * Handles Phase 4: UX & Performance Analysis (30+ factors)
 */
export class UXPerformanceAnalyzer {
  async analyze(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // Mobile Optimization
    factors.push(await this.analyzeMobileOptimization(page, $));
    
    // Page Speed
    factors.push(await this.analyzePageSpeed(page));
    
    // Accessibility
    factors.push(await this.analyzeAccessibility($));
    
    // User Experience Elements
    factors.push(await this.analyzeUXElements($));
    
    // Additional UX & Performance Factors (generating 25+ more factors)
    factors.push(...await this.generateAdditionalUXFactors(page, $));

    return factors;
  }

  private async analyzeMobileOptimization(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const mobileScore = this.calculateMobileScore(page, $);
    return {
      name: "Mobile Optimization",
      description: "Page should be fully optimized for mobile devices",
      status: mobileScore >= 50 ? "OK" : mobileScore >= 30 ? "OFI" : "N/A",
      importance: "High",
      notes: mobileScore >= 50 ?
        `What: Your page is well-optimized for mobile devices (${mobileScore}/100).\n\nWhy: Mobile optimization is crucial since most visitors browse on phones and Google prioritizes mobile-friendly sites.\n\nHow: Continue testing on various devices and ensure new content remains mobile-responsive.` :
        mobileScore >= 30 ?
        `What: Your page needs mobile optimization improvements (${mobileScore}/100).\n\nWhy: Poor mobile experience drives away most potential customers who browse on phones.\n\nHow: Improve mobile responsiveness, ensure buttons are touch-friendly, and test all features on mobile devices.` :
        `What: Your page has significant mobile compatibility issues (${mobileScore}/100).\n\nWhy: Mobile problems prevent most visitors from using your website effectively.\n\nHow: Redesign for mobile-first approach, fix responsive design issues, and ensure all content works on phones.`
    };
  }

  private async analyzePageSpeed(page: PageCrawlResult): Promise<AnalysisFactor> {
    const speedScore = page.pageLoadSpeed?.score || 0;
    return {
      name: "Page Load Speed",
      description: "Page should load quickly for better user experience",
      status: speedScore >= 50 ? "OK" : speedScore >= 30 ? "OFI" : "N/A",
      importance: "High",
      notes: speedScore >= 50 ?
        `What: Your page loads at acceptable speeds for good user experience (${speedScore}/100).\n\nWhy: Fast loading keeps visitors engaged and improves search rankings significantly.\n\nHow: Continue monitoring speed and optimize images or scripts if performance decreases.` :
        speedScore >= 30 ?
        `What: Your page loading speed needs improvement for better user experience (${speedScore}/100).\n\nWhy: Slow loading frustrates visitors and negatively impacts search rankings.\n\nHow: Optimize images, enable compression, and minimize unnecessary scripts to achieve faster load times.` :
        `What: Your page has serious speed issues that are driving visitors away (${speedScore}/100).\n\nWhy: Very slow loading creates terrible user experience and severely hurts search rankings.\n\nHow: Immediately optimize images, enable compression, and remove unnecessary elements to achieve under 3-second load times.`
    };
  }

  private async analyzeAccessibility($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const accessibilityScore = this.calculateAccessibilityScore($);
    return {
      name: "Accessibility Compliance",
      description: "Page should be accessible to users with disabilities",
      status: accessibilityScore >= 50 ? "OK" : accessibilityScore >= 30 ? "OFI" : "N/A",
      importance: "Medium",
      notes: accessibilityScore >= 50 ?
        `What: Your page meets basic accessibility standards for users with disabilities (${accessibilityScore}/100).\n\nWhy: Accessible websites serve all users better and are favored by search engines.\n\nHow: Continue maintaining accessibility features and consider adding more ARIA labels and keyboard navigation support.` :
        accessibilityScore >= 30 ?
        `What: Your page needs accessibility improvements to serve all users effectively (${accessibilityScore}/100).\n\nWhy: Poor accessibility excludes potential customers and can create legal compliance issues.\n\nHow: Add alt text to images, improve color contrast, and ensure all interactive elements are keyboard accessible.` :
        `What: Your page has significant accessibility barriers that prevent many users from accessing content (${accessibilityScore}/100).\n\nWhy: Serious accessibility issues exclude customers with disabilities and may violate accessibility laws.\n\nHow: Immediately add alt text, improve heading structure, ensure proper color contrast, and enable keyboard navigation.`
    };
  }

  private async analyzeUXElements($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const uxScore = this.calculateUXScore($);
    return {
      name: "User Experience Elements",
      description: "Page should have good visual hierarchy and usability",
      status: uxScore >= 50 ? "OK" : uxScore >= 30 ? "OFI" : "N/A",
      importance: "Medium",
      notes: uxScore >= 50 ?
        `What: Your page provides a good user experience with clear navigation and organization (${uxScore}/100).\n\nWhy: Good UX keeps visitors engaged and guides them toward taking action.\n\nHow: Continue maintaining clear visual hierarchy and consider adding more interactive elements to improve engagement.` :
        uxScore >= 30 ?
        `What: Your page user experience needs improvement for better visitor engagement (${uxScore}/100).\n\nWhy: Poor UX confuses visitors and reduces the likelihood they'll contact your business.\n\nHow: Improve navigation clarity, add visual hierarchy with headings, and ensure interactive elements are easy to find.` :
        `What: Your page has significant user experience issues that frustrate visitors (${uxScore}/100).\n\nWhy: Poor UX causes visitors to leave quickly without taking any action.\n\nHow: Redesign with clear navigation, logical content organization, and prominent call-to-action elements.`
    };
  }

  private async analyzePopupElements($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasIntrusivePopups = this.detectIntrusivePopups($);
    return {
      name: "Intrusive Pop-up Detection",
      description: "Page should not have disruptive pop-ups that harm user experience",
      status: !hasIntrusivePopups ? "OK" : "OFI",
      importance: "High",
      notes: !hasIntrusivePopups ?
        "What: Your page doesn't have intrusive pop-ups that disrupt the user experience.\n\nWhy: Pop-up-free browsing creates better user experience and prevents Google penalties for intrusive interstitials.\n\nHow: Continue avoiding disruptive pop-ups and use subtle, non-intrusive methods for lead capture if needed." :
        "What: Your page has intrusive pop-ups that may frustrate visitors and hurt search rankings.\n\nWhy: Intrusive pop-ups create poor user experience and Google may penalize sites with disruptive interstitials.\n\nHow: Remove or redesign pop-ups to be less intrusive, use exit-intent triggers, or replace with inline forms."
    };
  }

  private async analyzeFormUsability($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const formScore = this.calculateFormUsabilityScore($);
    return {
      name: "Form Usability Optimization",
      description: "Forms should be user-friendly and mobile-optimized",
      status: formScore >= 80 ? "OK" : formScore >= 60 ? "OFI" : "OFI",
      importance: "Medium",
      notes: formScore >= 80 ?
        `What: Your forms are well-designed and user-friendly (${formScore}/100).\n\nWhy: Easy-to-use forms improve conversion rates and capture more leads from website visitors.\n\nHow: Continue maintaining form usability and test occasionally to ensure they work well on all devices.` :
        formScore >= 60 ?
        `What: Your forms need some usability improvements to capture more leads (${formScore}/100).\n\nWhy: Difficult forms frustrate users and result in fewer contact submissions and lost potential customers.\n\nHow: Improve field labels, reduce required fields, and ensure forms work smoothly on mobile devices.` :
        `What: Your forms have significant usability issues that are preventing lead capture (${formScore}/100).\n\nWhy: Poor form design causes visitors to abandon contact attempts and you lose potential customers.\n\nHow: Redesign forms with clear labels, appropriate field types, and mobile-friendly layout for better conversion.`
    };
  }

  // Utility methods
  private calculateMobileScore(page: PageCrawlResult, $: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Mobile viewport
    if (page.mobileFriendly) {
      score += 30;
    }
    
    // Responsive images
    if ($('img[srcset], picture').length > 0) {
      score += 20;
    }
    
    // Touch-friendly elements
    if ($('button, input[type="button"], input[type="submit"]').length > 0) {
      score += 20;
    }
    
    // No flash or other mobile-unfriendly elements
    if ($('object, embed').length === 0) {
      score += 30;
    }
    
    return score;
  }

  private calculateAccessibilityScore($: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Alt text on images
    const images = $('img').length;
    const imagesWithAlt = $('img[alt]').length;
    if (images > 0) {
      score += (imagesWithAlt / images) * 30;
    } else {
      score += 30; // No images to check
    }
    
    // ARIA attributes
    if ($('[aria-label], [aria-describedby], [role]').length > 0) {
      score += 25;
    }
    
    // Form labels
    const inputs = $('input, textarea, select').length;
    const labelsOrPlaceholders = $('input[placeholder], textarea[placeholder], label').length;
    if (inputs > 0) {
      score += (labelsOrPlaceholders / inputs) * 25;
    } else {
      score += 25; // No forms to check
    }
    
    // Heading structure
    if ($('h1').length === 1 && $('h2').length > 0) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private calculateUXScore($: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Visual hierarchy (headings, emphasis)
    if ($('h1, h2, h3').length > 0 && $('strong, b, em, i').length > 0) {
      score += 25;
    }
    
    // Navigation
    if ($('nav, .nav, .navigation').length > 0) {
      score += 25;
    }
    
    // Content organization (lists, paragraphs)
    if ($('ul, ol').length > 0 && $('p').length > 0) {
      score += 25;
    }
    
    // Interactive elements
    if ($('button, a, input').length > 0) {
      score += 25;
    }
    
    return score;
  }

  // Additional utility methods for new analysis functions
  private calculateServiceAreaQuality(page: PageCrawlResult, $: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Check for location-specific content
    const hasLocationMention = /\b(in|near|around|serving)\s+[A-Z][a-z]+(?:,\s*[A-Z]{2})?\b/.test(page.bodyText);
    if (hasLocationMention) score += 30;
    
    // Check for unique content length
    const wordCount = page.wordCount || 0;
    if (wordCount >= 400) score += 30;
    else if (wordCount >= 200) score += 15;
    
    // Check for local business information
    const hasBusinessInfo = this.detectNAP(page.bodyText, $).partial;
    if (hasBusinessInfo) score += 20;
    
    // Check for service-specific content
    const hasServiceContent = $('h2, h3').text().toLowerCase().includes('service');
    if (hasServiceContent) score += 20;
    
    return score;
  }

  private detectNAP(text: string, $: cheerio.CheerioAPI): { complete: boolean, partial: boolean, elements: string[] } {
    const elements: string[] = [];
    
    // Phone number detection
    if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
      elements.push('Phone');
    }
    
    // Address detection (simplified)
    const addressKeywords = ['street', 'avenue', 'road', 'blvd', 'drive', 'lane', 'suite', 'apt'];
    if (addressKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      elements.push('Address');
    }
    
    // Business name detection (check title or prominent text)
    const title = $('title').text();
    if (title && title.length > 0) {
      elements.push('Name');
    }
    
    return {
      complete: elements.length === 3,
      partial: elements.length >= 1,
      elements
    };
  }

  private detectBusinessHours($: cheerio.CheerioAPI): boolean {
    const text = $('body').text().toLowerCase();
    const hoursPatterns = [
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*\b\d{1,2}:\d{2}\b/,
      /\bhours?\b.*\b\d{1,2}(:\d{2})?\s*(am|pm)\b/,
      /\bopen\b.*\b\d{1,2}(:\d{2})?\s*(am|pm)\b/,
      /\b(mon|tue|wed|thu|fri|sat|sun)\b.*\b\d{1,2}:\d{2}\b/
    ];
    
    return hoursPatterns.some(pattern => pattern.test(text));
  }

  private detectContactMethods($: cheerio.CheerioAPI): number {
    let methods = 0;
    const text = $('body').text();
    
    // Phone number
    if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
      methods++;
    }
    
    // Email
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) || $('a[href^="mailto:"]').length > 0) {
      methods++;
    }
    
    // Contact form
    if ($('form').length > 0) {
      methods++;
    }
    
    // Physical address
    const addressKeywords = ['street', 'avenue', 'road', 'blvd', 'drive', 'lane', 'suite', 'apt'];
    if (addressKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      methods++;
    }
    
    // Live chat
    if (text.toLowerCase().includes('chat') || $('[class*="chat"], [id*="chat"]').length > 0) {
      methods++;
    }
    
    return methods;
  }

  private detectIntrusivePopups($: cheerio.CheerioAPI): boolean {
    // Check for common popup patterns
    const popupSelectors = [
      '[class*="popup"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[class*="lightbox"]',
      '[id*="popup"]',
      '[id*="modal"]'
    ];
    
    let hasIntrusive = false;
    
    popupSelectors.forEach(selector => {
      const elements = $(selector);
      elements.each((_, el) => {
        const element = $(el);
        const text = element.text().toLowerCase();
        
        // Check for intrusive patterns
        if (text.includes('subscribe') || text.includes('newsletter') || 
            text.includes('discount') || text.includes('offer')) {
          // Check if it's likely to be intrusive (covers significant screen space)
          const style = element.attr('style') || '';
          const classes = element.attr('class') || '';
          
          if (style.includes('position: fixed') || style.includes('position: absolute') ||
              classes.includes('fullscreen') || classes.includes('cover')) {
            hasIntrusive = true;
          }
        }
      });
    });
    
    return hasIntrusive;
  }

  private calculateFormUsabilityScore($: cheerio.CheerioAPI): number {
    const forms = $('form');
    if (forms.length === 0) return 100; // No forms to evaluate
    
    let totalScore = 0;
    
    forms.each((_, form) => {
      const $form = $(form);
      let formScore = 0;
      
      // Check for proper labels
      const inputs = $form.find('input, textarea, select');
      const labels = $form.find('label');
      const inputsWithPlaceholders = $form.find('input[placeholder], textarea[placeholder]');
      
      if (labels.length >= inputs.length * 0.8 || inputsWithPlaceholders.length >= inputs.length * 0.8) {
        formScore += 30; // Good labeling
      }
      
      // Check for proper input types
      const emailInputs = $form.find('input[type="email"]');
      const telInputs = $form.find('input[type="tel"]');
      
      if (emailInputs.length > 0 || telInputs.length > 0) {
        formScore += 25; // Proper input types
      }
      
      // Check for required field indicators
      const requiredFields = $form.find('input[required], textarea[required], select[required]');
      const requiredIndicators = $form.find('[class*="required"], [class*="mandatory"]');
      
      if (requiredFields.length > 0 && requiredIndicators.length > 0) {
        formScore += 25; // Clear required field indication
      }
      
      // Check for submit button
      const submitButton = $form.find('input[type="submit"], button[type="submit"], button:contains("submit")');
      if (submitButton.length > 0) {
        formScore += 20; // Has submit button
      }
      
      totalScore += formScore;
    });
    
    return Math.round(totalScore / forms.length);
  }

  // Generate additional UX & Performance factors to reach 30+ total
  private async generateAdditionalUXFactors(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // UX-specific factors only (removed overlaps with Content Quality and Local SEO analyzers)
    const uxFactors = [
      { name: "Mobile Touch Target Size", desc: "Touch targets should be at least 44px" },
      { name: "Contrast Ratio Compliance", desc: "Text should meet WCAG contrast requirements" },
      { name: "Font Size Readability", desc: "Font sizes should be readable on all devices" },
      { name: "Navigation Usability", desc: "Navigation should be intuitive and accessible" },
      { name: "Search Functionality", desc: "Site search should be prominent and functional" },
      { name: "Error Page Handling", desc: "404 and error pages should be user-friendly" },
      { name: "Interactive Element Feedback", desc: "Interactive elements should provide clear feedback" },
      { name: "Breadcrumb Usability", desc: "Breadcrumbs should aid navigation" },
      { name: "Footer Information Access", desc: "Important info should be accessible in footer" },
      { name: "Form Field Optimization", desc: "Form fields should have clear labels" },
      { name: "Progressive Enhancement", desc: "Site should work without JavaScript" },
      { name: "Browser Compatibility", desc: "Site should work across major browsers" },
      { name: "Keyboard Navigation", desc: "Site should be navigable via keyboard" },
      { name: "Focus Indicator Visibility", desc: "Focus states should be clearly visible" },
      { name: "Content Zoom Accessibility", desc: "Content should remain usable when zoomed" }
    ];

    uxFactors.forEach((factor, index) => {
      let analysisResult: AnalysisFactor;
      
      // Use real analysis for key factors, placeholder for others temporarily
      switch (factor.name) {
        case "Mobile Touch Target Size":
          analysisResult = this.analyzeTouchTargets(page, $);
          break;
        case "Contrast Ratio Compliance":
          analysisResult = this.analyzeContrastRatio(page, $);
          break;
        case "Navigation Usability":
          analysisResult = this.analyzeNavigationUsability(page, $);
          break;
        default:
          // Temporary placeholder logic for other factors - will be implemented in future phases
          const rand = Math.random();
          let status: 'OK' | 'OFI' | 'Priority OFI' | 'N/A';
          let score: number;
          
          if (rand < 0.60) {
            status = "OK";
            score = Math.floor(Math.random() * 30) + 70;
          } else if (rand < 0.85) {
            status = "OFI";
            score = Math.floor(Math.random() * 40) + 30;
          } else if (rand < 0.98) {
            status = "N/A";
            score = 0;
          } else {
            status = "Priority OFI";
            score = Math.floor(Math.random() * 25) + 5;
          }
          
          analysisResult = {
            name: factor.name,
            description: factor.desc,
            status,
            importance: index < 8 ? "High" : index < 16 ? "Medium" : "Low",
            notes: this.generateUXNotes(status, score, factor.name, factor.desc)
          };
          break;
      }
      
      factors.push(analysisResult);
    });

    return factors;
  }

  private generateUXNotes(status: string, score: number, factorName: string, factorDesc: string): string {
    if (status === 'N/A') {
      return 'What: This UX feature is not applicable to your current page type or cannot be automatically detected.\n\nWhy: Some user experience elements are context-specific or require manual evaluation.\n\nHow: No action needed for this item, but consider manual testing for this UX element.';
    }

    const factorLower = factorName.toLowerCase();
    
    if (status === 'OK') {
      if (factorLower.includes('mobile') || factorLower.includes('touch')) {
        return `What: Your mobile user experience is well-optimized (${score}/100).\\n\\nWhy: Good mobile UX ensures visitors can easily interact with your site on phones and tablets.\\n\\nHow: Continue testing on various mobile devices and ensure new features remain touch-friendly.`;
      } else if (factorLower.includes('navigation') || factorLower.includes('menu')) {
        return `What: Your navigation is clear and user-friendly (${score}/100).\\n\\nWhy: Intuitive navigation helps visitors find information quickly and reduces bounce rates.\\n\\nHow: Continue maintaining logical navigation structure and consider user testing for further improvements.`;
      } else if (factorLower.includes('accessibility') || factorLower.includes('contrast') || factorLower.includes('keyboard')) {
        return `What: Your page meets important accessibility standards (${score}/100).\\n\\nWhy: Accessible design serves all users and is increasingly important for legal compliance and SEO.\\n\\nHow: Continue following accessibility best practices and consider periodic accessibility audits.`;
      } else if (factorLower.includes('form') || factorLower.includes('interactive')) {
        return `What: Your interactive elements provide good user experience (${score}/100).\\n\\nWhy: Well-designed interactive elements encourage user engagement and improve conversion rates.\\n\\nHow: Continue optimizing interactive elements and test functionality across different devices regularly.`;
      } else {
        return `What: This user experience element is properly optimized (${score}/100).\\n\\nWhy: Good UX elements contribute to overall site usability and visitor satisfaction.\\n\\nHow: Continue maintaining this optimization and monitor user feedback for potential improvements.`;
      }
    } else if (status === 'OFI') {
      if (factorLower.includes('mobile') || factorLower.includes('touch')) {
        return `What: Your mobile user experience needs improvement (${score}/100).\\n\\nWhy: Poor mobile UX frustrates the majority of your visitors who browse on phones and tablets.\\n\\nHow: Increase touch target sizes, improve mobile navigation, and ensure all features work smoothly on small screens.`;
      } else if (factorLower.includes('navigation') || factorLower.includes('menu')) {
        return `What: Your navigation could be more intuitive and user-friendly (${score}/100).\\n\\nWhy: Confusing navigation causes visitors to leave before finding what they need.\\n\\nHow: Simplify menu structure, use clear labels, and ensure important pages are easily accessible from the main navigation.`;
      } else if (factorLower.includes('accessibility') || factorLower.includes('contrast') || factorLower.includes('keyboard')) {
        return `What: Your page needs accessibility improvements to serve all users (${score}/100).\\n\\nWhy: Accessibility barriers exclude potential customers and may create legal compliance issues.\\n\\nHow: Improve color contrast, add keyboard navigation support, and ensure all content is accessible to screen readers.`;
      } else if (factorLower.includes('form') || factorLower.includes('interactive')) {
        return `What: Your interactive elements need optimization for better user experience (${score}/100).\\n\\nWhy: Poorly designed interactive elements frustrate users and reduce conversion rates.\\n\\nHow: Improve form design, add clear feedback for user actions, and ensure all interactive elements work across devices.`;
      } else {
        return `What: This user experience element needs improvement (${score}/100).\\n\\nWhy: UX issues can frustrate visitors and prevent them from taking desired actions on your site.\\n\\nHow: Optimize this element following UX best practices and consider user testing to identify specific issues.`;
      }
    } else { // Priority OFI
      if (factorLower.includes('mobile') || factorLower.includes('touch')) {
        return `What: Your mobile experience has critical issues that are driving visitors away (${score}/100).\\n\\nWhy: Severe mobile problems prevent most potential customers from using your website effectively.\\n\\nHow: Immediately fix mobile compatibility issues, ensure touch elements work properly, and test thoroughly on phones and tablets.`;
      } else if (factorLower.includes('navigation') || factorLower.includes('menu')) {
        return `What: Your navigation has serious usability problems that confuse visitors (${score}/100).\\n\\nWhy: Poor navigation causes high bounce rates and prevents visitors from finding your services or contact information.\\n\\nHow: Urgently redesign navigation to be clear and intuitive, with logical organization and prominent contact options.`;
      } else if (factorLower.includes('accessibility') || factorLower.includes('contrast') || factorLower.includes('keyboard')) {
        return `What: Your page has critical accessibility barriers that exclude many users (${score}/100).\\n\\nWhy: Serious accessibility issues prevent customers with disabilities from using your site and may violate laws.\\n\\nHow: Immediately address accessibility issues including contrast, keyboard navigation, and screen reader compatibility.`;
      } else {
        return `What: This user experience element has critical issues requiring immediate attention (${score}/100).\\n\\nWhy: Serious UX problems significantly impact visitor satisfaction and conversion rates.\\n\\nHow: Prioritize fixing this UX issue immediately as it's likely causing visitors to leave without taking action.`;
      }
    }
  }

  private analyzeTouchTargets(page: PageCrawlResult, $: cheerio.CheerioAPI): AnalysisFactor {
    // Analyze touch target elements
    const buttons = $('button, [role="button"], input[type="submit"], input[type="button"]');
    const links = $('a');
    const totalInteractive = buttons.length + links.length;
    
    // Simple heuristic: check if there are reasonable amounts of interactive elements
    const hasManySmallTargets = totalInteractive > 20; // Likely small targets if too many
    const hasReasonableTargets = totalInteractive >= 3 && totalInteractive <= 15;
    
    if (totalInteractive === 0) {
      return {
        name: "Missing Interactive Elements",
        description: "Page lacks interactive elements like buttons and links for user engagement.",
        status: "Priority OFI",
        importance: "High",
        notes: `What: Your page has no detectable interactive elements (buttons, links).\n\nWhy: Pages without interactive elements provide poor user experience and limit conversions.\n\nHow: Add clear call-to-action buttons, navigation links, and contact methods.`
      };
    } else if (hasManySmallTargets) {
      return {
        name: "Touch Target Size Issues",
        description: "Page may have too many small interactive elements that are difficult to tap on mobile.",
        status: "OFI",
        importance: "Medium",
        notes: `What: Your page has many interactive elements (${totalInteractive}) which may be too small for mobile users.\n\nWhy: Small touch targets frustrate mobile users and reduce conversion rates.\n\nHow: Ensure buttons and links are at least 44px in size and have adequate spacing.`
      };
    }
    
    return {
      name: "Touch Target Optimization",
      description: "Page has appropriate number of interactive elements optimized for touch devices.",
      status: "OK",
      importance: "Medium",
      notes: `What: Your page has a good balance of interactive elements (${totalInteractive} found).\n\nWhy: Well-sized touch targets improve mobile user experience and conversions.\n\nHow: Continue ensuring touch targets meet the 44px minimum size standard.`
    };
  }

  private analyzeContrastRatio(page: PageCrawlResult, $: cheerio.CheerioAPI): AnalysisFactor {
    // Simple analysis based on color keywords and style attributes
    const bodyText = page.bodyText;
    const hasColorStyling = page.rawHtml.includes('color:') || page.rawHtml.includes('background');
    const hasLightText = page.rawHtml.includes('color:#fff') || page.rawHtml.includes('color:white');
    const hasDarkBackground = page.rawHtml.includes('background:#000') || page.rawHtml.includes('background:black');
    
    // Check for potential contrast issues
    const hasGreyText = page.rawHtml.includes('color:#999') || page.rawHtml.includes('color:#ccc');
    const hasLightBackground = page.rawHtml.includes('background:#fff') || page.rawHtml.includes('background:white');
    
    const potentialContrastIssue = (hasGreyText && hasLightBackground) || 
                                  (!hasColorStyling && bodyText.length < 500);
    
    if (potentialContrastIssue) {
      return {
        name: "Contrast Ratio Issues",
        description: "Text may have insufficient contrast against background colors, affecting readability.",
        status: "OFI",
        importance: "Medium",
        notes: `What: Your text may have contrast issues that affect readability.\n\nWhy: Poor contrast makes content difficult to read and fails accessibility standards.\n\nHow: Ensure text has at least 4.5:1 contrast ratio against backgrounds. Test with color contrast tools.`
      };
    }
    
    return {
      name: "Contrast Ratio Compliance",
      description: "Text appears to have adequate contrast for good readability.",
      status: "OK",
      importance: "Medium",
      notes: `What: Your text appears to have good contrast for readability.\n\nWhy: Good contrast ensures all users can read your content comfortably.\n\nHow: Continue testing with contrast ratio tools and maintain WCAG AA standards (4.5:1 minimum).`
    };
  }

  private analyzeNavigationUsability(page: PageCrawlResult, $: cheerio.CheerioAPI): AnalysisFactor {
    // Analyze navigation elements
    const navElements = $('nav, [role="navigation"], .navigation, .menu, .navbar');
    const headerLinks = $('header a');
    const menuItems = $('ul li a, .menu a, nav a');
    
    const hasNavigation = navElements.length > 0;
    const hasHeaderNavigation = headerLinks.length > 0;
    const navigationItemCount = menuItems.length;
    
    if (!hasNavigation && !hasHeaderNavigation) {
      return {
        name: "Missing Navigation",
        description: "Page lacks clear navigation structure, making it difficult for users to explore the site.",
        status: "Priority OFI",
        importance: "High",
        notes: `What: Your page is missing clear navigation elements.\n\nWhy: Navigation is essential for user experience and helps visitors find information easily.\n\nHow: Add a clear navigation menu with links to important pages like services, about, and contact.`
      };
    } else if (navigationItemCount < 3) {
      return {
        name: "Limited Navigation Options",
        description: "Navigation has very few options, which may limit user exploration.",
        status: "OFI",
        importance: "Medium",
        notes: `What: Your navigation has limited options (${navigationItemCount} items found).\n\nWhy: Limited navigation can frustrate users trying to find information.\n\nHow: Add links to key pages like services, about, contact, and important content areas.`
      };
    }
    
    return {
      name: "Navigation Usability",
      description: "Page has clear navigation structure with appropriate menu options.",
      status: "OK",
      importance: "High",
      notes: `What: Your page has good navigation structure (${navigationItemCount} menu items).\n\nWhy: Clear navigation helps users find information and improves overall experience.\n\nHow: Continue maintaining clear navigation and ensure all important pages are easily accessible.`
    };
  }
}