import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  BookOpen, 
  Lightbulb, 
  ThumbsUp, 
  Award, 
  Zap, 
  Sparkles, 
  Heart, 
  Star,
  Pencil
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useSound from 'use-sound';

// Learning tips and encouragement messages
const LEARNING_TIPS = [
  "Focus on intent, not just keywords. What is the user trying to achieve?",
  "Create content for people first, search engines second.",
  "Internal links help search engines understand site structure.",
  "Page load speed is a ranking factor. Keep your site fast!",
  "Mobile optimization is essential for modern SEO.",
  "Quality backlinks are worth more than quantity.",
  "Use descriptive alt text for images for better accessibility.",
  "Title tags should be unique for each page and include key terms.",
  "Meta descriptions affect click-through rates, not rankings.",
  "Schema markup helps search engines understand your content.",
  "Local businesses should optimize for 'near me' searches.",
  "Voice search optimization uses natural language patterns.",
  "Keep URLs simple, descriptive and readable.",
  "Update content regularly to maintain relevance.",
  "Analyze competitors to find content gaps you can fill."
];

const ENCOURAGEMENT_MESSAGES = [
  "You're making great progress! Keep going!",
  "Each lesson brings you closer to SEO mastery!",
  "You're learning skills that will bring real results!",
  "Your dedication to learning is impressive!",
  "Knowledge compounds - you're building something valuable!",
  "SEO expertise takes time, and you're on the right path!",
  "Take a moment to celebrate your progress!",
  "Each concept you master is a stepping stone to success!",
  "Learning consistently is the key to expertise!",
  "You're developing skills that bring lasting value!"
];

interface LearningCompanionProps {
  moduleTitle?: string;
  lessonTitle?: string;
  progress?: number;
}

export default function LearningCompanion({
  moduleTitle,
  lessonTitle,
  progress = 0
}: LearningCompanionProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState<JSX.Element>(<Lightbulb className="h-4 w-4" />);
  const [isWiggling, setIsWiggling] = useState(false);
  const wiggleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sound effects
  const [playAppear] = useSound('/sounds/first-lesson.mp3', { volume: 0.3 });
  const [playClick] = useSound('/sounds/lesson-completed.mp3', { volume: 0.3 });
  
  // Only show on learning-related paths
  const shouldShow = location.includes('/learning') || 
                     location.includes('/modules/') || 
                     location.includes('/achievement-demo');
  
  // Get random tip or encouragement
  const getRandomMessage = () => {
    const isEncouragement = Math.random() > 0.5;
    
    if (isEncouragement) {
      const randomIndex = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
      setIcon(<Heart className="h-4 w-4 text-pink-500" />);
      return ENCOURAGEMENT_MESSAGES[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * LEARNING_TIPS.length);
      setIcon(<Lightbulb className="h-4 w-4 text-amber-500" />);
      return LEARNING_TIPS[randomIndex];
    }
  };
  
  // Trigger wiggle animation periodically to get attention
  useEffect(() => {
    if (!shouldShow) return;
    
    const startWiggleTimer = () => {
      // Randomly wiggle every 20-40 seconds
      const wiggleInterval = 20000 + Math.random() * 20000;
      
      wiggleTimerRef.current = setTimeout(() => {
        setIsWiggling(true);
        
        // Stop wiggling after animation completes
        setTimeout(() => {
          setIsWiggling(false);
          startWiggleTimer();
        }, 1000);
      }, wiggleInterval);
    };
    
    startWiggleTimer();
    
    return () => {
      if (wiggleTimerRef.current) {
        clearTimeout(wiggleTimerRef.current);
      }
    };
  }, [shouldShow]);
  
  // Change message periodically when open
  useEffect(() => {
    if (isOpen) {
      setMessage(getRandomMessage());
      
      messageTimerRef.current = setInterval(() => {
        setMessage(getRandomMessage());
      }, 12000); // Change message every 12 seconds
    }
    
    return () => {
      if (messageTimerRef.current) {
        clearInterval(messageTimerRef.current);
      }
    };
  }, [isOpen]);
  
  // Play sound on first appearance
  useEffect(() => {
    if (shouldShow) {
      playAppear();
    }
  }, [shouldShow, playAppear]);
  
  // Hide if not on a learning page
  if (!shouldShow) return null;
  
  // Get contextual icon based on progress
  const getContextualIcon = () => {
    if (progress >= 80) return <Award className="h-6 w-6 text-amber-500" />;
    if (progress >= 50) return <ThumbsUp className="h-6 w-6 text-green-500" />;
    return <BookOpen className="h-6 w-6 text-blue-500" />;
  };
  
  // More cartoon-like elephant icon for better visibility
  const ElephantIcon = () => (
    <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#8c52ff" />
      
      {/* Elephant face */}
      <ellipse cx="50" cy="50" rx="30" ry="32" fill="#f0f0f0" />
      
      {/* Ears */}
      <ellipse cx="20" cy="45" rx="15" ry="20" fill="#f0f0f0" />
      <ellipse cx="80" cy="45" rx="15" ry="20" fill="#f0f0f0" />
      
      {/* Eyes */}
      <circle cx="40" cy="40" r="4" fill="#333" />
      <circle cx="60" cy="40" r="4" fill="#333" />
      
      {/* Trunk */}
      <path d="M50,50 Q50,65 40,72 Q38,75 40,78" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
      
      {/* Smile */}
      <path d="M40,55 Q50,62 60,55" stroke="#333" strokeWidth="2" fill="none" />
    </svg>
  );
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button 
                  size="lg" 
                  className={`h-16 w-16 rounded-full shadow-lg bg-gradient-to-br from-purple-400 to-purple-600 ${isWiggling ? 'animate-bounce-slow' : ''}`}
                  onClick={() => {
                    playClick();
                    setIsOpen(!isOpen);
                  }}
                >
                  <div className="animate-float">
                    <ElephantIcon />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="end" 
                className="w-72 p-4 bg-white border border-purple-200 shadow-lg animate-fadeIn rounded-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-purple-600 font-medium text-sm mr-1.5">Ellie</span> 
                      <span className="text-gray-500 text-xs">the SEO Elephant</span>
                    </div>
                    <div className="flex items-center">
                      {icon}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-700">{message}</p>
                  </div>
                  
                  {(moduleTitle || lessonTitle) && (
                    <div className="bg-white p-2 rounded-md border border-purple-100">
                      {moduleTitle && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium text-purple-600">Module:</span> {moduleTitle}
                        </p>
                      )}
                      {lessonTitle && (
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium text-purple-600">Current:</span> {lessonTitle}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {progress > 0 && (
                    <div className="mt-2 text-xs">
                      <div className="w-full bg-purple-100 rounded-full h-2.5">
                        <div 
                          className="bg-purple-500 h-2.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 flex justify-between text-gray-600">
                        <span>{progress}% complete</span>
                        <span className="flex items-center">
                          <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                          Keep going!
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Close
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs ml-2 border-purple-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => setMessage(getRandomMessage())}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      New Tip
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Ellie the SEO Elephant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}