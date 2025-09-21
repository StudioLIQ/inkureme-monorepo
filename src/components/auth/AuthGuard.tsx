'use client';

/**
 * Authentication Guard Components
 * Provides conditional rendering based on authentication state
 */

import React from 'react';
import { useLiffAuth, useAuthState } from '@/hooks/useLiffAuth';
import { LiffLoginButton } from './LiffLoginButton';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Main AuthGuard component
 * Conditionally renders content based on authentication state
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading } = useLiffAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and auth required
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please login with your LINE account to continue
          </p>
          <LiffLoginButton
            redirectUri={redirectTo}
            variant="primary"
            size="lg"
            fullWidth
          />
        </div>
      </div>
    );
  }

  // Authenticated or auth not required
  return <>{children}</>;
};

/**
 * Show content only for authenticated users
 */
export const AuthOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isUser } = useAuthState();
  return isUser ? <>{children}</> : null;
};

/**
 * Show content only for guests (non-authenticated users)
 */
export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isGuest } = useAuthState();
  return isGuest ? <>{children}</> : null;
};

/**
 * Conditional rendering based on auth state
 */
interface ConditionalAuthProps {
  authenticated?: React.ReactNode;
  unauthenticated?: React.ReactNode;
  loading?: React.ReactNode;
}

export const ConditionalAuth: React.FC<ConditionalAuthProps> = ({
  authenticated,
  unauthenticated,
  loading,
}) => {
  const { isUser, isGuest, isLoading } = useAuthState();

  if (isLoading && loading) {
    return <>{loading}</>;
  }

  if (isUser && authenticated) {
    return <>{authenticated}</>;
  }

  if (isGuest && unauthenticated) {
    return <>{unauthenticated}</>;
  }

  return null;
};