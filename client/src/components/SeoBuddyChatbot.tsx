import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

// Define message type
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// SEO response patterns for simple rule-based chatbot
const chatbotResponses = [
  {
    patterns: ['hello', 'hi', 'hey', 'howdy', 'greetings'],
    responses: [
      "Hi there! I'm your SEO Buddy. How can I help you with your SEO today?",
      "Hello! Ready to boost your search rankings? What SEO questions do you have?",
      "Hey! I'm here to help with your SEO. What would you like to know?"
    ]
  },
  {
    patterns: ['keyword', 'keywords', 'research', 'search term', 'search terms'],
    responses: [
      "Keywords are the foundation of SEO! Try our Keyword Research tool to find valuable search terms with good volume and reasonable competition.",
      "For keyword research, look at search intent, competition, and volume. Don't just chase high-volume terms - relevance to your business is key.",
      "When researching keywords, try adding modifiers like 'best', 'how to', or geographic terms to find more targeted opportunities."
    ]
  },
  {
    patterns: ['backlink', 'backlinks', 'link building', 'links'],
    responses: [
      "Quality backlinks are crucial for SEO. Focus on getting links from relevant, authoritative sites in your industry.",
      "For link building, try creating shareable content, reaching out to industry partners, or guest posting on relevant blogs.",
      "Remember that a few high-quality backlinks are better than many low-quality ones. Quality over quantity!"
    ]
  },
  {
    patterns: ['content', 'blog', 'article', 'write'],
    responses: [
      "Great content answers your audience's questions thoroughly. Use headers, lists, and engaging media to make it easy to read.",
      "When creating content, address the searcher's intent. Are they looking to learn, buy, or find a specific resource?",
      "Content should be comprehensive, unique, and provide value. Aim for at least 1,000 words for important topics, but prioritize quality over length."
    ]
  },
  {
    patterns: ['technical', 'site speed', 'speed', 'mobile', 'responsive'],
    responses: [
      "Technical SEO is vital! Ensure your site loads quickly, is mobile-friendly, and has a clean structure Google can easily crawl.",
      "Site speed affects both rankings and user experience. Optimize images, leverage browser caching, and minimize redirect chains.",
      "Mobile optimization is no longer optional - Google primarily uses mobile-first indexing for most sites now."
    ]
  },
  {
    patterns: ['local', 'gmb', 'google my business', 'map', 'maps'],
    responses: [
      "For local SEO, claim and optimize your Google Business Profile, get local citations, and encourage customer reviews.",
      "Local keywords often include city names, neighborhoods, or 'near me' phrases. Target these in your content and meta data.",
      "NAP consistency (Name, Address, Phone) across all online directories is crucial for local SEO success."
    ]
  },
  {
    patterns: ['meta', 'title', 'description', 'tag', 'tags'],
    responses: [
      "Meta titles should be 50-60 characters and include your main keyword near the beginning.",
      "Meta descriptions don't directly impact rankings but affect click-through rates. Keep them under 155 characters and make them compelling.",
      "Each page should have a unique meta title and description that accurately reflects the content."
    ]
  },
  {
    patterns: ['competitor', 'competition', 'competitors', 'rival'],
    responses: [
      "Analyzing competitors can reveal valuable SEO opportunities. Try our Rival Audit tool to see what's working for them.",
      "Look at which keywords your competitors rank for that you don't - these might be good opportunities.",
      "Study your top-ranking competitors' content structure, word count, and format to understand what Google prefers for your target keywords."
    ]
  },
  {
    patterns: ['rank', 'ranking', 'rankings', 'position', 'serp'],
    responses: [
      "Rankings fluctuate naturally. Focus on trends over time rather than day-to-day changes.",
      "Our Rank Tracker tool can help you monitor your positions for important keywords over time.",
      "Remember that personalization means the rankings you see may differ from what others see."
    ]
  },
  {
    patterns: ['tools', 'tool', 'analyze', 'audit'],
    responses: [
      "We have several tools to help your SEO: Rival Audit, Keyword Research, Rank Tracker, and PDF Analyzer.",
      "Our PDF Analyzer tool can extract insights from SEO reports automatically.",
      "The Rival Audit tool helps you analyze competitor websites for SEO gaps and opportunities."
    ]
  },
  {
    patterns: ['thanks', 'thank you', 'helpful', 'appreciate'],
    responses: [
      "You're welcome! Feel free to ask if you need any other SEO guidance.",
      "Happy to help! Let me know if you have more SEO questions.",
      "Anytime! SEO success comes from consistent effort and smart strategy."
    ]
  }
];

// Default fallback responses
const fallbackResponses = [
  "I'm not sure I understand that SEO question. Could you rephrase or ask about keywords, content, backlinks, or technical SEO?",
  "Hmm, that's a bit outside my knowledge area. I'm best at helping with SEO topics like keyword research, content optimization, and link building.",
  "I don't have specific information about that. Try asking about SEO best practices, keyword research, or competitor analysis?"
];

// Function to get a bot response based on user input
function getBotResponse(userInput: string): string {
  const input = userInput.toLowerCase();
  
  // Check if input matches any of our patterns
  for (const item of chatbotResponses) {
    for (const pattern of item.patterns) {
      if (input.includes(pattern)) {
        // Return a random response from the matching category
        const randomIndex = Math.floor(Math.random() * item.responses.length);
        return item.responses[randomIndex];
      }
    }
  }
  
  // If no match, return a random fallback response
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
}

export default function SeoBuddyChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your SEO Buddy. Ask me anything about SEO best practices, keywords, or content strategy!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    // Simulate typing delay then add bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 500 + Math.random() * 1000); // Random delay between 500-1500ms
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-2 rounded-lg ${
                message.isUser 
                  ? 'bg-primary text-white rounded-tr-none' 
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
              <p className="text-xs leading-snug">{message.text}</p>
            </div>
          </motion.div>
        ))}
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
            className="bg-primary text-white p-1.5 rounded-r-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}