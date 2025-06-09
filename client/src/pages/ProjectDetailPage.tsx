import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  LineChart, 
  ListChecks, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  PauseCircle,
  Globe,
  Search,
  Code,
  Layers,
  FileText,
  Share2,
  MapPin,
  MoreHorizontal
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

// Status badge component for reusability
type StatusType = "active" | "in-progress" | "monitoring" | "paused" | "error";

function StatusBadge({ status }: { status: StatusType }) {
  const statusConfig = {
    active: { 
      label: "Active", 
      className: "bg-green-100 hover:bg-green-200 text-green-800" 
    },
    "in-progress": { 
      label: "In Progress", 
      className: "bg-blue-100 hover:bg-blue-200 text-blue-800" 
    },
    monitoring: { 
      label: "Monitoring", 
      className: "bg-purple-100 hover:bg-purple-200 text-purple-800" 
    },
    paused: { 
      label: "Paused", 
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800" 
    },
    error: { 
      label: "Error", 
      className: "bg-red-100 hover:bg-red-200 text-red-800" 
    }
  };

  const icon = {
    active: <CheckCircle className="w-3 h-3 mr-1" />,
    "in-progress": <Clock className="w-3 h-3 mr-1" />,
    monitoring: <AlertCircle className="w-3 h-3 mr-1" />,
    paused: <PauseCircle className="w-3 h-3 mr-1" />,
    error: <AlertCircle className="w-3 h-3 mr-1" />
  };

  const config = statusConfig[status];

  return (
    <Badge className={`${config.className} flex items-center`} variant="outline">
      {icon[status]}
      {config.label}
    </Badge>
  );
}

// Metric Score Component
function MetricScore({ score, label, icon }: { score: number; label: string; icon: React.ReactNode }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    if (s >= 40) return "text-orange-500";
    return "text-red-600";
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="p-2 rounded-full bg-gray-100">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">{label}</h4>
        <div className="flex items-baseline mt-1">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs text-muted-foreground ml-1">/100</span>
        </div>
      </div>
    </div>
  );
}

// Historical Chart Component
function HistoricalDataChart({ data, dataKey = "value", name }: { data: any[]; dataKey?: string; name: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => {
              if (typeof date === 'string') return date;
              return new Date(date).toLocaleDateString('en-US', { month: 'short' });
            }}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value) => [`${value}`, name]}
            labelFormatter={(label) => {
              if (typeof label === 'string') return label;
              return new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }}
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke="#52bb7a" 
            strokeWidth={2} 
            dot={{ strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0, fill: "#52bb7a" }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mock data generator functions
const generateMonthlyData = (months: number, startVal: number, growth: number, volatility: number) => {
  const data = [];
  let current = startVal;
  const now = new Date();
  now.setDate(1); // First day of current month
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    
    // Add growth trend and volatility
    const randomFactor = (Math.random() - 0.5) * volatility;
    current = Math.max(0, current + (current * growth / 100) + (randomFactor * current / 100));
    
    data.push({
      date: date.getTime(),
      value: Math.round(current)
    });
  }
  
  return data;
};

// Mock data for projects
const MOCK_PROJECTS = {
  1: {
    id: 1,
    name: "Brody Pennell HVAC",
    domain: "brodypennell.com",
    status: "active" as StatusType,
    score: 79,
    created: new Date(2023, 1, 15),
    updated: new Date(2023, 4, 27),
    organicTraffic: {
      value: 8900,
      displayValue: "8.9K",
      change: "+58.95%",
      trend: [32, 38, 45, 52, 60, 72, 85, 98, 115, 130, 140, 150],
      history: generateMonthlyData(12, 5600, 4.5, 10)
    },
    organicKeywords: {
      value: 3600,
      displayValue: "3.6K",
      change: "+1.71%",
      trend: [3200, 3250, 3300, 3350, 3400, 3450, 3500, 3550, 3600, 3620, 3650, 3660],
      history: generateMonthlyData(12, 3200, 1.1, 5)
    },
    backlinks: {
      value: 3100,
      displayValue: "3.1K",
      change: "-10.6%",
      trend: [3800, 3750, 3700, 3650, 3600, 3550, 3500, 3450, 3400, 3350, 3300, 3100],
      history: generateMonthlyData(12, 3800, -2, 7)
    },
    seoScores: {
      onPage: 81,
      technical: 76,
      contentQuality: 82,
      userExperience: 84,
      mobileOptimization: 73
    },
    topKeywords: [
      { keyword: "hvac repair los angeles", position: 2, volume: 2400, difficulty: 68 },
      { keyword: "ac repair near me", position: 3, volume: 5800, difficulty: 72 },
      { keyword: "heating and cooling los angeles", position: 1, volume: 1900, difficulty: 65 },
      { keyword: "air conditioning installation", position: 4, volume: 3200, difficulty: 70 },
      { keyword: "furnace repair service", position: 3, volume: 1800, difficulty: 62 }
    ],
    competitors: [
      { domain: "serviceexperts.com", overlap: 42, traffic: 12500, keywords: 6700 },
      { domain: "airconditioningrepairla.com", overlap: 38, traffic: 7800, keywords: 4200 },
      { domain: "airandwater.com", overlap: 29, traffic: 9500, keywords: 5100 }
    ],
    analyses: [
      { id: 101, date: new Date(2023, 1, 15), score: 68, status: "completed" },
      { id: 102, date: new Date(2023, 2, 20), score: 72, status: "completed" },
      { id: 103, date: new Date(2023, 3, 18), score: 75, status: "completed" },
      { id: 104, date: new Date(2023, 4, 27), score: 79, status: "completed" }
    ]
  },
  2: {
    id: 2,
    name: "Home Allegiance",
    domain: "callhomeallegiance.com",
    status: "in-progress" as StatusType,
    score: 64,
    created: new Date(2022, 10, 8),
    updated: new Date(2023, 3, 22),
    organicTraffic: {
      value: 432,
      displayValue: "432",
      change: "-7%",
      trend: [480, 475, 470, 465, 460, 455, 450, 445, 440, 435, 432, 432],
      history: generateMonthlyData(12, 480, -0.8, 8)
    },
    organicKeywords: {
      value: 617,
      displayValue: "617",
      change: "+3.29%",
      trend: [580, 585, 590, 595, 600, 605, 610, 615, 617, 617, 617, 617],
      history: generateMonthlyData(12, 580, 1.2, 4)
    },
    backlinks: {
      value: 131,
      displayValue: "131",
      change: "-1.5%",
      trend: [135, 134, 133, 132, 132, 132, 131, 131, 131, 131, 131, 131],
      history: generateMonthlyData(12, 135, -0.3, 3)
    },
    seoScores: {
      onPage: 62,
      technical: 69,
      contentQuality: 58,
      userExperience: 66,
      mobileOptimization: 65
    },
    topKeywords: [
      { keyword: "hvac repair dallas", position: 8, volume: 1800, difficulty: 65 },
      { keyword: "air conditioning service dallas", position: 6, volume: 1200, difficulty: 58 },
      { keyword: "furnace replacement dallas", position: 5, volume: 580, difficulty: 52 },
      { keyword: "home ac repair", position: 12, volume: 2400, difficulty: 68 },
      { keyword: "24 hour emergency ac repair", position: 7, volume: 760, difficulty: 61 }
    ],
    competitors: [
      { domain: "dallascooling.com", overlap: 31, traffic: 6200, keywords: 3500 },
      { domain: "texascomfort.com", overlap: 28, traffic: 8700, keywords: 4800 },
      { domain: "abacusplumbing.com", overlap: 24, traffic: 7100, keywords: 3900 }
    ],
    analyses: [
      { id: 201, date: new Date(2022, 10, 8), score: 52, status: "completed" },
      { id: 202, date: new Date(2022, 11, 15), score: 55, status: "completed" },
      { id: 203, date: new Date(2023, 0, 12), score: 59, status: "completed" },
      { id: 204, date: new Date(2023, 1, 20), score: 62, status: "completed" },
      { id: 205, date: new Date(2023, 3, 22), score: 64, status: "completed" }
    ]
  },
  3: {
    id: 3,
    name: "Jay Dorco Services",
    domain: "jaydorco.com",
    status: "monitoring" as StatusType,
    score: 59,
    created: new Date(2022, 8, 3),
    updated: new Date(2023, 2, 14),
    organicTraffic: {
      value: 654,
      displayValue: "654",
      change: "-9.92%",
      trend: [750, 740, 730, 720, 710, 700, 690, 680, 670, 660, 657, 654],
      history: generateMonthlyData(12, 750, -1.5, 6)
    },
    organicKeywords: {
      value: 277,
      displayValue: "277",
      change: "-5.14%",
      trend: [300, 298, 295, 290, 285, 283, 280, 278, 278, 278, 277, 277],
      history: generateMonthlyData(12, 300, -0.9, 5)
    },
    backlinks: {
      value: 1800,
      displayValue: "1.8K",
      change: "-25.04%",
      trend: [2500, 2400, 2300, 2200, 2100, 2000, 1950, 1900, 1850, 1830, 1810, 1800],
      history: generateMonthlyData(12, 2500, -3, 8)
    },
    seoScores: {
      onPage: 58,
      technical: 55,
      contentQuality: 63,
      userExperience: 60,
      mobileOptimization: 59
    },
    topKeywords: [
      { keyword: "heating and cooling charlotte", position: 10, volume: 1400, difficulty: 62 },
      { keyword: "ac replacement cost", position: 9, volume: 1900, difficulty: 68 },
      { keyword: "commercial hvac charlotte", position: 6, volume: 520, difficulty: 54 },
      { keyword: "heat pump vs furnace", position: 14, volume: 2100, difficulty: 59 },
      { keyword: "best air conditioning brands", position: 11, volume: 3200, difficulty: 72 }
    ],
    competitors: [
      { domain: "charlottehvacpros.com", overlap: 35, traffic: 5900, keywords: 3100 },
      { domain: "morrisjenkins.com", overlap: 32, traffic: 7200, keywords: 3800 },
      { domain: "carolinacomfort.com", overlap: 28, traffic: 6500, keywords: 3400 }
    ],
    analyses: [
      { id: 301, date: new Date(2022, 8, 3), score: 48, status: "completed" },
      { id: 302, date: new Date(2022, 9, 20), score: 52, status: "completed" },
      { id: 303, date: new Date(2022, 11, 8), score: 55, status: "completed" },
      { id: 304, date: new Date(2023, 0, 15), score: 57, status: "completed" },
      { id: 305, date: new Date(2023, 2, 14), score: 59, status: "completed" }
    ]
  }
};

// Main Project Detail Page Component
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, we would fetch the project data from an API
    // For demonstration, we're using our mock data
    const projectId = parseInt(params.id, 10);
    
    if (MOCK_PROJECTS[projectId as keyof typeof MOCK_PROJECTS]) {
      setProject(MOCK_PROJECTS[projectId as keyof typeof MOCK_PROJECTS]);
    }
    
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => setLocation("/profile")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  // Format historical chart data
  const trafficHistory = project.organicTraffic.history.map((item: any) => ({
    ...item,
    name: 'Traffic'
  }));
  
  const keywordsHistory = project.organicKeywords.history.map((item: any) => ({
    ...item,
    name: 'Keywords'
  }));
  
  const backlinksHistory = project.backlinks.history.map((item: any) => ({
    ...item,
    name: 'Backlinks'
  }));
  
  // Generate SEO score history from analyses
  const scoreHistory = project.analyses.map((analysis: any) => ({
    date: analysis.date.getTime(),
    value: analysis.score,
    name: 'SEO Score'
  }));

  return (
    <div className="space-y-6">
      {/* Back button and project header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center mb-2">
            <button 
              onClick={() => setLocation("/profile")}
              className="mr-3 p-1.5 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Globe className="mr-1.5 h-4 w-4" />
            <a 
              href={`https://${project.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary flex items-center"
            >
              {project.domain}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="h-9">
            <LineChart className="mr-2 h-4 w-4" />
            Run Analysis
          </Button>
          <Button className="h-9 bg-[#52bb7a] hover:bg-[#43a067]">
            <ListChecks className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      </div>
      
      {/* Project summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">SEO Score</span>
            <div className="flex items-baseline mt-1">
              <span className="text-3xl font-bold mr-1">{project.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
              <div 
                className="h-1 bg-[#52bb7a] rounded-full" 
                style={{ width: `${project.score}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Organic Traffic</span>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-bold">{project.organicTraffic.displayValue}</span>
              <span className={`ml-2 text-xs flex items-center ${project.organicTraffic.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {project.organicTraffic.change.startsWith('+') ? 
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                }
                {project.organicTraffic.change}
              </span>
            </div>
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={project.organicTraffic.trend.map((value: number, index: number) => ({ index, value }))}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={project.organicTraffic.change.startsWith('+') ? "#38c173" : "#e3342f"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={project.organicTraffic.change.startsWith('+') ? "#38c173" : "#e3342f"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={project.organicTraffic.change.startsWith('+') ? "#38c173" : "#e3342f"} 
                    strokeWidth={1.5}
                    fill="url(#trafficGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Organic Keywords</span>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-bold">{project.organicKeywords.displayValue}</span>
              <span className={`ml-2 text-xs flex items-center ${project.organicKeywords.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {project.organicKeywords.change.startsWith('+') ? 
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                }
                {project.organicKeywords.change}
              </span>
            </div>
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={project.organicKeywords.trend.map((value: number, index: number) => ({ index, value }))}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="keywordsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={project.organicKeywords.change.startsWith('+') ? "#38c173" : "#e3342f"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={project.organicKeywords.change.startsWith('+') ? "#38c173" : "#e3342f"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={project.organicKeywords.change.startsWith('+') ? "#38c173" : "#e3342f"} 
                    strokeWidth={1.5}
                    fill="url(#keywordsGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Backlinks</span>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-bold">{project.backlinks.displayValue}</span>
              <span className={`ml-2 text-xs flex items-center ${project.backlinks.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {project.backlinks.change.startsWith('+') ? 
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                }
                {project.backlinks.change}
              </span>
            </div>
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={project.backlinks.trend.map((value: number, index: number) => ({ index, value }))}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="backlinksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={project.backlinks.change.startsWith('+') ? "#38c173" : "#e3342f"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={project.backlinks.change.startsWith('+') ? "#38c173" : "#e3342f"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={project.backlinks.change.startsWith('+') ? "#38c173" : "#e3342f"} 
                    strokeWidth={1.5}
                    fill="url(#backlinksGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO Scores</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Traffic History</h3>
              <HistoricalDataChart data={trafficHistory} name="Organic Traffic" />
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">SEO Score History</h3>
              <HistoricalDataChart data={scoreHistory} name="SEO Score" />
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">About This Project</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-muted-foreground mb-4">
                  {project.name} is an HVAC services company focusing on heating, ventilation, and air conditioning solutions for residential and commercial clients.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#e6f5ec] flex items-center justify-center mt-0.5 mr-2">
                      <CheckCircle className="w-3 h-3 text-[#52bb7a]" />
                    </div>
                    <div>
                      <h4 className="font-medium">Project created</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#e6f5ec] flex items-center justify-center mt-0.5 mr-2">
                      <CheckCircle className="w-3 h-3 text-[#52bb7a]" />
                    </div>
                    <div>
                      <h4 className="font-medium">Last analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.updated.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#e6f5ec] flex items-center justify-center mt-0.5 mr-2">
                      <CheckCircle className="w-3 h-3 text-[#52bb7a]" />
                    </div>
                    <div>
                      <h4 className="font-medium">Total analyses</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.analyses.length} analyses conducted
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <MetricScore score={project.seoScores.onPage} label="On-Page SEO" icon={<FileText className="h-5 w-5 text-blue-500" />} />
                <MetricScore score={project.seoScores.technical} label="Technical SEO" icon={<Code className="h-5 w-5 text-purple-500" />} />
                <MetricScore score={project.seoScores.contentQuality} label="Content Quality" icon={<FileText className="h-5 w-5 text-green-500" />} />
                <MetricScore score={project.seoScores.userExperience} label="User Experience" icon={<Layers className="h-5 w-5 text-orange-500" />} />
                <MetricScore score={project.seoScores.mobileOptimization} label="Mobile Optimization" icon={<Layers className="h-5 w-5 text-blue-500" />} />
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">SEO Score Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <h4 className="font-medium">On-Page SEO</h4>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${project.seoScores.onPage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{project.seoScores.onPage}/100</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">Technical SEO</h4>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-purple-500 rounded-full" 
                    style={{ width: `${project.seoScores.technical}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{project.seoScores.technical}/100</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">Content Quality</h4>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full" 
                    style={{ width: `${project.seoScores.contentQuality}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{project.seoScores.contentQuality}/100</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">User Experience</h4>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-orange-500 rounded-full" 
                    style={{ width: `${project.seoScores.userExperience}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{project.seoScores.userExperience}/100</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">Mobile Optimization</h4>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${project.seoScores.mobileOptimization}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{project.seoScores.mobileOptimization}/100</span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">SEO Score History</h3>
            <HistoricalDataChart data={scoreHistory} name="SEO Score" />
          </Card>
        </TabsContent>
        
        <TabsContent value="keywords" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Top Keywords</h3>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Research Keywords
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-sm text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left font-medium py-2 pl-2">Keyword</th>
                    <th className="text-center font-medium py-2">Position</th>
                    <th className="text-center font-medium py-2">Volume</th>
                    <th className="text-center font-medium py-2">Difficulty</th>
                    <th className="text-right font-medium py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.topKeywords.map((keyword: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 pl-2 font-medium">{keyword.keyword}</td>
                      <td className="py-3 text-center">{keyword.position}</td>
                      <td className="py-3 text-center">{keyword.volume.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                keyword.difficulty > 70 ? 'bg-red-500' : 
                                keyword.difficulty > 50 ? 'bg-orange-500' : 
                                keyword.difficulty > 30 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`} 
                              style={{ width: `${keyword.difficulty}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{keyword.difficulty}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" className="w-full">View All Keywords</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Keyword Performance</h3>
            <HistoricalDataChart data={keywordsHistory} name="Organic Keywords" />
          </Card>
        </TabsContent>
        
        <TabsContent value="competitors" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Competing Websites</h3>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Find Competitors
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-sm text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left font-medium py-2 pl-2">Website</th>
                    <th className="text-center font-medium py-2">Keyword Overlap</th>
                    <th className="text-center font-medium py-2">Traffic</th>
                    <th className="text-center font-medium py-2">Keywords</th>
                    <th className="text-right font-medium py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.competitors.map((competitor: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 pl-2">
                        <a 
                          href={`https://${competitor.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary flex items-center"
                        >
                          {competitor.domain}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${competitor.overlap * 2}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{competitor.overlap}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">{competitor.traffic.toLocaleString()}</td>
                      <td className="py-3 text-center">{competitor.keywords.toLocaleString()}</td>
                      <td className="py-3 pr-2 text-right">
                        <Button variant="ghost" size="sm" className="h-8">
                          Compare
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="analyses" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Analysis History</h3>
              <Button className="bg-[#52bb7a] hover:bg-[#43a067]">
                <LineChart className="mr-2 h-4 w-4" />
                Run New Analysis
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-sm text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left font-medium py-2 pl-2">Date</th>
                    <th className="text-center font-medium py-2">SEO Score</th>
                    <th className="text-center font-medium py-2">Status</th>
                    <th className="text-right font-medium py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.analyses.map((analysis: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 pl-2 font-medium">
                        {analysis.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                analysis.score > 70 ? 'bg-green-500' : 
                                analysis.score > 50 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`} 
                              style={{ width: `${analysis.score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{analysis.score}/100</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Badge className="bg-green-100 text-green-800" variant="outline">
                          {analysis.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}