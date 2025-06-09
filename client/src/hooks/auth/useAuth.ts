import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface LoginCredentials {
  username: string;
  password: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // For Replit Auth, login redirects to /api/login
  const login = async (_credentials?: LoginCredentials) => {
    setIsLoggingIn(true);
    try {
      window.location.href = '/api/login';
    } catch (error) {
      setAuthError("Login failed. Please try again.");
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // For Replit Auth, logout redirects to /api/logout
  const logout = async () => {
    setIsLoggingOut(true);
    try {
      window.location.href = '/api/logout';
    } catch (error) {
      setAuthError("Logout failed. Please try again.");
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    isLoggingIn,
    isLoggingOut,
    authError
  };
}