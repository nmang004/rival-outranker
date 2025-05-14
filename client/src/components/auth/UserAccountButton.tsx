import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthDialog } from "./AuthDialog";
import { Link } from "wouter";

export function UserAccountButton() {
  const { user, isAuthenticated, logout, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return (
      <Button variant="ghost" className="w-9 px-0" disabled>
        <span className="sr-only">Loading account</span>
        <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex gap-2">
        <AuthDialog 
          mode="login" 
          buttonProps={{ variant: "ghost" }} 
          buttonText="Login"
        />
        <AuthDialog 
          mode="register" 
          buttonProps={{ variant: "default" }} 
          buttonText="Register"
        />
      </div>
    );
  }

  // Generate initials for avatar fallback
  const getInitials = (): string => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImage || ""} alt={user?.username || "User"} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/projects">My Projects</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/analyses">My Analyses</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}