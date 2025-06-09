import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { ProfileForm } from "@/components/features/auth/ProfileForm";
import { ChangePasswordForm } from "@/components/features/auth/ChangePasswordForm";
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
import { AuthDialog } from "@/components/features/auth/AuthDialog";
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
  tooltipFormatter = (value: number) => value.toString(),
  unit = ""
}: MiniChartProps) {
  return (
    <div className="h-12 w-20 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((value, index) => ({ value, index }))}>
          <defs>
            <linearGradient id={`miniGradient-${isPositive ? 'positive' : 'negative'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            fillOpacity={1}
            fill={`url(#miniGradient-${isPositive ? 'positive' : 'negative'})`}
            strokeWidth={1.5}
          />
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p>{tooltipFormatter(payload[0].value as number)}{unit}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Analysis {
  id: string;
  url: string;
  score: number;
  created_at: string;
  status: string;
}

function UserAnalysesList() {
  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ['/api/user/analyses'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const mockAnalyses = [
    {
      id: '1',
      url: 'example.com',
      score: 85,
      created_at: new Date().toISOString(),
      status: 'completed'
    },
    {
      id: '2', 
      url: 'demo-site.com',
      score: 72,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed'
    }
  ];

  const analysesToShow = analyses && analyses.length > 0 ? analyses : mockAnalyses;

  return (
    <div className="space-y-4">
      {analysesToShow.map((analysis: Analysis) => (
        <Card key={analysis.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{analysis.url}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(analysis.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{analysis.score}</div>
                  <div className="text-xs text-muted-foreground">SEO Score</div>
                </div>
                <Link href={`/results?url=${encodeURIComponent(analysis.url)}`}>
                  <Button variant="outline" size="sm">
                    View Results
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserProjectsList() {
  const [projects] = useState([
    {
      id: 1,
      name: "Main Website",
      domain: "example.com",
      status: "Active",
      lastAnalyzed: "2025-01-08",
      score: 85,
      trend: [78, 81, 83, 85],
      keywords: 24,
      backlinks: 156,
      pageViews: 12500
    },
    {
      id: 2,
      name: "Blog",
      domain: "blog.example.com", 
      status: "Active",
      lastAnalyzed: "2025-01-07",
      score: 72,
      trend: [68, 70, 71, 72],
      keywords: 18,
      backlinks: 89,
      pageViews: 8300
    }
  ]);

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-muted-foreground">{project.domain}</p>
              </div>
              <Badge variant={project.status === "Active" ? "default" : "secondary"}>
                {project.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{project.score}</div>
                <div className="text-xs text-muted-foreground">SEO Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{project.keywords}</div>
                <div className="text-xs text-muted-foreground">Keywords</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{project.backlinks}</div>
                <div className="text-xs text-muted-foreground">Backlinks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{project.pageViews.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Page Views</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Last analyzed:</span>
                <span className="text-sm">{project.lastAnalyzed}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MiniChart data={project.trend} isPositive={true} />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProfilePage(props: { params?: { tab?: string } }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(props.params?.tab || "projects");
  const [location, setLocation] = useLocation();

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
              <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
              <CardDescription>
                Please log in to access your profile and manage your account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <AuthDialog />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={(user as any)?.avatar} alt={(user as any)?.name || 'User'} />
            <AvatarFallback>
              <UserCircle2 className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{(user as any)?.name || 'Welcome'}</h1>
            <p className="text-muted-foreground">{(user as any)?.email}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center space-x-2">
            <LineChart className="h-4 w-4" />
            <span>Projects</span>
          </TabsTrigger>
          <TabsTrigger value="analyses" className="flex items-center space-x-2">
            <ListChecks className="h-4 w-4" />
            <span>Analyses</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <UserCog className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <KeyRound className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Projects</h2>
            <Button>
              <FileImport className="mr-2 h-4 w-4" />
              Import Existing Data
            </Button>
          </div>
          <UserProjectsList />
        </TabsContent>

        <TabsContent value="analyses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Analyses</h2>
          </div>
          <UserAnalysesList />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Profile Settings</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Security Settings</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Keep your account secure by using a strong password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}