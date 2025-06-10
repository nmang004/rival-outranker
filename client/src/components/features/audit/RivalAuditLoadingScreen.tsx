import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  MagnifyingGlassIcon, 
  DocumentMagnifyingGlassIcon, 
  ChartBarIcon, 
  TagIcon, 
  CodeBracketIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

// Import any additional required components

interface RivalAuditLoadingScreenProps {
  url: string;
}

const LoadingStep = ({ 
  icon, 
  label, 
  isActive, 
  isComplete 
}: { 
  icon: React.ReactNode, 
  label: string, 
  isActive: boolean, 
  isComplete: boolean 
}) => {
  return (
    <div className={`flex items-center gap-3 py-3 pl-2 rounded-md transition-all ${
      isActive ? 'bg-orange-50 dark:bg-orange-950/30' : 
      isComplete ? 'opacity-70' : 'opacity-40'
    }`}>
      <div className={`p-2 rounded-full ${
        isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300 animate-pulse' : 
        isComplete ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300' : 
        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
      }`}>
        {icon}
      </div>
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">
          {isComplete ? 'Completed' : isActive ? 'In progress...' : 'Waiting...'}
        </div>
      </div>
    </div>
  );
};

export default function RivalAuditLoadingScreen({ url }: RivalAuditLoadingScreenProps) {
  // Simulated loading progress steps
  const [activeStep, setActiveStep] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  
  React.useEffect(() => {
    // More realistic progression timing for actual crawling
    const stepTimings = [3000, 5000, 4000, 6000, 4000, 3000]; // Different timing for each step
    let totalElapsed = 0;
    
    const timers: NodeJS.Timeout[] = [];
    
    stepTimings.forEach((duration, index) => {
      totalElapsed += duration;
      const timer = setTimeout(() => {
        setActiveStep(index + 1);
        setProgress(Math.min(Math.round(((index + 1) / 6) * 100), 95)); // Cap at 95% until completion
      }, totalElapsed);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Running Comprehensive SEO Audit
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Analyzing <span className="font-medium text-foreground">{url}</span>
        </p>
      </div>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Audit Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2.5 bg-orange-100 dark:bg-orange-900"
          />
          
          <div className="mt-8 space-y-1">
            <LoadingStep 
              icon={<MagnifyingGlassIcon className="h-5 w-5" />} 
              label="Crawling website pages" 
              isActive={activeStep === 0} 
              isComplete={activeStep > 0}
            />
            <LoadingStep 
              icon={<DocumentMagnifyingGlassIcon className="h-5 w-5" />} 
              label="Analyzing on-page elements" 
              isActive={activeStep === 1} 
              isComplete={activeStep > 1}
            />
            <LoadingStep 
              icon={<LinkIcon className="h-5 w-5" />} 
              label="Checking site structure & navigation" 
              isActive={activeStep === 2} 
              isComplete={activeStep > 2}
            />
            <LoadingStep 
              icon={<TagIcon className="h-5 w-5" />} 
              label="Evaluating service & location pages" 
              isActive={activeStep === 3} 
              isComplete={activeStep > 3}
            />
            <LoadingStep 
              icon={<CodeBracketIcon className="h-5 w-5" />} 
              label="Detecting technical issues" 
              isActive={activeStep === 4} 
              isComplete={activeStep > 4}
            />
            <LoadingStep 
              icon={<ChartBarIcon className="h-5 w-5" />} 
              label="Generating final report" 
              isActive={activeStep === 5} 
              isComplete={activeStep > 5}
            />
          </div>
          
          <div className="mt-8 text-center">
            <div className="text-sm text-muted-foreground">
              This typically takes 30 seconds to 3 minutes, depending on website size
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              We're crawling and analyzing every page to provide comprehensive results
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="animate-bounce-slow flex justify-center p-6">
        <div className="flex space-x-2 opacity-70">
          <div className="w-2 h-2 rounded-full bg-orange-600 animate-bounce-delay-0"></div>
          <div className="w-2 h-2 rounded-full bg-orange-600 animate-bounce-delay-300"></div>
          <div className="w-2 h-2 rounded-full bg-orange-600 animate-bounce-delay-600"></div>
        </div>
      </div>
    </div>
  );
}

// CSS animation classes should be added to your tailwind.config.ts
// extends: {
//   animation: {
//     "bounce-slow": "bounce 2s infinite",
//     "bounce-delay-0": "bounce 1.5s infinite",
//     "bounce-delay-300": "bounce 1.5s infinite 0.3s",
//     "bounce-delay-600": "bounce 1.5s infinite 0.6s",
//     "fadeIn": "fadeIn 0.5s ease-in-out",
//   },
//   keyframes: {
//     fadeIn: {
//       "0%": { opacity: "0" },
//       "100%": { opacity: "1" },
//     },
//   },
// }