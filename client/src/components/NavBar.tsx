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
  LineChart
} from "lucide-react";
import { UserAccountButton } from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/NotificationCenter";

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
                  <span className="gradient-heading text-xl">SEO Best Practices</span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex h-full">
              <Link href="/">
                <div className={linkClass("/")}>
                  <BarChart2 className="h-4 w-4 mr-1" /> Dashboard
                </div>
              </Link>
              <Link href="/deep-content">
                <div className={linkClass("/deep-content")}>
                  <FileText className="h-4 w-4 mr-1" /> Deep Content
                </div>
              </Link>
              <Link href="/competitor-analysis">
                <div className={linkClass("/competitor-analysis")}>
                  <Users className="h-4 w-4 mr-1" /> Competitors
                </div>
              </Link>
              <Link href="/history">
                <div className={linkClass("/history")}>
                  <History className="h-4 w-4 mr-1" /> History
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
        <div className="pt-2 pb-3 space-y-1 bg-white">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <div className={mobileLinkClass("/")}>
              <div className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" /> Dashboard
              </div>
            </div>
          </Link>
          <Link href="/deep-content" onClick={() => setMobileMenuOpen(false)}>
            <div className={mobileLinkClass("/deep-content")}>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Deep Content Analysis
              </div>
            </div>
          </Link>
          <Link href="/competitor-analysis" onClick={() => setMobileMenuOpen(false)}>
            <div className={mobileLinkClass("/competitor-analysis")}>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" /> Competitor Analysis
              </div>
            </div>
          </Link>
          <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
            <div className={mobileLinkClass("/history")}>
              <div className="flex items-center">
                <History className="h-4 w-4 mr-2" /> Analysis History
              </div>
            </div>
          </Link>
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
