import { useState, useEffect } from 'react';
import { X, MessageSquare, HelpCircle, Lightbulb, TrendingUp, ExternalLink, Link as LinkIcon, Search, Award, MessageCircle } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import SeoBuddyChatbot from "./SeoBuddyChatbot";

// SEO Buddy character
const buddyQuotes = {
  dashboard: [
    "Welcome to your SEO dashboard! Check out the <a href='/rival-audit'>Rival Audit</a> tool to analyze competitors.",
    "Need keyword ideas? Try the <a href='/keyword-research'>Keyword Research</a> tool for fresh inspiration.",
    "Track your keyword positions with the <a href='/basic-rank-tracker'>Rank Tracker</a> to see your progress."
  ],
  rivalAudit: [
    "The Rival Audit tool helps analyze competitors. Check <a href='/competitor-analysis'>Competitor Analysis</a> too!",
    "After your audit, use <a href='/keyword-research'>Keyword Research</a> to find gaps in your strategy.",
    "Don't forget to <a href='/pdf-analyzer'>analyze PDF reports</a> for more insights!"
  ],
  keywordResearch: [
    "Looking for keywords? Remember to focus on search intent, not just volume.",
    "Try combining core terms with modifiers like 'best', 'how to', or location names.",
    "Track performance in the <a href='/basic-rank-tracker'>Rank Tracker</a> after targeting new keywords."
  ],
  pdfAnalyzer: [
    "Upload SEO reports here for AI analysis! Need help with keywords? Try <a href='/keyword-research'>Keyword Research</a>.",
    "After analyzing, track performance with <a href='/basic-rank-tracker'>Rank Tracker</a>.",
    "Check <a href='/rival-audit'>Rival Audit</a> to compare your data against competitors!"
  ],
  default: [
    "Need SEO help? I'm your SEO Buddy! Try the <a href='/rival-audit'>Rival Audit</a> tool first.",
    "Looking for keyword ideas? Check out <a href='/keyword-research'>Keyword Research</a>.",
    "Want to analyze SEO reports? Use the <a href='/pdf-analyzer'>PDF Analyzer</a> tool!"
  ]
};

// SEO character faces
const buddyFaces = ["(◠‿◠)", "(⌐■_■)", "(◕‿◕)", "ʕ•ᴥ•ʔ", "(•‿•)"];

export default function SeoBuddy() {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [showBuddy, setShowBuddy] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [buddyFace, setBuddyFace] = useState(buddyFaces[0]);
  const [activeTab, setActiveTab] = useState("tips");
  
  // Determine which tips to show based on current page
  const getTipsForLocation = () => {
    if (location === '/') return buddyQuotes.dashboard;
    if (location.includes('rival-audit')) return buddyQuotes.rivalAudit;
    if (location.includes('keyword-research')) return buddyQuotes.keywordResearch;
    if (location.includes('pdf-analyzer')) return buddyQuotes.pdfAnalyzer;
    return buddyQuotes.default;
  };
  
  // Rotate through tips and occasionally change face
  useEffect(() => {
    const tipInterval = setInterval(() => {
      const tips = getTipsForLocation();
      setCurrentTip((prevTip) => (prevTip + 1) % tips.length);
      
      // Occasionally wave and change face to get attention
      if (Math.random() > 0.7) {
        setIsWaving(true);
        setBuddyFace(buddyFaces[Math.floor(Math.random() * buddyFaces.length)]);
        setTimeout(() => setIsWaving(false), 2000);
      }
    }, 8000);
    
    return () => clearInterval(tipInterval);
  }, [location]);
  
  // Reset tip counter when changing pages
  useEffect(() => {
    setCurrentTip(0);
    setBuddyFace(buddyFaces[0]);
  }, [location]);
  
  // Handle buddy click to change face
  const handleBuddyClick = () => {
    // Change to a random face
    const newFaceIndex = Math.floor(Math.random() * buddyFaces.length);
    setBuddyFace(buddyFaces[newFaceIndex]);
    
    // Add shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    
    // Expand if collapsed
    if (!expanded) {
      setExpanded(true);
    }
  };
  
  if (!showBuddy) {
    // Make buddy disappear but allow it to come back
    return (
      <motion.div 
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.div 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBuddy(true)}
          className="cursor-pointer"
        >
          <div className="bg-primary/10 hover:bg-primary/20 transition-colors duration-200 rounded-full p-3 shadow-md">
            <HelpCircle className="w-5 h-5 text-primary/80" />
          </div>
        </motion.div>
      </motion.div>
    );
  }
  
  const tips = getTipsForLocation();
  
  const createMarkup = (html) => {
    return { __html: html };
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {!expanded ? (
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBuddyClick}
            className="cursor-pointer flex flex-col items-center"
          >
            <motion.div
              animate={
                isShaking 
                  ? { x: [0, -4, 4, -3, 3, -2, 2, 0] }
                  : isWaving 
                    ? { rotate: [0, 15, -15, 10, -5, 0] } 
                    : {}
              }
              transition={{ 
                duration: isShaking ? 0.5 : 1.5,
                ease: isShaking ? "easeInOut" : "easeOut",
              }}
              className="bg-gradient-to-br from-primary/90 to-primary shadow-lg rounded-full p-3 mb-2"
            >
              <div className="text-white text-lg font-bold">{buddyFace}</div>
            </motion.div>
            <div className="bg-white px-3 py-1.5 rounded-full text-xs shadow-md border border-gray-100">
              Need SEO help?
            </div>
          </motion.div>
        ) : (
          <Card className="w-[280px] shadow-xl border-primary/10 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-3 flex flex-row justify-between items-center bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center">
                <div className="mr-2 relative">
                  <motion.div
                    animate={
                      isShaking 
                        ? { x: [0, -3, 3, -2, 2, -1, 1, 0] }
                        : isWaving 
                          ? { rotate: [0, 15, -15, 10, -5, 0] } 
                          : {}
                    }
                    transition={{ 
                      duration: isShaking ? 0.5 : 1.5,
                      ease: isShaking ? "easeInOut" : "easeOut",
                    }}
                    onClick={handleBuddyClick}
                    className="cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-primary/30 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-base">{buddyFace}</span>
                    </div>
                  </motion.div>
                </div>
                <div>
                  <CardTitle className="text-sm">SEO Buddy</CardTitle>
                  <CardDescription className="text-xs">SEO tips & tricks</CardDescription>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setExpanded(false)}
                >
                  <span className="sr-only">Minimize</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M0 4h10v2H0z" fill="currentColor" />
                  </svg>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:bg-red-100 hover:text-red-600" 
                  onClick={() => setExpanded(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-gray-50 border-b px-2 h-8">
                <TabsTrigger value="tips" className="text-xs h-6 flex-1">
                  <Lightbulb className="w-3 h-3 mr-1" /> Tips
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs h-6 flex-1">
                  <MessageCircle className="w-3 h-3 mr-1" /> Chat
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tips" className="p-0 m-0">
                <CardContent className="px-3 py-2 text-xs bg-gradient-to-br from-white to-gray-50">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTip}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="min-h-[60px] flex items-start pt-1"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 mr-1.5 flex-shrink-0 mt-0.5" />
                      <div 
                        className="tip-text" 
                        dangerouslySetInnerHTML={createMarkup(tips[currentTip])}
                        onClick={(e) => {
                          // Handle click on links inside the tip text
                          if (e.target.tagName === 'A') {
                            e.preventDefault();
                            const href = e.target.getAttribute('href');
                            if (href) {
                              // Use Wouter's navigate
                              window.location.href = href;
                            }
                          }
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="pt-0 px-3 pb-3 bg-gradient-to-br from-white to-gray-50">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs px-2 py-1 h-7">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        SEO Best Practices
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[350px] sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle className="flex items-center">
                          <Award className="w-4 h-4 mr-2 text-primary" />
                          SEO Best Practices
                        </SheetTitle>
                        <SheetDescription>
                          Quick tips to improve your search rankings
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                        <h3 className="font-medium mb-2 text-sm flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Top SEO Tips:
                        </h3>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-start">
                            <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                              <TrendingUp className="w-3 h-3 text-primary" />
                            </div>
                            <div className="text-sm">
                              <a href="https://moz.com/learn/seo/on-site-seo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                                Focus on user experience <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <span className="text-xs text-gray-600">Google rewards sites that visitors love</span>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                              <Search className="w-3 h-3 text-primary" />
                            </div>
                            <div className="text-sm">
                              <a href="https://ahrefs.com/blog/keyword-research/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                                Research keywords thoroughly <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <span className="text-xs text-gray-600">Target terms with the right search intent</span>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                              <LinkIcon className="w-3 h-3 text-primary" />
                            </div>
                            <div className="text-sm">
                              <a href="https://backlinko.com/link-building" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                                Build quality backlinks <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <span className="text-xs text-gray-600">From reputable, relevant sites</span>
                            </div>
                          </li>
                        </ul>
                        
                        <h3 className="font-medium mb-2 text-sm flex items-center">
                          <Award className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Tools in this app:
                        </h3>
                        <ul className="space-y-2">
                          <li className="text-sm border-l-2 border-primary/30 pl-2 py-0.5">
                            <Link href="/rival-audit" className="font-medium text-primary hover:underline">Rival Audit:</Link>
                            <div className="text-xs text-gray-600">Analyze competitor websites</div>
                          </li>
                          <li className="text-sm border-l-2 border-primary/30 pl-2 py-0.5">
                            <Link href="/keyword-research" className="font-medium text-primary hover:underline">Keyword Research:</Link>
                            <div className="text-xs text-gray-600">Discover valuable search terms</div>
                          </li>
                          <li className="text-sm border-l-2 border-primary/30 pl-2 py-0.5">
                            <Link href="/basic-rank-tracker" className="font-medium text-primary hover:underline">Rank Tracker:</Link>
                            <div className="text-xs text-gray-600">Monitor search positions</div>
                          </li>
                          <li className="text-sm border-l-2 border-primary/30 pl-2 py-0.5">
                            <Link href="/pdf-analyzer" className="font-medium text-primary hover:underline">PDF Analyzer:</Link>
                            <div className="text-xs text-gray-600">Extract insights from reports</div>
                          </li>
                        </ul>
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardFooter>
              </TabsContent>
              
              <TabsContent value="chat" className="p-0 m-0 h-[260px] overflow-hidden">
                <SeoBuddyChatbot />
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}