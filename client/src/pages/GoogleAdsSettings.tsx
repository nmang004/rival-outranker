import React from "react";
import PageHeader from "@/components/PageHeader";
import GoogleAdsCredentialsForm from "@/components/GoogleAdsCredentialsForm";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { Settings, KeySquare, ArrowLeft } from "lucide-react";

export default function GoogleAdsSettings() {
  const { isAuthenticated, isLoading } = useAuth();

  // If not authenticated, show a message to log in
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to access Google Ads API settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Please log in to configure your Google Ads API credentials and access the Keyword Planner data.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/api/login">Log In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <PageHeader
        title="Google Ads API Settings"
        icon={<Settings className="w-8 h-8 text-primary" />}
        description="Configure your Google Ads API credentials to access Keyword Planner data"
      />
      
      <div className="flex gap-2 items-center mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/keyword-research">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Keyword Research
          </Link>
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <GoogleAdsCredentialsForm />
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Why Use Google Ads API?</CardTitle>
              <CardDescription>
                Benefits of connecting to the Google Ads API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Direct Access to Keyword Planner</h3>
                <p className="text-muted-foreground">
                  Get the most accurate and up-to-date keyword data directly from Google's official Keyword Planner tool.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">More Accurate Search Volume</h3>
                <p className="text-muted-foreground">
                  Access the same search volume data that advertisers use to plan their campaigns.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Competitive Intelligence</h3>
                <p className="text-muted-foreground">
                  Get insights into keyword competition and CPC bids from Google's advertising platform.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Historical Trend Data</h3>
                <p className="text-muted-foreground">
                  Access 12-month historical trends directly from Google to identify seasonal patterns.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>How to Get Your Credentials</CardTitle>
              <CardDescription>
                Step-by-step guide to obtaining Google Ads API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <span className="font-medium">Create a Google Cloud project</span>
                  <p className="text-sm text-muted-foreground ml-6">
                    Go to the Google Cloud Console and create a new project.
                  </p>
                </li>
                
                <li>
                  <span className="font-medium">Enable the Google Ads API</span>
                  <p className="text-sm text-muted-foreground ml-6">
                    In your Google Cloud project, navigate to "APIs &amp; Services" &rarr; "Library" and enable the Google Ads API.
                  </p>
                </li>
                
                <li>
                  <span className="font-medium">Configure OAuth consent screen</span>
                  <p className="text-sm text-muted-foreground ml-6">
                    Set up the OAuth consent screen with your app information and add the required scopes.
                  </p>
                </li>
                
                <li>
                  <span className="font-medium">Create OAuth credentials</span>
                  <p className="text-sm text-muted-foreground ml-6">
                    Create an OAuth 2.0 Client ID and secure the Client ID and Client Secret.
                  </p>
                </li>
                
                <li>
                  <span className="font-medium">Apply for a Developer Token</span>
                  <p className="text-sm text-muted-foreground ml-6">
                    Go to the Google Ads API Center and apply for a developer token for your manager account.
                  </p>
                </li>
                
                <li>
                  <span className="font-medium">Generate a Refresh Token</span>
                  <p className="text-sm text-muted-foreground ml-6">
                    Use an OAuth flow to generate a refresh token with the adwords scope.
                  </p>
                </li>
              </ol>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <a 
                  href="https://developers.google.com/google-ads/api/docs/first-call/overview" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <KeySquare className="w-4 h-4 mr-2" />
                  View Google's Documentation
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}