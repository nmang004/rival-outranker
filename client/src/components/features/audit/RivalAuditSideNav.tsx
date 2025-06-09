import React from 'react';
import { Link, useLocation } from "wouter";
import { 
  ClipboardCheck, 
  FileUp,
  BarChart,
  Search,
} from "lucide-react";

interface RivalAuditSideNavProps {
  currentPage?: 'main' | 'pdf-analyzer' | 'keyword-research' | 'rank-tracker';
}

const RivalAuditSideNav: React.FC<RivalAuditSideNavProps> = ({ 
  currentPage = 'main' 
}) => {
  const [location] = useLocation();
  
  const getItemClass = (page: string) => {
    const isActive = 
      (page === 'main' && currentPage === 'main') ||
      (page === 'pdf-analyzer' && currentPage === 'pdf-analyzer') ||
      (page === 'keyword-research' && currentPage === 'keyword-research') ||
      (page === 'rank-tracker' && currentPage === 'rank-tracker');
    
    return isActive
      ? "flex items-center gap-3 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
      : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";
  };

  return (
    <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
      <div className="sticky top-20">
        <div className="border rounded-lg p-1">
          <nav className="grid gap-1">
            <Link href="/rival-audit">
              <div className={getItemClass('main')}>
                <ClipboardCheck className="h-4 w-4" />
                <span>SEO Audit Tool</span>
              </div>
            </Link>
            <Link href="/pdf-analyzer">
              <div className={getItemClass('pdf-analyzer')}>
                <FileUp className="h-4 w-4" />
                <span>PDF Analyzer</span>
              </div>
            </Link>
            <Link href="/keyword-research">
              <div className={getItemClass('keyword-research')}>
                <Search className="h-4 w-4" />
                <span>Keyword Research</span>
              </div>
            </Link>
            <Link href="/basic-rank-tracker">
              <div className={getItemClass('rank-tracker')}>
                <BarChart className="h-4 w-4" />
                <span>Rank Tracker</span>
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default RivalAuditSideNav;