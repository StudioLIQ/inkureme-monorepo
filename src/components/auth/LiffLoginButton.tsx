'use client';

/**
 * LIFF Login Button Component
 * Handles user authentication with LINE
 */

import React, { useState } from 'react';
import { loginWithLiff } from '@/services/liff/authService';

interface LiffLoginButtonProps {
  redirectUri?: string;
  className?: string;
  children?: React.ReactNode;
  onLoginStart?: () => void;
  onLoginError?: (error: Error) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const LiffLoginButton: React.FC<LiffLoginButtonProps> = ({
  redirectUri,
  className = '',
  children,
  onLoginStart,
  onLoginError,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      onLoginStart?.();

      // Store current page path for post-login redirect
      if (!redirectUri) {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('post_login_redirect', currentPath);
      }

      // Initiate LIFF login
      await loginWithLiff(redirectUri);
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggingIn(false);
      onLoginError?.(error as Error);
    }
  };

  // Style variants
  const baseStyles = 'font-medium transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 active:bg-green-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded',
    md: 'px-4 py-2 text-base rounded-md',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };

  const buttonClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <button
      onClick={handleLogin}
      disabled={isLoggingIn}
      className={buttonClasses}
      aria-label="Login with LINE"
    >
      {isLoggingIn ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Logging in...</span>
        </>
      ) : (
        <>
          {/* LINE Icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 5.84 2 10.52c0 4.2 3.44 7.72 8.08 8.36.31.07.74.21.85.49.1.25.06.65.03.91l-.14.87c-.04.25-.2 1.01.88.55 1.08-.46 5.84-3.44 7.97-5.89C21.42 14.03 22 12.35 22 10.52 22 5.84 17.52 2 12 2zm-1.72 12.24h-2.8c-.15 0-.28-.13-.28-.28V9.44c0-.15.13-.28.28-.28.16 0 .28.13.28.28v4.24h2.52c.16 0 .28.13.28.28 0 .16-.12.28-.28.28zm1.44-.28c0 .15-.13.28-.28.28-.16 0-.28-.13-.28-.28V9.44c0-.15.12-.28.28-.28.15 0 .28.13.28.28v4.52zm4.48 0c0 .12-.07.22-.18.26-.03.01-.07.02-.1.02-.08 0-.16-.03-.22-.1l-2.64-3.52v3.34c0 .15-.13.28-.28.28-.16 0-.28-.13-.28-.28V9.44c0-.12.07-.22.18-.26.03-.01.06-.02.1-.02.08 0 .16.03.22.1l2.64 3.52V9.44c0-.15.12-.28.28-.28.15 0 .28.13.28.28v4.52zm3.56-2.6c.16 0 .28.13.28.28 0 .16-.12.28-.28.28h-2.52v1.12h2.52c.16 0 .28.13.28.28 0 .16-.12.28-.28.28h-2.8c-.15 0-.28-.13-.28-.28V9.44c0-.15.13-.28.28-.28h2.8c.16 0 .28.13.28.28 0 .16-.12.28-.28.28h-2.52v1.12h2.52z"/>
          </svg>
          <span>{children || 'Login with LINE'}</span>
        </>
      )}
    </button>
  );
};

/**
 * Compact login button for navbar/header
 */
export const LiffLoginButtonCompact: React.FC<{
  redirectUri?: string;
  onLoginStart?: () => void;
}> = ({ redirectUri, onLoginStart }) => {
  return (
    <LiffLoginButton
      redirectUri={redirectUri}
      onLoginStart={onLoginStart}
      variant="outline"
      size="sm"
    >
      Login
    </LiffLoginButton>
  );
};