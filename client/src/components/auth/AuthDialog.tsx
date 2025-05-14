import { useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle2, LogIn } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AuthDialogProps {
  mode?: "login" | "register";
  buttonText?: string;
  buttonIcon?: ReactNode;
  buttonProps?: ButtonProps;
}

export function AuthDialog({ mode = "login", buttonText, buttonIcon, buttonProps }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">(mode);

  const closeDialog = () => {
    setOpen(false);
  };
  
  // Default icon based on mode if none is provided
  const icon = buttonIcon || (mode === "login" ? <LogIn className="mr-2 h-5 w-5" /> : <UserCircle2 className="mr-2 h-5 w-5" />);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...buttonProps}>
          <span className="flex items-center">
            {icon}
            {buttonText || (mode === "login" ? "Login" : "Register")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Welcome Back" : "Create an Account"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {activeTab === "login" 
                ? "Sign in to access your account and SEO analysis tools" 
                : "Register to save your analyses and track your SEO progress"}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={closeDialog} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={closeDialog} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}