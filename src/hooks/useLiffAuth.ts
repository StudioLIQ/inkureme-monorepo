/**
 * Custom Hooks for LIFF Authentication
 * Provides session management and auth state handling
 */

import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '@line/liff';
import {
  getUserProfile,
  isUserLoggedIn,
  loginWithLiff,
  logoutUser,
  handleLoginRedirect,
  refreshSession,
  isSessionValid,
  getAccessToken,
  getIdToken,
} from '@/services/liff/authService';
import { isLiffInitialized } from '@/services/liff/liffInitializer';

/**
 * Main authentication hook
 * Manages user authentication state and provides auth methods
 */
export function useLiffAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check authentication status on mount and LIFF initialization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for LIFF to initialize
        const checkInterval = setInterval(() => {
          if (isLiffInitialized()) {
            clearInterval(checkInterval);
            performAuthCheck();
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!isLiffInitialized()) {
            setError(new Error('LIFF initialization timeout'));
            setIsLoading(false);
          }
        }, 5000);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    const performAuthCheck = async () => {
      try {
        // Handle redirect after login
        handleLoginRedirect();

        // Check if user is logged in
        const loggedIn = isUserLoggedIn();
        setIsAuthenticated(loggedIn);

        if (loggedIn) {
          // Check if session is still valid
          if (!isSessionValid()) {
            console.log('Session expired, refreshing...');
            const refreshed = await refreshSession();
            if (!refreshed) {
              setIsAuthenticated(false);
              setUserProfile(null);
              setIsLoading(false);
              return;
            }
          }

          // Fetch user profile
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (redirectUri?: string) => {
    try {
      setError(null);
      await loginWithLiff(redirectUri);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setError(null);
      await logoutUser();
      setIsAuthenticated(false);
      setUserProfile(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    try {
      setError(null);
      const profile = await getUserProfile();
      setUserProfile(profile);
      return profile;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, []);

  return {
    isAuthenticated,
    userProfile,
    isLoading,
    error,
    login,
    logout,
    refreshProfile,
  };
}

/**
 * Hook for protected routes
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectTo: string = '/') {
  const { isAuthenticated, isLoading } = useLiffAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);

      // Store intended destination
      sessionStorage.setItem('auth_redirect', window.location.pathname);

      // Redirect to login with return URL
      loginWithLiff(window.location.origin + redirectTo);
    }
  }, [isAuthenticated, isLoading, isRedirecting, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook for conditional rendering based on auth state
 * Provides convenient boolean flags for UI state management
 */
export function useAuthState() {
  const { isAuthenticated, userProfile, isLoading, error } = useLiffAuth();

  return {
    isGuest: !isLoading && !isAuthenticated,
    isUser: !isLoading && isAuthenticated && !!userProfile,
    isLoading,
    hasError: !!error,
    error,
  };
}

/**
 * Hook for accessing auth tokens
 * Provides access and ID tokens for API calls
 */
export function useAuthTokens() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const { isAuthenticated } = useLiffAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setAccessToken(getAccessToken());
      setIdToken(getIdToken());
    } else {
      setAccessToken(null);
      setIdToken(null);
    }
  }, [isAuthenticated]);

  const refreshTokens = useCallback(() => {
    if (isAuthenticated) {
      setAccessToken(getAccessToken());
      setIdToken(getIdToken());
    }
  }, [isAuthenticated]);

  return {
    accessToken,
    idToken,
    refreshTokens,
  };
}

/**
 * Hook for session management
 * Monitors session validity and handles refresh
 */
export function useSession() {
  const [sessionValid, setSessionValid] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { isAuthenticated } = useLiffAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check session every minute
    const interval = setInterval(async () => {
      const valid = isSessionValid();
      setSessionValid(valid);

      if (!valid) {
        console.log('Session invalid, attempting refresh...');
        const refreshed = await refreshSession();
        if (refreshed) {
          setSessionValid(true);
          setLastRefresh(new Date());
        }
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const manualRefresh = useCallback(async () => {
    const refreshed = await refreshSession();
    if (refreshed) {
      setSessionValid(true);
      setLastRefresh(new Date());
    }
    return refreshed;
  }, []);

  return {
    sessionValid,
    lastRefresh,
    refreshSession: manualRefresh,
  };
}