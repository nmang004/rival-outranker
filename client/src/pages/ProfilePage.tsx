import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  UserCircle2, 
  KeyRound, 
  ListChecks, 
  LineChart, 
  Lock, 
  ChevronRight, 
  UserCog,
  History,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Import as FileImport
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip,
  XAxis,
  YAxis 
} from "recharts";

// Interactive Components

// Mini trend chart component with tooltip
interface MiniChartProps {
  data: number[];
  isPositive: boolean;
  showTooltip?: boolean;
  tooltipFormatter?: (value: number) => string;
  unit?: string;
}

function MiniChart({ 
  data, 
  isPositive, 
  showTooltip = false, 
  tooltipFormatter = (value) => `${value}`, 
  unit = ''
}: MiniChartProps) {
  const chartData = data.map((value, index) => ({
    name: String(index),
    value: value
  }));

  const gradientId = `gradient-${isPositive ? 'up' : 'down'}-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="w-20 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="0%" 
                stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="100%" 
                stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 rounded shadow-md border text-xs">
                      <p>{tooltipFormatter(payload[0].value as number)}{unit}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Status Badge component
interface StatusBadgeProps {
  status: "active" | "in-progress" | "monitoring" | "paused" | "error";
  onClick?: () => void;
}

function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const statusConfig = {
    "active": { 
      text: "Active", 
      className: "text-green-600 bg-green-50 hover:bg-green-100" 
    },
    "in-progress": { 
      text: "In Progress", 
      className: "text-blue-600 bg-blue-50 hover:bg-blue-100" 
    },
    "monitoring": { 
      text: "Monitoring", 
      className: "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" 
    },
    "paused": { 
      text: "Paused", 
      className: "text-muted-foreground bg-muted/50 hover:bg-muted" 
    },
    "error": { 
      text: "Error", 
      className: "text-red-600 bg-red-50 hover:bg-red-100" 
    }
  };

  // Use a button element to avoid DOM nesting errors with Badge component
  return (
    <button
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${statusConfig[status].className}`}
      onClick={onClick}
    >
      {statusConfig[status].text}
    </button>
  );
}

// Project Actions Menu Component
interface ProjectActionsMenuProps {
  projectId: number;
}

function ProjectActionsMenu({ projectId }: ProjectActionsMenuProps) {
  const [open, setOpen] = useState(false);
  
  const handleAction = (action: string) => {
    console.log(`Performing ${action} on project ${projectId}`);
    setOpen(false);
  };
  
  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(!open)}>
        <span className="sr-only">Menu</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
      </Button>
      
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-muted/50 flex items-center"
              onClick={() => handleAction('edit')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Project
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-muted/50 flex items-center"
              onClick={() => handleAction('duplicate')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
              </svg>
              Duplicate
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-muted/50 flex items-center"
              onClick={() => handleAction('share')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share
            </button>
            <hr className="my-1 border-gray-200" />
            <button 
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              onClick={() => handleAction('delete')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage(props: { params?: { tab?: string } }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(props.params?.tab || "projects");
  const [location, setLocation] = useLocation();
  const [dashboardView, setDashboardView] = useState<"grid" | "table">("grid");
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/profile/${tab}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-10">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="max-w-lg w-full">
          <Card className="w-full">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                <Lock className="mx-auto h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-extrabold">Sign in to your account</CardTitle>
              <CardDescription className="text-lg pt-2">
                Access your profile and manage your SEO analyses
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="w-full flex items-center justify-center"
                  onClick={() => window.location.href = '/api/login'}
                >
                  <UserCog className="mr-2 h-5 w-5" />
                  Login to Your Account
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full flex items-center justify-center"
                  onClick={() => window.location.href = '/api/login'}
                >
                  <UserCircle2 className="mr-2 h-5 w-5" />
                  Create an Account
                </Button>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <p className="text-center text-muted-foreground mb-4">
                  Account benefits:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center rounded-full p-0 mr-2">
                        <BarChart3 className="h-3 w-3" />
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Save all your SEO analyses</h3>
                      <p className="text-xs text-muted-foreground">Track your website's SEO progress over time</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center rounded-full p-0 mr-2">
                        <History className="h-3 w-3" />
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Access your analysis history</h3>
                      <p className="text-xs text-muted-foreground">Review previous SEO audits and insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-muted/30 min-h-screen">
      <header className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Dashboard</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Manage your profile and SEO analysis settings
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/">
                  <BarChart3 className="h-4 w-4" />
                  New Analysis
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/rival-audit">
                  <ListChecks className="h-4 w-4" />
                  New Rival Audit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        {user && (
          <div className="mb-8 bg-card rounded-lg shadow overflow-hidden border border-muted">
            <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 border-2 border-muted flex items-center justify-center">
                  {(user as any)?.profileImageUrl ? (
                    <img 
                      src={(user as any).profileImageUrl} 
                      alt={`${(user as any).firstName || ''} ${(user as any).lastName || ''}`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="h-12 w-12 text-primary/50" />
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <h2 className="text-2xl font-bold">
                  {(user as any)?.firstName && (user as any)?.lastName 
                    ? `${(user as any).firstName} ${(user as any).lastName}` 
                    : (user as any)?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-muted-foreground">
                  {(user as any)?.email}
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                    Verified
                  </Badge>
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium text-primary">Replit</span> user
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Account created for SEO analysis tools
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg shadow overflow-hidden border border-muted">
          <Tabs defaultValue="profile" className="w-full" value={activeTab} onValueChange={handleTabChange}>
            <div className="sm:hidden px-4 py-3 border-b">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-muted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
              >
                <option value="projects">Projects & Domains</option>
                <option value="analyses">My Analyses</option>
                <option value="profile">Profile Settings</option>
                <option value="security">Security</option>
              </select>
              {activeTab === "projects" && (
                <div className="flex justify-end mt-3">
                  <div className="flex bg-muted rounded-md p-0.5">
                    <Button 
                      size="sm" 
                      variant={dashboardView === "grid" ? "default" : "ghost"} 
                      className="rounded-sm h-8 px-2"
                      onClick={() => setDashboardView("grid")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                      </svg>
                    </Button>
                    <Button 
                      size="sm" 
                      variant={dashboardView === "table" ? "default" : "ghost"} 
                      className="rounded-sm h-8 px-2"
                      onClick={() => setDashboardView("table")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7h18" />
                        <path d="M3 12h18" />
                        <path d="M3 17h18" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:block border-b">
              <div className="px-6 flex justify-between items-center">
                <TabsList className="h-14 bg-transparent space-x-8 -mb-px">
                  <TabsTrigger
                    value="projects"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <ListChecks className="h-5 w-5 mr-2" />
                    Projects & Domains
                  </TabsTrigger>
                  <TabsTrigger
                    value="analyses"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <LineChart className="h-5 w-5 mr-2" />
                    My Analyses
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <UserCircle2 className="h-5 w-5 mr-2" />
                    Profile Settings
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <KeyRound className="h-5 w-5 mr-2" />
                    Security
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  {activeTab === "projects" && (
                    <div className="flex bg-muted rounded-md p-0.5">
                      <Button 
                        size="sm" 
                        variant={dashboardView === "grid" ? "default" : "ghost"} 
                        className="rounded-sm h-8 px-2.5"
                        onClick={() => setDashboardView("grid")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect width="7" height="7" x="3" y="3" rx="1" />
                          <rect width="7" height="7" x="14" y="3" rx="1" />
                          <rect width="7" height="7" x="14" y="14" rx="1" />
                          <rect width="7" height="7" x="3" y="14" rx="1" />
                        </svg>
                        Grid
                      </Button>
                      <Button 
                        size="sm" 
                        variant={dashboardView === "table" ? "default" : "ghost"} 
                        className="rounded-sm h-8 px-2.5"
                        onClick={() => setDashboardView("table")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M3 7h18" />
                          <path d="M3 12h18" />
                          <path d="M3 17h18" />
                        </svg>
                        Table
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <TabsContent value="profile" className="mt-0">
                <ProfileForm />
              </TabsContent>
              <TabsContent value="security" className="mt-0">
                <ChangePasswordForm />
              </TabsContent>
              <TabsContent value="analyses" className="mt-0">
                <div className="bg-card rounded-lg p-6 border border-muted">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">My Analyses</h2>
                      <p className="text-muted-foreground">
                        View and manage all your previous SEO analyses.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-4 md:mt-0 gap-1.5">
                      <Link href="/">
                        <BarChart3 className="h-4 w-4" />
                        New Analysis
                      </Link>
                    </Button>
                  </div>
                  <UserAnalysesList />
                </div>
              </TabsContent>
              <TabsContent value="projects" className="mt-0">
                <div className="bg-card rounded-lg p-6 border border-muted">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">My Projects</h2>
                      <p className="text-muted-foreground">
                        View and manage all your SEO projects.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 md:mt-0 gap-1.5">
                      <ListChecks className="h-4 w-4" />
                      Create Project
                    </Button>
                  </div>
                  <UserProjectsList />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// User's Analyses List Component
function UserAnalysesList() {
  const { data: analyses, isLoading } = useQuery<any[]>({
    queryKey: ['/api/user/analyses'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-muted">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          You don't have any saved analyses yet. Run an SEO analysis to get detailed insights for your website.
        </p>
        <Button asChild>
          <Link href="/" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze New URL
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* This would be populated with actual analyses */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/30 p-4 rounded-lg border border-muted hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span className="text-xs font-medium text-muted-foreground">Completed</span>
                </div>
                <div className="text-xs text-muted-foreground">May {i + 10}, 2025</div>
              </div>
              <h3 className="font-medium mb-1 truncate">example-website-{i}.com</h3>
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                <span>Overall Score: {65 + i * 5}%</span>
              </div>
              <div className="mt-4 pt-3 border-t border-muted flex justify-between">
                <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                  <Link href={`/results?url=example-website-${i}.com`}>
                    <ChevronRight className="h-3.5 w-3.5 mr-1" />
                    View Results
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          View All Analyses
        </Button>
      </div>
    </div>
  );
}

// User's Projects List Component
function UserProjectsList() {
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ['/api/user/projects'],
    retry: false,
  });
  const [dashboardView, setDashboardView] = useState<"grid" | "table">("grid");
  const [filterValue, setFilterValue] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    // Empty state view matching the screenshot
    return (
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">My Projects</h2>
            <p className="text-sm text-muted-foreground">View and manage all your SEO projects.</p>
          </div>
          <Button>
            <ListChecks className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
        
        {/* Dashboard summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <h3 className="text-3xl font-bold mt-1">0</h3>
              </div>
              <div className="p-2 bg-[#e6f5ec] rounded-full">
                <ListChecks className="h-5 w-5 text-[#52bb7a]" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                <h3 className="text-3xl font-bold mt-1">0</h3>
              </div>
              <div className="p-2 bg-[#e1f0ff] rounded-full">
                <BarChart3 className="h-5 w-5 text-[#3694ff]" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tracked Keywords</p>
                <h3 className="text-3xl font-bold mt-1">0</h3>
              </div>
              <div className="p-2 bg-[#e9f9ee] rounded-full">
                <TrendingUp className="h-5 w-5 text-[#38c173]" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-lg text-center">
          <div className="flex justify-center items-center h-12 w-12 bg-[#f8f9fa] rounded-full mb-4">
            <ListChecks className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-base font-medium mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Projects help you organize multiple websites for easier tracking<br />
            and comparison of SEO metrics.
          </p>
          <div className="flex gap-3">
            <Button className="bg-[#52bb7a] hover:bg-[#43a067]">
              <ListChecks className="mr-2 h-4 w-4" />
              Create Project
            </Button>
            <Button variant="outline" className="border-gray-300">
              <FileImport className="mr-2 h-4 w-4" />
              Import Existing Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sample project data based on the reference image
  // Helper functions for generating comprehensive mock data
  const generateTrendData = (start: number, isGrowing: boolean, volatility: number, length: number = 10) => {
    const data = [];
    let current = start;
    for (let i = 0; i < length; i++) {
      // Add randomness with specified volatility
      const change = Math.random() * volatility * (isGrowing ? 1 : -1);
      current = Math.max(0, current + change);
      data.push(Math.round(current));
    }
    return data;
  };
  
  const generateHistoricalData = (start: number, end: number, months: number = 6) => {
    const data = [];
    const step = (end - start) / (months - 1);
    for (let i = 0; i < months; i++) {
      const monthValue = Math.round(start + step * i);
      // Add some randomness
      const variance = Math.random() * 0.2 * monthValue;
      data.push(Math.round(monthValue + variance * (Math.random() > 0.5 ? 1 : -1)));
    }
    return data;
  };
  
  const generateKeywordData = (count: number, baseKeyword: string) => {
    const keywords = [
      "heating and cooling", "HVAC", "air conditioning repair", "furnace installation", 
      "AC service", "heating systems", "duct cleaning", "emergency HVAC", "commercial HVAC",
      "heat pump repair", "air quality", "thermostat installation", "energy efficient HVAC",
      "air conditioning units", "furnace repair", "HVAC maintenance", "cooling systems",
      "air conditioner installation", "heating repair", "HVAC contractor"
    ];
    
    const locations = [
      "Texas", "Dallas", "Houston", "Austin", "San Antonio", "Fort Worth", 
      "Charlotte", "Raleigh", "Durham", "Winston-Salem", "Greensboro", "Asheville"
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const keyword = i < 5 
        ? `${baseKeyword} ${keywords[Math.floor(Math.random() * keywords.length)]}` 
        : `${keywords[Math.floor(Math.random() * keywords.length)]} ${locations[Math.floor(Math.random() * locations.length)]}`;
      
      return {
        id: i + 1,
        keyword: keyword,
        position: Math.floor(Math.random() * 50) + 1,
        volume: Math.floor(Math.random() * 5000) + 100,
        difficulty: Math.floor(Math.random() * 100),
        cpc: (Math.random() * 15).toFixed(2),
        trend: generateTrendData(10 + Math.random() * 20, Math.random() > 0.3, 3, 6)
      };
    });
  };
  
  const generateCompetitors = (domain: string) => {
    const competitors = [
      { domain: "competitor1.com", overlap: Math.floor(Math.random() * 30) + 20 },
      { domain: "competitor2.net", overlap: Math.floor(Math.random() * 20) + 10 },
      { domain: "competitor3.org", overlap: Math.floor(Math.random() * 15) + 5 },
      { domain: "competitor4.biz", overlap: Math.floor(Math.random() * 10) + 5 },
      { domain: "competitor5.co", overlap: Math.floor(Math.random() * 5) + 1 }
    ];
    
    return competitors.map(comp => ({
      ...comp,
      traffic: Math.floor(Math.random() * 15000) + 1000,
      keywords: Math.floor(Math.random() * 5000) + 500,
      backlinks: Math.floor(Math.random() * 2000) + 100,
      domain: domain.replace(domain.split(".")[0], "competitor" + Math.floor(Math.random() * 10))
    }));
  };
  
  // Rich sample project data
  const sampleProjects = [
    {
      id: 1,
      name: "Brody Pennell HVAC",
      domain: "brodypennell.com",
      status: "active" as const,
      score: 79,
      created: new Date(2023, 1, 15),
      updated: new Date(2023, 4, 27),
      organicTraffic: {
        value: "8.9K",
        change: "+58.95%",
        trend: [32, 28, 35, 42, 50, 65, 80, 95, 100, 120, 130, 140],
        history: generateHistoricalData(5600, 8900, 6)
      },
      organicKeywords: {
        value: "3.6K",
        change: "+1.71%",
        trend: [3200, 3250, 3300, 3350, 3400, 3450, 3500, 3550, 3600, 3620, 3650, 3660],
        history: generateHistoricalData(3200, 3600, 6)
      },
      backlinks: {
        value: "3.1K",
        change: "-10.6%",
        trend: [3800, 3750, 3700, 3650, 3600, 3550, 3500, 3450, 3400, 3350, 3300, 3100],
        history: generateHistoricalData(3500, 3100, 6)
      },
      keywords: generateKeywordData(15, "Brody Pennell"),
      competitors: generateCompetitors("brodypennell.com"),
      analyses: [
        { id: 101, date: new Date(2023, 1, 15), score: 68, status: "completed" },
        { id: 102, date: new Date(2023, 2, 20), score: 72, status: "completed" },
        { id: 103, date: new Date(2023, 3, 18), score: 75, status: "completed" },
        { id: 104, date: new Date(2023, 4, 27), score: 79, status: "completed" }
      ]
    },
    {
      id: 2,
      name: "Home Allegiance",
      domain: "callhomeallegiance.com",
      status: "in-progress" as const,
      score: 64,
      created: new Date(2022, 10, 8),
      updated: new Date(2023, 3, 22),
      organicTraffic: {
        value: "432",
        change: "-7%",
        trend: [480, 475, 470, 465, 460, 455, 450, 445, 440, 435, 432, 432],
        history: generateHistoricalData(480, 432, 6)
      },
      organicKeywords: {
        value: "617",
        change: "+3.29%",
        trend: [580, 585, 590, 595, 600, 605, 610, 615, 617, 617, 617, 617],
        history: generateHistoricalData(580, 617, 6)
      },
      backlinks: {
        value: "131",
        change: "-1.5%",
        trend: [135, 134, 133, 132, 132, 132, 131, 131, 131, 131, 131, 131],
        history: generateHistoricalData(135, 131, 6)
      },
      keywords: generateKeywordData(12, "Home Allegiance"),
      competitors: generateCompetitors("callhomeallegiance.com"),
      analyses: [
        { id: 201, date: new Date(2022, 10, 8), score: 52, status: "completed" },
        { id: 202, date: new Date(2022, 11, 15), score: 55, status: "completed" },
        { id: 203, date: new Date(2023, 0, 12), score: 59, status: "completed" },
        { id: 204, date: new Date(2023, 1, 20), score: 62, status: "completed" },
        { id: 205, date: new Date(2023, 3, 22), score: 64, status: "completed" }
      ]
    },
    {
      id: 3,
      name: "Jay Dorco Services",
      domain: "jaydorco.com",
      status: "monitoring" as const,
      score: 59,
      created: new Date(2022, 8, 3),
      updated: new Date(2023, 2, 14),
      organicTraffic: {
        value: "654",
        change: "-9.92%",
        trend: [750, 740, 730, 720, 710, 700, 690, 680, 670, 660, 657, 654],
        history: generateHistoricalData(750, 654, 6)
      },
      organicKeywords: {
        value: "277",
        change: "-5.14%",
        trend: [300, 298, 295, 290, 285, 283, 280, 278, 278, 278, 277, 277],
        history: generateHistoricalData(300, 277, 6)
      },
      backlinks: {
        value: "1.8K",
        change: "-25.04%",
        trend: [2500, 2400, 2300, 2200, 2100, 2000, 1950, 1900, 1850, 1830, 1810, 1800],
        history: generateHistoricalData(2500, 1800, 6)
      },
      keywords: generateKeywordData(10, "Jay Dorco"),
      competitors: generateCompetitors("jaydorco.com"),
      analyses: [
        { id: 301, date: new Date(2022, 8, 3), score: 48, status: "completed" },
        { id: 302, date: new Date(2022, 9, 20), score: 52, status: "completed" },
        { id: 303, date: new Date(2022, 11, 8), score: 55, status: "completed" },
        { id: 304, date: new Date(2023, 0, 15), score: 57, status: "completed" },
        { id: 305, date: new Date(2023, 2, 14), score: 59, status: "completed" }
      ]
    },
    {
      id: 4,
      name: "Absolute Comfort Heating",
      domain: "absolutecomfort.co",
      status: "paused" as const,
      score: 45,
      created: new Date(2022, 5, 12),
      updated: new Date(2022, 11, 8),
      organicTraffic: {
        value: "321",
        change: "-8.2%",
        trend: generateTrendData(40, false, 4, 10),
        history: generateHistoricalData(360, 321, 6)
      },
      organicKeywords: {
        value: "512",
        change: "-5.3%",
        trend: generateTrendData(35, false, 3, 10),
        history: generateHistoricalData(550, 512, 6)
      },
      backlinks: {
        value: "184",
        change: "-2.1%",
        trend: generateTrendData(25, false, 2, 10),
        history: generateHistoricalData(190, 184, 6)
      },
      keywords: generateKeywordData(8, "Absolute Comfort"),
      competitors: generateCompetitors("absolutecomfort.co"),
      analyses: [
        { id: 401, date: new Date(2022, 5, 12), score: 40, status: "completed" },
        { id: 402, date: new Date(2022, 7, 22), score: 42, status: "completed" },
        { id: 403, date: new Date(2022, 9, 18), score: 44, status: "completed" },
        { id: 404, date: new Date(2022, 11, 8), score: 45, status: "completed" }
      ]
    },
    {
      id: 5,
      name: "Midwest Cooling Solutions",
      domain: "midwestcooling.com",
      status: "error" as const,
      score: 32,
      created: new Date(2023, 0, 5),
      updated: new Date(2023, 1, 20),
      organicTraffic: {
        value: "247",
        change: "-12.5%",
        trend: generateTrendData(30, false, 5, 10),
        history: generateHistoricalData(300, 247, 6)
      },
      organicKeywords: {
        value: "376",
        change: "-9.8%",
        trend: generateTrendData(25, false, 4, 10),
        history: generateHistoricalData(420, 376, 6)
      },
      backlinks: {
        value: "95",
        change: "-4.5%",
        trend: generateTrendData(20, false, 3, 10),
        history: generateHistoricalData(105, 95, 6)
      },
      keywords: generateKeywordData(6, "Midwest Cooling"),
      competitors: generateCompetitors("midwestcooling.com"),
      analyses: [
        { id: 501, date: new Date(2023, 0, 5), score: 28, status: "completed" },
        { id: 502, date: new Date(2023, 1, 20), score: 32, status: "completed" },
        { id: 503, date: new Date(2023, 3, 10), score: 0, status: "error" }
      ]
    }
  ];

  // Calculate the total stats from sample projects
  const totalProjects = sampleProjects.length;
  const totalAnalyses = totalProjects * 2; // Just for mock data
  const totalKeywords = sampleProjects.reduce((sum, project) => {
    const keywordValue = project.organicKeywords.value;
    const numericValue = typeof keywordValue === 'string' 
      ? parseInt(keywordValue.replace(/[^\d]/g, ''), 10) 
      : keywordValue;
    return sum + numericValue;
  }, 0);

  const filteredProjects = sampleProjects.filter(project => 
    project.name.toLowerCase().includes(filterValue.toLowerCase()) || 
    project.domain.toLowerCase().includes(filterValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Dashboard summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <h3 className="text-3xl font-bold mt-1">{totalProjects}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1 bg-gray-100 rounded-full">
              <div 
                className="h-1 bg-primary rounded-full" 
                style={{ width: `${Math.min(100, totalProjects * 5)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProjects} of 20 projects tracked
            </p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
              <h3 className="text-3xl font-bold mt-1">{totalAnalyses}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-green-50 p-2 rounded text-center">
              <p className="text-xs text-green-700 font-medium">Good</p>
              <p className="text-sm font-bold text-green-800">{Math.round(totalAnalyses * 0.6)}</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center">
              <p className="text-xs text-yellow-700 font-medium">Average</p>
              <p className="text-sm font-bold text-yellow-800">{Math.round(totalAnalyses * 0.3)}</p>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <p className="text-xs text-red-700 font-medium">Poor</p>
              <p className="text-sm font-bold text-red-800">{Math.round(totalAnalyses * 0.1)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tracked Keywords</p>
              <h3 className="text-3xl font-bold mt-1">{totalKeywords.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Change (30 days)</span>
              <span className="text-green-600 font-medium">+5.2%</span>
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={Array.from({ length: 30 }, (_, i) => ({ 
                    day: i, 
                    value: 4200 + Math.floor(Math.random() * 800) 
                  }))}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="keywordGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#keywordGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page header with controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary" 
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="flex items-center">
              <select className="mr-2 py-2 px-3 rounded-md border border-gray-300 text-sm">
                <option value="all">All Projects</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <select className="py-2 px-3 rounded-md border border-gray-300 text-sm">
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export
              </Button>
              <Button size="sm" className="whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Projects list */}
      {dashboardView === "grid" ? (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md"
            >
              <div className="p-4 sm:p-6">
                {/* Project header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{project.name}</span>
                        <span className="text-xs text-muted-foreground">{project.domain}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">AScore: {project.score}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge 
                      status={project.status} 
                      onClick={() => {
                        console.log(`Clicked status badge for ${project.name}`);
                      }}
                    />
                    <ProjectActionsMenu projectId={project.id} />
                  </div>
                </div>
                
                {/* Project metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Site Health</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-bold">{project.id === 1 ? '77%' : project.id === 2 ? '90%' : '85%'}</div>
                      <div className={`text-xs ${project.id === 1 ? 'text-muted-foreground' : project.id === 2 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                        {project.id === 1 ? '0%' : 
                          project.id === 2 ? 
                            <><ArrowUpRight className="h-3 w-3 mr-0.5" />+2%</> : 
                            <><ArrowDownRight className="h-3 w-3 mr-0.5" />-3%</>
                        }
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 my-1">
                      <div 
                        className="bg-primary h-1.5 rounded-full" 
                        style={{ 
                          width: project.id === 1 ? '77%' : project.id === 2 ? '90%' : '85%',
                          backgroundColor: project.id === 1 ? '#6366f1' : project.id === 2 ? '#10b981' : '#f59e0b'
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">Track keyword positions.</div>
                    <Button variant="outline" size="sm" className="h-7 mt-1 text-xs w-full sm:w-auto">Set up</Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Organic Traffic</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold">{project.organicTraffic.value}</div>
                        <div className={`text-xs ${project.organicTraffic.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {project.organicTraffic.change.startsWith('+') ? 
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          }
                          {project.organicTraffic.change}
                        </div>
                      </div>
                      <MiniChart 
                        data={project.organicTraffic.trend} 
                        isPositive={project.organicTraffic.change.startsWith('+')}
                        showTooltip={true}
                        tooltipFormatter={(value) => value.toLocaleString()}
                        unit=" visits"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Organic Keywords</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold">{project.organicKeywords.value}</div>
                        <div className={`text-xs ${project.organicKeywords.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {project.organicKeywords.change.startsWith('+') ? 
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          }
                          {project.organicKeywords.change}
                        </div>
                      </div>
                      <MiniChart 
                        data={project.organicKeywords.trend} 
                        isPositive={project.organicKeywords.change.startsWith('+')}
                        showTooltip={true}
                        tooltipFormatter={(value) => value.toLocaleString()}
                        unit=" keywords"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Backlinks</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold">{project.backlinks.value}</div>
                        <div className={`text-xs ${project.backlinks.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {project.backlinks.change.startsWith('+') ? 
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          }
                          {project.backlinks.change}
                        </div>
                      </div>
                      <MiniChart 
                        data={project.backlinks.trend} 
                        isPositive={project.backlinks.change.startsWith('+')}
                        showTooltip={true}
                        tooltipFormatter={(value) => value.toLocaleString()}
                        unit=" links"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <LineChart className="h-3.5 w-3.5 mr-1" />
                      View Analytics
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 mr-1">
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                      </svg>
                      Add Keyword
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Updated 2 days ago
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted/30">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Site
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    AScore
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Organic Traffic
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Organic Keywords
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Backlinks
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-xs text-muted-foreground">{project.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge 
                        status={project.status} 
                        onClick={() => {
                          console.log(`Clicked status badge for ${project.name} in table view`);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium">{project.score}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{project.organicTraffic.value}</div>
                        <div className={`text-xs ${project.organicTraffic.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {project.organicTraffic.change.startsWith('+') ? 
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          }
                          {project.organicTraffic.change}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{project.organicKeywords.value}</div>
                        <div className={`text-xs ${project.organicKeywords.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {project.organicKeywords.change.startsWith('+') ? 
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          }
                          {project.organicKeywords.change}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{project.backlinks.value}</div>
                        <div className={`text-xs ${project.backlinks.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {project.backlinks.change.startsWith('+') ? 
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          }
                          {project.backlinks.change}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          <LineChart className="h-3.5 w-3.5 mr-1" />
                          Analytics
                        </Button>
                        <ProjectActionsMenu projectId={project.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Add domain section */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-2">Domains for monitoring</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quickly see changes in key organic and paid traffic metrics and track the Authority Score of your competitors.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 lg:col-span-2">
            {/* Sample Domain Traffic Chart */}
            <div className="bg-muted/20 rounded-lg p-4 border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">domain.com</h4>
                <div className="text-sm text-muted-foreground">291.5M</div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: 'Jan', traffic: 240 },
                      { month: 'Feb', traffic: 230 },
                      { month: 'Mar', traffic: 245 },
                      { month: 'Apr', traffic: 260 },
                      { month: 'May', traffic: 255 },
                      { month: 'Jun', traffic: 270 },
                      { month: 'Jul', traffic: 290 },
                      { month: 'Aug', traffic: 280 },
                      { month: 'Sep', traffic: 300 },
                      { month: 'Oct', traffic: 310 },
                      { month: 'Nov', traffic: 305 },
                      { month: 'Dec', traffic: 320 },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 rounded shadow-md border text-xs">
                              <p>{`${payload[0].payload.month}: ${payload[0].value}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <defs>
                      <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="traffic" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fill="url(#trafficGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div>
            {/* Domain Input Form */}
            <div className="bg-muted/10 rounded-lg p-4 border border-gray-100 h-full">
              <h4 className="font-medium mb-3">Add new domain</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Enter domain name</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Country</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <Button className="w-full mt-2">
                  + Add domain
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}