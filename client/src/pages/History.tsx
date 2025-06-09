import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Analysis } from "@shared/schema";
import { formatDate } from "@/lib/formatters";
import SearchApiUsage from "@/components/features/analysis/SearchApiUsage";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";

export default function History() {
  const [, setLocation] = useLocation();
  
  // Filtering state
  const [urlFilter, setUrlFilter] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { data, isLoading, isError } = useQuery<Analysis[]>({
    queryKey: ['/api/analyses'],
  });
  
  // Filtered and paginated data
  const filteredData = data ? data.filter(item => {
    // Filter by URL
    if (urlFilter && !item.url.toLowerCase().includes(urlFilter.toLowerCase())) {
      return false;
    }
    
    // Filter by start date
    if (startDateStr) {
      const itemDate = parseISO(item.timestamp.toString());
      const filterStartDate = startOfDay(new Date(startDateStr));
      if (isBefore(itemDate, filterStartDate)) {
        return false;
      }
    }
    
    // Filter by end date
    if (endDateStr) {
      const itemDate = parseISO(item.timestamp.toString());
      const filterEndDate = endOfDay(new Date(endDateStr));
      if (isAfter(itemDate, filterEndDate)) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) : [];
  
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Reset page if beyond bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  // Get paginated items
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const handleViewAnalysis = (url: string) => {
    setLocation(`/results?url=${encodeURIComponent(url)}`);
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [urlFilter, startDateStr, endDateStr]);
  
  if (isLoading) {
    return <HistorySkeleton />;
  }
  
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p>Failed to load analysis history. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No analysis history</h3>
            <p className="text-gray-500 mb-4">You haven't analyzed any websites yet.</p>
            <Button onClick={() => setLocation('/')}>
              Analyze a Website
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-1">
          <SearchApiUsage />
        </div>
      </div>
    
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>
            View and filter your previous SEO analyses. Showing {paginatedItems.length} of {totalItems} results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="url-filter">Filter by URL</Label>
              <Input
                id="url-filter"
                placeholder="Enter domain or URL..."
                value={urlFilter}
                onChange={(e) => setUrlFilter(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          {(urlFilter || startDateStr || endDateStr) && (
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUrlFilter("");
                  setStartDateStr("");
                  setEndDateStr("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
          
          {/* Results Table */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Date
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                      No results match your filters. Try adjusting your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate max-w-[150px] sm:max-w-xs">
                          {analysis.url}
                          <div className="text-xs text-gray-500 mt-1 sm:hidden">
                            {formatDate(analysis.timestamp)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {formatDate(analysis.timestamp)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ScoreIndicator score={analysis.overallScore} />
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary-600 hover:text-primary-900"
                          onClick={() => handleViewAnalysis(analysis.url)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm">Page {currentPage} of {totalPages}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Admin Dashboard Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 mb-2">Administrator Access</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation('/admin/dashboard')}
          className="mx-auto"
        >
          View API Usage Dashboard
        </Button>
      </div>
    </div>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  let color = "";
  let label = "";
  
  if (score >= 90) {
    color = "bg-green-100 text-green-800";
    label = "Excellent";
  } else if (score >= 70) {
    color = "bg-blue-100 text-blue-800";
    label = "Good";
  } else if (score >= 50) {
    color = "bg-yellow-100 text-yellow-800";
    label = "Needs Work";
  } else {
    color = "bg-red-100 text-red-800";
    label = "Poor";
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {score} - {label}
    </span>
  );
}

function HistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-4 sm:px-6 py-4">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}