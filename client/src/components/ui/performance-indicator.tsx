import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  getColorForCategory, 
  getBorderColorForCategory,
  getEmojiForCategory,
  getTextForCategory,
  getIconColorForCategory,
  type PerformanceCategory
} from '@/lib/colorUtils';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ThumbsUp 
} from 'lucide-react';

export interface PerformanceIndicatorProps {
  category: PerformanceCategory;
  score?: number;
  label?: string;
  showText?: boolean;
  showIcon?: boolean;
  showEmoji?: boolean;
  showScore?: boolean;
  className?: string;
  tooltipText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'badge' | 'pill' | 'text';
}

/**
 * A component that visually indicates performance categories with appropriate colors and icons
 */
export function PerformanceIndicator({
  category,
  score,
  label,
  showText = false,
  showIcon = true,
  showEmoji = false,
  showScore = false,
  className = '',
  tooltipText,
  size = 'md',
  variant = 'default',
}: PerformanceIndicatorProps) {
  // Get the appropriate styling based on category
  const baseColors = getColorForCategory(category);
  const borderColors = getBorderColorForCategory(category);
  const iconColors = getIconColorForCategory(category);
  
  // Get the text representation of the category
  const text = label || getTextForCategory(category);
  
  // Get size-specific classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size];
  
  // Get variant-specific classes
  const variantClasses = {
    default: `${baseColors} border`,
    outline: `border bg-white ${borderColors} text-gray-800`,
    badge: '',  // Will use Badge component styling
    pill: `${baseColors} border rounded-full`,
    text: iconColors,
  }[variant];
  
  // Get the appropriate icon based on category
  const Icon = {
    excellent: CheckCircle2,
    good: ThumbsUp,
    'needs-work': AlertCircle,
    poor: AlertTriangle,
  }[category];
  
  // For badge variant, return a Badge component
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn(baseColors, borderColors, className)}>
              {showIcon && Icon && <Icon className="h-3 w-3 mr-1" />}
              {showEmoji && <span className="mr-1">{getEmojiForCategory(category)}</span>}
              {text}
              {showScore && score !== undefined && <span className="ml-1">({score})</span>}
            </Badge>
          </TooltipTrigger>
          {tooltipText && <TooltipContent>{tooltipText}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Otherwise, return a styled div
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center font-medium rounded', sizeClasses, variantClasses, className)}>
            {showIcon && Icon && (
              <span className={cn('mr-1', { 'mr-1.5': size === 'lg' })}>
                <Icon className={cn('inline', {
                  'h-3 w-3': size === 'sm',
                  'h-4 w-4': size === 'md',
                  'h-5 w-5': size === 'lg',
                })} />
              </span>
            )}
            {showEmoji && <span className="mr-1">{getEmojiForCategory(category)}</span>}
            {showText && <span>{text}</span>}
            {showScore && score !== undefined && <span className="ml-1">({score})</span>}
          </div>
        </TooltipTrigger>
        {tooltipText && <TooltipContent>{tooltipText}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}