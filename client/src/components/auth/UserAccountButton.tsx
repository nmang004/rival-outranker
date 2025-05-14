import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { AuthDialog } from "./AuthDialog";
import { LogOut, User, Settings, History, BarChart2 } from "lucide-react";

export function UserAccountButton() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="flex gap-2">
        <AuthDialog 
          mode="login" 
          buttonProps={{ 
            variant: "outline", 
            size: "sm",
            className: "hidden md:flex"
          }} 
        />
        <AuthDialog 
          mode="register" 
          buttonProps={{ 
            size: "sm",
            className: "hidden md:flex"
          }} 
        />
        <AuthDialog 
          mode="login" 
          buttonProps={{ 
            variant: "outline", 
            size: "sm",
            className: "md:hidden"
          }} 
          buttonText="Login" 
        />
      </div>
    );
  }

  // Determine user display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.username || "User";
  };

  // Get avatar initials
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImage || ""} alt={user?.username || "User"} />
            <AvatarFallback className="bg-primary/5 text-primary">{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/analyses">
              <BarChart2 className="mr-2 h-4 w-4" />
              <span>My Analyses</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/history">
              <History className="mr-2 h-4 w-4" />
              <span>History</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/security">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild disabled={isLoggingOut}>
          <div className="flex items-center cursor-pointer" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}