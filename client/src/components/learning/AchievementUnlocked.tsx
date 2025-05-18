import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Star, Award, BookOpen, Flame, Medal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/types/learningTypes';

interface AchievementUnlockedProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementUnlocked({ 
  achievement, 
  isOpen, 
  onClose 
}: AchievementUnlockedProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Sound effect when achievement appears
  const [playSound] = useSound('/sounds/achievement-unlocked.mp3', { 
    volume: 0.5,
    interrupt: true
  });
  
  // Render the icon based on the achievement's icon property
  const renderIcon = () => {
    switch (achievement.icon) {
      case 'Trophy':
        return <Trophy className="h-12 w-12 text-yellow-500" />;
      case 'Star':
        return <Star className="h-12 w-12 text-amber-500" />;
      case 'Award':
        return <Award className="h-12 w-12 text-indigo-500" />;
      case 'BookOpen':
        return <BookOpen className="h-12 w-12 text-blue-500" />;
      case 'Flame':
        return <Flame className="h-12 w-12 text-orange-500" />;
      case 'Medal':
        return <Medal className="h-12 w-12 text-emerald-500" />;
      default:
        return <Sparkles className="h-12 w-12 text-purple-500" />;
    }
  };
  
  // Create confetti animation when achievement is displayed
  useEffect(() => {
    if (isOpen) {
      // Play sound effect
      playSound();
      
      // Create confetti
      const canvasConfettiConfig = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      };
      
      confetti(canvasConfettiConfig);
      
      // Make smaller confetti bursts for a longer celebration
      setTimeout(() => {
        confetti({
          ...canvasConfettiConfig,
          particleCount: 50,
          angle: 60,
          spread: 55,
        });
      }, 200);
      
      setTimeout(() => {
        confetti({
          ...canvasConfettiConfig,
          particleCount: 50,
          angle: 120,
          spread: 55,
        });
      }, 400);
    }
  }, [isOpen, playSound]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={dialogRef}
        className={cn(
          "sm:max-w-md border-2 border-yellow-500/30 bg-gradient-to-b from-background to-muted/30",
          "animate-badge-pop shadow-xl"
        )}
      >
        <DialogHeader className="space-y-3 text-center">
          <div className="mx-auto bg-gradient-to-b from-yellow-200 to-amber-300 dark:from-yellow-600 dark:to-amber-700 h-24 w-24 rounded-full flex items-center justify-center shadow-lg animate-sparkle">
            <div className="animate-float">
              {renderIcon()}
            </div>
          </div>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Achievement Unlocked!
          </DialogTitle>
          <DialogDescription className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {achievement.title}
            </div>
            <p className="text-muted-foreground mt-1">
              {achievement.description}
            </p>
            
            <div className="mt-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
              <div className="text-sm font-medium text-primary">
                + {achievement.rewardPoints} points
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          <Button 
            className="mt-2 px-8" 
            onClick={onClose}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}