import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Globe, Search, Tag } from "lucide-react";
import KeywordTab from "./KeywordTab";
import MetaTagsTab from "./MetaTagsTab";
import ContentTab from "./ContentTab";
import TechnicalTab from "./TechnicalTab";
import UXTab from "./UXTab";
import CompetitorAnalysis from "./CompetitorAnalysis";
import DeepContentAnalysis from "./DeepContentAnalysis";
import { SeoAnalysisResult } from "@shared/schema";

interface AssessmentTabsProps {
  data: SeoAnalysisResult;
}

export default function AssessmentTabs({ data }: AssessmentTabsProps) {
  const [activeTab, setActiveTab] = useState("keyword");

  return (
    <div className="bg-white shadow sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Detailed Assessment</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">In-depth analysis of each SEO factor.</p>
      </div>
      
      <Tabs defaultValue="keyword" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200">
          <TabsList className="h-auto p-0 bg-transparent flex-wrap overflow-x-auto">
            <TabsTrigger 
              value="keyword" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Keyword Optimization
            </TabsTrigger>
            <TabsTrigger 
              value="meta" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Meta Tags
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Content Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="technical" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Technical SEO
            </TabsTrigger>
            <TabsTrigger 
              value="ux" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              User Experience
            </TabsTrigger>
            <TabsTrigger 
              value="competitors" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Competitor Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="deep-content" 
              className="px-1 py-4 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Deep Content Analysis
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="keyword" className="p-0 mt-0">
          <KeywordTab data={data.keywordAnalysis} />
        </TabsContent>
        
        <TabsContent value="meta" className="p-0 mt-0">
          <MetaTagsTab data={data.metaTagsAnalysis} />
        </TabsContent>
        
        <TabsContent value="content" className="p-0 mt-0">
          <ContentTab 
            contentData={data.contentAnalysis} 
            internalLinksData={data.internalLinksAnalysis}
            imageData={data.imageAnalysis}
          />
        </TabsContent>
        
        <TabsContent value="technical" className="p-0 mt-0">
          <TechnicalTab 
            pageSpeedData={data.pageSpeedAnalysis}
            schemaData={data.schemaMarkupAnalysis}
            mobileData={data.mobileAnalysis}
          />
        </TabsContent>
        
        <TabsContent value="ux" className="p-0 mt-0">
          <UXTab 
            userEngagementData={data.userEngagementAnalysis}
            eatData={data.eatAnalysis}
          />
        </TabsContent>
        
        <TabsContent value="competitors" className="p-0 mt-0">
          <div className="p-4 sm:p-6">
            {data.competitorAnalysis ? (
              // If competitor analysis data exists in the results, render it directly
              <div className="space-y-6 high-res-layout">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg font-semibold xl:text-xl 2xl:text-2xl">Top Competitors in {data.competitorAnalysis.location || 'your area'}</h3>
                    
                    <div className="flex items-center text-sm xl:text-base text-muted-foreground">
                      <Tag className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5" />
                      <span>Keyword: <span className="font-medium text-foreground">{data.competitorAnalysis.keyword || data.keywordAnalysis.primaryKeyword}</span></span>
                      {data.competitorAnalysis.queryCount !== undefined && (
                        <span className="ml-4 flex items-center">
                          <Search className="h-3.5 w-3.5 xl:h-4 xl:w-4 mr-1.5 text-blue-500" />
                          <span className="text-xs xl:text-sm">
                            API Queries: <span className="font-medium text-foreground">{data.competitorAnalysis.queryCount}</span>
                            {data.competitorAnalysis.usingRealSearch && <span className="ml-1 text-green-500 text-xs">(Live data)</span>}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm xl:text-base text-muted-foreground">
                    Based on analysis of search rankings and online presence for "{data.competitorAnalysis.keyword || data.keywordAnalysis.primaryKeyword}" in {data.competitorAnalysis.location || 'your area'}.
                  </p>
                </div>
                
                {/* Show competitors from saved analysis */}
                {data.competitorAnalysis.competitors && data.competitorAnalysis.competitors.length > 0 ? (
                  <div className="space-y-4">
                    {data.competitorAnalysis.competitors.map((competitor: any, index: number) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-grow p-6 xl:p-8">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg xl:text-xl font-semibold flex items-center">
                                <Globe className="h-4 w-4 xl:h-5 xl:w-5 mr-2 text-primary" />
                                {competitor.name || `Competitor ${index + 1}`}
                              </h4>
                              <Badge variant={index === 0 ? "destructive" : index === 1 ? "default" : "outline"} className="xl:text-sm xl:px-3 xl:py-1">
                                {index === 0 ? "Top Competitor" : index === 1 ? "Strong Competitor" : "Competitor"}
                              </Badge>
                            </div>
                            
                            <p className="text-sm xl:text-base text-muted-foreground mb-4 flex items-center">
                              <ExternalLink className="h-3 w-3 xl:h-4 xl:w-4 mr-1 flex-shrink-0" />
                              <a 
                                href={competitor.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hover:underline truncate"
                                title={competitor.url}
                              >
                                {competitor.url}
                              </a>
                            </p>
                            
                            {/* Competitor metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6 mt-4">
                              {competitor.score && (
                                <div>
                                  <p className="text-xs xl:text-sm text-muted-foreground mb-1">SEO Score</p>
                                  <div className="flex items-center">
                                    <div className="bg-primary/10 text-primary font-medium rounded-md px-2 py-1 text-sm xl:text-base xl:px-3">
                                      {competitor.score}/100
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {competitor.domainAuthority && (
                                <div>
                                  <p className="text-xs xl:text-sm text-muted-foreground mb-1">Domain Authority</p>
                                  <div className="flex items-center">
                                    <Progress value={competitor.domainAuthority} className="h-2 xl:h-3 w-24 xl:w-32" />
                                    <span className="text-sm xl:text-base ml-2">{competitor.domainAuthority}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Competitor strengths */}
                          <div className="w-full md:w-1/3 xl:w-1/4 bg-muted p-6 xl:p-8 border-t md:border-t-0 md:border-l">
                            <h5 className="text-sm xl:text-base font-medium mb-2">Key Strengths</h5>
                            <ul className="space-y-1 xl:space-y-2 text-sm xl:text-base">
                              {competitor.strengths && competitor.strengths.length > 0 ? (
                                competitor.strengths.map((strength: string, idx: number) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="rounded-full h-4 w-4 xl:h-5 xl:w-5 bg-green-100 text-green-600 flex items-center justify-center text-xs xl:text-sm mr-2 mt-0.5 flex-shrink-0">+</span>
                                    <span className="break-words">{strength}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">No data available</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground xl:text-lg">No competitors data available.</p>
                  </div>
                )}
                
                {/* Keyword gap analysis */}
                {data.competitorAnalysis.keywordGap && data.competitorAnalysis.keywordGap.length > 0 && (
                  <>
                    <div className="space-y-2 mt-6">
                      <h3 className="text-lg xl:text-xl 2xl:text-2xl font-semibold">Keyword Gap Analysis</h3>
                      <p className="text-sm xl:text-base text-muted-foreground">
                        Keywords your competitors are ranking for that you might be missing.
                      </p>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <div className="grid grid-cols-4 gap-4 p-4 xl:p-6 font-medium bg-muted text-sm xl:text-base">
                        <div>Keyword</div>
                        <div>Monthly Volume</div>
                        <div>Difficulty</div>
                        <div>Top Competitor</div>
                      </div>
                      <div className="divide-y">
                        {data.competitorAnalysis.keywordGap.map((keyword: any, index: number) => (
                          <div key={index} className="grid grid-cols-4 gap-4 p-4 xl:p-6 text-sm xl:text-base hover:bg-muted/50">
                            <div className="font-medium">{keyword.term}</div>
                            <div>{keyword.volume}</div>
                            <div>{keyword.competition}</div>
                            <div className="truncate" title={keyword.topCompetitor}>{keyword.topCompetitor}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // If no competitor analysis data exists, show the competitor analysis component which will fetch new data
              <CompetitorAnalysis 
                url={data.url} 
                keyword={data.keywordAnalysis.primaryKeyword}
                isRequested={data.competitorAnalysis !== undefined} 
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="deep-content" className="p-0 mt-0">
          <div className="p-4 sm:p-6">
            <DeepContentAnalysis 
              url={data.url} 
              isRequested={data.deepContentAnalysis !== undefined} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
