import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Award, Trophy, PartyPopper, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';

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
  pointsEarned = 50,
  onContinue 
}: QuizCompletedProps) {
  const confettiRef = useRef<HTMLDivElement>(null);
  
  // Add sound effects for quiz completion
  const [playSuccessSound] = useSound('/sounds/quiz-passed.mp3', { 
    volume: 0.5,
    interrupt: true
  });
  
  const [playPointsSound] = useSound('/sounds/points-earned.mp3', {
    volume: 0.4,
    interrupt: true
  });
  
  useEffect(() => {
    if (isOpen && score >= passingScore) {
      // Play success sound
      playSuccessSound();
      
      // Play points sound with slight delay
      setTimeout(() => {
        playPointsSound();
      }, 800);
      
      // Trigger enhanced confetti effect for passing the quiz
      setTimeout(() => {
        // Create confetti effect with custom colors and shapes
        const myCanvas = document.createElement('canvas');
        document.body.appendChild(myCanvas);
        myCanvas.style.position = 'fixed';
        myCanvas.style.inset = '0';
        myCanvas.style.width = '100vw';
        myCanvas.style.height = '100vh';
        myCanvas.style.zIndex = '999999';
        myCanvas.style.pointerEvents = 'none';
        
        const myConfetti = confetti.create(myCanvas, {
          resize: true,
          useWorker: true
        });
        
        // First wave of confetti
        myConfetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFFF00', '#FAFAD2'],
          shapes: ['star', 'circle'],
          ticks: 100
        });
        
        // Second wave of confetti with different colors after a delay
        setTimeout(() => {
          myConfetti({
            particleCount: 60,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.6 },
            colors: ['#5D3FD3', '#9370DB', '#E6E6FA']
          });
          
          myConfetti({
            particleCount: 60,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.6 },
            colors: ['#32CD32', '#7CFC00', '#98FB98']
          });
        }, 1000);
        
        // Remove the canvas after animations complete
        setTimeout(() => {
          document.body.removeChild(myCanvas);
        }, 4000);
      }, 200);
    }
  }, [isOpen, score, passingScore, playSuccessSound, playPointsSound]);

  const isPassed = score >= passingScore;
  
  const handleContinue = () => {
    onClose();
    if (onContinue) {
      onContinue();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isPassed ? 'bg-gradient-to-r from-amber-300 to-yellow-500 animate-celebrate' : 'bg-blue-100'} my-2 transition-all duration-500`} ref={confettiRef}>
            {isPassed ? (
              <Trophy className="h-12 w-12 text-white drop-shadow-md" />
            ) : (
              <CheckCircle2 className="h-12 w-12 text-blue-500" />
            )}
          </div>
          <DialogTitle className={`text-2xl text-center ${isPassed ? 'animate-fadeIn' : ''}`}>
            {isPassed ? 'Quiz Completed! 🎉' : 'Quiz Attempt'}
          </DialogTitle>
          <div className={`${isPassed ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text font-bold text-xl mb-2 animate-pulse-glow' : 'text-muted-foreground'}`}>
            {isPassed ? '★ Achievement Unlocked ★' : ''}
          </div>
          <DialogDescription className="text-lg">
            {isPassed 
              ? `Congratulations! You've mastered the "${lessonTitle}" lesson in the ${moduleTitle} module.` 
              : `You didn't quite reach the passing score. Keep learning and try again!`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4 space-y-4">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>Your Score</span>
              <span className={`font-medium ${isPassed ? 'text-green-600' : 'text-amber-600'}`}>{score}%</span>
            </div>
            <Progress value={score} className={`h-2 ${isPassed ? 'bg-green-100' : 'bg-amber-100'} transition-all duration-1000`} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Passing: {passingScore}%</span>
              <span>100%</span>
            </div>
          </div>
          
          {isPassed && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 animate-badge-pop">
                <div className="flex items-center gap-1">
                  <Award className="h-5 w-5 text-amber-500 animate-sparkle" />
                  <span className="font-semibold text-primary bg-gradient-to-r from-amber-400 to-amber-600 text-transparent bg-clip-text">+{pointsEarned} Points Earned!</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 animate-sparkle" />
                  <Star className="h-5 w-5 text-yellow-500 animate-bounce-delayed" />
                  <Star className="h-4 w-4 text-yellow-500 animate-sparkle" />
                </div>
              </div>
              
              <div className="flex justify-center mt-3 gap-2">
                <div className="animate-float">
                  <PartyPopper className="h-6 w-6 text-primary" />
                </div>
                <div className="animate-bounce-delayed">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                  <PartyPopper className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-center gap-2">
          {!isPassed && (
            <Button variant="outline" onClick={onClose}>
              Try Again
            </Button>
          )}
          <Button 
            onClick={handleContinue}
            className={`${isPassed ? 'bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary transition-all duration-500 transform hover:scale-105' : ''}`}
          >
            {isPassed ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Continue Learning
                <Star className="h-4 w-4 animate-pulse" />
              </span>
            ) : 'Review Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}