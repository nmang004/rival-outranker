import { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileSearch, Info, Sparkles, Check, ArrowRight, Zap } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { urlFormSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Extend the URL form schema for deep content analysis
const deepContentFormSchema = urlFormSchema.extend({
  keywords: z.string().optional(),
  includeHeaders: z.boolean().default(true),
  includeBody: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
  includeImpressions: z.boolean().default(true),
});

type FormValues = z.infer<typeof deepContentFormSchema>;

export default function DeepContentAnalysisPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get URL from query params if provided
  const urlFromParams = new URLSearchParams(window.location.search).get('url') || '';

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(deepContentFormSchema),
    defaultValues: {
      url: urlFromParams,
      keywords: '',
      includeHeaders: true,
      includeBody: true,
      includeCTA: true,
      includeImpressions: true,
    },
  });

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('/api/deep-content', {
        method: 'POST',
        data: values,
      });
    },
    onSuccess: (data, variables) => {
      // Navigate to results page with parameters
      const { url, keywords, includeHeaders, includeBody, includeCTA, includeImpressions } = variables;
      const params = new URLSearchParams();
      params.set('url', url);
      if (keywords) params.set('keywords', keywords);
      params.set('includeHeaders', includeHeaders.toString());
      params.set('includeBody', includeBody.toString());
      params.set('includeCTA', includeCTA.toString());
      params.set('includeImpressions', includeImpressions.toString());
      
      setLocation(`/deep-content-results?${params.toString()}`);
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: 'There was an error analyzing the URL. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    },
  });

  function onSubmit(values: FormValues) {
    setLoading(true);
    mutation.mutate(values);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight gradient-heading">
          Deep Content Analysis
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Get comprehensive insights into your content structure, readability, and engagement
        </p>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSearch className="mr-2 h-5 w-5 text-primary" />
            Enter URL for Content Analysis
          </CardTitle>
          <CardDescription>
            Our AI will analyze content structure, readability, semantic relevance, and provide detailed annotations
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
                      <Input
                        placeholder="https://example.com/blog-post"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the full URL of the page you want to analyze
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
                    <FormLabel className="flex items-center">
                      Target Keywords
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p>Adding target keywords helps analyze how well your content is optimized for these terms. Leave blank to auto-detect from content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., content marketing, SEO best practices"
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Enter your target keywords separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className="text-sm font-medium mb-3">Analysis Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <FormField
                      control={form.control}
                      name="includeHeaders"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="includeHeaders"
                            />
                          </FormControl>
                          <Label htmlFor="includeHeaders" className="font-normal cursor-pointer">
                            Headers Analysis
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <FormField
                      control={form.control}
                      name="includeBody"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="includeBody"
                            />
                          </FormControl>
                          <Label htmlFor="includeBody" className="font-normal cursor-pointer">
                            Body Content Analysis
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <FormField
                      control={form.control}
                      name="includeCTA"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="includeCTA"
                            />
                          </FormControl>
                          <Label htmlFor="includeCTA" className="font-normal cursor-pointer">
                            Call-to-Action Analysis
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <FormField
                      control={form.control}
                      name="includeImpressions"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="includeImpressions"
                            />
                          </FormControl>
                          <Label htmlFor="includeImpressions" className="font-normal cursor-pointer">
                            First Impression Analysis
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze Content Structure
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col space-y-4 pt-6">
          <div className="text-sm text-muted-foreground">
            <h3 className="font-medium text-foreground mb-2">What to expect from Deep Content Analysis:</h3>
            <ul className="space-y-1">
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Detailed content structure evaluation with actionable recommendations</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Readability metrics with suggestions for improving clarity and comprehension</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Semantic relevance assessment to ensure content aligns with target topics</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                <span>Specific annotations highlighting issues and opportunities in your content</span>
              </li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}