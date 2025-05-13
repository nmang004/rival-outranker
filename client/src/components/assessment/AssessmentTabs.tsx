import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeywordTab from "./KeywordTab";
import MetaTagsTab from "./MetaTagsTab";
import ContentTab from "./ContentTab";
import TechnicalTab from "./TechnicalTab";
import UXTab from "./UXTab";
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
      </Tabs>
    </div>
  );
}
