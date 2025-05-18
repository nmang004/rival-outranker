import React from 'react';
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

interface AchievementUnlockedProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementUnlocked({ achievement, isOpen, onClose }: AchievementUnlockedProps) {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 my-2">
            {getIcon(achievement.icon)}
          </div>
          <DialogTitle className="text-2xl text-center">Achievement Unlocked!</DialogTitle>
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-transparent bg-clip-text font-bold text-xl mb-2">
            {achievement.title}
          </div>
          <DialogDescription className="text-lg">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full">
            +{achievement.rewardPoints} Points
          </div>
          <div className="mt-6 animate-pulse">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button onClick={onClose}>Continue Learning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}