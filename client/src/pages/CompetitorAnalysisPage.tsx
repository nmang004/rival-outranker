import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronRight, Globe, MapPin, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Combobox } from '@/components/ui/combobox';
import { US_CITIES } from '@shared/us-cities';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL including https://' }),
  city: z.string().min(2, { message: 'Please select a city' }),
});

export default function CompetitorAnalysisPage() {
  const [, navigate] = useLocation();
  const [selectedCity, setSelectedCity] = useState('');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      city: '',
    },
  });
  
  const cityOptions = US_CITIES.map(city => ({
    value: `${city.city}, ${city.state}`,
    label: `${city.city}, ${city.state}`
  }));
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Submit the form data
      await apiRequest('/api/competitors', {
        method: 'POST',
        data: {
          url: values.url,
          city: values.city,
        },
      });
      
      // Navigate to results page with URL and city parameters
      navigate(`/competitor-results?url=${encodeURIComponent(values.url)}&city=${encodeURIComponent(values.city)}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      form.setError('root', { 
        type: 'manual',
        message: 'Failed to analyze competitors. Please try again.' 
      });
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight gradient-heading">
          Competitor SEO Analysis
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Identify and analyze your top competitors in a specific location to gain strategic SEO insights
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5 text-primary" />
            Competitor Analysis Tool
          </CardTitle>
          <CardDescription>
            Enter your website URL and select a location to analyze your top competitors in that market
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
                    <FormLabel>Your Website URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-grow">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="https://example.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Include the full URL with https://
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Combobox
                          options={cityOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a city"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Choose a city to analyze competitors in that market
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                      Analyze Competitors
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Competitor Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                <span>Identify your top 5 competitors in any location</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                <span>Compare keyword strategies and content gaps</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                <span>Analyze competitor backlink profiles and domain authority</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Local SEO Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                <span>Get location-specific competitor insights</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                <span>Discover local ranking factors and opportunities</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                <span>Uncover local business citations and directory presence</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-muted p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Why Analyze Competitors?</h3>
        <p className="text-muted-foreground mb-4">
          Understanding your competition is critical for SEO success. Our competitor analysis tool helps you:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-background p-4 rounded-md">
            <h4 className="font-medium mb-2">Identify Opportunities</h4>
            <p className="text-sm text-muted-foreground">Discover content and keyword gaps you can target to gain market share</p>
          </div>
          <div className="bg-background p-4 rounded-md">
            <h4 className="font-medium mb-2">Benchmark Performance</h4>
            <p className="text-sm text-muted-foreground">Compare your metrics against industry leaders to set realistic goals</p>
          </div>
          <div className="bg-background p-4 rounded-md">
            <h4 className="font-medium mb-2">Refine Strategy</h4>
            <p className="text-sm text-muted-foreground">Learn from competitor successes and failures to improve your approach</p>
          </div>
        </div>
      </div>
    </div>
  );
}