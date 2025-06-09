import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkGoogleAdsAuthStatus, updateGoogleAdsCredentials, GoogleAdsAuthStatus } from "../lib/googleAdsApi";

// Validation schema for Google Ads API credentials
const googleAdsCredentialsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  developerToken: z.string().min(1, "Developer Token is required"),
  refreshToken: z.string().min(1, "Refresh Token is required"),
  customerId: z.string().min(1, "Customer ID is required"),
});

type GoogleAdsCredentialsFormValues = z.infer<typeof googleAdsCredentialsSchema>;

export default function GoogleAdsCredentialsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<GoogleAdsAuthStatus | null>(null);
  
  const form = useForm<GoogleAdsCredentialsFormValues>({
    resolver: zodResolver(googleAdsCredentialsSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      developerToken: "",
      refreshToken: "",
      customerId: "",
    },
  });

  // Check Google Ads API auth status on component mount
  useEffect(() => {
    async function checkStatus() {
      try {
        setStatusLoading(true);
        const status = await checkGoogleAdsAuthStatus();
        setAuthStatus(status);
      } catch (error) {
        console.error("Error checking Google Ads API status:", error);
        toast({
          title: "Error",
          description: "Failed to check Google Ads API status",
          variant: "destructive",
        });
      } finally {
        setStatusLoading(false);
      }
    }

    checkStatus();
  }, [toast]);

  const onSubmit = async (values: GoogleAdsCredentialsFormValues) => {
    try {
      setLoading(true);
      
      const response = await updateGoogleAdsCredentials(values);
      
      toast({
        title: "Success",
        description: "Google Ads API credentials have been updated",
      });
      
      // Refresh status
      const status = await checkGoogleAdsAuthStatus();
      setAuthStatus(status);
      
    } catch (error) {
      console.error("Error updating Google Ads API credentials:", error);
      toast({
        title: "Error",
        description: "Failed to update Google Ads API credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Google Ads API Credentials</CardTitle>
        <CardDescription>
          Configure your Google Ads API credentials to use the Google Keyword Planner data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Status Alert */}
        {!statusLoading && authStatus && (
          <Alert 
            className="mb-6" 
            variant={authStatus.isReady ? "default" : "destructive"}
          >
            {authStatus.isReady ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {authStatus.isReady ? "Ready" : "Configuration Required"}
            </AlertTitle>
            <AlertDescription>
              {authStatus.message}
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Google OAuth Client ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    From the Google Cloud Console OAuth 2.0 Client ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your Google OAuth Client Secret" {...field} />
                  </FormControl>
                  <FormDescription>
                    The client secret associated with your OAuth Client ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="developerToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Developer Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Google Ads Developer Token" {...field} />
                  </FormControl>
                  <FormDescription>
                    From the Google Ads API Center
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="refreshToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Your OAuth Refresh Token" {...field} />
                  </FormControl>
                  <FormDescription>
                    Generated through the OAuth authentication flow
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Google Ads Customer ID (e.g., 123-456-7890)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your Google Ads account ID in format XXX-XXX-XXXX
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Save Credentials"}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            These credentials are required to access the Google Ads API and Keyword Planner data. If you don't have these credentials yet, please follow{" "}
            <a 
              href="https://developers.google.com/google-ads/api/docs/oauth/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google's documentation
            </a>{" "}
            to set them up.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}