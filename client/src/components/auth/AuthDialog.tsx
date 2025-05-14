import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

type AuthDialogProps = {
  triggerButton?: React.ReactNode;
  mode?: AuthMode;
  buttonProps?: ButtonProps;
  buttonText?: string;
};

export function AuthDialog({
  triggerButton,
  mode = "login",
  buttonProps,
  buttonText,
}: AuthDialogProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(mode);
  const [isOpen, setIsOpen] = useState(false);

  const handleModeSwitch = (newMode: AuthMode) => {
    setAuthMode(newMode);
  };

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            className={cn(
              buttonProps?.variant === "outline"
                ? "border-primary/20 hover:bg-primary/5"
                : ""
            )}
            {...buttonProps}
          >
            {buttonText || (authMode === "login" ? "Login" : "Register")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        {authMode === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onRegisterClick={() => handleModeSwitch("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onLoginClick={() => handleModeSwitch("login")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}