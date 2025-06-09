import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RankTrackerFormProps, RankTrackerFormData } from '../types/rankTracker.types';

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

export const RankTrackerForm: React.FC<RankTrackerFormProps> = ({ 
  config, 
  onSubmit, 
  isSubmitting 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: "",
      website: "",
      competitors: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      website: values.website,
      keywords: values.keywords,
      competitors: values.competitors,
    });
  };

  // Simple form variant (no React Hook Form)
  if (config.variant === 'simple') {
    return <SimpleFormVariant config={config} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
  }

  // Advanced form with full validation
  return (
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
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter keywords (one per line or comma-separated)&#10;SEO best practices&#10;keyword research tool&#10;content optimization"
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
                          placeholder="Enter competitor websites (one per line or comma-separated)&#10;competitor1.com&#10;competitor2.com"
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
  );
};

// Simple form variant without React Hook Form
const SimpleFormVariant: React.FC<RankTrackerFormProps> = ({ config, onSubmit, isSubmitting }) => {
  const [website, setWebsite] = React.useState("");
  const [keywords, setKeywords] = React.useState("");
  const [competitors, setCompetitors] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ website, keywords, competitors });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create New Tracking Analysis</CardTitle>
          <CardDescription>
            Enter your website, keywords, and competitors to track rankings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Your Website</Label>
            <Input
              id="website"
              placeholder="https://yourwebsite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (one per line)</Label>
            <Textarea
              id="keywords"
              placeholder="SEO best practices&#10;keyword research tool&#10;on-page optimization"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={5}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter each keyword on a new line or separated by commas
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="competitors">Competitors (one per line)</Label>
            <Textarea
              id="competitors"
              placeholder="competitor1.com&#10;competitor2.com&#10;competitor3.com"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Enter competitor domains to compare rankings
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Track Rankings
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};