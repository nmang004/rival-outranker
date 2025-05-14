import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmNewPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const { toast } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (data: PasswordChangeFormValues) => {
    setGeneralError(null);
    try {
      // Remove confirm password from data sent to API
      const { confirmNewPassword, ...passwordData } = data;
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Reset form after successful change
      form.reset();
      
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError("An unexpected error occurred");
      }
      
      toast({
        title: "Error changing password",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      <p className="text-muted-foreground mb-6">
        Update your password to keep your account secure
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {generalError && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {generalError}
            </div>
          )}

          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
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
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}