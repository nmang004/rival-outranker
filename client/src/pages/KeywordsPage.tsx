import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { ChevronUp, ChevronDown, Minus, RefreshCw, Search, ArrowUpRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  keyword: z.string().min(1, {
    message: "Keyword is required.",
  }),
  targetUrl: z.string().url({
    message: "Target URL must be a valid URL.",
  }),
  projectId: z.number().optional(),
  notes: z.string().optional(),
});

export default function KeywordsPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checkingKeyword, setCheckingKeyword] = useState<number | null>(null);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/api/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: keywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ["/api/keywords"],
    enabled: isAuthenticated,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
      targetUrl: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to add keyword");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      setIsDialogOpen(false);
      toast({
        title: "Keyword Added",
        description: `Successfully added keyword: ${values.keyword}`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add keyword. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkRanking = async (keywordId: number) => {
    try {
      setCheckingKeyword(keywordId);
      const response = await fetch(`/api/keywords/${keywordId}/check-ranking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check keyword ranking");
      }

      const data = await response.json();
      
      // Invalidate rankings data to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/rankings`] });
      
      toast({
        title: "Ranking Checked",
        description: data.rank 
          ? `Current ranking position: ${data.rank}` 
          : "Not found in top search results",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check keyword ranking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingKeyword(null);
    }
  };

  const handleKeywordClick = (keywordId: number) => {
    navigate(`/keywords/${keywordId}`);
  };

  if (authLoading) {
    return <div className="container py-8">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirect will happen via the useEffect
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Keyword Tracking</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Keyword</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add a New Keyword</DialogTitle>
              <DialogDescription>
                Enter the details for the keyword you want to track.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="keyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SEO best practices" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the keyword phrase you want to track.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com/page" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL of the page you want to rank for this keyword.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!projectsLoading && projects && projects.length > 0 && (
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project (Optional)</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          >
                            <option value="">Select a project</option>
                            {projects.map((project: any) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormDescription>
                          Associate this keyword with a project.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any notes about this keyword..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Keyword</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All Keywords</TabsTrigger>
          <TabsTrigger value="ranking">Rankings</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {keywordsLoading ? (
            <KeywordsLoadingSkeleton />
          ) : keywords && keywords.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableCaption>A list of your tracked keywords.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Current Rank</TableHead>
                    <TableHead>Previous Rank</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword: any) => (
                    <TableRow key={keyword.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleKeywordClick(keyword.id)}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {new URL(keyword.targetUrl).hostname}
                      </TableCell>
                      <TableCell>
                        {keyword.latestRanking ? (
                          keyword.latestRanking.rank || "-"
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.latestRanking?.previousRank || "-"}
                      </TableCell>
                      <TableCell>
                        {keyword.latestRanking && keyword.latestRanking.previousRank && keyword.latestRanking.rank ? (
                          <RankChange 
                            current={keyword.latestRanking.rank} 
                            previous={keyword.latestRanking.previousRank} 
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.latestRanking ? 
                          new Date(keyword.latestRanking.rankDate).toLocaleDateString() : 
                          "Never"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            checkRanking(keyword.id);
                          }}
                          disabled={checkingKeyword === keyword.id}
                        >
                          {checkingKeyword === keyword.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Check Rank
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyKeywords />
          )}
        </TabsContent>
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Rankings</CardTitle>
              <CardDescription>
                Track how your keywords are performing over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-10">
                Click on a keyword to view detailed ranking history and competitor analysis.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Suggestions</CardTitle>
              <CardDescription>
                Discover new keyword opportunities related to your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input placeholder="Enter a seed keyword..." className="max-w-sm" />
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Generate Ideas
                </Button>
              </div>
              <p className="text-gray-500 text-center py-10">
                Enter a base keyword to generate relevant keyword suggestions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankChange({ current, previous }: { current: number; previous: number }) {
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <div className="flex items-center text-green-600">
        <ChevronUp className="h-4 w-4 mr-1" />
        <span>+{diff}</span>
      </div>
    );
  } else if (diff < 0) {
    return (
      <div className="flex items-center text-red-600">
        <ChevronDown className="h-4 w-4 mr-1" />
        <span>{diff}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-600">
        <Minus className="h-4 w-4 mr-1" />
        <span>0</span>
      </div>
    );
  }
}

function EmptyKeywords() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Keywords Found</CardTitle>
        <CardDescription>
          You haven't added any keywords to track yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <p className="text-center text-gray-500 mb-4">
          Start tracking your keyword rankings by adding your first keyword.
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ArrowUpRight className="h-4 w-4" />
          <span>Click the "Add Keyword" button above to get started.</span>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}