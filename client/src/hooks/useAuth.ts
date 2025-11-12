import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

export function useAuth() {
  const queryClient = useQueryClient();

  // Check if user is authenticated by calling /api/me OR localStorage fallback for Replit
  const { data: authData, isLoading: isInitialLoading, error: authError } = useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/me', 'GET');
        if (response.ok) {
          const data = await response.json();
          return data;
        }
        
        // Fallback to localStorage for Replit environment
        const storedUser = localStorage.getItem('vittaverde_user');
        const isLoggedIn = localStorage.getItem('vittaverde_logged_in') === 'true';
        
        if (storedUser && isLoggedIn) {
          try {
            const user = JSON.parse(storedUser);
            return { user };
          } catch (e) {
            localStorage.removeItem('vittaverde_user');
            localStorage.removeItem('vittaverde_logged_in');
          }
        }
        
        return null;
      } catch (error) {
        // Fallback to localStorage for Replit environment
        const storedUser = localStorage.getItem('vittaverde_user');
        const isLoggedIn = localStorage.getItem('vittaverde_logged_in') === 'true';
        
        if (storedUser && isLoggedIn) {
          try {
            const user = JSON.parse(storedUser);
            return { user };
          } catch (e) {
            localStorage.removeItem('vittaverde_user');
            localStorage.removeItem('vittaverde_logged_in');
          }
        }
        
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = authData?.user || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password, recaptchaToken }: { email: string; password: string; recaptchaToken?: string }) => {
      const response = await apiRequest('/api/login', 'POST', { email, password, recaptchaToken });
      const jsonData = await response.json();
      return jsonData;
    },
    onSuccess: () => {
      // Invalidate the /api/me query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
      throw error;
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log('registerMutation mutationFn called with:', userData);
      const response = await apiRequest('/api/register', 'POST', userData);
      console.log('registerMutation apiRequest response:', response);
      const jsonData = await response.json();
      console.log('registerMutation parsed JSON:', jsonData);
      return jsonData;
    },
    onSuccess: (data: any) => {
      console.log('Register onSuccess data:', data);
      // Invalidate the /api/me query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
    onError: (error) => {
      console.error('Register error:', error);
      throw error;
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/logout', 'POST');
    },
    onSuccess: () => {
      // Clear all queries and localStorage
      queryClient.clear();
      localStorage.removeItem('vittaverde_user');
      localStorage.removeItem('vittaverde_logged_in');
      localStorage.removeItem('vittaverde_temp_user');
      window.location.href = '/';
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      queryClient.clear();
      localStorage.removeItem('vittaverde_user');
      localStorage.removeItem('vittaverde_logged_in');
      localStorage.removeItem('vittaverde_temp_user');
      window.location.href = '/';
    }
  });

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    const response = await loginMutation.mutateAsync({ email, password, recaptchaToken });
    const user = response.user;
    
    if (user) {
      // Store user data in localStorage for Replit environment compatibility
      localStorage.setItem('vittaverde_user', JSON.stringify(user));
      localStorage.setItem('vittaverde_logged_in', 'true');
      
      console.log('[LOGIN] User data:', { 
        role: user.role, 
        isExternalVendor: user.isExternalVendor,
        affiliateCode: user.affiliateCode 
      });
      
      // Determine target URL based on role and external vendor status
      let targetUrl = "/";
      
      if (user.role === "admin") {
        targetUrl = "/admin";
      } else if (user.isExternalVendor || user.role === "vendor") {
        // Vendedor Externo (Afiliado) - identificado pela flag OU pela role
        console.log('[LOGIN] Redirecting to /vendedor');
        targetUrl = "/vendedor";
      } else if (user.role === "consultant") {
        // Vendedor Interno (Comercial)
        targetUrl = "/comercial";
      } else if (user.role === "doctor") {
        targetUrl = "/medico";
      } else if (user.role === "client" || user.role === "patient") {
        // Check if patient has completed intake
        try {
          const intakeResponse = await apiRequest('/api/check-intake-status', 'GET');
          if (intakeResponse.ok) {
            const { hasCompletedIntake } = await intakeResponse.json();
            targetUrl = hasCompletedIntake ? "/bem-estar" : "/patologias";
          } else {
            targetUrl = "/patologias";
          }
        } catch (error) {
          console.error("Error checking intake status:", error);
          targetUrl = "/patologias";
        }
      } else {
        targetUrl = "/";
      }
      
      console.log('[LOGIN] Final redirect targetUrl:', targetUrl);
      return { user, targetUrl };
    }
    
    return { user };
  };

  const register = async (userData: any) => {
    try {
      console.log('Register function called with:', userData);
      const response = await registerMutation.mutateAsync(userData);
      console.log('Register response:', response);
      return response.user || response;
    } catch (error) {
      console.error('Register function error:', error);
      throw error;
    }
  };

  const loginDirect = (userData: User) => {
    // This function is now deprecated as we rely on server sessions
    console.warn('loginDirect is deprecated - authentication should go through /api/login');
    // Force refresh of authentication state
    queryClient.invalidateQueries({ queryKey: ['/api/me'] });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const hasRole = (requiredRole: string) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  return {
    user,
    isLoggedIn: !!user,
    isLoading: isInitialLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    login,
    register,
    loginDirect, // Deprecated but kept for compatibility
    logout,
    hasRole,
    hasAnyRole,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    authError // Include auth error for debugging
  };
}