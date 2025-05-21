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
  LineChart,
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

export default function NavBar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActiveLink = (path: string) => {
    return location === path;
  };
  
  const linkClass = (path: string) => {
    return isActiveLink(path)
      ? "border-primary text-foreground inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium h-full"
      : "border-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors h-full";
  };
  
  const mobileLinkClass = (path: string) => {
    return isActiveLink(path)
      ? "bg-muted border-primary text-primary block pl-4 pr-4 py-2 border-l-4 text-base font-medium"
      : "border-transparent text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-foreground block pl-4 pr-4 py-2 border-l-4 text-base font-medium transition-colors";
  };

  return (
    <nav className="bg-white border-b border-primary/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <div className="rounded-full p-1.5 bg-primary/10 mr-2">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <span className="gradient-heading text-xl truncate max-w-[160px] sm:max-w-full">SEO Best Practices</span>
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
                <div className="absolute left-0 top-full hidden group-hover:block hover:block z-50">
                  <div className="pt-1.5">
                    <div className="bg-white rounded-md shadow-xl border border-gray-100 w-60 overflow-hidden">
                      <div className="py-1">
                        <Link href="/deep-content">
                          <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            <FileText className="h-4 w-4 mr-2.5 text-primary" />
                            <span>Deep Content</span>
                          </div>
                        </Link>
                        <Link href="/competitor-analysis">
                          <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            <Users className="h-4 w-4 mr-2.5 text-primary" />
                            <span>Competitors</span>
                          </div>
                        </Link>
                      </div>
                    </div>
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
                <div className="absolute left-0 top-full hidden group-hover:block hover:block z-50">
                  <div className="pt-1.5">
                    <div className="bg-white rounded-md shadow-xl border border-gray-100 w-60 overflow-hidden">
                      <div className="py-1">
                        <Link href="/basic-rank-tracker">
                          <div className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            <BarChart className="h-4 w-4 mr-2.5 text-primary" />
                            <span>Basic Rank Tracker</span>
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
              <Menu className={`${mobileMenuOpen ? 'hidden' : 'block'} h-5 w-5`} aria-hidden="true" />
              <X className={`${mobileMenuOpen ? 'block' : 'hidden'} h-5 w-5`} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden shadow-lg`}>
        <div className="pt-2 pb-3 bg-white border-b">
          <div className="space-y-0.5">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/")}>
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>Dashboard</span>
                </div>
              </div>
            </Link>
            <Link href="/deep-content" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/deep-content")}>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>Deep Content Analysis</span>
                </div>
              </div>
            </Link>
            <Link href="/competitor-analysis" onClick={() => setMobileMenuOpen(false)}>
              <button className={mobileLinkClass("/competitor-analysis") + " w-full text-left cursor-pointer"}>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>Competitor Analysis</span>
                </div>
              </button>
            </Link>
          </div>
          
          {/* Rival Audit Section with nested items */}
          <div className="mt-2 mb-1">
            <Link href="/rival-audit" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/rival-audit")}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <ClipboardCheck className="h-4 w-4 mr-2.5 text-primary/80" /> 
                    <span className="font-medium">Rival Audit</span>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Nested items with visual indication */}
            <div className="border-l border-primary/20 ml-4 mt-1">
              <Link href="/basic-rank-tracker" onClick={() => setMobileMenuOpen(false)}>
                <div className={mobileLinkClass("/basic-rank-tracker") + " border-l-0 py-1.5 pl-8"}>
                  <div className="flex items-center">
                    <BarChart className="h-3.5 w-3.5 mr-2 text-primary/70" /> 
                    <span className="text-sm">Basic Rank Tracker</span>
                  </div>
                </div>
              </Link>
              <Link href="/keyword-research" onClick={() => setMobileMenuOpen(false)}>
                <div className={mobileLinkClass("/keyword-research") + " border-l-0 py-1.5 pl-8"}>
                  <div className="flex items-center">
                    <Search className="h-3.5 w-3.5 mr-2 text-primary/70" /> 
                    <span className="text-sm">Keyword Research</span>
                  </div>
                </div>
              </Link>
              <Link href="/pdf-analyzer" onClick={() => setMobileMenuOpen(false)}>
                <div className={mobileLinkClass("/pdf-analyzer") + " border-l-0 py-1.5 pl-8"}>
                  <div className="flex items-center">
                    <FileUp className="h-3.5 w-3.5 mr-2 text-primary/70" /> 
                    <span className="text-sm">PDF Analyzer</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="mt-2">
            <Link href="/backlinks" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/backlinks")}>
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>Backlink Tracker</span>
                </div>
              </div>
            </Link>
            <Link href="/learning" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/learning")}>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>SEO Learning Paths</span>
                </div>
              </div>
            </Link>
            <Link href="/achievement-demo" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/achievement-demo")}>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>Achievement Demo</span>
                </div>
              </div>
            </Link>
            <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
              <div className={mobileLinkClass("/history")}>
                <div className="flex items-center">
                  <History className="h-4 w-4 mr-2.5 text-primary/80" /> 
                  <span>Analysis History</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="pt-4 pb-3 border-t border-primary/10 bg-white">
          <div className="flex flex-col items-center px-4">
            {/* Mobile User Account Info */}
            <div className="flex w-full items-center pb-4">
              <UserAccountButton />
              <div className="ml-auto flex-shrink-0">
                <NotificationCenter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
