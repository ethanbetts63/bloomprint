"use client";

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import * as api from '@/api';
import { ApiError } from '@/api/ApiError';
import type { UserProfile } from '@/types/UserProfile';
import type { AuthContextType } from '@/types/AuthContextType';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    try {
      const fullProfile = await api.getUserProfile();
      setUser(fullProfile);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : null;
      if (status === 401 || status === 403) {
        localStorage.removeItem('hasSession');
        setUser(null);
      } else {
        console.warn("Failed to fetch user profile due to network/server error. Retaining session.", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('hasSession')) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    const handleAuthFailure = () => {
      console.log("Authentication failure event received. Logging out.");
      logout();
    };

    window.addEventListener('auth-failure', handleAuthFailure);

    return () => {
      window.removeEventListener('auth-failure', handleAuthFailure);
    };
  }, []);

  const handleLoginSuccess = async () => {
    localStorage.setItem('hasSession', '1');
    setIsLoading(true);
    await loadUserProfile();
  };

  const loginWithPassword = async (email: string, password: string) => {
    await api.loginUser(email, password);
    await handleLoginSuccess();
  };

  const logout = async (onLogoutSuccess?: () => void) => {
    localStorage.removeItem('hasSession');
    try {
      await api.logoutUser();
            } catch {
                // A failed refresh is handled below by clearing authentication state.
            }
    setUser(null);
    if (onLogoutSuccess) {
      onLogoutSuccess();
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginWithPassword,
    handleLoginSuccess,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
