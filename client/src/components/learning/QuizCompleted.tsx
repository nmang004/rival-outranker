import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy, Award, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { Progress } from '@/components/ui/progress';

interface QuizCompletedProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  passingScore: number;
  moduleTitle: string;
  lessonTitle: string;
  pointsEarned?: number;
  onContinue?: () => void;
}

export default function QuizCompleted({ 
  isOpen, 
  onClose,
  score,
  passingScore,
  moduleTitle,
  lessonTitle,
  pointsEarned = 0,
  onContinue
}: QuizCompletedProps) {
  const [showPoints, setShowPoints] = useState(false);
  const passed = score >= passingScore;
  
  // Configure sound effects based on pass/fail
  const [playSuccessSound] = useSound('/sounds/quiz-passed.mp3', { 
    volume: 0.5,
    interrupt: true
  });
  
  const [playFailSound] = useSound('/sounds/lesson-completed.mp3', { 
    volume: 0.3,
    interrupt: true
  });
  
  // Create confetti animation when quiz is passed successfully
  useEffect(() => {
    if (isOpen) {
      if (passed) {
        // Play success sound
        playSuccessSound();
        
        // Create celebratory confetti for successful quiz completion
        setTimeout(() => {
          const canvasConfettiConfig = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          };
          
          confetti(canvasConfettiConfig);
        }, 300);
      } else {
        // Play failure sound
        playFailSound();
      }
      
      // Show points after a brief delay
      const timer = setTimeout(() => {
        setShowPoints(true);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        setShowPoints(false);
      };
    }
  }, [isOpen, passed, playSuccessSound, playFailSound]);
  
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };
  
  // Get the appropriate message and styling based on the score
  const getScoreMessage = () => {
    if (score >= 95) return { text: "Outstanding!", color: "text-green-500" };
    if (score >= 85) return { text: "Great job!", color: "text-green-500" };
    if (score >= passingScore) return { text: "Good work!", color: "text-green-500" };
    return { text: "Try again", color: "text-amber-500" };
  };
  
  const scoreMessage = getScoreMessage();
  
  // Get the appropriate Progress bar color based on the score
  const getProgressColor = () => {
    if (score >= 85) return "bg-green-200 dark:bg-green-800";
    if (score >= passingScore) return "bg-green-100 dark:bg-green-900";
    return "bg-amber-100 dark:bg-amber-900";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "sm:max-w-md",
          passed 
            ? "border-2 border-green-500/30 bg-gradient-to-b from-background to-green-950/5" 
            : "border-2 border-amber-500/30 bg-gradient-to-b from-background to-amber-950/5",
          "animate-badge-pop"
        )}
      >
        <DialogHeader className="space-y-3 text-center">
          <div 
            className={cn(
              "mx-auto h-20 w-20 rounded-full flex items-center justify-center shadow-lg",
              passed 
                ? "bg-gradient-to-b from-green-200 to-green-300 dark:from-green-800 dark:to-green-700" 
                : "bg-gradient-to-b from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-700"
            )}
          >
            {passed ? (
              <Trophy className="h-10 w-10 text-green-700 dark:text-green-300" />
            ) : (
              <XCircle className="h-10 w-10 text-amber-700 dark:text-amber-300" />
            )}
          </div>
          
          <DialogTitle 
            className={cn(
              "text-xl font-bold",
              passed 
                ? "bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent" 
                : "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"
            )}
          >
            Quiz Completed
          </DialogTitle>
          
          <DialogDescription className="text-center">
            <div className="text-foreground font-medium mb-1">
              {moduleTitle}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {lessonTitle}
            </div>
            
            {/* Score display */}
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Your score</span>
                <span className={scoreMessage.color}>{score}%</span>
              </div>
              
              <div className="w-full space-y-2">
                <Progress 
                  value={score} 
                  className={cn("h-3", getProgressColor())} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>Passing: {passingScore}%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className={cn(
                "font-bold text-lg", 
                scoreMessage.color
              )}>
                {scoreMessage.text}
              </div>
              
              {/* Points earned animation */}
              {passed && pointsEarned > 0 && (
                <div className={cn(
                  "mt-4 bg-primary/5 p-3 rounded-lg border border-primary/10",
                  showPoints ? "animate-fadeIn" : "opacity-0"
                )}>
                  <div className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>+ {pointsEarned} points earned</span>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          <Button 
            className={cn(
              "mt-2 px-8",
              !passed && "bg-amber-600 hover:bg-amber-700"
            )}
            onClick={handleContinue}
          >
            {passed ? "Continue" : "Try Again"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}