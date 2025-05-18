import React, { useEffect, useRef } from 'react';
import { Star, Trophy, Award, Sparkles, PartyPopper } from 'lucide-react';
import useSound from 'use-sound';
import confetti from 'canvas-confetti';

interface MilestoneSparkProps {
  type: 'lesson' | 'module' | 'quiz' | 'achievement' | 'milestone';
  message?: string;
  show: boolean;
  onComplete?: () => void;
}

/**
 * MilestoneSpark - A micro-celebration component that plays sound and animation
 * when a user reaches certain milestones in the learning journey
 */
export default function MilestoneSpark({ 
  type, 
  message,
  show,
  onComplete 
}: MilestoneSparkProps) {
  const sparkRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  
  // Sound effect configuration based on milestone type
  const getSoundPath = () => {
    switch (type) {
      case 'lesson': return '/sounds/lesson-completed.mp3';
      case 'module': return '/sounds/module-completed.mp3';
      case 'quiz': return '/sounds/quiz-passed.mp3';
      case 'achievement': return '/sounds/achievement-unlocked.mp3';
      default: return '/sounds/milestone.mp3';
    }
  };
  
  const [playSound] = useSound(getSoundPath(), {
    volume: 0.4,
    interrupt: true
  });
  
  // Animation configuration based on milestone type
  const getAnimationConfig = () => {
    switch (type) {
      case 'lesson':
        return {
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00BFFF', '#1E90FF', '#4169E1']
        };
      case 'module':
        return {
          particleCount: 100,
          spread: 120,
          startVelocity: 30,
          decay: 0.94,
          shapes: ['circle', 'square'],
          colors: ['#5D3FD3', '#9370DB', '#E6E6FA'],
          origin: { y: 0.7 }
        };
      case 'quiz':
        return {
          particleCount: 80,
          spread: 100,
          startVelocity: 25,
          decay: 0.92,
          shapes: ['star'],
          colors: ['#FFD700', '#FFFF00', '#FAFAD2'],
          origin: { y: 0.65 }
        };
      case 'achievement':
        return {
          particleCount: 120,
          spread: 140,
          startVelocity: 35,
          decay: 0.91,
          gravity: 0.8,
          shapes: ['circle'],
          colors: ['#32CD32', '#7CFC00', '#98FB98'],
          origin: { y: 0.7 }
        };
      default:
        return {
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 }
        };
    }
  };
  
  // Get the appropriate icon for the milestone type
  const getMilestoneIcon = () => {
    switch (type) {
      case 'lesson': return <Sparkles className="h-6 w-6 text-blue-500" />;
      case 'module': return <Trophy className="h-6 w-6 text-purple-500" />;
      case 'quiz': return <Star className="h-6 w-6 text-yellow-500" />;
      case 'achievement': return <Award className="h-6 w-6 text-green-500" />;
      default: return <PartyPopper className="h-6 w-6 text-amber-500" />;
    }
  };
  
  // Animation and sound effect on show
  useEffect(() => {
    if (show && sparkRef.current) {
      // Play the sound effect
      playSound();
      
      // Create confetti animation
      const animationConfig = getAnimationConfig();
      confetti({
        ...animationConfig,
        zIndex: 9999,
        disableForReducedMotion: true
      });
      
      // Auto-hide after animation completes
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      
      timerRef.current = window.setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 3000);
    }
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [show, playSound, onComplete, type]);
  
  if (!show) return null;
  
  return (
    <div 
      ref={sparkRef}
      className={`fixed inset-0 pointer-events-none flex items-center justify-center z-50`}
    >
      <div className={`bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg animate-badge-pop flex items-center gap-3 ${
        type === 'achievement' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' :
        type === 'module' ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20' :
        type === 'quiz' ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20' :
        'bg-gradient-to-r from-blue-500/20 to-sky-500/20'
      }`}>
        <div className="animate-celebrate">
          {getMilestoneIcon()}
        </div>
        <div className="text-white font-medium animate-fadeIn">
          {message || `${type.charAt(0).toUpperCase() + type.slice(1)} completed!`}
        </div>
      </div>
    </div>
  );
}