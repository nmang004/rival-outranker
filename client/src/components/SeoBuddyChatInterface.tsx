import { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Maximize2, Minimize2, MessageCircle, 
  ChevronLeft, ExternalLink, Book, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { seoKnowledgeBase, SeoTopic, SeoSubtopic } from '@/data/seoKnowledgeBase';

// Define message type
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: {
    topic: string;
    subtopic: string;
    url?: string;
  }[];
}

export default function SeoBuddyChatInterface({ onClose }: { onClose?: () => void }) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Expanded/collapsed height
  const chatHeight = isExpanded ? 'h-[400px]' : 'h-[200px]';

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

  // Generate response using the knowledge base
  const generateResponse = (userInput: string): { text: string; sources?: { topic: string; subtopic: string; }[] } => {
    const relevantInfo = findRelevantInformation(userInput);
    
    // If no relevant information found
    if (relevantInfo.length === 0) {
      return {
        text: "I don't have specific information about that. Would you like to ask about on-page SEO, technical SEO, link building, local SEO, or content strategy instead?"
      };
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

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
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
    
    // Generate response after slight delay to simulate thinking
    setTimeout(() => {
      const response = generateResponse(userMessage.text);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        sources: response.sources?.map(source => ({
          topic: source.topic,
          subtopic: source.subtopic
        }))
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsThinking(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className={`flex flex-col ${chatHeight} transition-all duration-300 ease-in-out`}>
      <div className="flex justify-between items-center p-2 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center">
          <Bot className="w-4 h-4 text-primary mr-1.5" />
          <span className="text-xs font-medium">SEO Buddy Chat</span>
        </div>
        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3 w-3 text-gray-500" />
                  ) : (
                    <Maximize2 className="h-3 w-3 text-gray-500" />
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
              className="h-6 w-6 hover:bg-red-100 hover:text-red-600" 
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-1 flex-shrink-0 ${
                  message.isUser ? 'bg-white/20' : 'bg-primary/20'
                }`}>
                  {message.isUser 
                    ? <User className={`w-3 h-3 text-white`} /> 
                    : <Bot className={`w-3 h-3 text-primary`} />
                  }
                </div>
                <span className="text-xs font-medium">
                  {message.isUser ? 'You' : 'SEO Buddy'}
                </span>
              </div>
              <p className="text-xs leading-snug whitespace-pre-line">{message.text}</p>
              
              {/* Sources section */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-1 border-t border-gray-200 text-xs">
                  <div className="flex items-center text-gray-500">
                    <Book className="w-3 h-3 mr-1" />
                    <span>Sources:</span>
                  </div>
                  <ul className="mt-0.5 space-y-0.5">
                    {message.sources.map((source, index) => (
                      <li key={index} className="flex items-start">
                        <Search className="w-2.5 h-2.5 mt-0.5 mr-1 flex-shrink-0" />
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
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}