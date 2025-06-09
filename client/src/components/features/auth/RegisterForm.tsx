import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader2, UserCircle2 } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { login, isLoggingIn, authError } = useAuth();

  const handleRegister = async () => {
    try {
      await login();  // For Replit Auth, register is the same as login
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="space-y-4">
      {authError && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
          {authError}
        </div>
      )}

      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Create an account using your Replit credentials to track your SEO progress
        </p>
      </div>

      <Button 
        onClick={handleRegister} 
        className="w-full py-6" 
        size="lg" 
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserCircle2 className="mr-2 h-5 w-5" />
            Sign up with Replit
          </>
        )}
      </Button>
    </div>
  );
}