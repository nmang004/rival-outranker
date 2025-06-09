import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Scan, FileSearch, Clipboard, CheckCircle2, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/ui/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema for URL submission
const rivalAuditFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type RivalAuditFormValues = z.infer<typeof rivalAuditFormSchema>;

export default function RivalAuditPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<RivalAuditFormValues>({
    resolver: zodResolver(rivalAuditFormSchema),
    defaultValues: {
      url: "",
    },
  });

  async function onSubmit(values: RivalAuditFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("/api/rival-audit", {
        method: "POST",
        data: { url: values.url },
      });
      
      // Redirect to results page with audit ID and URL for refresh capability
      navigate(`/rival-audit-results?id=${response.id}&url=${encodeURIComponent(values.url)}`);
      
    } catch (error) {
      console.error("Error starting rival audit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start the rival audit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-heading mb-3 sm:mb-4">Rival SEO Audit</h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
            Perform a comprehensive SEO audit for client websites and generate a detailed report with actionable recommendations.
          </p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Website URL</CardTitle>
            <CardDescription>
              We'll crawl the entire domain and generate a comprehensive audit report
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
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="https://example.com"
                            {...field}
                            className="flex-1"
                          />
                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                          >
                            {isSubmitting ? "Starting..." : "Start Audit"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-primary" />
                Complete Site Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our audit crawls the entire domain to provide a comprehensive analysis of all pages, including structure, navigation, and content.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="w-5 h-5 mr-2 text-primary" />
                SEO Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Evaluates the site against key SEO best practices, identifying critical issues, opportunities for improvement, and areas of strength.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clipboard className="w-5 h-5 mr-2 text-primary" />
                Interactive Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View findings in an interactive dashboard with expandable sections for each audit category and detailed recommendations.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSearch className="w-5 h-5 mr-2 text-primary" />
                Excel Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Export the complete audit report to Excel format with all categories, findings, and recommendations for client delivery.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Audit Categories</CardTitle>
              <CardDescription>The Rival Audit covers key areas of SEO performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">On-Page SEO</h3>
                    <p className="text-sm text-muted-foreground">User experience, readability, calls to action, content quality</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Structure & Navigation</h3>
                    <p className="text-sm text-muted-foreground">URL structure, navigation, page titles, meta descriptions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Contact Page</h3>
                    <p className="text-sm text-muted-foreground">Business information, forms, phone numbers, maps</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Service Pages</h3>
                    <p className="text-sm text-muted-foreground">Detailed service information, calls to action, structure</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Location Pages</h3>
                    <p className="text-sm text-muted-foreground">Local SEO, address information, maps, geographic relevance</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Service Area Pages</h3>
                    <p className="text-sm text-muted-foreground">Geographic targeting, city pages, local information</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground mb-2">
                Each item is evaluated on a four-point scale:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                <div className="text-sm border border-destructive/50 bg-destructive/10 rounded p-2 text-center">
                  Priority OFI
                </div>
                <div className="text-sm border border-yellow-500/50 bg-yellow-500/10 rounded p-2 text-center">
                  OFI
                </div>
                <div className="text-sm border border-green-500/50 bg-green-500/10 rounded p-2 text-center">
                  OK
                </div>
                <div className="text-sm border border-gray-500/50 bg-gray-500/10 rounded p-2 text-center">
                  N/A
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}