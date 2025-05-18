import React, { useEffect, useRef } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Trophy,
  Search,
  Flame,
  MapPin,
  Star,
  Lightbulb,
  BarChart,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/types/learningTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';

interface AchievementUnlockedProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementUnlocked({ achievement, isOpen, onClose }: AchievementUnlockedProps) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const achievementType = achievement?.trigger?.type || 'achievement';
  
  // Load the appropriate sound based on achievement type
  const [playAchievementSound] = useSound('/sounds/achievement-unlocked.mp3', { 
    volume: 0.5,
    interrupt: true 
  });
  
  // Function to trigger confetti animation based on achievement type
  const triggerConfetti = () => {
    if (confettiRef.current) {
      const animationOptions = {
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF4500'],
      };
      
      // Customize animation based on achievement type
      if (achievementType === 'module_complete') {
        animationOptions.particleCount = 200;
        animationOptions.spread = 160;
        animationOptions.colors = ['#5D3FD3', '#9370DB', '#E6E6FA'];
      } else if (achievementType === 'milestone') {
        animationOptions.particleCount = 150;
        animationOptions.spread = 120;
        animationOptions.colors = ['#00BFFF', '#1E90FF', '#4169E1'];
      } else if (achievementType === 'quiz_complete') {
        animationOptions.particleCount = 80;
        animationOptions.spread = 100;
        animationOptions.colors = ['#FFD700', '#FFFF00', '#FAFAD2'];
      }
      
      confetti({
        ...animationOptions,
        zIndex: 9999,
        disableForReducedMotion: true
      });
    }
  };
  
  // Play sound and trigger animation when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Play sound effect
      playAchievementSound();
      
      // Trigger confetti animation with slight delay
      setTimeout(() => {
        triggerConfetti();
      }, 300);
    }
  }, [isOpen, playAchievementSound]);
  
  const getIcon = (iconName: string) => {
    const iconProps = { className: "h-12 w-12 text-primary" };
    
    switch (iconName) {
      case 'BookOpen': return <BookOpen {...iconProps} />;
      case 'Award': return <Award {...iconProps} />;
      case 'CheckCircle2': return <CheckCircle2 {...iconProps} />;
      case 'Trophy': return <Trophy {...iconProps} />;
      case 'Search': return <Search {...iconProps} />;
      case 'Flame': return <Flame {...iconProps} />;
      case 'MapPin': return <MapPin {...iconProps} />;
      case 'Star': return <Star {...iconProps} />;
      case 'Lightbulb': return <Lightbulb {...iconProps} />;
      case 'BarChart': return <BarChart {...iconProps} />;
      case 'PartyPopper': return <PartyPopper {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" ref={confettiRef}>
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 my-2 animate-bounce">
            {getIcon(achievement.icon)}
          </div>
          <DialogTitle className="text-2xl text-center animate-fadeIn">Achievement Unlocked!</DialogTitle>
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-transparent bg-clip-text font-bold text-xl mb-2 animate-pulse">
            {achievement.title}
          </div>
          <DialogDescription className="text-lg">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full transform transition-all duration-500 hover:scale-110">
            <span className="inline-flex gap-2 items-center">
              <Sparkles className="h-4 w-4 text-yellow-500" /> 
              +{achievement.rewardPoints} Points
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </span>
          </div>
          
          <div className="flex justify-center mt-6 gap-3">
            <div className="animate-bounce-slow">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <div className="animate-bounce-delayed">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="animate-bounce-slow">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button 
            onClick={onClose}
            className="transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Continue Learning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}