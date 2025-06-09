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

interface SimpleMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleMobileNav({ isOpen, onClose }: SimpleMobileNavProps) {
  const [location] = useLocation();
  
  const isActiveLink = (path: string) => {
    return location.startsWith(path);
  };
  
  const mobileLinkClass = (path: string) => {
    return isActiveLink(path)
      ? "bg-gray-100 text-primary block py-2 px-3"
      : "text-gray-700 hover:bg-gray-50 block py-2 px-3";
  };

  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-x-0 top-16 bg-white z-50 shadow-lg">
      <div className="pt-2 pb-3 divide-y divide-gray-100">
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-primary">Rival Outranker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="py-1">
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
        </div>
        
        {/* Indented submenu items */}
        <div className="py-1 pl-4 border-l-4 border-gray-100 ml-4">
          <Link href="/basic-rank-tracker" onClick={onClose}>
            <div className={mobileLinkClass("/basic-rank-tracker")}>
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-3 text-primary/80" /> 
                <span>Basic Rank Tracker</span>
              </div>
            </div>
          </Link>
          
          <Link href="/keyword-research" onClick={onClose}>
            <div className={mobileLinkClass("/keyword-research")}>
              <div className="flex items-center">
                <Search className="h-4 w-4 mr-3 text-primary/80" /> 
                <span>Keyword Research</span>
              </div>
            </div>
          </Link>
          
          <Link href="/pdf-analyzer" onClick={onClose}>
            <div className={mobileLinkClass("/pdf-analyzer")}>
              <div className="flex items-center">
                <FileUp className="h-4 w-4 mr-3 text-primary/80" /> 
                <span>PDF Analyzer</span>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="py-1">
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
        </div>
        
        <div className="py-3 px-4">
          <Link href="/login" onClick={onClose}>
            <button className="w-full px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
              Log In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}