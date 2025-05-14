import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronRight, Globe, MapPin, Search, BarChart3, LineChart, PieChart, TrendingUp, Trophy, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Combobox } from '../components/ui/combobox';
import { US_CITIES } from '@shared/us-cities';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL including https://' }),
  city: z.string().min(2, { message: 'Please select a city' }),
});

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0
  }
};

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
  
  // Create city options with a unique id for each city to prevent duplicate key warnings
  const cityOptions = US_CITIES.map((city, index) => ({
    value: `${city.city}, ${city.state}`,
    label: `${city.city}, ${city.state}`,
    id: `${city.city}-${city.state}-${index}` // Add unique id for key
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
      
      // Navigate to the main results page instead of a separate competitor results page
      // This ensures all analysis data is shown in one place
      navigate(`/results?url=${encodeURIComponent(values.url)}`);
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
      <motion.div 
        className="text-center mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-4xl font-bold tracking-tight gradient-heading mb-2">
          Competitor SEO Analysis
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          Identify and analyze your top competitors in a specific location to gain strategic SEO insights
        </p>
      </motion.div>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="mb-8"
      >
        <Card className="overflow-hidden border-primary/10 shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transform -translate-y-8 translate-x-8"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-2xl">
              <Globe className="mr-3 h-6 w-6 text-primary animate-pulse-slow" />
              Competitor Analysis Tool
            </CardTitle>
            <CardDescription className="text-base">
              Enter your website URL and select a location to analyze your top competitors in that market
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium">
                        <Globe className="mr-2 h-4 w-4 text-primary" />
                        Your Website URL
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-grow group">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                            <Input
                              placeholder="https://example.com"
                              className="pl-10 py-6 border-primary/20 focus:border-primary/70 focus:ring-primary/50 transition-all duration-300 group-hover:border-primary/40 bg-white"
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
                      <FormLabel className="flex items-center text-sm font-medium">
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        Location
                      </FormLabel>
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
                
                <div className="pt-4 flex justify-end">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button 
                      type="submit" 
                      className="px-6 py-6 h-auto bg-gradient-to-r from-primary to-primary/70 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300" 
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <svg className="animate-spin mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing<span className="loading-dots">...</span>
                        </>
                      ) : (
                        <>
                          Analyze Competitors
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
                
                {form.formState.errors.root && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 text-sm text-white bg-destructive rounded-md shadow-md"
                  >
                    {form.formState.errors.root.message}
                  </motion.div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={item}>
          <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-primary" />
                Competitor Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <motion.li variants={item} className="flex items-start">
                  <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Identify your top 5 competitors in any location</span>
                </motion.li>
                <motion.li variants={item} className="flex items-start">
                  <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Compare keyword strategies and content gaps</span>
                </motion.li>
                <motion.li variants={item} className="flex items-start">
                  <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Analyze competitor backlink profiles and domain authority</span>
                </motion.li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Local SEO Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <motion.li variants={item} className="flex items-start">
                  <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Get location-specific competitor insights</span>
                </motion.li>
                <motion.li variants={item} className="flex items-start">
                  <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Discover local ranking factors and opportunities</span>
                </motion.li>
                <motion.li variants={item} className="flex items-start">
                  <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Uncover local business citations and directory presence</span>
                </motion.li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-xl shadow-sm border border-primary/10"
      >
        <h3 className="text-xl font-medium mb-4 gradient-text inline-block">Why Analyze Competitors?</h3>
        <p className="text-muted-foreground mb-6">
          Understanding your competition is critical for SEO success. Our competitor analysis tool helps you:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-5 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-all duration-300"
          >
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <LineChart className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2 text-lg">Identify Opportunities</h4>
            <p className="text-sm text-muted-foreground">Discover content and keyword gaps you can target to gain market share</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-5 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-all duration-300"
          >
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2 text-lg">Benchmark Performance</h4>
            <p className="text-sm text-muted-foreground">Compare your metrics against industry leaders to set realistic goals</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-5 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-all duration-300"
          >
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2 text-lg">Refine Strategy</h4>
            <p className="text-sm text-muted-foreground">Learn from competitor successes and failures to improve your approach</p>
          </motion.div>
        </div>
        
        <div className="mt-8 p-4 border border-primary/20 rounded-lg bg-white shadow-sm">
          <div className="flex items-center mb-2">
            <Users className="mr-2 h-5 w-5 text-primary" />
            <h4 className="font-medium">Pro Tip</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            For the most accurate results, select a city where your business has a physical presence or where most of your customers are located. This helps identify the most relevant competitors in your target market.
          </p>
        </div>
      </motion.div>
    </div>
  );
}