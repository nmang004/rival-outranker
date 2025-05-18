import React from 'react';
import { CheckCircle2, Award, Trophy, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';

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
  React.useEffect(() => {
    if (isOpen && score >= passingScore) {
      // Trigger confetti effect when quiz is passed
      setTimeout(() => {
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
        
        myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        setTimeout(() => {
          document.body.removeChild(myCanvas);
        }, 3000);
      }, 200);
    }
  }, [isOpen, score, passingScore]);

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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 my-2">
            {isPassed ? (
              <Trophy className="h-12 w-12 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-12 w-12 text-blue-500" />
            )}
          </div>
          <DialogTitle className="text-2xl text-center">
            {isPassed ? 'Quiz Completed! 🎉' : 'Quiz Attempt'}
          </DialogTitle>
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
            <Progress value={score} className={`h-2 ${isPassed ? 'bg-green-100' : 'bg-amber-100'}`} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Passing: {passingScore}%</span>
              <span>100%</span>
            </div>
          </div>
          
          {isPassed && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <div className="flex items-center gap-1">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-primary">+{pointsEarned} Points Earned!</span>
              </div>
              <div className="mt-2 animate-bounce">
                <PartyPopper className="h-6 w-6 text-primary" />
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
          <Button onClick={handleContinue}>
            {isPassed ? 'Continue Learning' : 'Review Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}