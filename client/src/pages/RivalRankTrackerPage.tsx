import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightIcon, SearchIcon, ChartIcon, BarChart } from "lucide-react";

// Form schema with validation
const formSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  targetUrl: z.string().url("Please enter a valid URL").min(1, "Target URL is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RivalRankTrackerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/api/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
      targetUrl: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to track keywords",
        variant: "destructive",
      });
      navigate("/api/login");
      return;
    }

    try {
      setIsSubmitting(true);
      // Create a new keyword to track
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add keyword for tracking");
      }

      const keyword = await response.json();
      
      // Check ranking immediately
      const rankResponse = await fetch(`/api/keywords/${keyword.id}/check-ranking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!rankResponse.ok) {
        throw new Error("Failed to check keyword ranking");
      }

      // Navigate to results page with the new keyword ID
      navigate(`/rival-rank-tracker-results/${keyword.id}`);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to track keyword",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="h-40 bg-slate-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl gradient-heading">
          Rival Rank Tracker
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Track keyword rankings over time, monitor competitors, and get valuable SEO insights.
        </p>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-xl">Track a New Keyword</CardTitle>
          <CardDescription>
            Enter a keyword and target URL to start tracking rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Enter the keyword to track (e.g., 'SEO services')"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the primary keyword you want to track in search results.
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
                      <Input
                        placeholder="https://example.com/page-to-rank"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The URL you want to rank for this keyword (your website or page URL).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this keyword"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center pt-2">
                <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <BarChart className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Track Keyword
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-primary/5 text-sm text-slate-500">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-primary" />
              <span>Rankings update daily</span>
            </div>
            <span>Powered by the Google Search API</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}