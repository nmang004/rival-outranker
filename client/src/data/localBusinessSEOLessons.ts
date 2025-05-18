import { LearningLesson } from "@/types/learningTypes";

export const localBusinessSEOLessons: LearningLesson[] = [
  {
    id: 601,
    moduleId: 6,
    title: "Foundations of Local SEO",
    description: "Understand the essential elements that make local SEO different from traditional SEO strategies.",
    content: `<h2>Foundations of Local SEO</h2>
      <p>Local SEO focuses on optimizing a business's online presence to attract more customers from relevant local searches. These searches take place on Google and other search engines, with a specific geographic component such as "coffee shop near me" or "best plumber in [city name]".</p>
      
      <h3>Why Local SEO Matters</h3>
      <p>For businesses that serve specific geographic areas, local SEO offers tremendous value:</p>
      <ul>
        <li><strong>High Intent Traffic:</strong> People searching locally often have immediate purchase intent (46% of all Google searches have local intent)</li>
        <li><strong>Mobile Growth:</strong> "Near me" searches have grown over 900% in recent years, primarily from mobile devices</li>
        <li><strong>Competitive Advantage:</strong> Many local businesses still haven't optimized properly, creating opportunity</li>
        <li><strong>Cost-Effective Marketing:</strong> Local SEO often delivers better ROI than traditional advertising for local businesses</li>
        <li><strong>Featured Placement:</strong> Opportunities for Google Business Profile listings, local pack results, and map placements</li>
      </ul>
      
      <h3>How Local Search Works</h3>
      <p>Local search algorithms consider several key factors:</p>
      
      <div class="key-factors" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
        <div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Relevance</h4>
          <p>How well a local business profile matches what someone is searching for. This includes your business category, services offered, and content optimization.</p>
        </div>
        
        <div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Proximity</h4>
          <p>How far your business is from the searcher's location or the location specified in their search. A search for "dentist in Portland" will show different results than "dentist near me" from different locations.</p>
        </div>
        
        <div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Prominence</h4>
          <p>How well-known your business is both online and offline. This includes your online reviews, citations, links, articles, and offline factors like brand recognition.</p>
        </div>
      </div>
      
      <h3>The Local SEO Ecosystem</h3>
      <p>Effective local SEO requires optimizing across multiple platforms and factors:</p>
      
      <ol>
        <li><strong>Google Business Profile (GBP):</strong> The cornerstone of local search presence
          <ul>
            <li>Complete, accurate business information</li>
            <li>Compelling descriptions and images</li>
            <li>Customer reviews and management</li>
            <li>Regular posts and updates</li>
          </ul>
        </li>
        
        <li><strong>Local Citations:</strong> Mentions of your business information across the web
          <ul>
            <li>NAP consistency (Name, Address, Phone number)</li>
            <li>Business directories and aggregators</li>
            <li>Industry-specific directories</li>
          </ul>
        </li>
        
        <li><strong>On-Page Local SEO:</strong> Website optimization with local focus
          <ul>
            <li>Localized content and service pages</li>
            <li>Local keywords in title tags, headings, and content</li>
            <li>Schema markup for local businesses</li>
            <li>Mobile optimization</li>
          </ul>
        </li>
        
        <li><strong>Local Link Building:</strong> Authority signals with geographic relevance
          <ul>
            <li>Local partnerships and sponsorships</li>
            <li>Chamber of commerce and business associations</li>
            <li>Local news coverage and PR</li>
          </ul>
        </li>
        
        <li><strong>Reviews and Reputation:</strong> Customer feedback across platforms
          <ul>
            <li>Google, Yelp, industry platforms, and social media</li>
            <li>Review generation strategies</li>
            <li>Response management</li>
          </ul>
        </li>
        
        <li><strong>Social Media:</strong> Local engagement and community presence
          <ul>
            <li>Localized content and targeting</li>
            <li>Community involvement</li>
            <li>Local events and promotions</li>
          </ul>
        </li>
      </ol>
      
      <h3>Local SEO vs. Traditional SEO: Key Differences</h3>
      
      <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; text-align: left;">Factor</th>
          <th style="padding: 10px; text-align: left;">Traditional SEO</th>
          <th style="padding: 10px; text-align: left;">Local SEO</th>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Primary Goal</strong></td>
          <td style="padding: 10px;">Rank for industry/topic keywords</td>
          <td style="padding: 10px;">Rank in local pack and map results</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Key Platforms</strong></td>
          <td style="padding: 10px;">Website is primary focus</td>
          <td style="padding: 10px;">Google Business Profile equally important as website</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Target Keywords</strong></td>
          <td style="padding: 10px;">Broad industry terms</td>
          <td style="padding: 10px;">Location-specific terms, "near me" queries</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Business Information</strong></td>
          <td style="padding: 10px;">Less emphasis on location data</td>
          <td style="padding: 10px;">NAP consistency critical across all platforms</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Link Building</strong></td>
          <td style="padding: 10px;">Focus on authority/relevance</td>
          <td style="padding: 10px;">Focus on local relevance/community</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Reviews</strong></td>
          <td style="padding: 10px;">Less direct impact</td>
          <td style="padding: 10px;">Direct ranking factor</td>
        </tr>
      </table>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>While national businesses might focus primarily on traditional SEO, local businesses should implement both traditional and local SEO strategies. The foundation of good on-page SEO remains important, with local-specific elements layered on top.</p>
      </div>
      
      <h3>The Evolution of Local Search</h3>
      <p>Local SEO has evolved significantly in recent years:</p>
      <ul>
        <li><strong>From 10-Pack to 3-Pack:</strong> Google reduced local results from 10 listings to 3, making competition fiercer</li>
        <li><strong>Mobile-First:</strong> Mobile searches now dominate local queries, making mobile experience critical</li>
        <li><strong>Voice Search Growth:</strong> "Near me" voice searches increasing, requiring natural language optimization</li>
        <li><strong>Zero-Click Searches:</strong> More information displayed directly in search results without clicks</li>
        <li><strong>Google Business Profile Evolution:</strong> Continual expansion of features (posts, products, services, etc.)</li>
      </ul>
      
      <p>Understanding these fundamentals provides the framework for developing an effective local SEO strategy tailored to your specific business needs and location.</p>`,
    estimatedTime: 30,
    sortOrder: 1,
    isActive: true,
    quiz: {
      id: 6001,
      lessonId: 601,
      questions: [
        {
          id: 60001,
          text: "What are the three primary factors Google considers in local search rankings?",
          options: [
            "Content, keywords, and backlinks",
            "Relevance, proximity, and prominence",
            "Traffic, conversions, and engagement",
            "Domain authority, page authority, and trust"
          ],
          correctOptionIndex: 1,
          explanation: "Google considers three primary factors for local search rankings: relevance (how well your business matches the search), proximity (how close you are to the searcher), and prominence (how well-known and reputable your business is)."
        },
        {
          id: 60002,
          text: "Which platform is considered the cornerstone of local search presence?",
          options: [
            "Facebook Business Page",
            "Yelp Profile",
            "Google Business Profile",
            "LinkedIn Company Page"
          ],
          correctOptionIndex: 2,
          explanation: "Google Business Profile (GBP) is considered the cornerstone of local search presence. It's essential for appearing in the local pack, Map results, and the Knowledge Panel."
        },
        {
          id: 60003,
          text: "What does NAP stand for in local SEO?",
          options: [
            "Network Access Point",
            "Name, Address, Phone number",
            "Navigation and Position",
            "Notifications, Alerts, Preferences"
          ],
          correctOptionIndex: 1,
          explanation: "In local SEO, NAP stands for Name, Address, and Phone number. Maintaining consistent NAP information across all online platforms is critical for local search success."
        },
        {
          id: 60004,
          text: "How does local SEO differ from traditional SEO in terms of reviews?",
          options: [
            "Reviews have no impact on traditional SEO but are important for local SEO",
            "Reviews are equally important for both traditional and local SEO",
            "Reviews are more important for traditional SEO than local SEO",
            "Reviews only matter for e-commerce websites, not local businesses"
          ],
          correctOptionIndex: 0,
          explanation: "Reviews have a direct impact on local SEO rankings, while they have less direct impact on traditional SEO. For local businesses, review quantity, quality, recency, and diversity are significant ranking factors."
        }
      ],
      passingScore: 75
    },
    additionalResources: [
      {
        title: "Google Business Profile Help Center",
        url: "https://support.google.com/business",
        type: "guide",
        description: "Official Google resource for managing your Google Business Profile"
      },
      {
        title: "Local SEO: The Definitive Guide",
        url: "https://backlinko.com/local-seo-guide",
        type: "article",
        description: "Comprehensive guide to local SEO strategies and best practices"
      },
      {
        title: "Moz Local Learning Center",
        url: "https://moz.com/learn/seo/local-seo",
        type: "guide",
        description: "Educational resource library for local SEO fundamentals"
      }
    ]
  },
  {
    id: 602,
    moduleId: 6,
    title: "Google Business Profile Optimization",
    description: "Master the techniques for creating and optimizing a high-performing Google Business Profile to dominate local search results.",
    content: `<h2>Google Business Profile Optimization</h2>
      <p>Your Google Business Profile (formerly Google My Business) is the single most important asset for local SEO success. It serves as the foundation of your business's presence in Google Search, Google Maps, and the local pack—often being the first point of contact between your business and potential customers.</p>
      
      <h3>The Impact of Google Business Profile</h3>
      <p>A well-optimized GBP can dramatically improve your local visibility:</p>
      <ul>
        <li>Businesses with complete profiles are 70% more likely to attract location visits</li>
        <li>They're 50% more likely to lead to purchases</li>
        <li>Complete and active profiles receive 7x more clicks than incomplete profiles</li>
        <li>They can rank even when your website doesn't rank organically</li>
      </ul>
      
      <h3>Creating and Claiming Your Google Business Profile</h3>
      <ol>
        <li><strong>Search for your business</strong> on Google to check if a listing already exists</li>
        <li><strong>Visit <a href="https://business.google.com" target="_blank">business.google.com</a></strong> to create or claim your profile</li>
        <li><strong>Complete the verification process</strong> (typically via postcard, phone, email, or instantly for some businesses)</li>
      </ol>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Pitfall</h4>
        <p>Never create a second GBP listing if one already exists. Instead, claim the existing profile or report inaccurate information. Duplicate listings can result in penalties and confused customers.</p>
      </div>
      
      <h3>Essential Profile Optimization Elements</h3>
      
      <h4>1. Basic Business Information</h4>
      <ul>
        <li><strong>Business Name:</strong> Use your exact legal business name without keyword stuffing</li>
        <li><strong>Business Categories:</strong> Select one primary category and relevant secondary categories (up to 10 total)</li>
        <li><strong>Address:</strong> Ensure exact consistency with your website and other citations</li>
        <li><strong>Service Area:</strong> For businesses that serve customers at their location, define your service radius</li>
        <li><strong>Hours of Operation:</strong> Include regular hours, special hours, and holiday schedules</li>
        <li><strong>Phone Number:</strong> Use a local phone number whenever possible</li>
        <li><strong>Website URL:</strong> Link to your homepage or location-specific landing page</li>
        <li><strong>Appointment Links:</strong> Add booking URLs if applicable</li>
      </ul>
      
      <h4>2. Visual Content</h4>
      <div class="image-tips" style="padding: 15px; background: #f5f9ff; border-radius: 5px; margin: 15px 0;">
        <h5 style="margin-top: 0;">Photo Best Practices:</h5>
        <ul>
          <li>Upload a minimum of 10 high-quality images (businesses with 100+ photos get 520% more calls)</li>
          <li>Include exterior shots (storefront, building, parking)</li>
          <li>Add interior shots (ambiance, decor, seating)</li>
          <li>Showcase your team (staff, management, team activities)</li>
          <li>Feature your products or services in action</li>
          <li>Use proper image formats (JPG, PNG) at least 250×250 pixels</li>
          <li>Add proper alt text and geotags when possible</li>
          <li>Update images seasonally to keep content fresh</li>
        </ul>
      </div>
      
      <h4>3. Business Description</h4>
      <p>Craft a compelling 750-character description that includes:</p>
      <ul>
        <li>Primary products/services offered</li>
        <li>Unique selling propositions</li>
        <li>Brief company history or mission</li>
        <li>Geographic areas served</li>
        <li>Natural inclusion of primary keywords</li>
      </ul>
      
      <h4>4. Products and Services</h4>
      <ul>
        <li>Add comprehensive service list with descriptions and pricing when applicable</li>
        <li>For retail, add product categories and featured items</li>
        <li>Use keywords naturally in service/product descriptions</li>
        <li>Update offerings seasonally or as your business evolves</li>
      </ul>
      
      <h3>Active Profile Management Strategies</h3>
      
      <h4>1. Google Posts</h4>
      <p>Regular posts increase engagement and keep your profile active:</p>
      <ul>
        <li><strong>What's New:</strong> Company updates, blog content, announcements</li>
        <li><strong>Events:</strong> Upcoming workshops, sales events, webinars</li>
        <li><strong>Offers:</strong> Promotions, discounts, special deals</li>
        <li><strong>Products:</strong> Featured product spotlights</li>
      </ul>
      <p>Post best practices:</p>
      <ul>
        <li>Include eye-catching images (1200×900 pixels)</li>
        <li>Keep text concise (150-300 characters perform best)</li>
        <li>Include a clear call-to-action</li>
        <li>Post at least once weekly (posts expire after 7 days)</li>
      </ul>
      
      <h4>2. Questions & Answers</h4>
      <p>The Q&A section provides valuable information to potential customers:</p>
      <ul>
        <li>Create and answer your own FAQs (seed common questions)</li>
        <li>Monitor and respond to all customer questions within 24 hours</li>
        <li>Upvote helpful questions and answers</li>
        <li>Flag inappropriate or inaccurate content</li>
        <li>Include relevant keywords naturally in answers</li>
      </ul>
      
      <h4>3. Review Management</h4>
      <p>Reviews are critical for local rankings and customer decisions:</p>
      <ul>
        <li>Respond to all reviews—positive and negative—within 24-48 hours</li>
        <li>For positive reviews: Express genuine appreciation and reinforce mentioned positives</li>
        <li>For negative reviews:
          <ul>
            <li>Thank the reviewer for feedback</li>
            <li>Apologize for their negative experience</li>
            <li>Address specific issues mentioned</li>
            <li>Take the conversation offline when appropriate</li>
            <li>Explain any changes made based on feedback</li>
          </ul>
        </li>
        <li>Develop a consistent review generation strategy</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Create a customized short URL for your Google review form (from your GBP dashboard) to easily share with customers. Include this link in follow-up emails, text messages, receipts, and in-store materials.</p>
      </div>
      
      <h3>Advanced Optimization Techniques</h3>
      
      <h4>1. Attributes</h4>
      <p>Add all relevant business attributes to help customers and search engines better understand your offerings:</p>
      <ul>
        <li>Accessibility features</li>
        <li>Health & safety measures</li>
        <li>Payment methods</li>
        <li>Service options (takeout, delivery, curbside)</li>
        <li>Amenities (WiFi, outdoor seating)</li>
        <li>Highlights (Woman-owned, Veteran-owned, etc.)</li>
      </ul>
      
      <h4>2. Menus, Booking, and Messaging</h4>
      <ul>
        <li>If applicable, add complete digital menus</li>
        <li>Enable appointment booking functionality</li>
        <li>Activate the messaging feature and set up automated responses</li>
        <li>Ensure someone monitors and replies to messages promptly</li>
      </ul>
      
      <h4>3. Website Integration</h4>
      <ul>
        <li>Add your GBP review link to your website</li>
        <li>Embed Google Maps on your contact page</li>
        <li>Ensure NAP consistency between GBP and website</li>
        <li>Implement appropriate local business schema</li>
      </ul>
      
      <h3>Monitoring and Maintaining Your Profile</h3>
      <p>Ongoing management is essential for long-term success:</p>
      <ol>
        <li><strong>Regular Audits:</strong> Monthly reviews of all profile elements</li>
        <li><strong>Performance Tracking:</strong> Monitor insights in the GBP dashboard</li>
        <li><strong>Competitor Analysis:</strong> Review competitors' profiles for ideas</li>
        <li><strong>Update Verification:</strong> Check for and verify Google-suggested updates</li>
        <li><strong>Spam Fighting:</strong> Report competitors violating guidelines</li>
      </ol>
      
      <div class="metrics-box" style="background: #f0f7ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3366cc;">Key Metrics to Track Monthly</h4>
        <ul>
          <li><strong>Search Queries:</strong> Which terms drive the most views</li>
          <li><strong>Customer Actions:</strong> Website clicks, direction requests, calls</li>
          <li><strong>Photo Views:</strong> Engagement with visual content</li>
          <li><strong>Review Volume and Sentiment:</strong> Quantity and average rating</li>
          <li><strong>Local Pack Rankings:</strong> Position for priority keywords</li>
        </ul>
      </div>
      
      <p>A well-optimized and actively managed Google Business Profile will serve as the cornerstone of your local SEO success, driving both visibility and customer engagement.</p>`,
    estimatedTime: 40,
    sortOrder: 2,
    isActive: true,
    quiz: {
      id: 6002,
      lessonId: 602,
      questions: [
        {
          id: 60005,
          text: "What happens when a business creates a second Google Business Profile when one already exists?",
          options: [
            "The profiles merge automatically",
            "Both profiles rank higher together",
            "It can result in penalties and confused customers",
            "Google will select the better profile and delete the other"
          ],
          correctOptionIndex: 2,
          explanation: "Creating duplicate Google Business Profiles can result in penalties from Google and confused customers who don't know which listing is accurate. Always claim an existing profile rather than creating a duplicate."
        },
        {
          id: 60006,
          text: "According to the lesson, how many photos should a business have at minimum on their Google Business Profile?",
          options: [
            "3 photos",
            "5 photos",
            "10 photos",
            "25 photos"
          ],
          correctOptionIndex: 2,
          explanation: "The lesson recommends uploading a minimum of 10 high-quality images. Businesses with 100+ photos get 520% more calls, showing the significant impact of visual content on profile performance."
        },
        {
          id: 60007,
          text: "How often should businesses post updates on their Google Business Profile?",
          options: [
            "Daily",
            "At least once weekly",
            "Monthly",
            "Quarterly"
          ],
          correctOptionIndex: 1,
          explanation: "Businesses should post at least once weekly, as Google Posts expire after 7 days. Regular posting keeps your profile active and increases engagement."
        },
        {
          id: 60008,
          text: "What is the recommended timeframe for responding to customer reviews?",
          options: [
            "Within 24-48 hours",
            "Within 1 week",
            "Within 1 month",
            "No need to respond to reviews"
          ],
          correctOptionIndex: 0,
          explanation: "The recommended timeframe for responding to all reviews—both positive and negative—is within 24-48 hours. Prompt responses demonstrate attentiveness and customer care."
        },
        {
          id: 60009,
          text: "Which of the following is NOT a recommended approach for handling negative reviews?",
          options: [
            "Thank the reviewer for their feedback",
            "Apologize for their negative experience",
            "Argue with the reviewer to correct inaccuracies",
            "Take the conversation offline when appropriate"
          ],
          correctOptionIndex: 2,
          explanation: "Arguing with reviewers, even when they share inaccurate information, is not recommended. Instead, you should thank them for feedback, apologize for their negative experience, address specific issues, and take the conversation offline when appropriate."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "Google Business Profile Best Practices",
        url: "https://support.google.com/business/answer/7091?hl=en",
        type: "guide",
        description: "Official Google guide to optimizing your business profile"
      },
      {
        title: "Local SEO Checklist: Google Business Profile Edition",
        url: "https://whitespark.ca/blog/the-complete-guide-to-google-business-profile-optimization/",
        type: "article",
        description: "Comprehensive checklist for GBP optimization"
      },
      {
        title: "Google Business Profile Photo Guidelines",
        url: "https://support.google.com/business/answer/6103862?hl=en",
        type: "guide",
        description: "Specifications and best practices for GBP photos"
      }
    ]
  },
  {
    id: 603,
    moduleId: 6,
    title: "Local Citation Building & Management",
    description: "Learn how to build and maintain consistent business citations across the web to strengthen your local search presence.",
    content: `<h2>Local Citation Building & Management</h2>
      <p>Local citations are mentions of your business's name, address, and phone number (NAP) on websites, apps, social platforms, and business directories. They serve as trust signals to both search engines and potential customers, confirming your business's legitimacy and improving local search rankings.</p>
      
      <h3>The Value of Local Citations</h3>
      <p>Citations impact your local SEO success in several ways:</p>
      <ul>
        <li><strong>Ranking Factor:</strong> Google uses citation quantity, quality, and consistency as ranking signals</li>
        <li><strong>Trust Builder:</strong> Consistent information across multiple sources validates business legitimacy</li>
        <li><strong>Discovery Channel:</strong> Citations create additional pathways for customers to find your business</li>
        <li><strong>Competitive Advantage:</strong> Comprehensive citation profiles help outrank competitors with fewer citations</li>
      </ul>
      
      <h3>Types of Citations</h3>
      
      <div class="citation-types" style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
        <div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Primary Citations</h4>
          <p>Major data aggregators and top-tier general directories that distribute information to many other platforms.</p>
          <p><strong>Examples:</strong> Google Business Profile, Yelp, Facebook, Apple Maps, Bing Places, Data Aggregators (Foursquare, Data Axle, Localeze)</p>
        </div>
        
        <div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Secondary Citations</h4>
          <p>Industry-specific or locally-focused directories relevant to your business type or location.</p>
          <p><strong>Examples:</strong> Chamber of Commerce, industry associations, local newspaper directories, city-specific directories</p>
        </div>
        
        <div style="flex: 1; min-width: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Tertiary Citations</h4>
          <p>Additional mentions that may include broader business listings, social media profiles, or blog mentions.</p>
          <p><strong>Examples:</strong> Niche directories, social platforms, blog mentions, news articles, government records</p>
        </div>
      </div>
      
      <h3>NAP Consistency: The Golden Rule</h3>
      <p>NAP consistency means that your business's Name, Address, and Phone number are identical across all online platforms. Even minor discrepancies can confuse search engines and reduce trust signals.</p>
      
      <div class="example-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">NAP Consistency Examples</h4>
        
        <div style="display: flex; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
          <div style="flex: 1;"><strong>Consistent NAP (Good)</strong></div>
          <div style="flex: 2;">
            <p style="margin: 0;">XYZ Plumbing Services<br>
            123 Main Street, Suite 100<br>
            Portland, OR 97201<br>
            (503) 555-1234</p>
          </div>
        </div>
        
        <div style="display: flex; color: #e74c3c;">
          <div style="flex: 1;"><strong>Inconsistent NAP (Bad)</strong></div>
          <div style="flex: 2;">
            <p style="margin: 0;">XYZ Plumbing<br>
            123 Main St Suite #100<br>
            Portland, Oregon 97201<br>
            503-555-1234</p>
          </div>
        </div>
      </div>
      
      <p>Common inconsistency issues to avoid:</p>
      <ul>
        <li>Abbreviated vs. spelled out words (St. vs. Street)</li>
        <li>Missing or added suite numbers</li>
        <li>Different phone formats (with/without parentheses or dashes)</li>
        <li>Business name variations (XYZ Plumbing vs. XYZ Plumbing Services)</li>
        <li>Abbreviations in state names (OR vs. Oregon)</li>
        <li>Different ZIP code formats (with/without the extended 4 digits)</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Create a standardized NAP document with your exact business information format. Share this with everyone who might create citations or update business information online to ensure consistency.</p>
      </div>
      
      <h3>Citation Building: A Step-by-Step Process</h3>
      
      <h4>1. Audit Your Current Citations</h4>
      <ol>
        <li>Use citation tracking tools (Moz Local, BrightLocal, Whitespark) to discover existing citations</li>
        <li>Identify inconsistencies, duplicates, and missing information</li>
        <li>Catalog all found citations in a spreadsheet for tracking</li>
      </ol>
      
      <h4>2. Claim and Correct Existing Listings</h4>
      <ol>
        <li>Prioritize primary citation sources first</li>
        <li>Claim ownership of unclaimed listings</li>
        <li>Correct inaccurate information</li>
        <li>Add missing details (hours, descriptions, categories, etc.)</li>
        <li>Upload photos where possible</li>
        <li>Remove duplicate listings</li>
      </ol>
      
      <h4>3. Build New Citations</h4>
      <ol>
        <li>Start with data aggregators to efficiently distribute information</li>
        <li>Add top general directories (Yelp, Yellow Pages, etc.)</li>
        <li>Add industry-specific directories relevant to your business</li>
        <li>Include local-specific directories (chamber of commerce, local business associations)</li>
        <li>Create social media profiles with consistent NAP information</li>
      </ol>
      
      <h4>4. Optimize Citations</h4>
      <p>Go beyond basic NAP with these optimization strategies:</p>
      <ul>
        <li>Complete all available fields (business descriptions, hours, payment methods)</li>
        <li>Select appropriate categories (primary and secondary)</li>
        <li>Add high-quality images where permitted</li>
        <li>Include links to your website and social profiles</li>
        <li>Add business attributes (parking availability, accessibility features)</li>
      </ul>
      
      <h3>Top Citation Sources by Category</h3>
      
      <h4>Essential for All Businesses</h4>
      <ul>
        <li>Google Business Profile</li>
        <li>Bing Places</li>
        <li>Apple Maps</li>
        <li>Facebook Business</li>
        <li>Yelp</li>
        <li>Yellow Pages</li>
        <li>Better Business Bureau</li>
        <li>Foursquare</li>
        <li>Data Axle (InfoUSA)</li>
        <li>TripAdvisor (for relevant businesses)</li>
      </ul>
      
      <h4>Industry-Specific Directories</h4>
      <div class="industry-table" style="overflow-x: auto; margin: 15px 0;">
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left;">Industry</th>
            <th style="padding: 8px; text-align: left;">Top Directories</th>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Restaurants</strong></td>
            <td style="padding: 8px;">OpenTable, Zomato, MenuPages, EatApp, AllergyEats</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Hotels</strong></td>
            <td style="padding: 8px;">Hotels.com, Expedia, Booking.com, Kayak, Trivago</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Healthcare</strong></td>
            <td style="padding: 8px;">Healthgrades, WebMD, ZocDoc, Vitals, Doctor.com</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Legal</strong></td>
            <td style="padding: 8px;">Avvo, FindLaw, Justia, LegalMatch, Martindale-Hubbell</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Home Services</strong></td>
            <td style="padding: 8px;">Angi, HomeAdvisor, Thumbtack, Porch, Houzz</td>
          </tr>
        </table>
      </div>
      
      <h3>Citations Maintenance and Monitoring</h3>
      <p>Citation management is an ongoing process:</p>
      <ol>
        <li><strong>Quarterly Audits:</strong> Review top citations for accuracy and completeness</li>
        <li><strong>Update All Citations When Information Changes:</strong> Address changes, phone number updates, name rebrandings</li>
        <li><strong>Monitor Reviews:</strong> Check regularly for new reviews across citation sources</li>
        <li><strong>Track Performance:</strong> Note referral traffic from citations in Google Analytics</li>
        <li><strong>Competitor Analysis:</strong> Identify new citation opportunities by analyzing competitor listings</li>
      </ol>
      
      <div class="tools-box" style="background: #f0f7ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3366cc;">Recommended Citation Management Tools</h4>
        <ul>
          <li><strong>BrightLocal:</strong> Citation tracking, building, and reporting</li>
          <li><strong>Moz Local:</strong> Distribution to major data aggregators and citation monitoring</li>
          <li><strong>Whitespark:</strong> Citation finder and local citation building service</li>
          <li><strong>Yext:</strong> Business information management across multiple platforms</li>
          <li><strong>Semrush:</strong> Listing management tools within their SEO suite</li>
        </ul>
      </div>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Pitfall</h4>
        <p>Many businesses make the mistake of building citations and then neglecting them. When business information changes (address, phone, hours), failure to update all citations creates inconsistencies that harm your local SEO.</p>
      </div>
      
      <p>Effective citation building and management require initial effort but provide long-term benefits. By establishing a strong foundation of consistent business information across the web, you strengthen your local search presence and make it easier for customers to find and trust your business.</p>`,
    estimatedTime: 35,
    sortOrder: 3,
    isActive: true,
    quiz: {
      id: 6003,
      lessonId: 603,
      questions: [
        {
          id: 60010,
          text: "What does NAP stand for in the context of local citations?",
          options: [
            "Name, Area, Position",
            "Navigation, Address, Phone",
            "Name, Address, Phone number",
            "Network, Association, Place"
          ],
          correctOptionIndex: 2,
          explanation: "NAP stands for Name, Address, and Phone number. These three elements make up the core of a business citation and must be consistent across all online platforms."
        },
        {
          id: 60011,
          text: "Which of the following is an example of NAP inconsistency?",
          options: [
            "Using the same phone number format on all platforms",
            "Abbreviating 'Street' as 'St.' on some directories",
            "Using the identical business name everywhere",
            "Including the same suite number in every citation"
          ],
          correctOptionIndex: 1,
          explanation: "Abbreviating 'Street' as 'St.' on some directories but spelling it out on others is a common NAP inconsistency. Even minor variations like this can confuse search engines and reduce the effectiveness of your citations."
        },
        {
          id: 60012,
          text: "Which type of citation sources distribute information to many other platforms?",
          options: [
            "Secondary citations",
            "Primary citations",
            "Tertiary citations",
            "Social media profiles"
          ],
          correctOptionIndex: 1,
          explanation: "Primary citations, which include major data aggregators and top-tier general directories, distribute information to many other platforms. Examples include Data Axle (InfoUSA), Foursquare, and major directories like Google Business Profile."
        },
        {
          id: 60013,
          text: "How often should businesses audit their citations?",
          options: [
            "Weekly",
            "Monthly",
            "Quarterly",
            "Annually"
          ],
          correctOptionIndex: 2,
          explanation: "The recommended best practice is to conduct quarterly audits of your citations. This ensures you catch and correct any inconsistencies or outdated information in a timely manner while not being overly burdensome."
        },
        {
          id: 60014,
          text: "What is the recommended first step in the citation building process?",
          options: [
            "Create new citations immediately",
            "Audit your current citations",
            "Build social media profiles",
            "Optimize for keywords"
          ],
          correctOptionIndex: 1,
          explanation: "The first step in the citation building process should be to audit your current citations. This involves discovering existing citations, identifying inconsistencies or duplicates, and cataloging them before making corrections or creating new listings."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "The Ultimate Guide to Local Citations",
        url: "https://whitespark.ca/blog/the-ultimate-guide-to-local-citations/",
        type: "guide",
        description: "Comprehensive overview of citation building strategies"
      },
      {
        title: "Citation Building: Comprehensive List of Local Directories",
        url: "https://www.brightlocal.com/blog/top-local-citations-by-business-category/",
        type: "article",
        description: "Industry-specific citation sources for different business types"
      },
      {
        title: "Local SEO: Citation Building & Tracking Tool",
        url: "https://moz.com/products/local",
        type: "tool",
        description: "Platform for managing and monitoring your local citations"
      }
    ]
  },
  {
    id: 604,
    moduleId: 6,
    title: "Online Reviews & Reputation Management",
    description: "Learn strategies for generating positive reviews, properly responding to all feedback, and managing your business's online reputation.",
    content: `<h2>Online Reviews & Reputation Management</h2>
      <p>In the local SEO landscape, customer reviews have become a critical ranking factor and a powerful influence on consumer decisions. Reviews impact your business in multiple ways—affecting everything from search visibility to conversion rates—making review management an essential component of your local marketing strategy.</p>
      
      <h3>The Impact of Online Reviews</h3>
      <div class="stats-container" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Review Statistics</h4>
        <ul>
          <li>93% of consumers read online reviews before visiting a business</li>
          <li>Reviews account for ~15% of Google's local ranking factors</li>
          <li>Businesses with a 4.5+ star rating earn 28% more revenue</li>
          <li>Consumers require an average of 40 reviews before trusting a business's star rating</li>
          <li>72% of consumers won't take action until they've read reviews</li>
          <li>A single negative review can cost a business about 30 customers</li>
          <li>Responding to reviews leads to an average rating increase of 0.12 stars</li>
        </ul>
      </div>
      
      <h3>How Reviews Impact Local SEO</h3>
      <p>Google considers several review factors in its local search rankings:</p>
      <ol>
        <li><strong>Review Quantity:</strong> Total number of reviews across platforms (more is better)</li>
        <li><strong>Review Velocity:</strong> How frequently you receive new reviews</li>
        <li><strong>Review Diversity:</strong> Distribution across multiple platforms (not just Google)</li>
        <li><strong>Review Quality:</strong> Length, detail, and keywords mentioned</li>
        <li><strong>Review Recency:</strong> How recent your latest reviews are</li>
        <li><strong>Review Responses:</strong> Whether and how you respond to reviews</li>
        <li><strong>Review Sentiment:</strong> Overall rating and sentiment analysis</li>
      </ol>
      
      <h3>Critical Review Platforms for Local Businesses</h3>
      
      <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; text-align: left;">Platform</th>
          <th style="padding: 10px; text-align: left;">Importance</th>
          <th style="padding: 10px; text-align: left;">Key Considerations</th>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Google Business Profile</strong></td>
          <td style="padding: 10px;">Critical for all businesses</td>
          <td style="padding: 10px;">Direct impact on local pack rankings; most visible to searchers; integrated with Maps</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Yelp</strong></td>
          <td style="padding: 10px;">High for restaurants, retail, services</td>
          <td style="padding: 10px;">Strong domain authority; powers Apple Maps reviews; significant consumer trust</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Facebook</strong></td>
          <td style="padding: 10px;">Important for customer engagement</td>
          <td style="padding: 10px;">High social visibility; recommendations format; integrated with Facebook marketing</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Industry-Specific</strong><br>(TripAdvisor, Healthgrades, Avvo, etc.)</td>
          <td style="padding: 10px;">Critical for relevant businesses</td>
          <td style="padding: 10px;">Highly trusted by industry-specific consumers; often rank high for relevant searches</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Better Business Bureau</strong></td>
          <td style="padding: 10px;">Important for service businesses</td>
          <td style="padding: 10px;">High domain authority; strong trust factor; appears for branded searches</td>
        </tr>
      </table>
      
      <h3>Review Generation Strategies</h3>
      <p>Developing a systematic approach to gathering reviews is essential:</p>
      
      <h4>1. Create a Review Acquisition Process</h4>
      <ol>
        <li>Identify optimal timing for requests (post-purchase, service completion, positive interaction)</li>
        <li>Determine who will ask for reviews (frontline staff, follow-up emails, text messages)</li>
        <li>Create scripts and templates for consistency</li>
        <li>Establish a tracking system for monitoring progress</li>
      </ol>
      
      <h4>2. Make Reviewing Easy</h4>
      <ul>
        <li>Create short, direct links to your review profiles (use Google's Marketing Kit)</li>
        <li>Generate QR codes that link directly to review forms</li>
        <li>Send follow-up emails or texts with direct review links</li>
        <li>Offer simple instructions for leaving reviews</li>
      </ul>
      
      <div class="example-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Sample Review Request Templates</h4>
        
        <div style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
          <h5 style="margin-top: 0;">Email Template</h5>
          <p style="font-style: italic; margin: 0;">
            Subject: How was your experience with [Business Name]?<br><br>
            
            Hi [Customer Name],<br><br>
            
            Thank you for choosing [Business Name]! We hope you enjoyed your recent [product/service].<br><br>
            
            If you have a moment, we'd greatly appreciate it if you could share your experience with others by leaving a quick review. Your feedback helps us improve and assists other customers in making informed decisions.<br><br>
            
            Click here to leave a review on Google: [Direct Link]<br><br>
            
            Thank you for your support!<br><br>
            
            [Your Name]<br>
            [Business Name]
          </p>
        </div>
        
        <div>
          <h5 style="margin-top: 0;">SMS Template</h5>
          <p style="font-style: italic; margin: 0;">
            Thanks for visiting [Business Name]! We'd love your feedback. Could you take a moment to leave us a quick review? [Short Link] Thanks for your support!
          </p>
        </div>
      </div>
      
      <h4>3. Timing Your Requests</h4>
      <ul>
        <li>Ask at the moment of highest satisfaction (service completion, product delivery)</li>
        <li>For service businesses, follow up 1-3 days after service completion</li>
        <li>For retail, request feedback shortly after purchase or delivery</li>
        <li>Use satisfaction surveys first, then request reviews from satisfied customers</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Implement a "review funnel" approach: First ask customers if they were satisfied with their experience. If yes, direct them to leave a public review. If no, direct them to private feedback. This helps filter out potential negative reviews while still gathering valuable feedback.</p>
      </div>
      
      <h4>4. Staff Training</h4>
      <p>Educate your team on review importance and processes:</p>
      <ul>
        <li>Train staff to ask for reviews at appropriate moments</li>
        <li>Role-play review requests to build comfort</li>
        <li>Create incentives for staff who generate reviews (while complying with review platform policies)</li>
        <li>Share positive reviews with the team for motivation</li>
      </ul>
      
      <h3>Responding to Reviews</h3>
      <p>Proper response strategies vary by review sentiment:</p>
      
      <h4>Positive Review Response Framework</h4>
      <ol>
        <li>Thank the reviewer by name</li>
        <li>Express genuine appreciation for their feedback</li>
        <li>Reinforce specific positive points they mentioned</li>
        <li>Add value with relevant information</li>
        <li>Invite them back or suggest next steps</li>
        <li>Sign with name and position</li>
      </ol>
      
      <div class="example-response" style="background: #f0f7ff; border-radius: 5px; padding: 15px; margin: 15px 0;">
        <h5 style="margin-top: 0;">Positive Review Response Example:</h5>
        <p style="font-style: italic; margin: 0;">
          "Hi Sarah,<br><br>
          
          Thank you so much for taking the time to share your experience at [Business Name]! We're thrilled to hear that you enjoyed our [specific service/product they mentioned] and appreciated our [another positive point they noted].<br><br>
          
          Next time you visit, be sure to ask about our [related service/product] which pairs perfectly with what you enjoyed.<br><br>
          
          We look forward to serving you again soon!<br><br>
          
          John Smith<br>
          Customer Experience Manager"
        </p>
      </div>
      
      <h4>Negative Review Response Framework</h4>
      <ol>
        <li>Thank the reviewer for their feedback</li>
        <li>Apologize for their negative experience</li>
        <li>Address specific issues mentioned (without being defensive)</li>
        <li>Take the conversation offline</li>
        <li>Provide your direct contact information</li>
        <li>Explain any changes made based on their feedback</li>
        <li>Sign with name and position</li>
      </ol>
      
      <div class="example-response" style="background: #fff5f5; border-radius: 5px; padding: 15px; margin: 15px 0;">
        <h5 style="margin-top: 0;">Negative Review Response Example:</h5>
        <p style="font-style: italic; margin: 0;">
          "Hello James,<br><br>
          
          Thank you for taking the time to share your feedback. We sincerely apologize that your experience with our [specific service/product] didn't meet your expectations, particularly regarding the [specific issue mentioned].<br><br>
          
          We take your comments seriously and would appreciate the opportunity to make this right. Could you please contact me directly at [phone/email] so we can address your concerns personally?<br><br>
          
          Based on your feedback, we've already [explain specific action taken or change made] to improve our service.<br><br>
          
          We value your business and hope to have the chance to provide you with a better experience in the future.<br><br>
          
          Sarah Johnson<br>
          Customer Service Manager"
        </p>
      </div>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">What to Avoid When Responding to Negative Reviews</h4>
        <ul>
          <li>Arguing with or contradicting the reviewer</li>
          <li>Making excuses or being defensive</li>
          <li>Using a generic template without addressing specific issues</li>
          <li>Including marketing language or promotional content</li>
          <li>Making promises you can't keep</li>
          <li>Getting emotional or taking criticism personally</li>
        </ul>
      </div>
      
      <h3>Managing Review Platforms</h3>
      <p>Implement these best practices across all review platforms:</p>
      <ol>
        <li><strong>Claim All Profiles:</strong> Take ownership of all relevant review site listings</li>
        <li><strong>Complete Profiles:</strong> Fill out all information fields, add photos, and optimize descriptions</li>
        <li><strong>Monitor Daily:</strong> Set up alerts for new reviews (Google Alerts, review management software)</li>
        <li><strong>Respond Promptly:</strong> Aim to respond within 24-48 hours</li>
        <li><strong>Dispute False Reviews:</strong> Flag reviews that violate platform policies (fake reviews, competitor attacks)</li>
        <li><strong>Track Performance:</strong> Monitor overall rating, review volume, and sentiment trends</li>
      </ol>
      
      <h3>Review Management Tools</h3>
      <div class="tools-box" style="background: #f0f7ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3366cc;">Recommended Review Management Tools</h4>
        <ul>
          <li><strong>BirdEye:</strong> Comprehensive review management across multiple platforms</li>
          <li><strong>Podium:</strong> Text-message based review generation and management</li>
          <li><strong>Reputation.com:</strong> Enterprise-level reputation management</li>
          <li><strong>GatherUp:</strong> Review generation and customer experience management</li>
          <li><strong>Grade.us:</strong> Review funnel and white-label review management</li>
        </ul>
      </div>
      
      <h3>Legal and Ethical Considerations</h3>
      <p>Stay within legal and platform guidelines:</p>
      <ul>
        <li><strong>Never Buy Reviews:</strong> Purchasing fake reviews violates FTC guidelines and platform policies</li>
        <li><strong>Don't Incentivize Positive Reviews:</strong> Most platforms prohibit offering rewards specifically for positive reviews</li>
        <li><strong>Avoid Review Gating:</strong> Filtering out negative reviews before they're posted violates Google's policies</li>
        <li><strong>Know Platform Policies:</strong> Each review site has specific rules (e.g., Yelp prohibits directly asking for reviews)</li>
        <li><strong>Respect Privacy:</strong> Don't include customer's personal information in responses</li>
      </ul>
      
      <p>By implementing a strategic approach to review generation and management, you can build a positive online reputation that not only improves your local search rankings but also influences potential customers at the critical moment of decision-making.</p>`,
    estimatedTime: 45,
    sortOrder: 4,
    isActive: true,
    quiz: {
      id: 6004,
      lessonId: 604,
      questions: [
        {
          id: 60015,
          text: "According to the lesson, approximately what percentage of Google's local ranking factors is attributed to reviews?",
          options: [
            "5%",
            "15%",
            "25%",
            "35%"
          ],
          correctOptionIndex: 1,
          explanation: "Reviews account for approximately 15% of Google's local ranking factors, making them a significant component of local SEO success."
        },
        {
          id: 60016,
          text: "What is 'review gating' and why is it problematic?",
          options: [
            "Responding only to positive reviews, which builds trust",
            "Filtering out negative reviews before they're posted, which violates Google's policies",
            "Limiting the number of reviews per day, which reduces review effectiveness",
            "Requiring verification before reviews are posted, which improves authenticity"
          ],
          correctOptionIndex: 1,
          explanation: "Review gating is the practice of filtering out negative reviews before they're posted by pre-screening customers. This violates Google's policies and can result in penalties for your business."
        },
        {
          id: 60017,
          text: "What is the recommended timeframe for responding to reviews?",
          options: [
            "Within 24-48 hours",
            "Within 1 week",
            "Within 1 month",
            "Only respond to negative reviews"
          ],
          correctOptionIndex: 0,
          explanation: "The recommended timeframe for responding to reviews is within 24-48 hours. Prompt responses show attentiveness to customer feedback and can help mitigate negative reviews."
        },
        {
          id: 60018,
          text: "What is a 'review funnel' approach?",
          options: [
            "Getting reviews on multiple platforms simultaneously",
            "Converting all reviews into a single dashboard",
            "First asking if customers were satisfied, then directing satisfied customers to leave public reviews",
            "Gradually building reviews over a long period"
          ],
          correctOptionIndex: 2,
          explanation: "A 'review funnel' approach involves first asking customers if they were satisfied with their experience. If they indicate they were satisfied, they are directed to leave a public review. If not, they are directed to provide private feedback. This helps filter out potential negative reviews while still gathering valuable feedback."
        },
        {
          id: 60019,
          text: "Which of the following should you AVOID when responding to negative reviews?",
          options: [
            "Thanking the reviewer for their feedback",
            "Apologizing for their negative experience",
            "Arguing with or contradicting the reviewer",
            "Providing direct contact information"
          ],
          correctOptionIndex: 2,
          explanation: "When responding to negative reviews, you should avoid arguing with or contradicting the reviewer. This can escalate the situation and make your business appear unprofessional or defensive to other potential customers reading the exchange."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "The Complete Guide to Online Reviews",
        url: "https://www.brightlocal.com/learn/complete-guide-to-online-reviews/",
        type: "guide",
        description: "Comprehensive resource for managing reviews across platforms"
      },
      {
        title: "How to Respond to Negative Reviews",
        url: "https://www.podium.com/article/negative-review-response-examples/",
        type: "article",
        description: "Templates and examples for handling critical feedback"
      },
      {
        title: "Google's Guidelines on Reviews",
        url: "https://support.google.com/business/answer/2622994?hl=en",
        type: "guide",
        description: "Official Google guidelines for reviews on Google Business Profiles"
      }
    ]
  },
  {
    id: 605,
    moduleId: 6,
    title: "Local SEO Strategy & Implementation",
    description: "Develop a comprehensive local SEO strategy tailored to your business type, location, and competitive landscape.",
    content: `<h2>Local SEO Strategy & Implementation</h2>
      <p>Building on the foundations covered in previous lessons, this module focuses on developing and implementing a comprehensive local SEO strategy that integrates all components into a cohesive plan tailored to your specific business needs.</p>
      
      <h3>The Strategic Approach to Local SEO</h3>
      <p>Effective local SEO isn't about implementing random tactics—it requires a systematic approach:</p>
      
      <div class="strategy-framework" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
        <div style="flex: 1; min-width: 150px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9; text-align: center;">
          <h4 style="margin-top: 0; color: #3366cc;">1. Research & Assessment</h4>
          <p>Understand your starting point, competitive landscape, and opportunities</p>
        </div>
        
        <div style="flex: 1; min-width: 150px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9; text-align: center;">
          <h4 style="margin-top: 0; color: #3366cc;">2. Strategy Development</h4>
          <p>Create tailored plan with prioritized actions and measurable goals</p>
        </div>
        
        <div style="flex: 1; min-width: 150px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9; text-align: center;">
          <h4 style="margin-top: 0; color: #3366cc;">3. Implementation</h4>
          <p>Execute tactical elements in logical sequence with quality focus</p>
        </div>
        
        <div style="flex: 1; min-width: 150px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9; text-align: center;">
          <h4 style="margin-top: 0; color: #3366cc;">4. Monitoring & Analysis</h4>
          <p>Track performance metrics and gather insights for optimization</p>
        </div>
        
        <div style="flex: 1; min-width: 150px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9; text-align: center;">
          <h4 style="margin-top: 0; color: #3366cc;">5. Refinement</h4>
          <p>Continuously adjust strategy based on results and evolving landscape</p>
        </div>
      </div>
      
      <h3>Research & Assessment Phase</h3>
      
      <h4>1. Local SEO Audit</h4>
      <p>Begin with a comprehensive evaluation of your current local presence:</p>
      <ul>
        <li><strong>Google Business Profile Analysis:</strong> Completeness, accuracy, and optimization</li>
        <li><strong>Citation Audit:</strong> NAP consistency across directories</li>
        <li><strong>Website Local Optimization:</strong> On-page local signals, schema markup, mobile-friendliness</li>
        <li><strong>Review Profile:</strong> Volume, ratings, responses across platforms</li>
        <li><strong>Backlink Profile:</strong> Local relevance and authority of existing links</li>
        <li><strong>Technical SEO:</strong> Site speed, indexability, mobile experience</li>
      </ul>
      
      <h4>2. Competitive Analysis</h4>
      <p>Identify 3-5 top-ranking local competitors and analyze:</p>
      <ul>
        <li>Which local terms they rank for</li>
        <li>Their Google Business Profile optimization</li>
        <li>Review quantity, quality, and management approaches</li>
        <li>Citation profile and NAP consistency</li>
        <li>Local content strategy</li>
        <li>Backlink profile with focus on local links</li>
      </ul>
      
      <h4>3. Local Keyword Research</h4>
      <p>Identify location-specific search terms:</p>
      <ul>
        <li>Service/product + location combinations</li>
        <li>"Near me" and proximity variations</li>
        <li>Neighborhood-specific terms</li>
        <li>Local landmarks or reference points</li>
        <li>Colloquial terms specific to your area</li>
      </ul>
      
      <div class="example-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Local Keyword Examples for a Portland Dentist</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left;">Keyword Type</th>
            <th style="padding: 8px; text-align: left;">Examples</th>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service + City</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">dentist Portland, Portland dental clinic, teeth whitening Portland OR</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Neighborhood</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pearl District dentist, Southeast Portland dental care, Downtown Portland dentist</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Near Me</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">emergency dentist near me, teeth cleaning near me, dental implants near me</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Landmark</strong></td>
            <td style="padding: 8px;">dentist near Powell's Books, dental office near Providence Park</td>
          </tr>
        </table>
      </div>
      
      <h3>Strategy Development Phase</h3>
      
      <h4>1. Define Clear Objectives</h4>
      <p>Establish SMART goals for your local SEO campaign:</p>
      <ul>
        <li><strong>Specific:</strong> "Increase Google Business Profile views by 30%" vs. "Get more visibility"</li>
        <li><strong>Measurable:</strong> Define KPIs for tracking progress</li>
        <li><strong>Achievable:</strong> Set realistic targets based on your market and resources</li>
        <li><strong>Relevant:</strong> Align with broader business objectives (calls, visits, sales)</li>
        <li><strong>Time-bound:</strong> Establish clear timeframes for achievement</li>
      </ul>
      
      <h4>2. Prioritize Tactical Elements</h4>
      <p>Based on your audit findings, create a prioritized implementation plan:</p>
      
      <div class="priority-box" style="margin: 20px 0;">
        <div style="background: #ffe8e8; padding: 15px; border-radius: 8px 8px 0 0;">
          <h5 style="margin: 0; color: #cc0000;">High Priority (First 30 Days)</h5>
          <ul style="margin-bottom: 0;">
            <li>Google Business Profile optimization</li>
            <li>NAP consistency correction across top directories</li>
            <li>Critical on-site local SEO fixes (title tags, meta descriptions, headings)</li>
            <li>Implementation of local business schema</li>
            <li>Review response system implementation</li>
          </ul>
        </div>
        
        <div style="background: #fff9e6; padding: 15px;">
          <h5 style="margin: 0; color: #cc7700;">Medium Priority (30-90 Days)</h5>
          <ul style="margin-bottom: 0;">
            <li>Creation of location-specific content</li>
            <li>Secondary citation building</li>
            <li>Local link building with initial targets</li>
            <li>Review generation system implementation</li>
            <li>Local social media profile optimization</li>
          </ul>
        </div>
        
        <div style="background: #e6f4ea; padding: 15px; border-radius: 0 0 8px 8px;">
          <h5 style="margin: 0; color: #137333;">Ongoing Priority (90+ Days)</h5>
          <ul style="margin-bottom: 0;">
            <li>Continual content development with local focus</li>
            <li>Expansion of local link portfolio</li>
            <li>Monitoring and refinement of review strategy</li>
            <li>Analysis and adaptation of approach based on results</li>
            <li>Competitor movement tracking and response</li>
          </ul>
        </div>
      </div>
      
      <h4>3. Create a Timeline and Resource Allocation</h4>
      <ul>
        <li>Develop a month-by-month implementation calendar</li>
        <li>Assign responsibilities to team members or external resources</li>
        <li>Allocate budget across various tactics</li>
        <li>Identify tools needed for implementation and tracking</li>
      </ul>
      
      <h3>Implementation Phase</h3>
      
      <h4>1. Google Business Profile Optimization</h4>
      <p>Focus areas beyond basic setup:</p>
      <ul>
        <li>Implement a weekly Google Posts schedule</li>
        <li>Add all relevant products/services with descriptions</li>
        <li>Create and answer 10-15 FAQs in the Q&A section</li>
        <li>Develop a photo upload calendar (2-3 new images weekly)</li>
        <li>Configure messaging and response system</li>
      </ul>
      
      <h4>2. Website Localization Strategy</h4>
      <ul>
        <li><strong>Location-specific Landing Pages:</strong> Create detailed pages for each service area</li>
        <li><strong>Local Content:</strong> Develop blog posts relevant to local audience (events, news, guides)</li>
        <li><strong>Technical Implementation:</strong>
          <ul>
            <li>Include city/region in title tags, meta descriptions, headings</li>
            <li>Implement LocalBusiness schema markup</li>
            <li>Create a locally focused XML sitemap</li>
            <li>Optimize image alt text with location references</li>
          </ul>
        </li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.8em;">
        <h4 style="margin-top: 0;">Sample LocalBusiness Schema JSON-LD</h4>
        &lt;script type="application/ld+json"&gt;<br>
        {<br>
        &nbsp;&nbsp;"@context": "https://schema.org",<br>
        &nbsp;&nbsp;"@type": "DentistOrganization",<br>
        &nbsp;&nbsp;"name": "Portland Family Dental",<br>
        &nbsp;&nbsp;"image": "https://www.example.com/photos/photo.jpg",<br>
        &nbsp;&nbsp;"@id": "https://www.example.com",<br>
        &nbsp;&nbsp;"url": "https://www.example.com",<br>
        &nbsp;&nbsp;"telephone": "(503) 555-1234",<br>
        &nbsp;&nbsp;"priceRange": "$$",<br>
        &nbsp;&nbsp;"address": {<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"@type": "PostalAddress",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"streetAddress": "123 Main Street",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"addressLocality": "Portland",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"addressRegion": "OR",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"postalCode": "97201",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"addressCountry": "US"<br>
        &nbsp;&nbsp;},<br>
        &nbsp;&nbsp;"geo": {<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"@type": "GeoCoordinates",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"latitude": 45.523064,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"longitude": -122.676483<br>
        &nbsp;&nbsp;},<br>
        &nbsp;&nbsp;"openingHoursSpecification": [<br>
        &nbsp;&nbsp;&nbsp;&nbsp;{<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"@type": "OpeningHoursSpecification",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"opens": "09:00",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"closes": "17:00"<br>
        &nbsp;&nbsp;&nbsp;&nbsp;},<br>
        &nbsp;&nbsp;&nbsp;&nbsp;{<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"@type": "OpeningHoursSpecification",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dayOfWeek": "Friday",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"opens": "09:00",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"closes": "15:00"<br>
        &nbsp;&nbsp;&nbsp;&nbsp;}<br>
        &nbsp;&nbsp;]<br>
        }<br>
        &lt;/script&gt;
      </div>
      
      <h4>3. Strategic Local Link Building</h4>
      <p>Focus on quality and relevance:</p>
      <ul>
        <li><strong>Local Business Associations:</strong> Chamber of Commerce, merchant associations, BIA</li>
        <li><strong>Community Involvement:</strong> Sponsorships, events, charities</li>
        <li><strong>Local Partnerships:</strong> Complementary businesses, referral networks</li>
        <li><strong>Local Media:</strong> Press releases, expert commentary, event coverage</li>
        <li><strong>Local Resource Pages:</strong> "Best of" lists, community guides</li>
      </ul>
      
      <h4>4. Citation Building Strategy</h4>
      <ul>
        <li>Start with data aggregators (Infogroup, Acxiom, Localeze, Factual)</li>
        <li>Add Tier 1 directories (Google, Bing, Yelp, Facebook, etc.)</li>
        <li>Expand to industry-specific directories</li>
        <li>Include local-specific directories (regional, city-based)</li>
        <li>Implement monitoring system for NAP consistency</li>
      </ul>
      
      <h4>5. Review Management System</h4>
      <ul>
        <li>Create a documented review request process</li>
        <li>Develop templates for different request channels</li>
        <li>Implement a review monitoring and alerting system</li>
        <li>Create response templates for positive and negative reviews</li>
        <li>Schedule regular review performance analysis</li>
      </ul>
      
      <h3>Monitoring & Analysis Phase</h3>
      
      <h4>1. Key Performance Indicators (KPIs)</h4>
      <p>Track these essential metrics:</p>
      
      <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; text-align: left;">Category</th>
          <th style="padding: 10px; text-align: left;">KPIs to Track</th>
          <th style="padding: 10px; text-align: left;">Tools</th>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Visibility</strong></td>
          <td style="padding: 10px;">
            • Local pack rankings<br>
            • Organic rankings for local terms<br>
            • GBP impressions<br>
            • Map views
          </td>
          <td style="padding: 10px;">Google Search Console, GBP Insights, Local Rank Tracking Tools</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Engagement</strong></td>
          <td style="padding: 10px;">
            • Website clicks from GBP<br>
            • Direction requests<br>
            • Phone calls<br>
            • Form submissions<br>
            • Chat interactions
          </td>
          <td style="padding: 10px;">GBP Insights, Google Analytics, Call Tracking</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Reputation</strong></td>
          <td style="padding: 10px;">
            • Review quantity<br>
            • Average rating<br>
            • Review sentiment<br>
            • Response rate
          </td>
          <td style="padding: 10px;">Review Management Software, GBP Insights</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Traffic</strong></td>
          <td style="padding: 10px;">
            • Local organic traffic<br>
            • Traffic from local directories<br>
            • Branded vs. non-branded<br>
            • Mobile vs. desktop
          </td>
          <td style="padding: 10px;">Google Analytics, Search Console</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Conversions</strong></td>
          <td style="padding: 10px;">
            • Conversion rate by source<br>
            • Goal completions<br>
            • Store visits (if applicable)<br>
            • Revenue from local channels
          </td>
          <td style="padding: 10px;">Google Analytics, CRM, POS Systems</td>
        </tr>
      </table>
      
      <h4>2. Reporting Cadence</h4>
      <ul>
        <li><strong>Weekly:</strong> Quick performance snapshots and immediate issues</li>
        <li><strong>Monthly:</strong> Comprehensive performance review and tactical adjustments</li>
        <li><strong>Quarterly:</strong> Strategic assessment and major direction adjustments</li>
        <li><strong>Annual:</strong> Full strategy review and planning for upcoming year</li>
      </ul>
      
      <h3>Refinement Phase</h3>
      
      <h4>1. Continuous Improvement Cycles</h4>
      <p>Implement a regular process of:</p>
      <ol>
        <li>Analyzing performance data against KPIs</li>
        <li>Identifying opportunities and underperforming areas</li>
        <li>Researching new tactics and best practices</li>
        <li>Implementing targeted improvements</li>
        <li>Measuring impact of changes</li>
      </ol>
      
      <h4>2. Adaptation to Algorithm Updates</h4>
      <ul>
        <li>Monitor industry news sources for Google updates</li>
        <li>Review performance changes following updates</li>
        <li>Adapt strategy to align with new ranking factors</li>
        <li>Test and validate new approaches</li>
      </ul>
      
      <h4>3. Competitive Response</h4>
      <ul>
        <li>Conduct quarterly competitor analysis</li>
        <li>Identify new entrants and strategies</li>
        <li>Adapt to maintain competitive advantage</li>
        <li>Find underserved niches and opportunities</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>The most successful local SEO strategies reflect the unique characteristics of both the business and its local market. Avoid one-size-fits-all approaches and continuously refine your strategy based on real performance data.</p>
      </div>
      
      <h3>Business-Type Specific Considerations</h3>
      
      <h4>Service Area Businesses (SABs)</h4>
      <p>For businesses serving customers at their locations:</p>
      <ul>
        <li>Set up service areas in GBP instead of publicizing business address</li>
        <li>Create content targeting each service area</li>
        <li>Implement more aggressive review generation (as you lack foot traffic)</li>
        <li>Focus on service + location keywords for each area served</li>
      </ul>
      
      <h4>Multi-Location Businesses</h4>
      <p>For businesses with multiple physical locations:</p>
      <ul>
        <li>Create separate GBP for each location</li>
        <li>Develop location-specific website pages with unique content</li>
        <li>Implement location schema for each branch</li>
        <li>Segment performance tracking by location</li>
        <li>Coordinate review management across all locations</li>
      </ul>
      
      <h4>Hybrid Businesses</h4>
      <p>For businesses with both physical location(s) and service areas:</p>
      <ul>
        <li>Optimize for both location-specific and service area searches</li>
        <li>Create distinct content strategies for storefront and service aspects</li>
        <li>Use appropriate schema for both business types</li>
        <li>Track performance metrics separately for each business aspect</li>
      </ul>
      
      <p>Implementing a comprehensive local SEO strategy requires persistence and adaptability. By following this structured approach and tailoring tactics to your specific business needs, you can achieve sustainable visibility in local search and drive meaningful customer engagement.</p>`,
    estimatedTime: 50,
    sortOrder: 5,
    isActive: true,
    quiz: {
      id: 6005,
      lessonId: 605,
      questions: [
        {
          id: 60020,
          text: "What is a key characteristic of a SMART goal for local SEO?",
          options: [
            "Simplistic and easy to implement",
            "Managing expectations with low targets",
            "Specific and measurable with clear timeframes",
            "Social media focused over other channels"
          ],
          correctOptionIndex: 2,
          explanation: "SMART goals for local SEO should be Specific, Measurable, Achievable, Relevant, and Time-bound. An example would be 'Increase Google Business Profile views by 30% within 3 months' rather than vague goals like 'Get more visibility.'"
        },
        {
          id: 60021,
          text: "Which implementation task should typically be given highest priority in the first 30 days of a local SEO strategy?",
          options: [
            "Creating blog content with local focus",
            "Building backlinks from local websites",
            "Google Business Profile optimization",
            "Social media optimization"
          ],
          correctOptionIndex: 2,
          explanation: "Google Business Profile optimization should typically be given the highest priority in the first 30 days of a local SEO strategy. Since it's the cornerstone of local search visibility, getting it properly optimized creates immediate impact."
        },
        {
          id: 60022,
          text: "What is a key difference in local SEO strategy for a service area business compared to a business with a physical location?",
          options: [
            "Service area businesses don't need Google Business Profiles",
            "Service area businesses should set up service areas instead of publicizing their address",
            "Service area businesses don't need to focus on reviews",
            "Service area businesses should avoid location-specific keywords"
          ],
          correctOptionIndex: 1,
          explanation: "A key difference in local SEO strategy for service area businesses is that they should set up service areas in their Google Business Profile instead of publicizing their business address. This allows them to appear in local searches without revealing a physical address that customers don't visit."
        },
        {
          id: 60023,
          text: "Which of the following is an example of a local keyword for a Portland dentist?",
          options: [
            "best dentist",
            "dental implants procedure",
            "Pearl District dentist",
            "teeth cleaning benefits"
          ],
          correctOptionIndex: 2,
          explanation: "'Pearl District dentist' is an example of a local keyword for a Portland dentist as it combines a service (dentist) with a specific neighborhood (Pearl District) in Portland. This targets searchers looking for dental services in that specific location."
        },
        {
          id: 60024,
          text: "What reporting cadence is recommended for comprehensive performance review and tactical adjustments?",
          options: [
            "Weekly",
            "Monthly",
            "Quarterly",
            "Annual"
          ],
          correctOptionIndex: 1,
          explanation: "Monthly reporting is recommended for comprehensive performance review and tactical adjustments. Weekly is for quick snapshots, quarterly is for strategic assessment and major direction adjustments, and annual is for full strategy review and planning for the upcoming year."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "The Complete Local SEO Checklist",
        url: "https://www.searchenginejournal.com/local-seo-checklist/339931/",
        type: "guide",
        description: "Comprehensive checklist for implementing local SEO strategies"
      },
      {
        title: "Multi-Location SEO Playbook",
        url: "https://www.brightlocal.com/blog/multi-location-seo/",
        type: "article",
        description: "Specialized strategies for businesses with multiple locations"
      },
      {
        title: "Local SEO ROI Calculator",
        url: "https://www.localvisibilitysystem.com/local-seo-roi-calculator/",
        type: "tool",
        description: "Tool for estimating potential return on local SEO investment"
      }
    ]
  }
];