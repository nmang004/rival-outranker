import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { PageIssueSummary } from '../../../../../shared/schema';

interface PageIssuesDropdownProps {
  pageIssues: PageIssueSummary[];
}

const PageIssuesDropdown: React.FC<PageIssuesDropdownProps> = ({ pageIssues }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!pageIssues || pageIssues.length === 0) {
    return null;
  }

  const totalPagesWithIssues = pageIssues.length;
  const totalPriorityOFI = pageIssues.reduce((sum, page) => sum + page.priorityOfiCount, 0);
  const totalOFI = pageIssues.reduce((sum, page) => sum + page.ofiCount, 0);

  const getPageTypeIcon = (pageType: string) => {
    switch (pageType) {
      case 'homepage': return '🏠';
      case 'contact': return '📞';
      case 'service': return '🛠️';
      case 'location': return '📍';
      case 'serviceArea': return '🌐';
      default: return '📄';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Priority OFI') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          <AlertCircle className="w-3 h-3 mr-1" />
          Priority OFI
        </span>
      );
    } else if (status === 'OFI') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
          <AlertTriangle className="w-3 h-3 mr-1" />
          OFI
        </span>
      );
    }
    return null;
  };

  const getImportanceBadge = (importance: string) => {
    const colors = {
      'High': 'bg-red-50 text-red-700 border-red-200',
      'Medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Low': 'bg-blue-50 text-blue-700 border-blue-200'
    };

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium border rounded ${colors[importance as keyof typeof colors] || colors.Medium}`}>
        {importance}
      </span>
    );
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Pages Requiring Attention
            </h3>
            <p className="text-xs text-gray-600">
              {totalPagesWithIssues} pages with {totalPriorityOFI} Priority OFI and {totalOFI} OFI issues
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="bg-white">
          {pageIssues.map((page, index) => (
            <div
              key={page.pageUrl}
              className={`px-4 py-4 ${index !== pageIssues.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getPageTypeIcon(page.pageType)}</span>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {page.pageTitle}
                    </h4>
                    <a
                      href={page.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                      title="Open page in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {page.pageUrl}
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    {page.priorityOfiCount > 0 && (
                      <span className="text-red-600 font-medium">
                        {page.priorityOfiCount} Priority OFI
                      </span>
                    )}
                    {page.ofiCount > 0 && (
                      <span className="text-orange-600 font-medium">
                        {page.ofiCount} OFI
                      </span>
                    )}
                    <span className="text-gray-500">
                      {page.totalIssues} total issues
                    </span>
                  </div>
                </div>
              </div>

              {page.topIssues && page.topIssues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">
                    Top Issues:
                  </h5>
                  <div className="space-y-2">
                    {page.topIssues.map((issue, issueIndex) => (
                      <div
                        key={issueIndex}
                        className="flex items-start justify-between text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {issue.name}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {issue.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {getImportanceBadge(issue.importance)}
                          {getStatusBadge(issue.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageIssuesDropdown;