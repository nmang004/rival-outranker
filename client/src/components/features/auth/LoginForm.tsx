import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader2, LogIn } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoggingIn, authError } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Login error:", error);
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
          Quickly and securely log in using your Replit account
        </p>
      </div>

      <Button 
        onClick={handleLogin} 
        className="w-full py-6" 
        size="lg" 
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Logging in...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-5 w-5" />
            Continue with Replit
          </>
        )}
      </Button>
    </div>
  );
}