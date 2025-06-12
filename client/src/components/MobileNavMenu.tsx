import { Link, useLocation } from "wouter";
import { 
  BarChart2, 
  FileText, 
  History, 
  X,
  ClipboardCheck
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
          
          
          <Link href="/rival-audit" onClick={onClose}>
            <div className={mobileLinkClass("/rival-audit")}>
              <div className="flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-3 text-primary/80" /> 
                <span>Rival Audit</span>
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