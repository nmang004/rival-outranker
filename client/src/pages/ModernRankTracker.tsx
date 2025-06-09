import { RankTrackerPage } from '@/components/features/keywords';

// Basic Rank Tracker replacement
export const ModernBasicRankTracker = () => {
  return <RankTrackerPage variant="basic" />;
};

// Simple Rival Rank Tracker replacement
export const ModernSimpleRankTracker = () => {
  return <RankTrackerPage variant="simple" />;
};

// Advanced Rival Rank Tracker replacement
export const ModernAdvancedRankTracker = () => {
  return <RankTrackerPage variant="advanced" />;
};

// Default export for the primary rank tracker
export default ModernBasicRankTracker;