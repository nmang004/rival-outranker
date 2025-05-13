import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, FileText, Search, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL including https://' }),
  keywords: z.string().optional(),
  includeHeaders: z.boolean().default(true),
  includeBody: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
  includeImpressions: z.boolean().default(true)
});

export default function DeepContentAnalysisPage() {
  const [, navigate] = useLocation();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      keywords: '',
      includeHeaders: true,
      includeBody: true,
      includeCTA: true,
      includeImpressions: true
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Submit the form data
      await apiRequest('/api/deep-content', {
        method: 'POST',
        data: values,
      });
      
      // Prepare URL parameters
      const params = new URLSearchParams();
      params.append('url', values.url);
      if (values.keywords) params.append('keywords', values.keywords);
      params.append('includeHeaders', values.includeHeaders.toString());
      params.append('includeBody', values.includeBody.toString());
      params.append('includeCTA', values.includeCTA.toString());
      params.append('includeImpressions', values.includeImpressions.toString());
      
      // Navigate to results page with parameters
      navigate(`/deep-content-results?${params.toString()}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      form.setError('root', { 
        type: 'manual',
        message: 'Failed to analyze content. Please try again.' 
      });
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight gradient-heading">
          Deep Content Analysis
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Analyze your content in depth and receive actionable recommendations to improve engagement and SEO impact
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Content Analysis Tool
          </CardTitle>
          <CardDescription>
            Enter your website URL and target keywords to get a deep analysis of your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-grow">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="https://example.com/blog/article-title"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the full URL of the specific page you want to analyze
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Keywords (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your target keywords separated by commas"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Adding keywords helps us analyze how well your content is optimized for them
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Content Sections to Analyze</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="includeHeaders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Headers & Titles</FormLabel>
                          <FormDescription>
                            Analyze headings, titles, and subtitles
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeBody"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Body Content</FormLabel>
                          <FormDescription>
                            Analyze main paragraphs and content blocks
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeCTA"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Call-to-Actions</FormLabel>
                          <FormDescription>
                            Analyze CTAs and conversion points
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeImpressions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>First Impressions</FormLabel>
                          <FormDescription>
                            Analyze reader's first impression factors
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>Analyzing<span className="loading-dots">...</span></>
                  ) : (
                    <>
                      Analyze Content
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              
              {form.formState.errors.root && (
                <div className="p-3 text-sm text-white bg-destructive rounded-md">
                  {form.formState.errors.root.message}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-primary" />
              Comprehensive Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our deep content analyzer evaluates your content's structure, readability, keyword usage, and engagement factors.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Lightbulb className="mr-2 h-4 w-4 text-primary" />
              Actionable Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get specific recommendations for improving each section of your content with clear, implementable suggestions.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-primary" />
              Section-by-Section Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receive targeted feedback for headers, body content, and CTAs separately to focus your optimization efforts.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-muted p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Why Deep Content Analysis Matters</h3>
        <p className="text-muted-foreground mb-4">
          While basic SEO tools focus on technical factors, our deep content analysis evaluates what truly matters to both readers and search engines:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
            <span className="text-sm">Content quality that keeps readers engaged and reduces bounce rates</span>
          </li>
          <li className="flex items-start">
            <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
            <span className="text-sm">Semantic richness that helps search engines understand your topic depth</span>
          </li>
          <li className="flex items-start">
            <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
            <span className="text-sm">Psychological triggers that improve conversion rates and user actions</span>
          </li>
        </ul>
      </div>
    </div>
  );
}