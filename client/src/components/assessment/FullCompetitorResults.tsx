import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Globe, AlertCircle } from 'lucide-react';

interface FullCompetitorResultsProps {
  url: string;
  city?: string;
}

export default function FullCompetitorResults({ url, city }: FullCompetitorResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Items per page

  // Fetch the competitor data
  const competitorQueryKey = `/api/competitors?url=${encodeURIComponent(url)}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [competitorQueryKey],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // If we're loading or have an error, show appropriate UI
  if (isLoading) {
    return <CompetitorResultsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading competitor data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // If we have no data or no all competitor URLs, show a message
  if (!data || !data.allCompetitorUrls || data.allCompetitorUrls.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No additional competitor data available.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate pagination
  const totalItems = data.allCompetitorUrls.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentCompetitors = data.allCompetitorUrls.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5; // Max number of page buttons to show
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPageButtons - 3);
    
    // Adjust if we're near the end
    if (endPage - startPage < maxPageButtons - 3) {
      startPage = Math.max(2, endPage - (maxPageButtons - 3));
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('ellipsis1');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('ellipsis2');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">
        {data.meta && (
          <>
            Showing {startIndex + 1}-{endIndex} of {totalItems} results for "{data.meta.searchQuery || 'your query'}"
          </>
        )}
      </div>
    
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {currentCompetitors.map((competitor: any, index: number) => (
          <Card key={index} className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-start">
              <div className="font-medium flex items-center truncate">
                <Globe className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                <span className="truncate">{competitor.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2" 
                onClick={() => window.open(competitor.url, '_blank')}
                title="Visit website"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs mt-2 truncate text-muted-foreground">
              {competitor.url}
            </div>
          </Card>
        ))}
      </div>
    
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(prev => Math.max(1, prev - 1));
                  }} 
                />
              </PaginationItem>
            )}
            
            {pageNumbers.map((page, i) => (
              <PaginationItem key={i}>
                {page === 'ellipsis1' || page === 'ellipsis2' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink 
                    href="#" 
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Number(page));
                    }}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  }} 
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Show query count information */}
      {data.meta && (
        <div className="mt-6 text-xs text-muted-foreground text-center">
          <p>Data powered by Google Custom Search API</p>
        </div>
      )}
    </div>
  );
}

// Skeleton loader for the competitor results
function CompetitorResultsSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {Array(6).fill(0).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </Card>
        ))}
      </div>
    </div>
  );
}