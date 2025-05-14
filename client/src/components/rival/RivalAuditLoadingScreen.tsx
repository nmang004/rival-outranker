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
      isActive ? 'bg-blue-50 dark:bg-blue-950/30' : 
      isComplete ? 'opacity-70' : 'opacity-40'
    }`}>
      <div className={`p-2 rounded-full ${
        isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 animate-pulse' : 
        isComplete ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : 
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
    // Simulate progression through the steps
    const timer = setInterval(() => {
      setActiveStep((prevStep) => {
        if (prevStep < 5) {
          // Update progress based on steps
          setProgress((prevStep + 1) * 20);
          return prevStep + 1;
        }
        clearInterval(timer);
        return prevStep;
      });
    }, 1500); // Change step every 1.5 seconds
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Running Comprehensive SEO Audit
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Analyzing <span className="font-medium text-foreground">{url}</span>
        </p>
      </div>
      
      <Card className="border border-blue-100 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Audit Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2.5 bg-blue-100 dark:bg-blue-900"
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
              This might take a minute or two, depending on the size of the website
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="animate-bounce-slow flex justify-center p-6">
        <div className="flex space-x-2 opacity-70">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-delay-0"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-delay-300"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-delay-600"></div>
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