import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users, 
  Search,
  FileText,
  Download,
  Eye,
  BarChart3,
  PieChart,
  ArrowUp
} from "lucide-react";
import { ChartExport } from "@/components/ui/chart-export";
import { useRef } from "react";

interface ClientPresentationPageProps {
  auditId?: string;
}

export default function ClientPresentationPage({ auditId }: ClientPresentationPageProps) {
  const [businessType, setBusinessType] = useState("local-service");
  const [monthlyRevenue, setMonthlyRevenue] = useState("50000");
  const [avgOrderValue, setAvgOrderValue] = useState("500");
  
  const executiveSummaryRef = useRef<HTMLDivElement>(null);
  const roiCalculatorRef = useRef<HTMLDivElement>(null);
  const competitiveAnalysisRef = useRef<HTMLDivElement>(null);

  // Get audit data if auditId is provided
  const { data: audit } = useQuery({
    queryKey: ["/api/rival-audit", auditId],
    enabled: !!auditId,
  });

  // Calculate ROI projections based on audit findings
  const calculateROIProjections = () => {
    if (!audit) return null;
    
    const currentRevenue = parseInt(monthlyRevenue);
    const avgOrder = parseInt(avgOrderValue);
    
    // SEO improvement estimates based on audit issues
    const seoImprovements = {
      organicTrafficIncrease: Math.max(15, Math.min(150, audit.summary.ofiCount * 2)), // 15-150% increase
      conversionRateImprovement: Math.max(5, Math.min(25, audit.summary.priorityOfiCount * 3)), // 5-25% improvement
      averageOrderValueIncrease: Math.max(2, Math.min(15, audit.summary.ofiCount * 1.5)), // 2-15% increase
    };
    
    const projectedMonthlyRevenue = currentRevenue * 
      (1 + seoImprovements.organicTrafficIncrease / 100) *
      (1 + seoImprovements.conversionRateImprovement / 100) *
      (1 + seoImprovements.averageOrderValueIncrease / 100);
    
    const monthlyIncrease = projectedMonthlyRevenue - currentRevenue;
    const annualIncrease = monthlyIncrease * 12;
    
    return {
      ...seoImprovements,
      currentRevenue,
      projectedMonthlyRevenue,
      monthlyIncrease,
      annualIncrease,
      roiMultiplier: annualIncrease / (avgOrder * 12) // Assuming 12 months of SEO investment
    };
  };

  const roiData = calculateROIProjections();

  const priorityOpportunities = audit ? [
    {
      category: "On-Page SEO",
      issues: audit.categories.find(c => c.name === "On-Page")?.issues?.length || 0,
      impact: "High",
      projectedRevenue: roiData ? Math.round(roiData.annualIncrease * 0.4) : 0,
      timeframe: "2-3 months"
    },
    {
      category: "Technical SEO", 
      issues: audit.categories.find(c => c.name === "Structure")?.issues?.length || 0,
      impact: "Critical",
      projectedRevenue: roiData ? Math.round(roiData.annualIncrease * 0.3) : 0,
      timeframe: "1-2 months"
    },
    {
      category: "Local SEO",
      issues: audit.categories.find(c => c.name === "Service Areas")?.issues?.length || 0,
      impact: "High",
      projectedRevenue: roiData ? Math.round(roiData.annualIncrease * 0.3) : 0,
      timeframe: "2-4 months"
    }
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Client Presentation Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Transform SEO audit findings into compelling sales presentations
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Sales Tools
        </Badge>
      </div>

      {!audit && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                Select a completed audit to generate client presentation materials
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="executive-summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executive-summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="roi-calculator">ROI Calculator</TabsTrigger>
          <TabsTrigger value="competitive-analysis">Competitive Edge</TabsTrigger>
          <TabsTrigger value="presentation-tools">Export Tools</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="executive-summary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Executive Summary</span>
                </CardTitle>
                <CardDescription>
                  High-level business impact overview for decision makers
                </CardDescription>
              </div>
              <ChartExport 
                chartRef={executiveSummaryRef}
                filename="executive-seo-summary"
                title="Export Executive Summary"
                size="sm"
              />
            </CardHeader>
            <CardContent ref={executiveSummaryRef}>
              {audit && roiData ? (
                <div className="space-y-6">
                  {/* Business Impact Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold text-green-700">
                              ${roiData.annualIncrease.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600">Projected Annual Revenue Increase</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold text-blue-700">
                              {roiData.organicTrafficIncrease}%
                            </p>
                            <p className="text-sm text-blue-600">Organic Traffic Growth</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <Target className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold text-purple-700">
                              {audit.summary.ofiCount + audit.summary.priorityOfiCount}
                            </p>
                            <p className="text-sm text-purple-600">SEO Opportunities Identified</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Priority Opportunities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Priority Revenue Opportunities</h3>
                    <div className="space-y-3">
                      {priorityOpportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Badge variant={opportunity.impact === "Critical" ? "destructive" : "default"}>
                              {opportunity.impact}
                            </Badge>
                            <div>
                              <p className="font-medium">{opportunity.category}</p>
                              <p className="text-sm text-gray-600">{opportunity.issues} issues found</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              +${opportunity.projectedRevenue.toLocaleString()}/year
                            </p>
                            <p className="text-sm text-gray-600">{opportunity.timeframe}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investment vs Return */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Investment vs. Return Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Current Monthly Revenue</p>
                        <p className="text-2xl font-bold">${roiData.currentRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Projected Monthly Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${Math.round(roiData.projectedMonthlyRevenue).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded border">
                      <p className="text-sm text-gray-600 mb-1">Monthly Revenue Increase</p>
                      <p className="text-xl font-bold text-green-600">
                        +${Math.round(roiData.monthlyIncrease).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select an audit to generate executive summary</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Calculator Tab */}
        <TabsContent value="roi-calculator">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>ROI Calculator</span>
                </CardTitle>
                <CardDescription>
                  Calculate projected revenue impact from SEO improvements
                </CardDescription>
              </div>
              <ChartExport 
                chartRef={roiCalculatorRef}
                filename="seo-roi-calculator"
                title="Export ROI Analysis"
                size="sm"
              />
            </CardHeader>
            <CardContent ref={roiCalculatorRef}>
              <div className="space-y-6">
                {/* Business Input Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="business-type">Business Type</Label>
                    <select 
                      id="business-type"
                      className="w-full mt-1 p-2 border rounded"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      <option value="local-service">Local Service Business</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="saas">SaaS/Software</option>
                      <option value="professional">Professional Services</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="monthly-revenue">Current Monthly Revenue</Label>
                    <Input
                      id="monthly-revenue"
                      type="number"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="avg-order">Average Order Value</Label>
                    <Input
                      id="avg-order"
                      type="number"
                      value={avgOrderValue}
                      onChange={(e) => setAvgOrderValue(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>

                {audit && roiData && (
                  <>
                    <Separator />
                    
                    {/* ROI Projections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-4 text-green-800">Revenue Growth Projection</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm">Organic Traffic Increase:</span>
                              <span className="font-bold text-green-700">+{roiData.organicTrafficIncrease}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Conversion Rate Improvement:</span>
                              <span className="font-bold text-green-700">+{roiData.conversionRateImprovement}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Avg Order Value Increase:</span>
                              <span className="font-bold text-green-700">+{roiData.averageOrderValueIncrease}%</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg">
                              <span className="font-semibold">Annual Revenue Increase:</span>
                              <span className="font-bold text-green-700">
                                ${roiData.annualIncrease.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-4 text-blue-800">Investment Analysis</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm">Current Monthly Revenue:</span>
                              <span className="font-bold">${roiData.currentRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Projected Monthly Revenue:</span>
                              <span className="font-bold text-blue-700">
                                ${Math.round(roiData.projectedMonthlyRevenue).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Monthly Increase:</span>
                              <span className="font-bold text-blue-700">
                                +${Math.round(roiData.monthlyIncrease).toLocaleString()}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg">
                              <span className="font-semibold">ROI Multiplier:</span>
                              <span className="font-bold text-blue-700">
                                {roiData.roiMultiplier.toFixed(1)}x
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Timeline and Milestones */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Implementation Timeline & Milestones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                            <div className="flex-1">
                              <p className="font-medium">Technical SEO Foundation (Month 1-2)</p>
                              <p className="text-sm text-gray-600">
                                Fix critical technical issues, improve site speed, mobile optimization
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                +${Math.round(roiData.annualIncrease * 0.2).toLocaleString()}/year
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-green-50 rounded">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                            <div className="flex-1">
                              <p className="font-medium">Content & On-Page Optimization (Month 2-4)</p>
                              <p className="text-sm text-gray-600">
                                Optimize existing pages, improve content strategy, keyword targeting
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                +${Math.round(roiData.annualIncrease * 0.4).toLocaleString()}/year
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                            <div className="flex-1">
                              <p className="font-medium">Local SEO & Authority Building (Month 3-6)</p>
                              <p className="text-sm text-gray-600">
                                Local listings, review management, link building, ongoing optimization
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                +${Math.round(roiData.annualIncrease * 0.4).toLocaleString()}/year
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Analysis Tab */}
        <TabsContent value="competitive-analysis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Competitive SEO Analysis</span>
                </CardTitle>
                <CardDescription>
                  Show clients where they're losing to competitors
                </CardDescription>
              </div>
              <ChartExport 
                chartRef={competitiveAnalysisRef}
                filename="competitive-seo-analysis"
                title="Export Competitive Analysis"
                size="sm"
              />
            </CardHeader>
            <CardContent ref={competitiveAnalysisRef}>
              {audit ? (
                <div className="space-y-6">
                  {/* Competitive Gaps Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-red-600">
                            {audit.summary.priorityOfiCount}
                          </p>
                          <p className="text-sm text-red-700">Critical Gaps vs Competitors</p>
                          <p className="text-xs text-red-600 mt-1">Immediate attention needed</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-orange-600">
                            {audit.summary.ofiCount}
                          </p>
                          <p className="text-sm text-orange-700">Optimization Opportunities</p>
                          <p className="text-xs text-orange-600 mt-1">Competitive advantages</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {audit.summary.okCount}
                          </p>
                          <p className="text-sm text-green-700">Competitive Strengths</p>
                          <p className="text-xs text-green-600 mt-1">Already optimized</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Market Share Analysis */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle>Market Share Opportunity</CardTitle>
                      <CardDescription>
                        Estimated market share you're losing to competitors due to SEO gaps
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Competitive Disadvantages</h4>
                          <div className="space-y-3">
                            {audit.categories.slice(0, 3).map((category, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                                <div>
                                  <p className="font-medium">{category.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {category.issues?.length || 0} issues found
                                  </p>
                                </div>
                                <Badge variant="destructive">
                                  -{Math.min(25, (category.issues?.length || 0) * 3)}% traffic
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-3">Opportunity Value</h4>
                          <div className="space-y-3">
                            <div className="p-4 bg-white rounded border">
                              <p className="text-sm text-gray-600">Estimated Monthly Traffic Loss</p>
                              <p className="text-2xl font-bold text-red-600">
                                -{Math.round((audit.summary.ofiCount + audit.summary.priorityOfiCount) * 125).toLocaleString()} visitors
                              </p>
                            </div>
                            <div className="p-4 bg-white rounded border">
                              <p className="text-sm text-gray-600">Estimated Revenue Loss</p>
                              <p className="text-2xl font-bold text-red-600">
                                -${Math.round(parseInt(monthlyRevenue) * 0.3).toLocaleString()}/month
                              </p>
                            </div>
                            <div className="p-4 bg-green-100 rounded border border-green-200">
                              <p className="text-sm text-green-700">Recovery Potential</p>
                              <p className="text-2xl font-bold text-green-700">
                                +${Math.round(parseInt(monthlyRevenue) * 0.45).toLocaleString()}/month
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Competitive Recovery Action Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4 p-4 border rounded">
                          <ArrowUp className="h-6 w-6 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold">Immediate Wins (0-30 days)</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Fix critical technical issues that are giving competitors an advantage
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">Page Speed</Badge>
                              <Badge variant="outline">Mobile Optimization</Badge>
                              <Badge variant="outline">Title Tags</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+15% traffic</p>
                            <p className="text-sm text-gray-600">Expected increase</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4 p-4 border rounded">
                          <Target className="h-6 w-6 text-green-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold">Strategic Improvements (1-3 months)</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Comprehensive optimization to match and exceed competitor performance
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">Content Optimization</Badge>
                              <Badge variant="outline">Local SEO</Badge>
                              <Badge variant="outline">Schema Markup</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+35% traffic</p>
                            <p className="text-sm text-gray-600">Expected increase</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4 p-4 border rounded">
                          <TrendingUp className="h-6 w-6 text-purple-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold">Market Leadership (3-6 months)</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Advanced strategies to dominate your market and outrank all competitors
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">Authority Building</Badge>
                              <Badge variant="outline">Advanced Content</Badge>
                              <Badge variant="outline">Technical Excellence</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+60% traffic</p>
                            <p className="text-sm text-gray-600">Expected increase</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select an audit to view competitive analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presentation Tools Tab */}
        <TabsContent value="presentation-tools">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Export & Presentation Tools</span>
              </CardTitle>
              <CardDescription>
                Professional export options for client presentations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Executive Summary Package</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Complete business impact overview with ROI projections and competitive analysis
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" disabled={!audit}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Executive Summary
                      </Button>
                      <Button variant="outline" className="w-full" disabled={!audit}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Proposal
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">White-label Reports</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Professional branded reports with your company logo and colors
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" disabled={!audit}>
                        <Download className="h-4 w-4 mr-2" />
                        Custom Branded Report
                      </Button>
                      <Button variant="outline" className="w-full" disabled={!audit}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Presentation Slides</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Ready-to-use PowerPoint slides for client meetings
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" disabled={!audit}>
                        <Download className="h-4 w-4 mr-2" />
                        PowerPoint Template
                      </Button>
                      <Button variant="outline" className="w-full" disabled={!audit}>
                        <PieChart className="h-4 w-4 mr-2" />
                        Chart Pack
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Client Portal Access</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Shareable link for clients to explore their audit results
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" disabled={!audit}>
                        <Users className="h-4 w-4 mr-2" />
                        Generate Client Link
                      </Button>
                      <Button variant="outline" className="w-full" disabled={!audit}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {audit && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Ready for Presentation!</h3>
                  <p className="text-sm text-green-700">
                    All presentation materials are ready to export for this audit. Use these tools to create 
                    compelling sales presentations that show clear business value and ROI projections.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}