/**
 * Comprehensive Loading State Components
 * 
 * Features:
 * - Multiple loading patterns (skeletons, spinners, progress bars)
 * - Context-specific loading states
 * - Accessible loading indicators
 * - Progressive loading with real-time updates
 * - Smart loading state management
 */

import React from 'react';
import { Loader2, Activity, Download, Upload, Search, BarChart3, Globe, FileText } from 'lucide-react';
import { Progress } from './progress';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { cn } from '../../lib/utils';

// Generic Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export function FullPageLoading({ message = 'Loading...', progress, showProgress }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6 text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h3 className="text-lg font-semibold mb-2">{message}</h3>
          {showProgress && typeof progress === 'number' && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Analysis Loading States
export function AnalysisLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Score Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        
        {/* Tab Content */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-6 w-6 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Real-time Analysis Loading with Progress
interface AnalysisProgressProps {
  currentStep: string;
  progress: number;
  estimatedTime?: number;
  completedSteps: string[];
  totalSteps: number;
}

export function AnalysisProgress({ 
  currentStep, 
  progress, 
  estimatedTime, 
  completedSteps, 
  totalSteps 
}: AnalysisProgressProps) {
  const steps = [
    { id: 'fetching', label: 'Fetching page content', icon: Globe },
    { id: 'analyzing-meta', label: 'Analyzing meta tags', icon: FileText },
    { id: 'analyzing-content', label: 'Analyzing content', icon: Search },
    { id: 'analyzing-technical', label: 'Technical analysis', icon: Activity },
    { id: 'generating-report', label: 'Generating report', icon: BarChart3 },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h3 className="text-lg font-semibold">SEO Analysis in Progress</h3>
        <p className="text-sm text-muted-foreground">
          Analyzing your website's SEO performance...
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{currentStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {estimatedTime && (
            <p className="text-xs text-muted-foreground">
              Estimated time remaining: {Math.ceil(estimatedTime / 1000)}s
            </p>
          )}
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep.toLowerCase().includes(step.id);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isCurrent ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                )}>
                  {isCompleted ? (
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  ) : isCurrent ? (
                    <Icon className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  'text-sm',
                  isCompleted ? 'text-green-600' :
                  isCurrent ? 'text-blue-600 font-medium' :
                  'text-gray-500'
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Keyword Research Loading
export function KeywordLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 pb-2 border-b">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 py-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Data Table Loading
interface DataTableLoadingProps {
  columns: number;
  rows: number;
  showHeader?: boolean;
}

export function DataTableLoading({ columns, rows, showHeader = true }: DataTableLoadingProps) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className={`grid gap-4 pb-2 border-b`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`grid gap-4 py-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart Loading
export function ChartLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-64 bg-gray-50 rounded flex items-end justify-around p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="w-8 rounded-t" 
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
          <div className="flex justify-center space-x-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Card Grid Loading
interface CardGridLoadingProps {
  count: number;
  columns?: number;
}

export function CardGridLoading({ count, columns = 3 }: CardGridLoadingProps) {
  return (
    <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Upload/Download Progress
interface FileOperationProgressProps {
  type: 'upload' | 'download';
  progress: number;
  fileName: string;
  fileSize?: string;
  speed?: string;
}

export function FileOperationProgress({ 
  type, 
  progress, 
  fileName, 
  fileSize, 
  speed 
}: FileOperationProgressProps) {
  const Icon = type === 'upload' ? Upload : Download;
  const action = type === 'upload' ? 'Uploading' : 'Downloading';

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon className="w-6 h-6 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium">{action} {fileName}</p>
            {fileSize && (
              <p className="text-sm text-muted-foreground">{fileSize}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{Math.round(progress)}% complete</span>
            {speed && <span>{speed}</span>}
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Inline Loading Indicator
interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ text, size = 'sm', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Button Loading State
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText, 
  className, 
  disabled,
  onClick 
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  );
}