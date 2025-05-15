import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ListChecks, 
  BarChart3, 
  TrendingUp,
  Search,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  PauseCircle,
  LayoutGrid,
  List,
  HelpCircle,
  MoreHorizontal
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer
} from "recharts";

// Status badge component
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

// Mini Chart Component for displaying trends
function MiniChart({ data, isPositive }: { data: number[], isPositive: boolean }) {
  const color = isPositive ? "#38c173" : "#e3342f";
  
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data.map((value, index) => ({ index, value }))}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5}
            fill={`url(#gradient-${isPositive ? 'up' : 'down'})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: any }) {
  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg mb-1">{project.name}</h3>
            <a 
              href={`https://${project.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground flex items-center hover:text-primary"
            >
              {project.domain}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>
      
      <div className="p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm mb-1">SEO Score</div>
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">{project.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="h-9 w-9 rounded-full border flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {project.analyses?.length || 0}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Traffic</div>
            <div className="text-sm font-medium flex items-center mb-1">
              {project.organicTraffic.value}
              <span className={`ml-1 text-xs flex items-center ${project.organicTraffic.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {project.organicTraffic.change.startsWith('+') ? 
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                }
                {project.organicTraffic.change}
              </span>
            </div>
            <MiniChart 
              data={project.organicTraffic.trend} 
              isPositive={project.organicTraffic.change.startsWith('+')} 
            />
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Keywords</div>
            <div className="text-sm font-medium flex items-center mb-1">
              {project.organicKeywords.value}
              <span className={`ml-1 text-xs flex items-center ${project.organicKeywords.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {project.organicKeywords.change.startsWith('+') ? 
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                }
                {project.organicKeywords.change}
              </span>
            </div>
            <MiniChart 
              data={project.organicKeywords.trend} 
              isPositive={project.organicKeywords.change.startsWith('+')} 
            />
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Backlinks</div>
            <div className="text-sm font-medium flex items-center mb-1">
              {project.backlinks.value}
              <span className={`ml-1 text-xs flex items-center ${project.backlinks.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {project.backlinks.change.startsWith('+') ? 
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                }
                {project.backlinks.change}
              </span>
            </div>
            <MiniChart 
              data={project.backlinks.trend} 
              isPositive={project.backlinks.change.startsWith('+')} 
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Last updated: {project.updated.toLocaleDateString()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7"
            onClick={() => window.location.href = `/project/${project.id}`}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Project Table Row
function ProjectTableRow({ project }: { project: any }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 pl-4">
        <div>
          <div className="font-medium">{project.name}</div>
          <a 
            href={`https://${project.domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground flex items-center hover:text-primary"
          >
            {project.domain}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </td>
      <td className="py-3 px-2">
        <StatusBadge status={project.status} />
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center">
          <span className="text-lg font-bold mr-1">{project.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="flex flex-col">
          <div className="text-sm font-medium flex items-center">
            {project.organicTraffic.value}
            <span className={`ml-1 text-xs flex items-center ${project.organicTraffic.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {project.organicTraffic.change}
            </span>
          </div>
          <div className="w-24">
            <MiniChart 
              data={project.organicTraffic.trend.slice(-6)} 
              isPositive={project.organicTraffic.change.startsWith('+')} 
            />
          </div>
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="flex flex-col">
          <div className="text-sm font-medium flex items-center">
            {project.organicKeywords.value}
            <span className={`ml-1 text-xs flex items-center ${project.organicKeywords.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {project.organicKeywords.change}
            </span>
          </div>
          <div className="w-24">
            <MiniChart 
              data={project.organicKeywords.trend.slice(-6)} 
              isPositive={project.organicKeywords.change.startsWith('+')} 
            />
          </div>
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="text-xs text-muted-foreground">
          {project.updated.toLocaleDateString()}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 mr-1"
            onClick={() => window.location.href = `/project/${project.id}`}
          >
            View Details
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Main Profile Page Component
export default function ProfilePageMock() {
  const [dashboardView, setDashboardView] = useState<"grid" | "table">("grid");
  const [filterValue, setFilterValue] = useState("");
  
  // Helper functions for generating realistic mock data
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
  
  // Sample project data
  const sampleProjects = [
    {
      id: 1,
      name: "Brody Pennell HVAC",
      domain: "brodypennell.com",
      status: "active" as StatusType,
      score: 79,
      created: new Date(2023, 1, 15),
      updated: new Date(2023, 4, 27),
      organicTraffic: {
        value: "8.9K",
        change: "+58.95%",
        trend: [32, 38, 45, 52, 60, 72, 85, 98, 115, 130, 140, 150],
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
      status: "in-progress" as StatusType,
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
      status: "monitoring" as StatusType,
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
      analyses: [
        { id: 301, date: new Date(2022, 8, 3), score: 48, status: "completed" },
        { id: 302, date: new Date(2022, 9, 20), score: 52, status: "completed" },
        { id: 303, date: new Date(2022, 11, 8), score: 55, status: "completed" },
        { id: 304, date: new Date(2023, 0, 15), score: 57, status: "completed" },
        { id: 305, date: new Date(2023, 2, 14), score: 59, status: "completed" }
      ]
    }
  ];

  // Calculate totals
  const totalProjects = sampleProjects.length;
  const totalAnalyses = sampleProjects.reduce((sum, project) => {
    return sum + (project.analyses?.length || 0);
  }, 0);
  const totalKeywords = sampleProjects.reduce((sum, project) => {
    const keywordValue = project.organicKeywords.value;
    const numericValue = typeof keywordValue === 'string' 
      ? parseInt(keywordValue.replace(/[^\d]/g, ''), 10) 
      : keywordValue;
    return sum + numericValue;
  }, 0);
  
  // Filter projects based on search input
  const filteredProjects = sampleProjects.filter(project => 
    project.name.toLowerCase().includes(filterValue.toLowerCase()) || 
    project.domain.toLowerCase().includes(filterValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">My Projects</h2>
          <p className="text-sm text-muted-foreground">View and manage all your SEO projects.</p>
        </div>
        <Button className="bg-[#52bb7a] hover:bg-[#43a067]">
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
              <h3 className="text-3xl font-bold mt-1">{totalProjects}</h3>
            </div>
            <div className="p-2 bg-[#e6f5ec] rounded-full">
              <ListChecks className="h-5 w-5 text-[#52bb7a]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1 bg-gray-100 rounded-full">
              <div 
                className="h-1 bg-[#52bb7a] rounded-full" 
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
            <div className="p-2 bg-[#e1f0ff] rounded-full">
              <BarChart3 className="h-5 w-5 text-[#3694ff]" />
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
            <div className="p-2 bg-[#e9f9ee] rounded-full">
              <TrendingUp className="h-5 w-5 text-[#38c173]" />
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
                      <stop offset="5%" stopColor="#38c173" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38c173" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#38c173" 
                    strokeWidth={2}
                    fill="url(#keywordGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and filter controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search 
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#52bb7a]" 
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="flex items-center gap-2">
              <select className="py-2 px-3 rounded-md border border-gray-300 text-sm">
                <option value="all">All Projects</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <select className="py-2 px-3 rounded-md border border-gray-300 text-sm">
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="score">Sort by Score</option>
              </select>
              <div className="flex bg-muted rounded-md p-0.5">
                <Button 
                  size="sm" 
                  variant={dashboardView === "grid" ? "default" : "ghost"} 
                  className="rounded-sm h-8 px-2.5"
                  onClick={() => setDashboardView("grid")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button 
                  size="sm" 
                  variant={dashboardView === "table" ? "default" : "ghost"} 
                  className="rounded-sm h-8 px-2.5"
                  onClick={() => setDashboardView("table")}
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Projects display - conditional based on view type */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
          <div className="bg-gray-100 p-3 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-[#52bb7a] hover:bg-[#43a067]">
              <ListChecks className="mr-2 h-4 w-4" />
              Create Project
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Existing Data
            </Button>
          </div>
        </div>
      ) : dashboardView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-muted-foreground">
              <tr>
                <th className="py-3 pl-4 text-left font-medium">PROJECT</th>
                <th className="py-3 px-2 text-left font-medium">STATUS</th>
                <th className="py-3 px-2 text-left font-medium">SCORE</th>
                <th className="py-3 px-2 text-left font-medium">TRAFFIC</th>
                <th className="py-3 px-2 text-left font-medium">KEYWORDS</th>
                <th className="py-3 px-2 text-left font-medium">UPDATED</th>
                <th className="py-3 pr-4 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <ProjectTableRow key={project.id} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Empty state - only shown if no projects */}
      {sampleProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
          <div className="bg-gray-100 p-3 rounded-full mb-4">
            <ListChecks className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Projects help you organize multiple websites for easier tracking
            and comparison of SEO metrics.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-[#52bb7a] hover:bg-[#43a067]">
              <ListChecks className="mr-2 h-4 w-4" />
              Create Project
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Existing Data
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}