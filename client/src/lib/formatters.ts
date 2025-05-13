// Function to format a date for display
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Function to format a URL for display (truncate if too long)
export const formatUrl = (url: string, maxLength: number = 50): string => {
  if (url.length <= maxLength) return url;
  
  // Remove protocol for display
  let displayUrl = url.replace(/^https?:\/\//, '');
  
  if (displayUrl.length <= maxLength) return displayUrl;
  
  // Try to keep domain and part of the path
  const parts = displayUrl.split('/');
  const domain = parts[0];
  
  if (domain.length >= maxLength - 5) {
    return domain.substring(0, maxLength - 3) + '...';
  }
  
  // Keep domain and truncate path
  return domain + '/...' + displayUrl.substring(displayUrl.length - (maxLength - domain.length - 5));
};

// Function to get a category label based on a score
export const getScoreCategory = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
};

// Function to get a color based on a score
export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
};

// Function to get a background color based on a score
export const getScoreBgColor = (score: number): string => {
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

// Function to format time (ms) to a readable format
export const formatTime = (timeMs?: number): string => {
  if (timeMs === undefined) return 'N/A';
  
  if (timeMs < 1000) {
    return `${timeMs.toFixed(0)}ms`;
  }
  
  return `${(timeMs / 1000).toFixed(2)}s`;
};

// Function to format file size
export const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined) return 'N/A';
  
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Function to format keyword density
export const formatDensity = (density?: number): string => {
  if (density === undefined) return 'N/A';
  return `${density.toFixed(1)}%`;
};

// Function to generate a simple slug from text
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};
