import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { UserCircle2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthDialogProps {
  mode?: "login" | "register";
  buttonText?: string;
  buttonIcon?: ReactNode;
  buttonProps?: ButtonProps;
}

export function AuthDialog({ mode = "login", buttonText, buttonIcon, buttonProps }: AuthDialogProps) {
  const { login } = useAuth();
  
  // Default icon based on mode if none is provided
  const icon = buttonIcon || (mode === "login" ? <LogIn className="mr-2 h-5 w-5" /> : <UserCircle2 className="mr-2 h-5 w-5" />);

  // For Replit Auth, we directly redirect to /api/login for both login and register
  const handleAuth = () => {
    login();
  };

  return (
    <Button {...buttonProps} onClick={handleAuth}>
      <span className="flex items-center">
        {icon}
        {buttonText || (mode === "login" ? "Login" : "Register")}
      </span>
    </Button>
  );
}