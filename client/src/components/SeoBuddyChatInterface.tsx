import { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Maximize2, Minimize2, MessageCircle, 
  ChevronLeft, ExternalLink, Book, Search, X, Lightbulb, Cpu,
  AlertCircle, Lock
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { seoKnowledgeBase, SeoTopic, SeoSubtopic, industrySpecificAdvice, seoTools } from '@/data/seoKnowledgeBase';
import { getOpenAIResponse } from '@/services/openAiService';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

// Define message type
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isAI?: boolean;
  sources?: {
    topic: string;
    subtopic: string;
    url?: string;
  }[];
}

export interface SeoBuddyChatProps {
  onClose?: () => void;
  showHeader?: boolean;
  onExpand?: (expanded: boolean) => void;
}

// Interface for usage tracking
interface ChatUsageStatus {
  authenticated: boolean;
  usageCount: number;
  limit: number;
  remaining: number;
  status: 'ok' | 'approaching_limit' | 'limit_reached';
}

// Safe text formatting function to prevent XSS
const formatMessageText = (text: string): string => {
  // First sanitize the text to remove any potential HTML
  const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  
  // Then apply our formatting with safe HTML
  const formattedText = sanitizedText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    .replace(/•/g, '&#8226;');
  
  // Sanitize the final HTML to ensure only safe tags are allowed
  return DOMPurify.sanitize(formattedText, { 
    ALLOWED_TAGS: ['strong', 'br'],
    ALLOWED_ATTR: []
  });
};

export default function SeoBuddyChatInterface({ onClose, showHeader = true, onExpand }: SeoBuddyChatProps) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your SEO Buddy. Ask me anything about SEO best practices, keywords, or content strategy!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('chatSessionId') || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [chatUsage, setChatUsage] = useState<ChatUsageStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store session ID in localStorage (for anonymous users to track usage)
  useEffect(() => {
    if (!localStorage.getItem('chatSessionId')) {
      localStorage.setItem('chatSessionId', sessionId);
    }
  }, [sessionId]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle expand/collapse
  const handleResize = (expand: boolean) => {
    console.log("Expanding chat:", expand);
    setIsExpanded(expand);
    if (onExpand) {
      onExpand(expand);
    }
    
    // Ensure UI updates happen by forcing a reflow after state change
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  };
  
  // Detect mobile screen size and adjust on window resize
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate appropriate height based on screen size and expansion state
  const mobileHeight = isExpanded ? 'h-full' : 'h-full';
  const desktopHeight = isExpanded ? 'h-[450px]' : 'h-[300px]';
  const chatHeight = isMobile ? mobileHeight : desktopHeight;

  // Common SEO questions for more natural responses
  const commonQuestions = [
    {
      patterns: ['best way', 'how to optimize', 'improve seo', 'boost ranking', 'better rankings'],
      response: `To optimize your site's SEO effectively, I recommend a comprehensive approach:

1. **Technical foundation**: Ensure your site is crawlable, mobile-friendly, and loads quickly
2. **Content quality**: Create in-depth, valuable content that answers user questions
3. **On-page SEO**: Optimize titles, meta descriptions, headers, and use structured data
4. **Off-page SEO**: Build quality backlinks from reputable sites in your industry
5. **User experience**: Focus on engagement metrics like time on site and bounce rate

Would you like more specific information about any of these areas?`
    },
    {
      patterns: ['keywords', 'keyword research', 'find keywords', 'best keywords'],
      response: `Effective keyword research is crucial for SEO success. Here's a proven process:

1. **Start broad**: Identify seed keywords related to your business/industry
2. **Expand**: Use tools like Semrush, Ahrefs, or Google Keyword Planner to find related terms
3. **Analyze intent**: Group keywords by user intent (informational, navigational, commercial, transactional)
4. **Evaluate competition**: Balance search volume against difficulty and your site's authority
5. **Target long-tail keywords**: These longer, more specific phrases often convert better
6. **Map keywords**: Assign primary and secondary keywords to specific pages

Need recommendations for specific keyword research tools?`
    },
    {
      patterns: ['backlinks', 'link building', 'get links', 'quality links'],
      response: `Strategic link building remains one of the most powerful SEO tactics. Here are effective approaches:

1. **Create linkable assets**: Develop comprehensive guides, original research, or tools that naturally attract links
2. **Guest posting**: Contribute quality content to relevant, authoritative sites in your industry
3. **Resource link building**: Get your site included in resource lists and directories
4. **Broken link building**: Find broken links on other sites and suggest your content as a replacement
5. **Digital PR**: Create newsworthy content and build relationships with journalists/influencers
6. **Competitor analysis**: Identify who's linking to competitors but not to you

Would you like more details about any of these strategies?`
    },
    {
      patterns: ['local seo', 'google business', 'local search', 'local rankings'],
      response: `For local SEO success, focus on these key strategies:

1. **Google Business Profile**: Claim, verify and fully optimize your listing with photos, posts, and complete information
2. **Local citations**: Ensure consistent NAP (Name, Address, Phone) across all online directories
3. **Local content**: Create location-specific pages and content mentioning local landmarks
4. **Local link building**: Earn backlinks from local businesses, organizations, and news sites
5. **Reviews**: Implement a system to ethically generate and respond to customer reviews
6. **Local schema markup**: Add structured data for your business location and services

Is there a specific aspect of local SEO you'd like to explore further?`
    },
    {
      patterns: ['technical seo', 'site speed', 'crawlability', 'indexing'],
      response: `Technical SEO creates the foundation for all other optimization efforts:

1. **Site architecture**: Create a logical structure that's easy for users and search engines to navigate
2. **Page speed**: Optimize loading times through image compression, code minification, and server improvements
3. **Mobile optimization**: Ensure perfect mobile experience with responsive design and touch-friendly elements
4. **Crawlability**: Use robots.txt, XML sitemaps, and proper internal linking to guide search engines
5. **HTTPS**: Secure your site with proper SSL implementation
6. **Core Web Vitals**: Optimize LCP (loading), FID (interactivity), and CLS (visual stability) metrics

Would you like specific recommendations for any of these technical areas?`
    }
  ];

  // Function to check for common question patterns
  const checkCommonQuestions = (query: string): string | null => {
    query = query.toLowerCase();
    
    for (const question of commonQuestions) {
      for (const pattern of question.patterns) {
        if (query.includes(pattern)) {
          return question.response;
        }
      }
    }
    
    return null;
  };

  // Function to find relevant information from the knowledge base
  const findRelevantInformation = (query: string) => {
    query = query.toLowerCase();
    const relevantSources: {
      topic: SeoTopic;
      subtopic: SeoSubtopic;
      relevanceScore: number;
    }[] = [];
    
    // Search through all topics and subtopics
    seoKnowledgeBase.forEach(topic => {
      topic.subtopics.forEach(subtopic => {
        let relevanceScore = 0;
        
        // Check topic name match
        if (topic.name.toLowerCase().includes(query)) {
          relevanceScore += 5;
        }
        
        // Check subtopic name match (most important)
        if (subtopic.name.toLowerCase().includes(query)) {
          relevanceScore += 10;
        }
        
        // Check content for exact phrase
        if (subtopic.content.toLowerCase().includes(query)) {
          relevanceScore += 8;
        }
        
        // Check keywords
        if (subtopic.keywords) {
          subtopic.keywords.forEach(keyword => {
            if (query.includes(keyword.toLowerCase())) {
              relevanceScore += 3;
            }
          });
        }
        
        // If the query contains multiple words, check for partial matches
        const queryWords = query.split(' ').filter(word => word.length > 3);
        queryWords.forEach(word => {
          if (subtopic.content.toLowerCase().includes(word)) {
            relevanceScore += 1;
          }
        });
        
        // Add to relevant sources if score is high enough
        if (relevanceScore > 3) {
          relevantSources.push({
            topic,
            subtopic,
            relevanceScore
          });
        }
      });
    });
    
    // Sort by relevance score and take top results
    return relevantSources
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  };

  // Generate response using the knowledge base and OpenAI fallback
  const generateResponse = async (userInput: string): Promise<{ text: string; sources?: { topic: string; subtopic: string; }[]; isAI?: boolean }> => {
    // First check for common questions
    const commonResponse = checkCommonQuestions(userInput);
    if (commonResponse) {
      return { text: commonResponse };
    }
    
    const relevantInfo = findRelevantInformation(userInput);
    
    // If no relevant information found from knowledge base
    if (relevantInfo.length === 0) {
      // Check if the query contains industry-specific terms
      const industries = Object.keys(industrySpecificAdvice);
      for (const industry of industries) {
        if (userInput.toLowerCase().includes(industry.toLowerCase())) {
          const industryAdvice = industrySpecificAdvice[industry as keyof typeof industrySpecificAdvice];
          return {
            text: `Here are some SEO tips specifically for ${industryAdvice.name}:\n\n` + 
                 industryAdvice.tips.map(tip => `• ${tip}`).join('\n')
          };
        }
      }
      
      // Check if asking about SEO tools
      if (userInput.toLowerCase().includes('tool') || userInput.toLowerCase().includes('software')) {
        const toolCategories = Object.keys(seoTools);
        let toolResponse = "Here are some popular SEO tools you might find helpful:\n\n";
        
        // Provide a sampling of tools from different categories
        toolCategories.forEach(category => {
          const tools = seoTools[category as keyof typeof seoTools];
          toolResponse += `For ${category} SEO:\n`;
          tools.slice(0, 2).forEach(tool => {
            toolResponse += `• ${tool.name}: ${tool.description}\n`;
          });
          toolResponse += '\n';
        });
        
        return { text: toolResponse };
      }
      
      // Use OpenAI for more specific or complex queries
      try {
        const aiResponse = await getOpenAIResponse(userInput);
        return { 
          text: aiResponse,
          isAI: true
        };
      } catch (error) {
        console.error("Error getting AI response:", error);
        
        // Default fallback response if OpenAI fails
        return {
          text: "To optimize your website's SEO comprehensively, focus on these key areas:\n\n" +
                "1. **Technical SEO**: Ensure your site is fast, mobile-friendly, and crawlable\n" +
                "2. **On-Page SEO**: Optimize content, meta tags, headers, and internal links\n" +
                "3. **Off-Page SEO**: Build quality backlinks from reputable sites\n" +
                "4. **Content Strategy**: Create valuable, keyword-optimized content that serves user intent\n" +
                "5. **User Experience**: Improve engagement metrics and reduce bounce rates\n\n" +
                "Would you like specific details about any of these areas?"
        };
      }
    }
    
    let response = '';
    const sources: { topic: string; subtopic: string; }[] = [];
    
    // Combine information from top results
    if (relevantInfo.length === 1) {
      // If only one source, provide detailed information
      const source = relevantInfo[0];
      response = `${source.subtopic.content}`;
      
      // Add example if available
      if (source.subtopic.examples && source.subtopic.examples.length > 0) {
        response += `\n\nFor example: ${source.subtopic.examples[0]}`;
      }
      
      sources.push({
        topic: source.topic.name,
        subtopic: source.subtopic.name
      });
    } else {
      // If multiple sources, provide a synthesized answer
      response = "Based on SEO best practices: ";
      
      // Extract key information from each source
      relevantInfo.forEach((source, index) => {
        // Extract first 1-2 sentences from each content
        const contentSentences = source.subtopic.content.split('. ');
        const keyInfo = contentSentences.slice(0, 2).join('. ') + '.';
        
        if (index === 0) {
          response += keyInfo + ' ';
        } else if (index === relevantInfo.length - 1) {
          response += ` Additionally, ${keyInfo.charAt(0).toLowerCase() + keyInfo.slice(1)}`;
        } else {
          response += ` Furthermore, ${keyInfo.charAt(0).toLowerCase() + keyInfo.slice(1)}`;
        }
        
        sources.push({
          topic: source.topic.name,
          subtopic: source.subtopic.name
        });
      });
    }
    
    return { text: response, sources };
  };

  // Track chat usage via API
  const trackChatUsage = async (): Promise<ChatUsageStatus | null> => {
    try {
      const response = await axios.post('/api/chat-usage', { sessionId });
      return response.data;
    } catch (error) {
      console.error('Error tracking chat usage:', error);
      return null;
    }
  };
  
  // Update chat usage on first load and when isAuthenticated changes
  useEffect(() => {
    trackChatUsage().then(usage => {
      if (usage) {
        setChatUsage(usage);
      }
    });
  }, [isAuthenticated]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isThinking) return;
    
    // Check usage limits before proceeding
    const usageStatus = await trackChatUsage();
    setChatUsage(usageStatus);
    
    // If limit reached, don't proceed
    if (usageStatus?.status === 'limit_reached') {
      const limitMessage: Message = {
        id: Date.now().toString(),
        text: isAuthenticated ? 
          "You've reached your monthly limit of 100 messages. Your limit will reset next month." :
          "You've reached your monthly limit of 20 messages. Please log in to get access to 100 messages per month, or wait until next month when your limit resets.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);
    
    // Generate response using knowledge base or OpenAI
    try {
      const response = await generateResponse(userMessage.text);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        isAI: response.isAI,
        sources: response.sources?.map(source => ({
          topic: source.topic,
          subtopic: source.subtopic
        }))
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // After response, show usage warning if approaching limit
      if (usageStatus?.status === 'approaching_limit') {
        setTimeout(() => {
          const warningMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: isAuthenticated ? 
              `Note: You've used ${usageStatus.usageCount} of your 100 monthly messages.` :
              `Note: You've used ${usageStatus.usageCount} of your 20 monthly messages. Log in to get 100 messages per month.`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, warningMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      // Provide a fallback response if something goes wrong
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble processing your request. Please try asking a different question about SEO.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className={`flex flex-col ${chatHeight} transition-all duration-300 ease-in-out`}>
      {showHeader && (
        <div className="flex justify-between items-center p-2 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center">
            <Bot className="w-3.5 h-3.5 text-primary mr-1" />
            <span className="text-xs font-medium">SEO Buddy Chat</span>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    data-chat-expand="true"
                    onClick={() => handleResize(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-2.5 w-2.5 text-gray-500" />
                    ) : (
                      <Maximize2 className="h-2.5 w-2.5 text-gray-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{isExpanded ? 'Minimize' : 'Maximize'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 hover:bg-red-100 hover:text-red-600" 
                onClick={onClose}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Chat usage status indicator */}
      {chatUsage && (
        <div className="px-2 pt-1">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-1 ${
                chatUsage.status === 'approaching_limit' 
                  ? 'bg-amber-500' 
                  : chatUsage.status === 'limit_reached' 
                    ? 'bg-red-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (chatUsage.usageCount / chatUsage.limit) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
            <span>
              {chatUsage.usageCount}/{chatUsage.limit} messages used
            </span>
            {chatUsage.status === 'approaching_limit' && (
              <span className="text-amber-600 flex items-center">
                <AlertCircle className="w-2 h-2 mr-0.5" />
                Approaching limit
              </span>
            )}
            {chatUsage.status === 'limit_reached' && (
              <span className="text-red-600 flex items-center">
                <Lock className="w-2 h-2 mr-0.5" />
                Limit reached
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-2 rounded-lg ${
                message.isUser 
                  ? 'bg-primary/90 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              <div className="flex items-start mb-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 flex-shrink-0 ${
                  message.isUser 
                    ? 'bg-white/20' 
                    : message.isAI ? 'bg-green-600/20' : 'bg-primary/20'
                }`}>
                  {message.isUser 
                    ? <User className={`w-2.5 h-2.5 text-white`} /> 
                    : message.isAI
                      ? <Cpu className={`w-2.5 h-2.5 text-green-600`} />
                      : <Bot className={`w-2.5 h-2.5 text-primary`} />
                  }
                </div>
                <span className="text-[11px] font-medium flex items-center">
                  {message.isUser 
                    ? 'You' 
                    : message.isAI 
                      ? (<>
                          <span>AI Assistant</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Lightbulb className="ml-1 w-2.5 h-2.5 text-green-600" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>Powered by advanced AI for enhanced responses</p>
                            </TooltipContent>
                          </Tooltip>
                        </>)
                      : 'SEO Buddy'
                  }
                </span>
              </div>
              <div 
                className="text-xs leading-snug"
                dangerouslySetInnerHTML={{ 
                  __html: formatMessageText(message.text)
                }} 
              />
              
              {/* Sources section */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-1 border-t border-gray-200 text-[10px]">
                  <div className="flex items-center text-gray-500">
                    <Book className="w-2.5 h-2.5 mr-1" />
                    <span>Sources:</span>
                  </div>
                  <ul className="mt-0.5 space-y-0.5">
                    {message.sources.map((source, index) => (
                      <li key={index} className="flex items-start">
                        <Search className="w-2 h-2 mt-0.5 mr-1 flex-shrink-0" />
                        <span className={message.isUser ? "text-white/80" : "text-gray-600"}>
                          {source.topic}: {source.subtopic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {/* Thinking indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 text-gray-600 rounded-lg rounded-tl-none p-2">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-2 border-t">
        <div className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about SEO..."
            className="flex-1 px-3 py-1.5 text-xs border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSendMessage}
            className="bg-primary text-white p-1.5 rounded-r-md hover:bg-primary/90 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}