import { useState } from 'react';
import { X, RefreshCw, HelpCircle, Lightbulb, MessageSquare } from 'lucide-react';
import { useLocation } from 'wouter';
import SeoBuddyChatInterface from './SeoBuddyChatInterface';
import { AnimatePresence, motion } from 'framer-motion';

// SEO buddy quotes for different pages
const buddyQuotes = {
  dashboard: [
    "Track your SEO progress over time to see what's working.",
    "Remember to analyze your competitors regularly for new insights.",
    "Try to improve your meta descriptions for better click-through rates.",
    "Focus on quality content that answers user questions.",
    "Consider building more relevant backlinks to improve authority.",
  ],
  history: [
    "Compare your monthly progress to identify growth trends.",
    "Significant ranking drops might indicate algorithm updates.",
    "Consistent improvements show your SEO strategy is working.",
    "Look for correlations between content updates and ranking changes.",
    "Use historical data to refine your keyword strategy.",
  ],
  projects: [
    "Organize your sites by priority to focus your efforts.",
    "Set achievable SEO goals for each project.",
    "Regularly audit each site for technical SEO issues.",
    "Compare performance across projects to apply winning tactics.",
    "Consider content gaps between similar projects.",
  ],
  results: [
    "Pay attention to mobile optimization scores – they're increasingly important.",
    "Address any critical SEO issues before minor ones.",
    "Implement structured data to enhance your search results.",
    "Remember that speed improvements often lead to ranking boosts.",
    "Use these insights to guide your content strategy.",
  ],
  rivalAudit: [
    "The Rival Audit tool helps analyze competitors. Check competitor analysis too!",
    "After your audit, use Keyword Research to find gaps in your strategy.",
    "Don't forget to analyze PDF reports for more insights!"
  ],
  keywordResearch: [
    "Looking for keywords? Remember to focus on search intent, not just volume.",
    "Try combining core terms with modifiers like 'best', 'how to', or location names.",
    "Track performance in the Rank Tracker after targeting new keywords."
  ],
  pdfAnalyzer: [
    "Upload SEO reports here for AI analysis! Need help with keywords? Try Keyword Research.",
    "After analyzing, track performance with Rank Tracker.",
    "Check Rival Audit to compare your data against competitors!"
  ],
  default: [
    "Need SEO help? I'm your SEO Buddy! Try the Rival Audit tool first.",
    "Looking for keyword ideas? Check out Keyword Research.",
    "Want to analyze SEO reports? Use the PDF Analyzer tool!"
  ]
};

// SEO character faces
const buddyFaces = ["(◠‿◠)", "(⌐■_■)", "(◕‿◕)", "ʕ•ᴥ•ʔ", "(•‿•)"];

// Chat components used in this file

// Main SEO Buddy Component for non-learning pages
function MainSeoBuddy() {
  const [expanded, setExpanded] = useState(false);
  const [showBuddy, setShowBuddy] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [buddyFace, setBuddyFace] = useState(buddyFaces[0]);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showBestPractices, setShowBestPractices] = useState(false);
  const [location] = useLocation();
  
  // Determine which tips to show based on current page
  const getTipsForLocation = () => {
    if (location === '/') return buddyQuotes.dashboard;
    if (location.includes('/history')) return buddyQuotes.history;
    if (location.includes('/projects')) return buddyQuotes.projects;
    if (location.includes('/dashboard')) return buddyQuotes.dashboard;
    if (location.includes('rival-audit')) return buddyQuotes.rivalAudit;
    if (location.includes('keyword-research')) return buddyQuotes.keywordResearch;
    if (location.includes('pdf-analyzer')) return buddyQuotes.pdfAnalyzer;
    
    // Default to dashboard tips if no match
    return buddyQuotes.default;
  };
  
  // Get a random tip for the current location
  const getRandomTip = () => {
    const tips = getTipsForLocation();
    const randomIndex = Math.floor(Math.random() * tips.length);
    setCurrentTip(randomIndex);
    return tips[randomIndex];
  };
  
  // Handle waving animation
  const handleWave = () => {
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1000);
    setBuddyFace(buddyFaces[Math.floor(Math.random() * buddyFaces.length)]);
  };
  
  // Toggle visibility
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded) {
      handleWave();
    }
  };
  
  // Handle shake animation
  const handleShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };
  
  // Return the actual component JSX
  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-4 sm:right-4 bottom-16 right-2">
      {showBuddy && (
        <div className="flex flex-col items-end space-y-2">
          {/* SEO Buddy Chat Interface */}
          <AnimatePresence>
            {showChatBot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="mb-2 bg-white rounded-lg shadow-lg w-[350px] h-[450px] overflow-hidden seo-buddy-mobile-chat"
              >
                <SeoBuddyChatInterface onClose={() => setShowChatBot(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mobile optimization handled via className */}
          
          {/* SEO Best Practices Interface */}
          <AnimatePresence>
            {showBestPractices && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="mb-2 bg-white rounded-lg shadow-lg w-[350px] max-h-[450px] overflow-auto seo-buddy-mobile-tips"
              >
                <div className="p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5 flex justify-between items-center">
                  <div className="flex items-center">
                    <Lightbulb className="w-3.5 h-3.5 text-primary mr-1" />
                    <span className="text-xs font-medium">SEO Best Practices</span>
                  </div>
                  <button 
                    onClick={() => setShowBestPractices(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4 text-sm">
                  <div className="space-y-2">
                    <h3 className="font-medium text-primary">On-Page SEO Tips</h3>
                    <ul className="list-disc list-inside text-xs space-y-1 text-gray-700">
                      <li>Use descriptive, keyword-rich title tags (under 60 characters)</li>
                      <li>Create unique meta descriptions (under 155 characters)</li>
                      <li>Optimize images with descriptive alt text</li>
                      <li>Use header tags (H1, H2, H3) to structure content</li>
                      <li>Ensure content is comprehensive and high-quality</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-primary">Technical SEO Tips</h3>
                    <ul className="list-disc list-inside text-xs space-y-1 text-gray-700">
                      <li>Improve page speed (compress images, minify code)</li>
                      <li>Ensure site is mobile-friendly</li>
                      <li>Fix broken links and crawl errors</li>
                      <li>Use HTTPS for secure browsing</li>
                      <li>Create and submit XML sitemaps</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main SEO Buddy Interface */}
          {expanded && (
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">SEO Buddy</h3>
                <div className="flex space-x-1">
                  <button 
                    onClick={getRandomTip}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <RefreshCw className="h-3 w-3 text-gray-400" />
                  </button>
                  <button 
                    onClick={() => setShowBuddy(false)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {getTipsForLocation()[currentTip]}
              </p>
              <div className="flex justify-between text-xs">
                <button 
                  onClick={() => {
                    setShowChatBot(true);
                    setExpanded(false);
                  }}
                  className="text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  Ask a question
                </button>
                <button 
                  onClick={() => {
                    setShowBestPractices(true);
                    setExpanded(false);
                  }}
                  className="text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Lightbulb className="h-3 w-3" />
                  SEO tips
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={toggleExpanded}
            onMouseOver={handleShake}
            className={`h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all ${
              isWaving ? 'animate-wave' : ''
            } ${isShaking ? 'animate-wiggle' : ''}`}
          >
            <span className="text-lg font-bold">{buddyFace}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// The wrapper component that conditionally renders SEO Buddy
export default function SeoBuddy() {
  const [location] = useLocation();
  
  // Check if we're on a learning page where we don't want to show SeoBuddy
  const isLearningPage = location.includes('/learning') || 
                         location.includes('/modules/') || 
                         location.includes('/achievement-demo');
  
  // Return null on learning pages - LearningCompanion will be used instead
  if (isLearningPage) {
    return null;
  }
  
  // On other pages, show the main SEO Buddy interface
  return <MainSeoBuddy />;
}