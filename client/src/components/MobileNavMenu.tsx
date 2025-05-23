import { Link, useLocation } from "wouter";
import { 
  BarChart2, 
  FileText, 
  Users, 
  History, 
  X,
  ClipboardCheck,
  BarChart,
  Search,
  FileUp,
  Link as LinkIcon,
  BookOpen,
  Trophy
} from "lucide-react";

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavMenu({ isOpen, onClose }: MobileNavMenuProps) {
  const [location] = useLocation();
  
  const isActiveLink = (path: string) => {
    return location === path;
  };
  
  const mobileLinkClass = (path: string) => {
    return isActiveLink(path)
      ? "bg-gray-100 text-primary font-medium block py-2 px-3 rounded-md"
      : "text-gray-700 hover:bg-gray-50 block py-2 px-3 rounded-md";
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="py-4 px-4">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
          <div className="text-xl font-bold gradient-heading">
            Rival Outranker
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        <nav className="space-y-1">
          <Link href="/" onClick={onClose}>
            <div className={mobileLinkClass("/")}>
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Dashboard</span>
              </div>
            </div>
          </Link>
          
          <Link href="/deep-content-analysis" onClick={onClose}>
            <div className={mobileLinkClass("/deep-content-analysis")}>
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Deep Content Analysis</span>
              </div>
            </div>
          </Link>
          
          <Link href="/competitor-analysis" onClick={onClose}>
            <div className={mobileLinkClass("/competitor-analysis")}>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Competitor Analysis</span>
              </div>
            </div>
          </Link>
          
          <Link href="/rival-audit" onClick={onClose}>
            <div className={mobileLinkClass("/rival-audit")}>
              <div className="flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Rival Audit</span>
              </div>
            </div>
          </Link>
          
          {/* Indented submenu items */}
          <div className="border-l-2 border-gray-200 ml-4 pl-3 py-1">
            <Link href="/basic-rank-tracker" onClick={onClose}>
              <div className={mobileLinkClass("/basic-rank-tracker").replace('px-3', 'px-2')}>
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 mr-3 text-primary/80" /> 
                  <span>Basic Rank Tracker</span>
                </div>
              </div>
            </Link>
            
            <Link href="/keyword-research" onClick={onClose}>
              <div className={mobileLinkClass("/keyword-research").replace('px-3', 'px-2')}>
                <div className="flex items-center">
                  <Search className="h-4 w-4 mr-3 text-primary/80" /> 
                  <span>Keyword Research</span>
                </div>
              </div>
            </Link>
            
            <Link href="/pdf-analyzer" onClick={onClose}>
              <div className={mobileLinkClass("/pdf-analyzer").replace('px-3', 'px-2')}>
                <div className="flex items-center">
                  <FileUp className="h-4 w-4 mr-3 text-primary/80" /> 
                  <span>PDF Analyzer</span>
                </div>
              </div>
            </Link>
          </div>
          
          <Link href="/backlinks" onClick={onClose}>
            <div className={mobileLinkClass("/backlinks")}>
              <div className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Backlink Tracker</span>
              </div>
            </div>
          </Link>
          
          <Link href="/learning" onClick={onClose}>
            <div className={mobileLinkClass("/learning")}>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>SEO Learning Paths</span>
              </div>
            </div>
          </Link>
          
          <Link href="/achievement-demo" onClick={onClose}>
            <div className={mobileLinkClass("/achievement-demo")}>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Achievement Demo</span>
              </div>
            </div>
          </Link>
          
          <Link href="/history" onClick={onClose}>
            <div className={mobileLinkClass("/history")}>
              <div className="flex items-center">
                <History className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Analysis History</span>
              </div>
            </div>
          </Link>
        </nav>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link href="/login" onClick={onClose}>
            <button className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Log In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}