import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  AlignJustify, 
  BookOpen, 
  Newspaper, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  List, 
  Table, 
  Quote, 
  Bold, 
  Video, 
  Sparkles, 
  MousePointer, 
  MessageSquare, 
  ChevronDown,
  Loader2
} from 'lucide-react';

interface DeepContentAnalysisProps {
  url: string;
}

export default function DeepContentAnalysis({ url }: DeepContentAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/deep-content?url=${encodeURIComponent(url)}`],
    enabled: isAnalyzing,
    refetchOnWindowFocus: false
  });
  
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
  };
  
  if (!isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Deep Content Analysis
          </CardTitle>
          <CardDescription>
            Advanced analysis of your content structure, readability, relevance and engagement factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Our deep content analysis provides comprehensive insights into your content quality beyond basic SEO metrics. 
                We'll evaluate your content structure, reading level, semantic relevance, and engagement potential to help you create 
                more effective, user-friendly content.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <FeatureCard 
                  title="Content Structure" 
                  description="Analysis of headings, paragraphs, and content flow"
                  icon={<Layout className="h-4 w-4 text-primary" />}
                />
                <FeatureCard 
                  title="Readability" 
                  description="Reading level, sentence complexity, and word choice"
                  icon={<AlignJustify className="h-4 w-4 text-primary" />}
                />
                <FeatureCard 
                  title="Semantic Relevance" 
                  description="Topic coverage, keyword context, and entity analysis"
                  icon={<Newspaper className="h-4 w-4 text-primary" />}
                />
                <FeatureCard 
                  title="Engagement" 
                  description="Content formats, interactive elements, and calls-to-action"
                  icon={<Sparkles className="h-4 w-4 text-primary" />}
                />
              </div>
            </div>
            
            <Button
              onClick={handleStartAnalysis}
              className="w-full sage-bg-gradient hover:opacity-90 transition-opacity"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Start Deep Content Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return <DeepContentAnalysisLoading />;
  }
  
  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">Failed to analyze content. Please try again.</p>
          <Button 
            onClick={() => setIsAnalyzing(false)} 
            variant="outline"
          >
            Back to Analysis Options
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const { 
    overallScore, 
    structure, 
    readability, 
    semanticRelevance, 
    engagement, 
    recommendations 
  } = data;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Deep Content Analysis
        </CardTitle>
        <CardDescription>
          Detailed insights on your content's effectiveness and quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="bg-muted/20 p-4 rounded-lg border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <h3 className="text-lg font-medium">Overall Content Quality Score</h3>
            <div className="flex items-center mt-2 sm:mt-0">
              <Badge className={`
                font-medium 
                ${overallScore.category === 'excellent' ? 'bg-green-100 text-green-800' : 
                  overallScore.category === 'good' ? 'bg-blue-100 text-blue-800' : 
                  overallScore.category === 'needs-work' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}
              `}>
                {overallScore.category.replace('-', ' ')}
              </Badge>
            </div>
          </div>
          
          <Progress 
            value={overallScore.score} 
            className={`h-3 ${
              overallScore.category === 'excellent' ? '[--progress-foreground:theme(colors.green.500)]' : 
              overallScore.category === 'good' ? '[--progress-foreground:theme(colors.blue.500)]' : 
              overallScore.category === 'needs-work' ? '[--progress-foreground:theme(colors.yellow.500)]' : 
              '[--progress-foreground:theme(colors.red.500)]'
            }`}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0</span>
            <span className="text-xs font-medium">{overallScore.score}/100</span>
            <span className="text-xs text-muted-foreground">100</span>
          </div>
        </div>
        
        {/* Tabs for different analysis aspects */}
        <Tabs defaultValue="annotated" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="annotated">Annotated Content</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="readability">Readability</TabsTrigger>
            <TabsTrigger value="semantics">Semantics</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
          
          {/* Annotated Content Tab */}
          <TabsContent value="annotated" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-medium mb-2">{data.annotatedContent.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review your content with our suggestions for improvement. Each annotation highlights specific issues and provides actionable recommendations.
              </p>
            </div>
            
            {/* Introduction Section */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="text-lg font-medium mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Introduction
              </h4>
              <div className="relative mt-2 mb-2 py-2 px-4 bg-slate-50 rounded-lg">
                <p className="whitespace-pre-line">{data.annotatedContent.introduction.content}</p>
              </div>
              
              {data.annotatedContent.introduction.annotations.length > 0 ? (
                <div className="mt-3 space-y-3">
                  <h5 className="text-sm font-medium">Suggested Improvements:</h5>
                  {data.annotatedContent.introduction.annotations.map((annotation, index) => (
                    <div key={index} className="border-l-2 pl-3 py-1 text-sm" 
                      style={{ 
                        borderColor: annotation.severity === 'high' ? '#ef4444' : 
                                    annotation.severity === 'medium' ? '#f97316' : '#84cc16'
                      }}
                    >
                      <div className="flex items-start">
                        <span className={`px-2 py-0.5 rounded-full text-xs text-white mr-2 ${
                          annotation.severity === 'high' ? 'bg-red-500' : 
                          annotation.severity === 'medium' ? 'bg-orange-500' : 'bg-lime-500'
                        }`}>
                          {annotation.severity}
                        </span>
                        <p className="font-medium">{annotation.issue}</p>
                      </div>
                      <p className="mt-1 text-muted-foreground">{annotation.suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Your introduction looks good! No issues found.
                </div>
              )}
            </div>
            
            {/* Main Content Sections */}
            {data.annotatedContent.mainContent.map((section, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-white">
                <h4 className="text-base font-medium mb-2 flex items-center">
                  <AlignJustify className="h-4 w-4 mr-2 text-primary" />
                  Content Section {idx + 1}
                </h4>
                <div className="relative mt-2 mb-2 py-2 px-4 bg-slate-50 rounded-lg">
                  <p className="whitespace-pre-line">{section.content}</p>
                </div>
                
                {section.annotations.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    <h5 className="text-sm font-medium">Suggested Improvements:</h5>
                    {section.annotations.map((annotation, index) => (
                      <div key={index} className="border-l-2 pl-3 py-1 text-sm"
                        style={{ 
                          borderColor: annotation.severity === 'high' ? '#ef4444' : 
                                      annotation.severity === 'medium' ? '#f97316' : '#84cc16'
                        }}
                      >
                        <div className="flex items-start">
                          <span className={`px-2 py-0.5 rounded-full text-xs text-white mr-2 ${
                            annotation.severity === 'high' ? 'bg-red-500' : 
                            annotation.severity === 'medium' ? 'bg-orange-500' : 'bg-lime-500'
                          }`}>
                            {annotation.severity}
                          </span>
                          <p className="font-medium">{annotation.issue}</p>
                        </div>
                        <p className="mt-1 text-muted-foreground">{annotation.suggestion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    This section looks good! No issues found.
                  </div>
                )}
              </div>
            ))}
            
            {/* Conclusion Section */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="text-lg font-medium mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Conclusion
              </h4>
              <div className="relative mt-2 mb-2 py-2 px-4 bg-slate-50 rounded-lg">
                <p className="whitespace-pre-line">{data.annotatedContent.conclusion.content}</p>
              </div>
              
              {data.annotatedContent.conclusion.annotations.length > 0 ? (
                <div className="mt-3 space-y-3">
                  <h5 className="text-sm font-medium">Suggested Improvements:</h5>
                  {data.annotatedContent.conclusion.annotations.map((annotation, index) => (
                    <div key={index} className="border-l-2 pl-3 py-1 text-sm"
                      style={{ 
                        borderColor: annotation.severity === 'high' ? '#ef4444' : 
                                    annotation.severity === 'medium' ? '#f97316' : '#84cc16'
                      }}
                    >
                      <div className="flex items-start">
                        <span className={`px-2 py-0.5 rounded-full text-xs text-white mr-2 ${
                          annotation.severity === 'high' ? 'bg-red-500' : 
                          annotation.severity === 'medium' ? 'bg-orange-500' : 'bg-lime-500'
                        }`}>
                          {annotation.severity}
                        </span>
                        <p className="font-medium">{annotation.issue}</p>
                      </div>
                      <p className="mt-1 text-muted-foreground">{annotation.suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Your conclusion looks good! No issues found.
                </div>
              )}
            </div>
            
            <div className="rounded-lg p-4 bg-white border border-slate-200 mt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Content Type Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded mr-1.5">
                      {data.annotatedContent.introduction.annotations.filter(a => a.type === 'structure').length +
                       data.annotatedContent.mainContent.reduce((sum, section) => 
                          sum + section.annotations.filter(a => a.type === 'structure').length, 0) +
                       data.annotatedContent.conclusion.annotations.filter(a => a.type === 'structure').length}
                    </span>
                    <span>Structure Issues</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-1.5">
                      {data.annotatedContent.introduction.annotations.filter(a => a.type === 'readability').length +
                       data.annotatedContent.mainContent.reduce((sum, section) => 
                          sum + section.annotations.filter(a => a.type === 'readability').length, 0) +
                       data.annotatedContent.conclusion.annotations.filter(a => a.type === 'readability').length}
                    </span>
                    <span>Readability Issues</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded mr-1.5">
                      {data.annotatedContent.introduction.annotations.filter(a => a.type === 'semantics').length +
                       data.annotatedContent.mainContent.reduce((sum, section) => 
                          sum + section.annotations.filter(a => a.type === 'semantics').length, 0) +
                       data.annotatedContent.conclusion.annotations.filter(a => a.type === 'semantics').length}
                    </span>
                    <span>Semantic Issues</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="flex items-center">
                    <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded mr-1.5">
                      {data.annotatedContent.introduction.annotations.filter(a => a.type === 'engagement').length +
                       data.annotatedContent.mainContent.reduce((sum, section) => 
                          sum + section.annotations.filter(a => a.type === 'engagement').length, 0) +
                       data.annotatedContent.conclusion.annotations.filter(a => a.type === 'engagement').length}
                    </span>
                    <span>Engagement Issues</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Content Structure Tab */}
          <TabsContent value="structure" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard 
                title="Heading Structure" 
                score={structure.headingStructure.score} 
                category={structure.headingStructure.category}
                icon={<Layout className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Paragraph Structure" 
                score={structure.paragraphStructure.score} 
                category={structure.paragraphStructure.category}
                icon={<AlignJustify className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Content Distribution" 
                score={structure.contentDistribution.score} 
                category={structure.contentDistribution.category}
                icon={<Newspaper className="h-4 w-4" />}
              />
            </div>
            
            <Separator />
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded">
                  <h3 className="text-md font-medium">Detailed Structure Analysis</h3>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Layout className="h-4 w-4 mr-1 text-primary" /> Heading Structure
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Total Headings:</span>
                        <span className="font-medium">{structure.headingStructure.totalHeadings}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Headings with Keywords:</span>
                        <span className="font-medium">{structure.headingStructure.headingsWithKeywords}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Keyword Coverage:</span>
                        <span className="font-medium">
                          {structure.headingStructure.totalHeadings > 0 
                            ? Math.round((structure.headingStructure.headingsWithKeywords / structure.headingStructure.totalHeadings) * 100) 
                            : 0}%
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <AlignJustify className="h-4 w-4 mr-1 text-primary" /> Paragraph Structure
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Total Paragraphs:</span>
                        <span className="font-medium">{structure.paragraphStructure.totalParagraphs}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Avg. Paragraph Length:</span>
                        <span className="font-medium">{Math.round(structure.paragraphStructure.avgParagraphLength)} words</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Short Paragraphs:</span>
                        <span className="font-medium">{structure.paragraphStructure.shortParagraphCount}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Long Paragraphs:</span>
                        <span className="font-medium">{structure.paragraphStructure.longParagraphCount}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Newspaper className="h-4 w-4 mr-1 text-primary" /> Content Distribution
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="text-muted-foreground mr-4 w-40">Introduction Quality:</span>
                      <Progress 
                        value={structure.contentDistribution.introductionQuality} 
                        className="h-2 flex-grow" 
                      />
                      <span className="ml-2 text-xs w-8 text-right">{structure.contentDistribution.introductionQuality}%</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-muted-foreground mr-4 w-40">Body Content Quality:</span>
                      <Progress 
                        value={structure.contentDistribution.bodyContentQuality} 
                        className="h-2 flex-grow" 
                      />
                      <span className="ml-2 text-xs w-8 text-right">{structure.contentDistribution.bodyContentQuality}%</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-muted-foreground mr-4 w-40">Conclusion Quality:</span>
                      <Progress 
                        value={structure.contentDistribution.conclusionQuality} 
                        className="h-2 flex-grow" 
                      />
                      <span className="ml-2 text-xs w-8 text-right">{structure.contentDistribution.conclusionQuality}%</span>
                    </li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
          
          {/* Readability Tab */}
          <TabsContent value="readability" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard 
                title="Flesch Reading Ease" 
                score={readability.fleschReadingEase.score} 
                category={readability.fleschReadingEase.category}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Sentence Complexity" 
                score={readability.sentenceComplexity.score} 
                category={readability.sentenceComplexity.category}
                icon={<AlignJustify className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Word Choice" 
                score={readability.wordChoice.score} 
                category={readability.wordChoice.category}
                icon={<MessageSquare className="h-4 w-4" />}
              />
            </div>
            
            <Separator />
            
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-1 text-primary" /> Reading Level
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {readability.fleschReadingEase.interpretation}
              </p>
              <div className="relative pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white bg-red-500">
                      Very Difficult
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white bg-green-500">
                      Very Easy
                    </span>
                  </div>
                </div>
                <div className="h-2 mt-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-full rounded-full ${
                      readability.fleschReadingEase.score >= 80 ? 'bg-green-500' :
                      readability.fleschReadingEase.score >= 60 ? 'bg-green-300' :
                      readability.fleschReadingEase.score >= 50 ? 'bg-yellow-400' :
                      readability.fleschReadingEase.score >= 30 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${readability.fleschReadingEase.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>30</span>
                  <span>50</span>
                  <span>60</span>
                  <span>70</span>
                  <span>80</span>
                  <span>90</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded">
                  <h3 className="text-md font-medium">Detailed Readability Analysis</h3>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <AlignJustify className="h-4 w-4 mr-1 text-primary" /> Sentence Analysis
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Avg. Sentence Length:</span>
                        <span className="font-medium">{Math.round(readability.sentenceComplexity.avgSentenceLength)} words</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Complex Sentences:</span>
                        <span className="font-medium">{Math.round(readability.sentenceComplexity.complexSentencePercentage)}%</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1 text-primary" /> Word Analysis
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Simple Words:</span>
                        <span className="font-medium">{Math.round(readability.wordChoice.simpleWordPercentage)}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Complex Words:</span>
                        <span className="font-medium">{Math.round(readability.wordChoice.complexWordPercentage)}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Avg. Word Length:</span>
                        <span className="font-medium">{readability.wordChoice.avgWordLength.toFixed(1)} characters</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
          
          {/* Semantics Tab */}
          <TabsContent value="semantics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard 
                title="Topic Coverage" 
                score={semanticRelevance.topicCoverage.score} 
                category={semanticRelevance.topicCoverage.category}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Keyword Context" 
                score={semanticRelevance.keywordContext.score} 
                category={semanticRelevance.keywordContext.category}
                icon={<Newspaper className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Entity Analysis" 
                score={semanticRelevance.entityAnalysis.score} 
                category={semanticRelevance.entityAnalysis.category}
                icon={<Layout className="h-4 w-4" />}
              />
            </div>
            
            <Separator />
            
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Newspaper className="h-4 w-4 mr-1 text-primary" /> Top Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {semanticRelevance.topicCoverage.keyTopics.map((topic: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-primary/10 text-primary">
                    {topic}
                  </Badge>
                ))}
                {semanticRelevance.topicCoverage.keyTopics.length === 0 && (
                  <p className="text-sm text-muted-foreground">No key topics detected</p>
                )}
              </div>
            </div>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded">
                  <h3 className="text-md font-medium">Detailed Semantic Analysis</h3>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-2">
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Newspaper className="h-4 w-4 mr-1 text-primary" /> Keyword Context
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="text-muted-foreground">Keyword in Context:</span>
                      <span className="ml-2">
                        {semanticRelevance.keywordContext.keywordInContext ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-muted-foreground mr-4 w-40">Semantic Relevance:</span>
                      <Progress 
                        value={semanticRelevance.keywordContext.semanticRelevance * 100} 
                        className="h-2 flex-grow" 
                      />
                      <span className="ml-2 text-xs w-8 text-right">
                        {Math.round(semanticRelevance.keywordContext.semanticRelevance * 100)}%
                      </span>
                    </li>
                  </ul>
                </div>
                
                {semanticRelevance.entityAnalysis.entities.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Layout className="h-4 w-4 mr-1 text-primary" /> Entity Analysis
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-1 font-medium text-muted-foreground">Entity</th>
                            <th className="text-left py-2 px-1 font-medium text-muted-foreground">Type</th>
                            <th className="text-right py-2 px-1 font-medium text-muted-foreground">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semanticRelevance.entityAnalysis.entities.map((entity: { type: string; name: string; frequency: number }, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-muted/10' : ''}>
                              <td className="py-1.5 px-1">{entity.name}</td>
                              <td className="py-1.5 px-1 capitalize">{entity.type}</td>
                              <td className="py-1.5 px-1 text-right">{entity.frequency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
          
          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard 
                title="Content Formats" 
                score={engagement.contentFormats.score} 
                category={engagement.contentFormats.category}
                icon={<Layout className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Interactive Elements" 
                score={engagement.interactiveElements.score} 
                category={engagement.interactiveElements.category}
                icon={<MousePointer className="h-4 w-4" />}
              />
              <ScoreCard 
                title="Calls-to-Action" 
                score={engagement.callsToAction.score} 
                category={engagement.callsToAction.category}
                icon={<MessageSquare className="h-4 w-4" />}
              />
            </div>
            
            <Separator />
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded">
                  <h3 className="text-md font-medium">Detailed Engagement Analysis</h3>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Layout className="h-4 w-4 mr-1 text-primary" /> Content Formats
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <List className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Lists:</span>
                        <span className="ml-2">
                          {engagement.contentFormats.hasLists ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Table className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Tables:</span>
                        <span className="ml-2">
                          {engagement.contentFormats.hasTables ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Quote className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Blockquotes:</span>
                        <span className="ml-2">
                          {engagement.contentFormats.hasBlockquotes ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Bold className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Highlighted Text:</span>
                        <span className="ml-2">
                          {engagement.contentFormats.hasHighlightedText ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <MousePointer className="h-4 w-4 mr-1 text-primary" /> Interactive Elements
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <Video className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Videos:</span>
                        <span className="ml-2">
                          {engagement.interactiveElements.hasVideos ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Layout className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Embeds:</span>
                        <span className="ml-2">
                          {engagement.interactiveElements.hasEmbeds ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="text-muted-foreground">Interactive Content:</span>
                        <span className="ml-2">
                          {engagement.interactiveElements.hasInteractiveContent ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1 text-primary" /> Calls-to-Action
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="text-muted-foreground">Has CTAs:</span>
                      <span className="ml-2">
                        {engagement.callsToAction.hasCTA ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">CTA Count:</span>
                      <span className="font-medium">{engagement.callsToAction.ctaCount}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-muted-foreground mr-4 w-40">CTA Quality:</span>
                      <Progress 
                        value={engagement.callsToAction.ctaQuality} 
                        className="h-2 flex-grow" 
                      />
                      <span className="ml-2 text-xs w-8 text-right">{engagement.callsToAction.ctaQuality}%</span>
                    </li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
        
        {/* Recommendations */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Content Improvement Recommendations</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="flex">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
              {recommendations.length === 0 && (
                <li>No specific recommendations. Your content is well-optimized!</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end mt-4">
          <Button 
            onClick={() => setIsAnalyzing(false)} 
            variant="outline" 
            className="mr-2"
          >
            Back
          </Button>
          <Button 
            variant="default"
            className="sage-bg-gradient hover:opacity-90 transition-opacity"
            onClick={() => window.print()}
          >
            Export Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode 
}) {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center mb-2">
        <div className="rounded-full p-1.5 bg-primary/10 mr-2">
          {icon}
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ScoreCard({ 
  title, 
  score, 
  category,
  icon 
}: { 
  title: string; 
  score: number; 
  category: string;
  icon: JSX.Element;
}) {
  const iconColor = category === 'excellent' ? 'text-green-500' : 
                    category === 'good' ? 'text-blue-500' : 
                    category === 'needs-work' ? 'text-yellow-500' : 
                    'text-red-500';
                    
  const bgColor = category === 'excellent' ? 'bg-green-100' : 
                  category === 'good' ? 'bg-blue-100' : 
                  category === 'needs-work' ? 'bg-yellow-100' : 
                  'bg-red-100';
                  
  const textColor = category === 'excellent' ? 'text-green-800' : 
                    category === 'good' ? 'text-blue-800' : 
                    category === 'needs-work' ? 'text-yellow-800' : 
                    'text-red-800';
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className={`rounded-full p-1.5 ${bgColor} mr-2`}>
            <div className={`h-4 w-4 ${iconColor}`}>
              {icon}
            </div>
          </div>
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        <Badge className={`text-xs ${bgColor} ${textColor}`}>
          {score}/100
        </Badge>
      </div>
      <Progress 
        value={score} 
        className={`h-1.5 ${
          category === 'excellent' ? '[--progress-foreground:theme(colors.green.500)]' : 
          category === 'good' ? '[--progress-foreground:theme(colors.blue.500)]' : 
          category === 'needs-work' ? '[--progress-foreground:theme(colors.yellow.500)]' : 
          '[--progress-foreground:theme(colors.red.500)]'
        }`}
      />
    </div>
  );
}

function DeepContentAnalysisLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Deep Content Analysis
        </CardTitle>
        <CardDescription>
          Analyzing your content...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/20 p-4 rounded-lg border">
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between mt-2">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-6" />
          </div>
        </div>
        
        <div className="flex space-x-2 border-b">
          {['Structure', 'Readability', 'Semantics', 'Engagement'].map((tab, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        
        <div className="flex items-center justify-center my-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
          <p className="text-muted-foreground">Performing deep content analysis...</p>
        </div>
      </CardContent>
    </Card>
  );
}