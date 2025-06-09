import { useState, useCallback, useEffect } from 'react';
import useSound from 'use-sound';

interface UseAchievementSparkOptions {
  soundEffect?: string;
  volume?: number;
  duration?: number;
  autoHide?: boolean;
}

/**
 * Hook to manage milestone and achievement spark effects
 * This can be used to trigger micro-celebrations for various milestones
 */
export default function useAchievementSpark({
  soundEffect = '/sounds/achievement-unlocked.mp3',
  volume = 0.5,
  duration = 3000,
  autoHide = true
}: UseAchievementSparkOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [sparkType, setSparkType] = useState<'lesson' | 'module' | 'quiz' | 'achievement' | 'milestone'>('achievement');
  const [message, setMessage] = useState<string>('');
  
  // Configure sound effect
  const [playSound] = useSound(soundEffect, {
    volume,
    interrupt: true
  });
  
  // Reset spark visibility after duration
  useEffect(() => {
    let timer: number | null = null;
    
    if (isVisible && autoHide) {
      timer = window.setTimeout(() => {
        setIsVisible(false);
      }, duration);
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isVisible, duration, autoHide]);
  
  // Trigger the achievement spark with sound and animation
  const triggerSpark = useCallback((type: 'lesson' | 'module' | 'quiz' | 'achievement' | 'milestone' = 'achievement', customMessage?: string) => {
    // Set the type and message
    setSparkType(type);
    setMessage(customMessage || `${type.charAt(0).toUpperCase() + type.slice(1)} completed!`);
    
    // Play the sound effect
    playSound();
    
    // Show the animation
    setIsVisible(true);
    
    return true;
  }, [playSound]);
  
  // Hide the achievement spark
  const hideSpark = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  return {
    isVisible,
    sparkType,
    message,
    triggerSpark,
    hideSpark
  };
}