import { BarChart, SearchCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/PageHeader";
import { LoginButton } from "@/components/features/auth/LoginButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { RankTrackerForm } from "./components/RankTrackerForm";
import { RankTrackerLoadingSkeleton } from "./components/RankTrackerSkeletons";
import { useRankTracker } from "./hooks/useRankTracker";
import type { RankTrackerConfig } from "./types/rankTracker.types";

interface RankTrackerPageProps {
  variant?: 'basic' | 'simple' | 'advanced';
}

export const RankTrackerPage: React.FC<RankTrackerPageProps> = ({ 
  variant = 'basic' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  const config: RankTrackerConfig = {
    variant,
    requireAuth: variant === 'advanced',
    enableCharts: variant !== 'simple',
    enableExport: true,
    enableCompetitorAnalysis: variant !== 'simple',
    enableKeywordSuggestions: variant === 'basic',
    demoMode: !isAuthenticated || variant === 'simple'
  };

  const { submitAnalysis, isSubmitting, error } = useRankTracker(config);

  // Show loading spinner while authentication status is being checked
  if (isLoading) {
    return <RankTrackerLoadingSkeleton />;
  }

  // For advanced variant, require authentication
  if (!isAuthenticated && config.requireAuth) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <PageHeader
          title="Rank Tracker"
          description="Track your keyword rankings against competitors over time"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <div className="mt-8">
          <Alert className="mb-8">
            <SearchCheck className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please log in to access the advanced rank tracker features.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    switch (variant) {
      case 'simple': return 'Rival Rank Tracker';
      case 'advanced': return 'Rival Rank Tracker';
      case 'basic':
      default: return 'Basic Rank Tracker';
    }
  };

  const getDescription = () => {
    switch (variant) {
      case 'simple': return 'Track your keyword rankings against competitors';
      case 'advanced': return 'Track your keyword rankings against competitors over time';
      case 'basic':
      default: return 'A simple, reliable keyword ranking tracker';
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <PageHeader
        title={getTitle()}
        description={getDescription()}
        icon={<BarChart className="h-6 w-6 mr-2" />}
      />
      
      <div className="mt-8">
        {/* Demo mode alert for non-authenticated users */}
        {config.demoMode && !config.requireAuth && (
          <>
            <Alert className="mb-8">
              <SearchCheck className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                You're using the Rank Tracker in demo mode. {!isAuthenticated && 'Log in to save your results.'}
              </AlertDescription>
            </Alert>
            
            {/* Show login button for demo mode */}
            {!isAuthenticated && (
              <div className="flex justify-end mb-4">
                <LoginButton />
              </div>
            )}
          </>
        )}
        
        <RankTrackerForm 
          config={config}
          onSubmit={submitAnalysis}
          isSubmitting={isSubmitting}
        />
        
        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Demo section for simple variant */}
        {variant === 'simple' && (
          <div className="mt-8">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Try the Demo</h3>
              <p className="text-muted-foreground mb-4">
                See an example of rank tracking results without submitting your own data. 
                Our demo shows keyword rank tracking for a website against competitors, 
                including ranking positions, search volume data, and keyword difficulty metrics.
              </p>
              <button 
                onClick={() => submitAnalysis({
                  website: 'example.com',
                  keywords: 'seo best practices, keyword research tool, technical seo guide',
                  competitors: 'competitor1.com, competitor2.com'
                })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Loading Demo...' : 'View Demo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};