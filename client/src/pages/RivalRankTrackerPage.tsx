import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart, SearchCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/ui/use-toast";
import { PageHeader } from "../components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { LoginButton } from "@/components/features/auth/LoginButton";

// Form validation schema
const formSchema = z.object({
  keywords: z.string().min(1, {
    message: "Please enter at least one keyword to track",
  }),
  website: z.string().url({
    message: "Please enter a valid website URL including http:// or https://",
  }),
  competitors: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RivalRankTrackerPage() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Mark the page as loaded after initial authentication check
  useEffect(() => {
    if (!isLoading) {
      setPageLoaded(true);
    }
  }, [isLoading]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: "",
      website: "",
      competitors: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    try {
      // Process keywords into array
      const keywordList = values.keywords
        .split(/[\n,]/)
        .map(k => k.trim())
        .filter(k => k !== "");
        
      // Process competitors into array  
      const competitorsList = values.competitors
        ? values.competitors
            .split(/[\n,]/)
            .map(c => c.trim())
            .filter(c => c !== "")
        : [];
      
      console.log("Submitting request to track keywords:", {
        keywords: keywordList,
        website: values.website,
        competitors: competitorsList
      });
      
      // Submit request to track keywords
      const response = await apiRequest("/api/rival-rank-tracker", {
        method: "POST",
        data: {
          keywords: keywordList,
          website: values.website,
          competitors: competitorsList
        }
      });
      
      if (response.data && response.data.id) {
        toast({
          title: "Analysis started!",
          description: "Your keyword tracking analysis is being processed.",
        });
        
        // Navigate to results page with the analysis ID
        navigate(`/rival-rank-tracker-results/${response.data.id}`);
      } else {
        console.error("Invalid response:", response);
        throw new Error("Failed to create analysis");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error starting your analysis. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading spinner while authentication status is being checked
  if (!pageLoaded || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Rival Rank Tracker"
          description="Track your keyword rankings against competitors over time"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <PageHeader
          title="Rival Rank Tracker"
          description="Track your keyword rankings against competitors over time"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <div className="mt-8">
          <Alert className="mb-8">
            <SearchCheck className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              You're using Rival Rank Tracker in demo mode. Log in to save your results.
            </AlertDescription>
          </Alert>
          
          {/* Show both login button and the form */}
          <div className="flex justify-end mb-4">
            <LoginButton />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Track Keywords & Competitors</CardTitle>
              <CardDescription>
                Enter the keywords you want to track, your website, and optionally your competitors
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="keywords" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="keywords">Keywords & Competitors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="keywords" className="mt-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Keywords</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter keywords (one per line or comma-separated)"
                                {...field}
                                rows={5}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the keywords you want to track, one per line or comma-separated
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Website</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://yourwebsite.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your website URL including https://
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="competitors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Competitors (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter competitor websites (one per line or comma-separated)"
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              Optionally add competitor websites to compare rankings
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <CardFooter className="px-0 pb-0">
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Processing...
                            </>
                          ) : (
                            <>Start Tracking</>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <PageHeader
        title="Rival Rank Tracker"
        description="Track your keyword rankings against competitors over time"
        icon={<BarChart className="h-6 w-6 mr-2" />}
      />
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Track Keywords & Competitors</CardTitle>
            <CardDescription>
              Enter the keywords you want to track, your website, and optionally your competitors
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="keywords" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="keywords">Keywords & Competitors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="keywords" className="mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keywords</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter keywords (one per line or comma-separated)"
                              {...field}
                              rows={5}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the keywords you want to track, one per line or comma-separated
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourwebsite.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter your website URL including https://
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="competitors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Competitors (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter competitor websites (one per line or comma-separated)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Optionally add competitor websites to compare rankings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <CardFooter className="px-0 pb-0">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Processing...
                          </>
                        ) : (
                          <>Start Tracking</>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}