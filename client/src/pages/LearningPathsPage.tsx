import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  mockModules, 
  mockLearningPaths, 
  mockRecommendations,
  generateProgressSummary 
} from "@/data/mockLearningData";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, BookOpen, Award, Lightbulb, BookMarked, Clock } from "lucide-react";

// Import types from our shared types file
import {
  LearningModule,
  LearningPath,
  ProgressSummary,
  LearningRecommendation
} from "@/types/learningTypes";

export default function LearningPathsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("all-modules");
  
  // Use local mock data instead of API calls for now
  const [modules, setModules] = useState(mockModules);
  const [paths, setPaths] = useState(mockLearningPaths);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading the data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        setProgressSummary(generateProgressSummary() as ProgressSummary);
        setRecommendations(mockRecommendations);
      }
      setIsLoading(false);
    }, 800); // Add a small delay to simulate API loading
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
                    
  // Helper functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} hr ${remainingMinutes} min` 
      : `${hours} hr`;
  };
  
  const getProgressForModule = (moduleId: number) => {
    if (!progressSummary) return null;
    
    return progressSummary.moduleProgress.find(p => p.moduleId === moduleId) || null;
  };
  
  const getRecommendationForModule = (moduleId: number) => {
    if (!recommendations) return null;
    
    return recommendations.find(r => r.moduleId === moduleId && !r.isCompleted && !r.isDismmised) || null;
  };
  
  // Filter modules based on active tab
  const filteredModules = modules ? modules.filter((module: LearningModule) => {
    if (activeTab === 'all-modules') return true;
    if (activeTab === 'in-progress' && progressSummary) {
      const moduleProgress = getProgressForModule(module.id);
      return moduleProgress?.status === 'in_progress';
    }
    if (activeTab === 'completed' && progressSummary) {
      const moduleProgress = getProgressForModule(module.id);
      return moduleProgress?.status === 'completed';
    }
    if (activeTab === 'recommended' && recommendations) {
      return getRecommendationForModule(module.id) !== null;
    }
    return true;
  }) : [];
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">SEO Learning Paths</h1>
        <p className="text-muted-foreground">
          Master the art of SEO with our personalized learning paths. Track your progress and improve your skills.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading learning materials...</span>
        </div>
      ) : (
        <>
          {isAuthenticated && progressSummary && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Learning Progress</CardTitle>
                <CardDescription>
                  Track your SEO learning journey and see your accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4 flex-1 min-w-[200px]">
                      <div className="text-blue-600 font-medium">Overall Completion</div>
                      <div className="text-3xl font-bold mt-1">{progressSummary.overallProgress.percentComplete}%</div>
                      <Progress 
                        value={progressSummary.overallProgress.percentComplete} 
                        className="h-2 mt-2"
                      />
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 flex-1 min-w-[200px]">
                      <div className="text-green-600 font-medium">Completed Modules</div>
                      <div className="text-3xl font-bold mt-1">
                        {progressSummary.overallProgress.completedModules}/{progressSummary.overallProgress.totalModules}
                      </div>
                      <Progress 
                        value={(progressSummary.overallProgress.completedModules / progressSummary.overallProgress.totalModules) * 100} 
                        className="h-2 mt-2"
                      />
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-4 flex-1 min-w-[200px]">
                      <div className="text-amber-600 font-medium">Completed Lessons</div>
                      <div className="text-3xl font-bold mt-1">
                        {progressSummary.overallProgress.completedLessons}/{progressSummary.overallProgress.totalLessons}
                      </div>
                      <Progress 
                        value={(progressSummary.overallProgress.completedLessons / progressSummary.overallProgress.totalLessons) * 100} 
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {isAuthenticated && recommendations && recommendations.length > 0 && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  Based on your website analyses and learning progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.filter(r => !r.isCompleted && !r.isDismmised).slice(0, 3).map(recommendation => {
                    const recommendedModule = modules?.find((m: LearningModule) => m.id === recommendation.moduleId);
                    if (!recommendedModule) return null;
                    
                    return (
                      <Card key={recommendation.id} className="border-amber-200 bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{recommendedModule.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm">{recommendation.reasonText}</p>
                        </CardContent>
                        <CardFooter>
                          <Link href={`/modules/${recommendedModule.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <Button className="w-full">Start Learning</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
                {recommendations.filter(r => !r.isCompleted && !r.isDismmised).length > 3 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" onClick={() => setActiveTab("recommended")}>
                      View All Recommendations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <Tabs defaultValue="all-modules" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all-modules">All Modules</TabsTrigger>
              {isAuthenticated && (
                <>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended</TabsTrigger>
                </>
              )}
              <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-modules" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module: LearningModule) => {
                  const moduleProgress = getProgressForModule(module.id);
                  
                  return (
                    <Card key={module.id} className="overflow-hidden flex flex-col">
                      {module.imageUrl && (
                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={module.imageUrl} 
                            alt={module.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={!module.imageUrl ? 'pt-6' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(module.estimatedTime)}
                          </div>
                        </div>
                        <CardTitle>{module.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-3">
                          {module.description}
                        </p>
                        
                        {moduleProgress && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress: {moduleProgress.percentComplete}%</span>
                              <span>
                                {moduleProgress.completedLessons}/{moduleProgress.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={moduleProgress.percentComplete} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Link href={`/modules/${module.title.toLowerCase().replace(/\s+/g, '-')}`} className="w-full">
                          <Button className="w-full">
                            {moduleProgress?.status === 'completed' ? (
                              <>
                                <Award className="h-4 w-4 mr-2" />
                                Review Module
                              </>
                            ) : moduleProgress?.status === 'in_progress' ? (
                              <>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Continue Learning
                              </>
                            ) : (
                              <>
                                <BookMarked className="h-4 w-4 mr-2" />
                                Start Module
                              </>
                            )}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {filteredModules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-lg text-gray-500">No modules found for the selected filter.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="in-progress" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module: LearningModule) => {
                  const moduleProgress = getProgressForModule(module.id);
                  
                  return (
                    <Card key={module.id} className="overflow-hidden flex flex-col">
                      {module.imageUrl && (
                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={module.imageUrl} 
                            alt={module.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={!module.imageUrl ? 'pt-6' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(module.estimatedTime)}
                          </div>
                        </div>
                        <CardTitle>{module.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-3">
                          {module.description}
                        </p>
                        
                        {moduleProgress && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress: {moduleProgress.percentComplete}%</span>
                              <span>
                                {moduleProgress.completedLessons}/{moduleProgress.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={moduleProgress.percentComplete} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Link href={`/modules/${module.title.toLowerCase().replace(/\s+/g, '-')}`} className="w-full">
                          <Button className="w-full">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continue Learning
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {filteredModules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-lg text-gray-500">You don't have any modules in progress.</p>
                  <Button className="mt-4" onClick={() => setActiveTab("all-modules")}>Browse All Modules</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module: LearningModule) => {
                  const moduleProgress = getProgressForModule(module.id);
                  
                  return (
                    <Card key={module.id} className="overflow-hidden flex flex-col border-green-200">
                      {module.imageUrl && (
                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={module.imageUrl} 
                            alt={module.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={!module.imageUrl ? 'pt-6' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <Award className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                        <CardTitle>{module.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-3">
                          {module.description}
                        </p>
                        
                        {moduleProgress && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress: 100%</span>
                              <span>
                                {moduleProgress.completedLessons}/{moduleProgress.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={100} className="h-2 bg-green-100" />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Link href={`/modules/${module.title.toLowerCase().replace(/\s+/g, '-')}`} className="w-full">
                          <Button className="w-full" variant="outline">
                            <Award className="h-4 w-4 mr-2" />
                            Review Module
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {filteredModules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-lg text-gray-500">You haven't completed any modules yet.</p>
                  <Button className="mt-4" onClick={() => setActiveTab("all-modules")}>Browse Modules</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recommended" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module: LearningModule) => {
                  const moduleProgress = getProgressForModule(module.id);
                  const recommendation = getRecommendationForModule(module.id);
                  
                  return (
                    <Card key={module.id} className="overflow-hidden flex flex-col border-amber-200">
                      {module.imageUrl && (
                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={module.imageUrl} 
                            alt={module.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={!module.imageUrl ? 'pt-6' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        </div>
                        <CardTitle>{module.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        {recommendation && (
                          <div className="bg-amber-50 p-3 rounded-md mb-3 text-sm">
                            <p className="font-medium text-amber-800">Why we recommend this:</p>
                            <p className="text-amber-700">{recommendation.reasonText}</p>
                          </div>
                        )}
                        <p className="text-muted-foreground line-clamp-3">
                          {module.description}
                        </p>
                        
                        {moduleProgress && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress: {moduleProgress.percentComplete}%</span>
                              <span>
                                {moduleProgress.completedLessons}/{moduleProgress.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={moduleProgress.percentComplete} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Link href={`/learning/modules/${module.id}`} className="w-full">
                          <Button className="w-full">
                            {moduleProgress?.status === 'in_progress' ? (
                              <>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Continue Learning
                              </>
                            ) : (
                              <>
                                <BookMarked className="h-4 w-4 mr-2" />
                                Start Module
                              </>
                            )}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {filteredModules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-lg text-gray-500">No recommended modules found.</p>
                  <Button className="mt-4" onClick={() => setActiveTab("all-modules")}>Browse All Modules</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="learning-paths" className="space-y-4">
              {paths && paths.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paths.map((path: LearningPath) => (
                    <Card key={path.id} className="overflow-hidden">
                      {path.imageUrl && (
                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={path.imageUrl} 
                            alt={path.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle>{path.name}</CardTitle>
                        {path.targetAudience && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
                            {path.targetAudience}
                          </Badge>
                        )}
                        <CardDescription>{path.description}</CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Link href={`/learning/paths/${path.id}`} className="w-full">
                          <Button className="w-full">View Learning Path</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-lg text-gray-500">No learning paths available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}