import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type User = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isEmailVerified: boolean;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterCredentials = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type UpdateProfileData = {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  websiteUrl?: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Get the current authenticated user
  const { 
    data: user, 
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser
  } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    onError: () => {
      // Clear any error as we don't want to show error notifications for auth checks
      setAuthError(null);
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await apiRequest('/api/auth/register', 'POST', credentials);
      return response;
    },
    onSuccess: () => {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error: any) => {
      setAuthError(error.message || 'Registration failed');
      toast({
        title: "Registration failed", 
        description: error.message || 'Failed to create account. Please try again.',
        variant: "destructive"
      });
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('/api/auth/login', 'POST', credentials);
      return response;
    },
    onSuccess: () => {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });
    },
    onError: (error: any) => {
      setAuthError(error.message || 'Login failed');
      toast({
        title: "Login failed", 
        description: error.message || 'Invalid username or password.',
        variant: "destructive"
      });
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/logout', 'POST');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully.",
      });
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      const response = await apiRequest('/api/user/profile', 'PUT', profileData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed", 
        description: error.message || 'Failed to update profile. Please try again.',
        variant: "destructive"
      });
    }
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: ChangePasswordData) => {
      const response = await apiRequest('/api/user/change-password', 'PUT', passwordData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password change failed", 
        description: error.message || 'Failed to change password. Please try again.',
        variant: "destructive"
      });
    }
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoadingUser,
    authError,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    refetchUser
  };
}