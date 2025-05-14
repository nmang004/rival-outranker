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
  BarChart3 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage(props: { params?: { tab?: string } }) {
  const { isAuthenticated, user, isLoadingUser } = useAuth();
  const [activeTab, setActiveTab] = useState(props.params?.tab || "profile");
  const [location, setLocation] = useLocation();
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/profile/${tab}`, { replace: true });
  };

  if (isLoadingUser) {
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
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={`${user.firstName || ''} ${user.lastName || ''}`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="h-12 w-12 text-primary/50" />
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <h2 className="text-2xl font-bold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username}
                </h2>
                <p className="text-muted-foreground">
                  {user.email}
                  {user.isEmailVerified && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                      Verified
                    </Badge>
                  )}
                </p>
                {(user.company || user.jobTitle) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.jobTitle && <span>{user.jobTitle}</span>}
                    {user.jobTitle && user.company && <span> at </span>}
                    {user.company && <span className="font-medium">{user.company}</span>}
                  </p>
                )}
                {user.bio && (
                  <p className="mt-3 text-sm">{user.bio}</p>
                )}
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
                <option value="profile">Profile</option>
                <option value="security">Password</option>
                <option value="analyses">My Analyses</option>
                <option value="projects">My Projects</option>
              </select>
            </div>
            <div className="hidden sm:block border-b">
              <div className="px-6">
                <TabsList className="h-14 bg-transparent space-x-8 -mb-px">
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
                  <TabsTrigger
                    value="analyses"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <LineChart className="h-5 w-5 mr-2" />
                    My Analyses
                  </TabsTrigger>
                  <TabsTrigger
                    value="projects"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <ListChecks className="h-5 w-5 mr-2" />
                    My Projects
                  </TabsTrigger>
                </TabsList>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-muted">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No projects yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Projects help you organize multiple analyses for easier tracking and comparison.
        </p>
        <Button variant="outline">
          <ListChecks className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* This would be populated with actual projects */}
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted/30 p-4 rounded-lg border border-muted hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium">Project {i}</h3>
                <Badge variant="outline" className="text-xs">
                  {i === 1 ? '3 analyses' : '2 analyses'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {i === 1 
                  ? 'Tracking SEO progress for example.com and related sites' 
                  : 'Competitive analysis for business sector'
                }
              </p>
              <div className="mt-4 pt-3 border-t border-muted flex justify-between">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                  Last updated: May {i + 5}, 2025
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}