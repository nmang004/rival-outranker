import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { 
  Loader2, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ListChecks, 
  BookMarked,
  Info,
  Lock,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for learning module content
interface LearningModule {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: string;
  estimatedTime: number;
  prerequisiteIds: number[];
  sortOrder: number;
  isActive: boolean;
}

interface LearningLesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  estimatedTime: number;
  sortOrder: number;
  isActive: boolean;
}

interface LessonQuiz {
  id: number;
  lessonId: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  sortOrder: number;
}

interface UserLearningProgress {
  id: number;
  userId: string;
  moduleId: number;
  lessonId: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completionPercentage: number;
  quizScore?: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  notes?: string;
}

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const moduleId = parseInt(id);
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch the module details
  const { 
    data: module, 
    isLoading: isModuleLoading,
    error: moduleError
  } = useQuery<LearningModule>({
    queryKey: [`/api/learning/modules/${moduleId}`],
    enabled: !isNaN(moduleId),
  });
  
  // Fetch the lessons for this module
  const { 
    data: lessons, 
    isLoading: isLessonsLoading,
    error: lessonsError
  } = useQuery<LearningLesson[]>({
    queryKey: [`/api/learning/modules/${moduleId}/lessons`],
    enabled: !isNaN(moduleId),
  });
  
  // Fetch the user's progress for this module (if authenticated)
  const { 
    data: userProgress,
    isLoading: isProgressLoading,
    error: progressError
  } = useQuery<UserLearningProgress[]>({
    queryKey: [`/api/learning/progress/modules/${moduleId}`],
    enabled: isAuthenticated && !isNaN(moduleId),
  });
  
  // Fetch the selected lesson details
  const {
    data: selectedLesson,
    isLoading: isLessonLoading,
    error: lessonError
  } = useQuery<LearningLesson>({
    queryKey: [`/api/learning/lessons/${selectedLessonId}`],
    enabled: selectedLessonId !== null,
  });
  
  // Fetch quizzes for the selected lesson
  const {
    data: quizzes,
    isLoading: isQuizzesLoading,
    error: quizzesError
  } = useQuery<LessonQuiz[]>({
    queryKey: [`/api/learning/lessons/${selectedLessonId}/quizzes`],
    enabled: selectedLessonId !== null,
  });
  
  // Mutation to update user progress
  const updateProgressMutation = useMutation({
    mutationFn: (progressData: any) => {
      return apiRequest('/api/learning/progress', progressData, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/learning/progress/modules/${moduleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress/summary'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating progress",
        description: "Failed to update your learning progress. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Loading states
  const isLoading = isModuleLoading || isLessonsLoading || (isAuthenticated && isProgressLoading);
  
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
  
  const getLessonProgress = (lessonId: number) => {
    if (!userProgress) return null;
    
    return userProgress.find(p => p.lessonId === lessonId) || null;
  };
  
  const calculateModuleProgress = () => {
    if (!userProgress || !lessons || lessons.length === 0) return 0;
    
    const completedLessons = userProgress.filter(p => p.status === 'completed').length;
    return Math.round((completedLessons / lessons.length) * 100);
  };
  
  const handleStartLesson = (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setActiveTab('lesson');
    
    if (isAuthenticated) {
      // Mark the lesson as in progress if it's not already
      const lessonProgress = getLessonProgress(lessonId);
      if (!lessonProgress || lessonProgress.status === 'not_started') {
        updateProgressMutation.mutate({
          moduleId,
          lessonId,
          status: 'in_progress',
          completionPercentage: 0
        });
      }
    }
  };
  
  const handleCompleteLesson = (lessonId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to track your progress.",
        variant: "default",
      });
      return;
    }
    
    updateProgressMutation.mutate({
      moduleId,
      lessonId,
      status: 'completed',
      completionPercentage: 100
    });
    
    toast({
      title: "Lesson completed!",
      description: "Your progress has been updated.",
      variant: "default",
    });
  };
  
  // Create a sorted list of lessons, respecting the sortOrder
  const sortedLessons = lessons ? [...lessons].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  
  // Get the next incomplete lesson ID
  const getNextIncompleteLesson = () => {
    if (!sortedLessons || sortedLessons.length === 0) return null;
    
    if (!userProgress) {
      // If no progress, start with the first lesson
      return sortedLessons[0].id;
    }
    
    // Find the first lesson that's not completed
    for (const lesson of sortedLessons) {
      const progress = getLessonProgress(lesson.id);
      if (!progress || progress.status !== 'completed') {
        return lesson.id;
      }
    }
    
    // If all lessons are completed, return the last one
    return sortedLessons[sortedLessons.length - 1].id;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading module content...</span>
        </div>
      </div>
    );
  }
  
  if (moduleError || !module) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-800 p-6 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Module not found</h2>
          <p>The requested module could not be loaded. It might have been removed or you may not have access.</p>
          <Link href="/learning">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning Paths
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/learning">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning Paths
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                {module.difficulty}
              </Badge>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(module.estimatedTime)}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              {selectedLessonId && <TabsTrigger value="lesson">Current Lesson</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About This Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground whitespace-pre-line">
                    {module.description}
                  </p>
                  
                  {module.prerequisiteIds && module.prerequisiteIds.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Prerequisites</h3>
                      <p className="text-muted-foreground">
                        To get the most out of this module, we recommend completing these modules first:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                        {/* This would need to be implemented with a separate query to get prerequisite module details */}
                        <li>Introduction to SEO Fundamentals</li>
                        <li>Search Engine Basics</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">What You'll Learn</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {sortedLessons.slice(0, 5).map((lesson) => (
                        <li key={lesson.id} className="ml-2">
                          {lesson.title}
                        </li>
                      ))}
                      {sortedLessons.length > 5 && (
                        <li className="text-muted-foreground italic">
                          And {sortedLessons.length - 5} more lessons...
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setActiveTab("lessons")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All Lessons
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="lessons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Module Lessons</CardTitle>
                  <CardDescription>
                    Complete all lessons to master the module
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLessonsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2">Loading lessons...</span>
                    </div>
                  ) : lessonsError || !sortedLessons || sortedLessons.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No lessons found for this module.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedLessons.map((lesson, index) => {
                        const progress = getLessonProgress(lesson.id);
                        const isCompleted = progress?.status === 'completed';
                        const isInProgress = progress?.status === 'in_progress';
                        
                        return (
                          <div 
                            key={lesson.id} 
                            className={`p-4 border rounded-md ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-3">
                                <div className={`flex items-center justify-center h-6 w-6 rounded-full text-white text-xs ${isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}>
                                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                </div>
                                <div>
                                  <h3 className="font-medium">{lesson.title}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {lesson.description}
                                  </p>
                                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTime(lesson.estimatedTime)}
                                  </div>
                                </div>
                              </div>
                              
                              <Button
                                variant={isCompleted ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleStartLesson(lesson.id)}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Review
                                  </>
                                ) : isInProgress ? (
                                  <>
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    Continue
                                  </>
                                ) : (
                                  <>
                                    <BookMarked className="h-4 w-4 mr-1" />
                                    Start
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {isInProgress && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Progress: {progress?.completionPercentage || 0}%</span>
                                </div>
                                <Progress value={progress?.completionPercentage || 0} className="h-1" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
                {userProgress && lessons && (
                  <CardFooter className="flex justify-between border-t p-4 bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">Module Progress</p>
                      <div className="flex items-center mt-1">
                        <Progress value={calculateModuleProgress()} className="w-32 h-2 mr-2" />
                        <span className="text-sm">{calculateModuleProgress()}%</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        const nextLessonId = getNextIncompleteLesson();
                        if (nextLessonId) handleStartLesson(nextLessonId);
                      }}
                      disabled={!getNextIncompleteLesson()}
                    >
                      {calculateModuleProgress() === 100 ? (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Review Module
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Continue Learning
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="lesson" className="space-y-4">
              {isLessonLoading || !selectedLesson ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading lesson content...</span>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab("lessons")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Lessons
                      </Button>
                      
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(selectedLesson.estimatedTime)}
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{selectedLesson.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    {selectedLesson.videoUrl && (
                      <div className="mb-6 aspect-video">
                        <iframe
                          width="100%"
                          height="100%"
                          src={selectedLesson.videoUrl}
                          title={selectedLesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-md"
                        ></iframe>
                      </div>
                    )}
                    
                    <div className="prose max-w-none">
                      {/* This should be rendered as markdown or HTML depending on how content is structured */}
                      <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                    </div>
                    
                    {quizzes && quizzes.length > 0 && (
                      <div className="mt-8 border-t pt-6">
                        <h3 className="text-xl font-bold mb-4">Knowledge Check</h3>
                        <div className="space-y-6">
                          {quizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-gray-50 p-4 rounded-md">
                              <h4 className="font-medium mb-3">{quiz.question}</h4>
                              <div className="space-y-2">
                                {/* This would need to be expanded into a proper interactive quiz component */}
                                {quiz.options.map((option, index) => (
                                  <div 
                                    key={index} 
                                    className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
                                  >
                                    <input 
                                      type="radio" 
                                      name={`quiz-${quiz.id}`} 
                                      id={`quiz-${quiz.id}-option-${index}`} 
                                      className="h-4 w-4"
                                    />
                                    <label 
                                      htmlFor={`quiz-${quiz.id}-option-${index}`}
                                      className="flex-grow cursor-pointer"
                                    >
                                      {option}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6">
                          <Button className="mr-2">Check Answers</Button>
                          <Button variant="outline">Skip Quiz</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("lessons")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Lessons
                    </Button>
                    
                    <Button 
                      onClick={() => handleCompleteLesson(selectedLesson.id)}
                      disabled={updateProgressMutation.isPending}
                    >
                      {updateProgressMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          {/* Module sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Module Completion</span>
                        <span>{calculateModuleProgress()}%</span>
                      </div>
                      <Progress value={calculateModuleProgress()} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Lessons Completed</h4>
                      <div className="flex justify-between text-sm">
                        <span>{userProgress ? userProgress.filter(p => p.status === 'completed').length : 0}/{sortedLessons.length}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          const nextLessonId = getNextIncompleteLesson();
                          if (nextLessonId) handleStartLesson(nextLessonId);
                        }}
                        disabled={!getNextIncompleteLesson()}
                      >
                        {calculateModuleProgress() === 100 ? (
                          <>
                            <Award className="h-4 w-4 mr-2" />
                            Review Module
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continue Learning
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Sign in to track progress</p>
                  <p className="text-xs text-muted-foreground mb-4">Keep track of your learning journey</p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/api/login")}>
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Module Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedLessons.map((lesson, index) => {
                  const progress = getLessonProgress(lesson.id);
                  const isCompleted = progress?.status === 'completed';
                  const isInProgress = progress?.status === 'in_progress';
                  const isActive = selectedLessonId === lesson.id;
                  
                  return (
                    <div 
                      key={lesson.id}
                      className={`p-2 border rounded text-sm cursor-pointer hover:bg-gray-50 ${isActive ? 'border-blue-300 bg-blue-50' : ''} ${isCompleted ? 'border-green-200' : ''}`}
                      onClick={() => handleStartLesson(lesson.id)}
                    >
                      <div className="flex items-start space-x-2">
                        <div className={`flex items-center justify-center h-5 w-5 rounded-full text-white text-xs mt-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}>
                          {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                        </div>
                        <div className="flex-grow">
                          <p className={`font-medium ${isCompleted ? 'text-gray-600' : ''}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(lesson.estimatedTime)}
                            
                            {isInProgress && !isCompleted && (
                              <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                In progress
                              </Badge>
                            )}
                            
                            {isCompleted && (
                              <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 bg-green-50 text-green-700 border-green-200">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {sortedLessons.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No lessons available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <ListChecks className="h-4 w-4 mr-2" />
                  Module Quiz
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Info className="h-4 w-4 mr-2" />
                  Additional Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}