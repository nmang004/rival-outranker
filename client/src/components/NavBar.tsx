import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  FileText, 
  Users, 
  History, 
  Menu, 
  X,
  ClipboardCheck,
  ChevronDown,
  BarChart,
  Search,
  FileUp,
  Link as LinkIcon,
  BookOpen,
  Trophy
} from "lucide-react";
import { UserAccountButton } from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MobileNavMenu } from "./MobileNavMenu";

export default function NavBar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActiveLink = (path: string) => {
    return location === path;
  };
  
  const linkClass = (path: string) => {
    return isActiveLink(path)
      ? "border-secondary text-foreground inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium h-full"
      : "border-transparent text-muted-foreground hover:border-secondary/50 hover:text-foreground inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors h-full";
  };

  return (
    <nav className="bg-white border-b border-secondary/10 shadow-sm">
      <div className="high-res-layout">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <span className="gradient-heading text-lg sm:text-xl md:text-2xl truncate max-w-[160px] sm:max-w-full">Rival Outranker</span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:flex h-full items-center gap-2 ml-6">
              <div className="relative group">
                <Link href="/">
                  <div className={linkClass("/")}>
                    <div className="flex items-center">
                      <BarChart2 className="h-4 w-4 mr-2" /> 
                      <span>Dashboard</span>
                      <ChevronDown className="h-3.5 w-3.5 ml-1.5 transition-transform duration-200 group-hover:rotate-180" />
                    </div>
                  </div>
                </Link>
                
                <div className="absolute left-0 z-10 transform origin-top-left transition-all duration-150 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto">
                  <div className="py-1 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[14rem]">
                    <Link href="/">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <BarChart2 className="h-4 w-4 mr-2.5 text-primary" />
                        <span>Dashboard Overview</span>
                      </div>
                    </Link>
                    <Link href="/deep-content-analysis">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <FileText className="h-4 w-4 mr-2.5 text-primary" />
                        <span>Deep Content Analysis</span>
                      </div>
                    </Link>
                    <Link href="/competitor-analysis">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <Users className="h-4 w-4 mr-2.5 text-primary" />
                        <span>Competitor Analysis</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <Link href="/rival-audit">
                  <div className={linkClass("/rival-audit")}>
                    <div className="flex items-center">
                      <ClipboardCheck className="h-4 w-4 mr-2" /> 
                      <span>Rival Audit</span>
                      <ChevronDown className="h-3.5 w-3.5 ml-1.5 transition-transform duration-200 group-hover:rotate-180" />
                    </div>
                  </div>
                </Link>
                
                <div className="absolute left-0 z-10 transform origin-top-left transition-all duration-150 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto">
                  <div className="py-1 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[14rem]">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Audit Tools
                    </div>
                    <Link href="/basic-rank-tracker">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <BarChart className="h-4 w-4 mr-2.5 text-primary" />
                        <span>Basic Rank Tracker</span>
                      </div>
                    </Link>
                    <Link href="/keyword-research">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <Search className="h-4 w-4 mr-2.5 text-primary" />
                        <span>Keyword Research</span>
                      </div>
                    </Link>
                    <Link href="/pdf-analyzer">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <FileUp className="h-4 w-4 mr-2.5 text-primary" />
                        <span>PDF Analyzer</span>
                      </div>
                    </Link>
                    <Link href="/backlinks">
                      <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                        <LinkIcon className="h-4 w-4 mr-2.5 text-primary" />
                        <span>Backlink Analyzer</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              
              <Link href="/keyword-research">
                <div className={linkClass("/keyword-research")}>
                  <Search className="h-4 w-4 mr-2" /> Keyword Research
                </div>
              </Link>

            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <NotificationCenter />
            <div className="ml-3 relative">
              <UserAccountButton />
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu - structure matches desktop */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden absolute inset-x-0 top-16 bg-white shadow-lg z-40`}>
        <div className="py-2">
          {/* Dashboard Section */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Dashboard
          </div>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <BarChart2 className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Dashboard Overview</span>
            </div>
          </Link>
          
          <Link href="/deep-content-analysis" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <FileText className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Deep Content Analysis</span>
            </div>
          </Link>
          
          <Link href="/competitor-analysis" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <Users className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Competitor Analysis</span>
            </div>
          </Link>
          
          {/* Rival Audit Section */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
            Rival Audit
          </div>
          <Link href="/basic-rank-tracker" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <BarChart className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Basic Rank Tracker</span>
            </div>
          </Link>
          
          <Link href="/keyword-research" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <Search className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Keyword Research</span>
            </div>
          </Link>
          
          <Link href="/pdf-analyzer" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <FileUp className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">PDF Analyzer</span>
            </div>
          </Link>
          
          <Link href="/backlinks" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <LinkIcon className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Backlink Analyzer</span>
            </div>
          </Link>
          
          {/* Other Navigation Items */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
            Other Tools
          </div>
          <Link href="/learning" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <BookOpen className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">SEO Learning Paths</span>
            </div>
          </Link>
          
          <Link href="/achievement-demo" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <Trophy className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Achievement Demo</span>
            </div>
          </Link>
          
          <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center px-6 py-2 hover:bg-gray-50">
              <History className="h-4 w-4 mr-3 text-primary/80" /> 
              <span className="text-gray-700">Analysis History</span>
            </div>
          </Link>
        </div>
        
        <div className="px-4 py-4 border-t border-gray-200">
          <NotificationCenter />
          <div className="mt-3">
            <UserAccountButton />
          </div>
        </div>
      </div>
    </nav>
  );
}