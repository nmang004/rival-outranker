import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Simplified API request function for this component
const apiRequest = async (url: string, options?: { method?: string; data?: any }) => {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {};
  }
  
  return response.json();
};
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ExternalLink, LinkIcon, Plus, RefreshCw, Search, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MetricCard from "@/components/metrics/MetricCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BacklinksChart } from "@/components/backlinks/BacklinksChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from 'react-helmet';

// Form validation schema
const profileFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  domain: z.string().optional(),
  scanFrequency: z.string().default("weekly"),
  emailAlerts: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Default form values
const defaultValues: Partial<ProfileFormValues> = {
  scanFrequency: "weekly",
  emailAlerts: false,
};

export default function BacklinksPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState("all");
  
  // Form handling
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });
  
  // Type definitions for the API responses
  interface Profile {
    id: number;
    url: string;
    domain: string;
    createdAt: string;
    updatedAt: string;
    lastScanAt: string | null;
    scanFrequency: string;
    emailAlerts: boolean;
    domainAuthority: number | null;
    totalBacklinks: number;
    newBacklinks: number;
    lostBacklinks: number;
    dofollow: number;
    nofollow: number;
  }

  // Fetch backlink profiles
  const { 
    data: profiles = [], 
    isLoading: isLoadingProfiles,
    error: profilesError,
  } = useQuery<Profile[]>({
    queryKey: ['/api/backlinks/profiles'],
    enabled: isAuthenticated, // Only fetch profiles when authenticated
    retry: isAuthenticated ? 3 : 0, // Don't retry if not authenticated
  });
  
  // Fetch backlinks for the selected profile
  const { 
    data: backlinks = [], 
    isLoading: isLoadingBacklinks,
    error: backlinksError,
  } = useQuery({
    queryKey: ['/api/backlinks/profiles', selectedProfileId, 'backlinks', selectedLinkType],
    queryFn: () => 
      apiRequest(`/api/backlinks/profiles/${selectedProfileId}/backlinks?${
        selectedLinkType === 'dofollow' ? 'dofollow=true' : 
        selectedLinkType === 'nofollow' ? 'dofollow=false' : 
        selectedLinkType === 'active' ? 'status=active' :
        selectedLinkType === 'lost' ? 'status=lost' : ''
      }`),
    enabled: !!selectedProfileId && isAuthenticated,
    retry: isAuthenticated ? 3 : 0,
  });
  
  // Fetch outgoing links for the selected profile
  const { 
    data: outgoingLinks = [], 
    isLoading: isLoadingOutgoing,
    error: outgoingError,
  } = useQuery({
    queryKey: ['/api/backlinks/profiles', selectedProfileId, 'outgoing'],
    queryFn: () => apiRequest(`/api/backlinks/profiles/${selectedProfileId}/outgoing`),
    enabled: !!selectedProfileId && activeTab === "outgoing" && isAuthenticated,
    retry: isAuthenticated ? 3 : 0,
  });
  
  // Fetch history for the selected profile
  const { 
    data: history = [], 
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ['/api/backlinks/profiles', selectedProfileId, 'history'],
    queryFn: () => apiRequest(`/api/backlinks/profiles/${selectedProfileId}/history`),
    enabled: !!selectedProfileId && activeTab === "overview" && isAuthenticated,
    retry: isAuthenticated ? 3 : 0,
  });
  
  // Create profile mutation
  const createProfile = useMutation({
    mutationFn: (data: ProfileFormValues) => apiRequest("/api/backlinks/profiles", {
      method: "POST",
      data
    }),
    onSuccess: () => {
      toast({
        title: "Profile Added",
        description: "Your backlink profile has been created successfully.",
      });
      setIsAddProfileOpen(false);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ['/api/backlinks/profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create backlink profile.",
        variant: "destructive",
      });
    },
  });
  
  // Scan outgoing links mutation
  const scanOutgoingLinks = useMutation({
    mutationFn: ({ url, profileId }: { url: string, profileId: number }) => 
      apiRequest("/api/backlinks/scan-outgoing", {
        method: "POST", 
        data: { url, profileId }
      }),
    onSuccess: () => {
      toast({
        title: "Scan Complete",
        description: "Outgoing links have been scanned successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/backlinks/profiles', selectedProfileId, 'outgoing'] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to scan outgoing links.",
        variant: "destructive",
      });
    },
  });
  
  // Update profile stats mutation
  const updateProfileStats = useMutation({
    mutationFn: (profileId: number) => 
      apiRequest(`/api/backlinks/profiles/${profileId}/update-stats`, {
        method: "POST"
      }),
    onSuccess: () => {
      toast({
        title: "Stats Updated",
        description: "Profile statistics have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backlinks/profiles'] });
      if (selectedProfileId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/backlinks/profiles', selectedProfileId, 'backlinks'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/backlinks/profiles', selectedProfileId, 'history'] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile statistics.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: ProfileFormValues) => {
    createProfile.mutate(data);
  };
  
  // Type definitions for the API responses
  interface Profile {
    id: number;
    url: string;
    domain: string;
    createdAt: string;
    updatedAt: string;
    lastScanAt: string | null;
    scanFrequency: string;
    emailAlerts: boolean;
    domainAuthority: number | null;
    totalBacklinks: number;
    newBacklinks: number;
    lostBacklinks: number;
    dofollow: number;
    nofollow: number;
  }
  
  // Get the selected profile
  const selectedProfile = selectedProfileId && Array.isArray(profiles) 
    ? profiles.find((profile) => profile && profile.id === selectedProfileId) 
    : null;
  
  // If user is not authenticated, show a login prompt
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="container py-10">
        <Helmet>
          <title>Backlink Tracker - SEO Analysis Platform</title>
          <meta name="description" content="Monitor and analyze your website's backlinks with our advanced backlink tracking tool. Track new and lost backlinks to improve your SEO strategy." />
        </Helmet>
        
        <h1 className="text-3xl font-bold mb-6">Backlink Tracker</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access the backlink tracking features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              You need to be logged in to track and monitor backlinks for your websites.
            </p>
            <Button onClick={() => login()}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there are no profiles, show the add profile screen
  if (Array.isArray(profiles) && profiles.length === 0 && !isLoadingProfiles) {
    return (
      <div className="container py-10">
        <Helmet>
          <title>Backlink Tracker - SEO Analysis Platform</title>
          <meta name="description" content="Monitor and analyze your website's backlinks with our advanced backlink tracking tool. Track new and lost backlinks to improve your SEO strategy." />
        </Helmet>
        
        <h1 className="text-3xl font-bold mb-6">Backlink Tracker</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Get Started with Backlink Tracking</CardTitle>
            <CardDescription>
              Monitor your website's backlinks to improve your SEO strategy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Backlinks are crucial for SEO success. Add your first website to start tracking:
            </p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of the website you want to track
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scanFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scan Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often should we check for new backlinks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emailAlerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Alerts</FormLabel>
                        <FormDescription>
                          Receive email notifications about new and lost backlinks
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending ? "Adding Profile..." : "Add Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <Helmet>
        <title>Backlink Tracker - SEO Analysis Platform</title>
        <meta name="description" content="Monitor and analyze your website's backlinks with our advanced backlink tracking tool. Track new and lost backlinks to improve your SEO strategy." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Backlink Tracker</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddProfileOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Profile
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-6">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfiles ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile: any) => (
                  <Button
                    key={profile.id}
                    variant={selectedProfileId === profile.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedProfileId(profile.id)}
                  >
                    <span className="truncate">{profile.domain}</span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-3">
          {selectedProfile ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedProfile.domain}</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateProfileStats.mutate(selectedProfileId as number)}
                  disabled={updateProfileStats.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${updateProfileStats.isPending ? 'animate-spin' : ''}`} />
                  Update Stats
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                  title="Total Backlinks" 
                  value={selectedProfile.totalBacklinks || 0}
                  icon={<LinkIcon className="h-4 w-4" />}
                  description="Unique referring URLs"
                />
                <MetricCard 
                  title="Dofollow Links" 
                  value={selectedProfile.dofollow || 0}
                  icon={<ExternalLink className="h-4 w-4" />}
                  description="Links passing authority"
                />
                <MetricCard 
                  title="Nofollow Links" 
                  value={selectedProfile.nofollow || 0}
                  icon={<AlertCircle className="h-4 w-4" />}
                  description="Links with nofollow attribute"
                />
                <MetricCard 
                  title="Domain Authority" 
                  value={selectedProfile.domainAuthority || 'N/A'}
                  icon={<TrendingUp className="h-4 w-4" />}
                  description="Estimated domain strength"
                  help="Domain Authority is a metric that estimates how well a website will rank on search engine result pages."
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
                  <TabsTrigger value="outgoing">Outgoing Links</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Backlink Growth</CardTitle>
                      <CardDescription>
                        Track your backlink acquisition over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingHistory ? (
                        <div className="h-80">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : history.length > 0 ? (
                        <div className="h-80">
                          <BacklinksChart data={history} />
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No data available</AlertTitle>
                          <AlertDescription>
                            We don't have enough historical data yet. Check back after the next scan.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="backlinks">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Backlink Analysis</CardTitle>
                        <Select 
                          value={selectedLinkType} 
                          onValueChange={setSelectedLinkType}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter links" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Links</SelectItem>
                            <SelectItem value="dofollow">Dofollow Only</SelectItem>
                            <SelectItem value="nofollow">Nofollow Only</SelectItem>
                            <SelectItem value="active">Active Links</SelectItem>
                            <SelectItem value="lost">Lost Links</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingBacklinks ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : backlinks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Source</TableHead>
                              <TableHead>Anchor Text</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>First Seen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backlinks.map((link: any) => (
                              <TableRow key={link.id}>
                                <TableCell>
                                  <a 
                                    href={link.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center"
                                  >
                                    {link.sourceDomain}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </TableCell>
                                <TableCell>{link.anchorText || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={link.isDofollow ? "default" : "outline"}>
                                    {link.isDofollow ? "Dofollow" : "Nofollow"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    link.status === 'active' ? "success" : 
                                    link.status === 'lost' ? "destructive" : 
                                    "outline"
                                  }>
                                    {link.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(link.firstDiscovered).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No backlinks found</AlertTitle>
                          <AlertDescription>
                            We haven't detected any backlinks matching your criteria yet.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="outgoing">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Outgoing Links</CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => scanOutgoingLinks.mutate({
                            url: selectedProfile.url,
                            profileId: selectedProfileId as number
                          })}
                          disabled={scanOutgoingLinks.isPending}
                        >
                          <Search className={`h-4 w-4 mr-2 ${scanOutgoingLinks.isPending ? 'animate-spin' : ''}`} />
                          Scan Page
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingOutgoing ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : outgoingLinks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Target Domain</TableHead>
                              <TableHead>Anchor Text</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Checked</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {outgoingLinks.map((link: any) => (
                              <TableRow key={link.id}>
                                <TableCell>
                                  <a 
                                    href={link.targetUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center"
                                  >
                                    {link.targetDomain}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </TableCell>
                                <TableCell>{link.anchorText || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={link.isDofollow ? "default" : "outline"}>
                                    {link.isDofollow ? "Dofollow" : "Nofollow"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    link.status === 'active' ? "success" : 
                                    link.status === 'broken' ? "destructive" : 
                                    "outline"
                                  }>
                                    {link.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(link.lastChecked).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No outgoing links found</AlertTitle>
                          <AlertDescription>
                            Use the "Scan Page" button to detect outgoing links on your page.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select a Profile</CardTitle>
                <CardDescription>
                  Choose a website from the list to view its backlink data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center p-6">
                  <p className="text-center text-muted-foreground">
                    Select a profile from the left sidebar to view detailed backlink analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Add Profile Dialog */}
      <Dialog open={isAddProfileOpen} onOpenChange={setIsAddProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Profile</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the URL of the website you want to track
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scanFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scan Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often should we check for new backlinks
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emailAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Alerts</FormLabel>
                      <FormDescription>
                        Receive email notifications about new and lost backlinks
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending ? "Adding Profile..." : "Add Profile"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}