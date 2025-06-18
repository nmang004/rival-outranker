import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Define profile interface
interface ProfileData {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  websiteUrl?: string;
}

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImage: z.string().url("Invalid URL").optional().or(z.string().length(0)),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.string().length(0)),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const updateProfile = async (data: ProfileFormValues) => {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    
    return response.json();
  };

  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ['/api/user/profile'],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      jobTitle: "",
      bio: "",
      websiteUrl: "",
      profileImage: "",
    }
  });
  
  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        company: profile.company || "",
        jobTitle: profile.jobTitle || "",
        bio: profile.bio || "",
        websiteUrl: profile.websiteUrl || "",
        profileImage: profile.profileImage || "",
      });
    }
  }, [profile, form]);

  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (data: ProfileFormValues) => {
    setGeneralError(null);
    try {
      await updateProfile(data);
    } catch (error) {
      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError("An unexpected error occurred");
      }
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      <p className="text-muted-foreground mb-6">
        Update your profile information and preferences
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {generalError && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {generalError}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="profileImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  Enter a URL to an image for your profile picture
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Your job title" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about yourself" 
                    {...field} 
                    value={field.value || ''} 
                    className="min-h-[120px]"
                  />
                </FormControl>
                <FormDescription>
                  {(field.value?.length || 0)}/500 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://yourwebsite.com" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}