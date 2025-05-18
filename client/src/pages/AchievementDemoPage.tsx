import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Trophy, 
  Award, 
  Star, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  PartyPopper 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

import AchievementUnlocked from '@/components/learning/AchievementUnlocked';
import QuizCompleted from '@/components/learning/QuizCompleted';
import MilestoneSpark from '@/components/learning/MilestoneSpark';
import { Achievement } from '@/types/learningTypes';

/**
 * Achievement Demo Page - Showcases the different achievement animations and effects
 */
export default function AchievementDemoPage() {
  // Achievement modal state
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement>({
    id: 'demo-achievement',
    title: 'Achievement Master',
    description: 'You unlocked the achievement demo page!',
    icon: 'Trophy',
    rewardPoints: 100,
    trigger: {
      type: 'achievement',
    }
  });
  
  // Quiz completion modal state
  const [showQuizCompleted, setShowQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(85);
  
  // Milestone spark state
  const [showMilestoneSpark, setShowMilestoneSpark] = useState(false);
  const [sparkType, setSparkType] = useState<'lesson' | 'module' | 'quiz' | 'achievement' | 'milestone'>('achievement');
  const [sparkMessage, setSparkMessage] = useState('Achievement unlocked!');
  
  // Trigger achievement modal
  const triggerAchievement = (type: string) => {
    const achievementTypes: Record<string, Achievement> = {
      'module': {
        id: 'module-complete',
        title: 'Module Master',
        description: 'You have completed the SEO Fundamentals module!',
        icon: 'Trophy',
        rewardPoints: 150,
        trigger: {
          type: 'module_complete',
          moduleId: 1,
        }
      },
      'first-lesson': {
        id: 'first-lesson',
        title: 'First Steps',
        description: 'You completed your first lesson. Keep going!',
        icon: 'BookOpen',
        rewardPoints: 50,
        trigger: {
          type: 'first_lesson',
        }
      },
      'streak': {
        id: 'learning-streak',
        title: '7-Day Streak',
        description: 'You\'ve been learning consistently for 7 days!',
        icon: 'Flame',
        rewardPoints: 100,
        trigger: {
          type: 'streak',
          days: 7,
        }
      },
      'perfect-quiz': {
        id: 'perfect-quiz',
        title: 'Perfect Score',
        description: 'You aced a quiz with a perfect 100% score!',
        icon: 'Star',
        rewardPoints: 75,
        trigger: {
          type: 'quiz_complete',
          score: 100,
        }
      },
    };
    
    setCurrentAchievement(achievementTypes[type] || achievementTypes['module']);
    setShowAchievement(true);
  };
  
  // Trigger quiz completion
  const triggerQuizCompletion = (score: number) => {
    setQuizScore(score);
    setShowQuizCompleted(true);
  };
  
  // Trigger milestone spark
  const triggerMilestoneSpark = (type: 'lesson' | 'module' | 'quiz' | 'achievement' | 'milestone', message?: string) => {
    setSparkType(type);
    setSparkMessage(message || `${type.charAt(0).toUpperCase() + type.slice(1)} completed!`);
    setShowMilestoneSpark(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowMilestoneSpark(false);
    }, 3000);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
        Achievement Celebration Demo
      </h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates the gamified achievement sparks with micro-animations and sound effects that celebrate user progress and accomplishments.
      </p>
      
      <Tabs defaultValue="achievements" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz Completion</TabsTrigger>
          <TabsTrigger value="milestones">Milestone Sparks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Celebrations</CardTitle>
              <CardDescription>
                Celebratory popups that appear when users unlock achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">Module Completed</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-center text-muted-foreground pb-2">
                    Celebrates finishing an entire learning module
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => triggerAchievement('module')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">First Lesson</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-center text-muted-foreground pb-2">
                    Celebrates completing the first lesson
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => triggerAchievement('first-lesson')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <Sparkles className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">Learning Streak</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-center text-muted-foreground pb-2">
                    Celebrates consistent learning over time
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => triggerAchievement('streak')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">Perfect Quiz</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-center text-muted-foreground pb-2">
                    Celebrates getting a perfect quiz score
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => triggerAchievement('perfect-quiz')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Completion Celebrations</CardTitle>
              <CardDescription>
                Celebratory popups that appear when users complete quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Trophy className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">Outstanding (100%)</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="w-full space-y-2">
                      <Progress value={100} className="h-2 bg-green-100" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>Passing: 70%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => triggerQuizCompletion(100)}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">Good (85%)</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="w-full space-y-2">
                      <Progress value={85} className="h-2 bg-green-100" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>Passing: 70%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => triggerQuizCompletion(85)}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <CardHeader className="pb-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <CheckCircle2 className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="text-center text-lg mt-2">Failed (60%)</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="w-full space-y-2">
                      <Progress value={60} className="h-2 bg-amber-100" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>Passing: 70%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => triggerQuizCompletion(60)}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Micro-Celebrations</CardTitle>
              <CardDescription>
                Small, unobtrusive notifications that celebrate smaller accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">Lesson Completed</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-2">
                    <Sparkles className="h-8 w-8 text-blue-500 mx-auto" />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => triggerMilestoneSpark('lesson', 'Lesson completed!')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">Module Finished</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-2">
                    <Trophy className="h-8 w-8 text-purple-500 mx-auto" />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => triggerMilestoneSpark('module', 'Module mastered!')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">Quiz Passed</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-2">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto" />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => triggerMilestoneSpark('quiz', 'Quiz completed!')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">Achievement</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-2">
                    <Award className="h-8 w-8 text-green-500 mx-auto" />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => triggerMilestoneSpark('achievement', 'Achievement unlocked!')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">Milestone</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-2">
                    <PartyPopper className="h-8 w-8 text-amber-500 mx-auto" />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => triggerMilestoneSpark('milestone', '3-day streak achieved!')}
                    >
                      Trigger
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Achievement Modal */}
      <AchievementUnlocked
        achievement={currentAchievement}
        isOpen={showAchievement}
        onClose={() => setShowAchievement(false)}
      />
      
      {/* Quiz Completion Modal */}
      <QuizCompleted
        isOpen={showQuizCompleted}
        onClose={() => setShowQuizCompleted(false)}
        score={quizScore}
        passingScore={70}
        moduleTitle="SEO Fundamentals"
        lessonTitle="Understanding Search Engine Basics"
        pointsEarned={quizScore >= 70 ? Math.floor(quizScore * 0.75) : 0}
      />
      
      {/* Milestone Spark */}
      <MilestoneSpark
        type={sparkType}
        message={sparkMessage}
        show={showMilestoneSpark}
        onComplete={() => setShowMilestoneSpark(false)}
      />
    </div>
  );
}