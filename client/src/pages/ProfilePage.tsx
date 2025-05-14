import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserCircle2, KeyRound, ListChecks, LineChart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { AuthDialog } from "@/components/auth/AuthDialog";

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
        <div className="max-w-md w-full text-center">
          <UserCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-3xl font-extrabold">Sign in to your account</h2>
          <p className="mt-2 text-lg text-muted-foreground mb-8">
            Please sign in to access your profile and manage your SEO projects
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthDialog 
              mode="login" 
              buttonProps={{ size: "lg" }} 
              buttonText="Login"
            />
            <AuthDialog 
              mode="register" 
              buttonProps={{ variant: "outline", size: "lg" }} 
              buttonText="Create an account"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <header className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your profile and SEO analysis settings
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow">
          <Tabs defaultValue="profile" className="w-full" value={activeTab} onValueChange={handleTabChange}>
            <div className="sm:hidden px-4 py-3 border-b">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-muted-foreground/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
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
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="py-4 px-1 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <KeyRound className="h-5 w-5 mr-2" />
                    Password
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
                <div className="bg-card rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">My Analyses</h2>
                  <p className="text-muted-foreground mb-6">
                    View and manage all your previous SEO analyses.
                  </p>
                  <UserAnalysesList />
                </div>
              </TabsContent>
              <TabsContent value="projects" className="mt-0">
                <div className="bg-card rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">My Projects</h2>
                  <p className="text-muted-foreground mb-6">
                    View and manage all your SEO projects.
                  </p>
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

// Placeholder components for Analyses and Projects
function UserAnalysesList() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">
        You don't have any saved analyses yet. Analyze a URL to get started.
      </p>
      <Button asChild>
        <Link href="/">Analyze New URL</Link>
      </Button>
    </div>
  );
}

function UserProjectsList() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">
        You don't have any projects yet. Create a project to organize your analyses.
      </p>
      <Button variant="outline">Create Project</Button>
    </div>
  );
}