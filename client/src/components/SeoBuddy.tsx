import { useState, useEffect } from 'react';
import { X, MessageSquare, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
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
import { motion, AnimatePresence } from "framer-motion";

// SEO Buddy character
const buddyQuotes = {
  dashboard: [
    "Welcome to your SEO dashboard! Here you can see all your key metrics at a glance.",
    "Try analyzing a competitor to see how you stack up against them.",
    "Remember to check your keyword rankings regularly to track your progress."
  ],
  rivalAudit: [
    "The Rival Audit tool helps you analyze competitor websites in detail.",
    "Make sure to review both technical factors and content quality in your audit.",
    "Don't forget to export your audit results for team presentations!"
  ],
  keywordResearch: [
    "Looking for new keywords? Focus on search intent, not just volume.",
    "Try combining your core terms with modifiers like 'best', 'how to', or location names.",
    "Remember that long-tail keywords often convert better, even with lower volume."
  ],
  pdfAnalyzer: [
    "Upload your SEO reports for smart AI analysis and insights.",
    "PDF Analyzer works best with reports that include metrics and charts.",
    "You can extract key insights without manual data entry!"
  ],
  default: [
    "Need SEO help? I'm your SEO Buddy - here to guide you through best practices!",
    "Don't forget to check your keyword rankings to see how you're performing.",
    "Remember the SEO basics: quality content, good technical structure, and authoritative backlinks."
  ]
};

export default function SeoBuddy() {
  const [location] = useLocation();
  const [minimized, setMinimized] = useState(false);
  const [showBuddy, setShowBuddy] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  
  // Determine which tips to show based on current page
  const getTipsForLocation = () => {
    if (location === '/') return buddyQuotes.dashboard;
    if (location.includes('rival-audit')) return buddyQuotes.rivalAudit;
    if (location.includes('keyword-research')) return buddyQuotes.keywordResearch;
    if (location.includes('pdf-analyzer')) return buddyQuotes.pdfAnalyzer;
    return buddyQuotes.default;
  };
  
  // Rotate through tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      const tips = getTipsForLocation();
      setCurrentTip((prevTip) => (prevTip + 1) % tips.length);
      // Occasionally wave to get attention
      if (Math.random() > 0.7) {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 2000);
      }
    }, 12000);
    
    return () => clearInterval(tipInterval);
  }, [location]);
  
  // Reset tip counter when changing pages
  useEffect(() => {
    setCurrentTip(0);
  }, [location]);
  
  if (!showBuddy) return null;
  
  const tips = getTipsForLocation();
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {minimized ? (
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMinimized(false)}
            className="bg-primary shadow-lg rounded-full p-3 cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </motion.div>
        ) : (
          <Card className="w-[300px] shadow-xl border-primary/10">
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-center">
              <div className="flex items-center">
                <div className="mr-2 relative">
                  <motion.div
                    animate={isWaving ? { rotate: [0, 15, -15, 10, -5, 0] } : {}}
                    transition={{ duration: 1.5 }}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </motion.div>
                </div>
                <div>
                  <CardTitle className="text-base">SEO Buddy</CardTitle>
                  <CardDescription className="text-xs">Your optimization assistant</CardDescription>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setMinimized(true)}
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
                  onClick={() => setShowBuddy(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 py-2 text-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTip}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[60px] flex items-center"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                  <p>{tips[currentTip]}</p>
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <CardFooter className="pt-0 px-4 pb-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Get SEO help
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>SEO Best Practices</SheetTitle>
                    <SheetDescription>
                      Quick tips to improve your search rankings
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <h3 className="font-medium mb-2">Top 5 SEO Tips:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">Focus on user experience - Google rewards sites that visitors love</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">Create in-depth content that thoroughly answers user questions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">Optimize page speed - slow sites rank lower</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">Use descriptive URLs, title tags, and meta descriptions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded mr-2 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">Build quality backlinks from reputable, relevant sites</span>
                      </li>
                    </ul>
                    
                    <h3 className="font-medium mb-2 mt-6">Tools in this app:</h3>
                    <ul className="space-y-3">
                      <li className="text-sm">
                        <span className="font-medium">Rival Audit:</span> Analyze competitor websites for SEO gaps and opportunities
                      </li>
                      <li className="text-sm">
                        <span className="font-medium">Keyword Research:</span> Discover valuable search terms your audience uses
                      </li>
                      <li className="text-sm">
                        <span className="font-medium">Rank Tracker:</span> Monitor your search position for important keywords
                      </li>
                      <li className="text-sm">
                        <span className="font-medium">PDF Analyzer:</span> Extract insights from SEO reports automatically
                      </li>
                    </ul>
                  </div>
                </SheetContent>
              </Sheet>
            </CardFooter>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}