'use client';

/**
 * LIFF Authentication Demo Page
 * Demonstrates login, profile display, and session management
 */

import React, { useState, useEffect } from 'react';
import { LiffMiniDappProvider } from '@/components/LiffMiniDappProvider';
import { LiffLoginButton, LiffLoginButtonCompact } from '@/components/auth/LiffLoginButton';
import { UserProfileDisplay, UserAvatar } from '@/components/auth/UserProfileDisplay';
import { AuthGuard, AuthOnly, GuestOnly, ConditionalAuth } from '@/components/auth/AuthGuard';
import { useLiffAuth, useAuthTokens, useSession } from '@/hooks/useLiffAuth';
import { initializeLiff } from '@/services/liff/liffInitializer';

function AuthenticationDemo() {
  const {
    isAuthenticated,
    userProfile,
    isLoading,
    error,
    login,
    logout,
    refreshProfile,
  } = useLiffAuth();

  const { accessToken, idToken } = useAuthTokens();
  const { sessionValid, lastRefresh, refreshSession } = useSession();
  const [showTokens, setShowTokens] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          LIFF Authentication Demo
        </h1>

        {/* Navigation Bar Example */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">Navigation Example</h2>
            </div>
            <ConditionalAuth
              authenticated={<UserProfileDisplay variant="dropdown" />}
              unauthenticated={<LiffLoginButtonCompact />}
              loading={
                <div className="animate-pulse bg-gray-300 rounded w-20 h-8"></div>
              }
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Login/Profile */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Authentication Status
            </h2>

            {/* Guest Only Content */}
            <GuestOnly>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Welcome Guest!
                </h3>
                <p className="text-gray-600 mb-6">
                  Login with your LINE account to access all features
                </p>
                <LiffLoginButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onLoginStart={() => console.log('Login started')}
                  onLoginError={(err) => console.error('Login error:', err)}
                >
                  Login with LINE
                </LiffLoginButton>

                <div className="mt-4 space-y-2">
                  <LiffLoginButton variant="secondary" size="md" fullWidth>
                    Secondary Style
                  </LiffLoginButton>
                  <LiffLoginButton variant="outline" size="md" fullWidth>
                    Outline Style
                  </LiffLoginButton>
                </div>
              </div>
            </GuestOnly>

            {/* Auth Only Content */}
            <AuthOnly>
              <div className="space-y-6">
                {/* Profile Display Variants */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Full Profile Card
                  </h3>
                  <UserProfileDisplay variant="full" />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Compact Profile
                  </h3>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <UserProfileDisplay variant="compact" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    User Avatar Variants
                  </h3>
                  <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                    <UserAvatar size="sm" />
                    <UserAvatar size="md" />
                    <UserAvatar size="lg" />
                    <UserAvatar size="md" showName />
                  </div>
                </div>
              </div>
            </AuthOnly>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-800 text-sm">{error.message}</p>
              </div>
            )}
          </div>

          {/* Right Column - Session Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Session Management
            </h2>

            {/* Protected Content with AuthGuard */}
            <AuthGuard
              requireAuth={true}
              fallback={
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-yellow-800">
                    This content requires authentication. Please login to view.
                  </p>
                </div>
              }
            >
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Session Information
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Authentication:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isAuthenticated
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Session Valid:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sessionValid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {sessionValid ? 'Valid' : 'Expired'}
                      </span>
                    </div>

                    {lastRefresh && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Refresh:</span>
                        <span className="text-gray-900">
                          {lastRefresh.toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {userProfile && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">User ID:</span>
                          <span className="text-gray-900 font-mono text-xs">
                            {userProfile.userId.substring(0, 12)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Display Name:</span>
                          <span className="text-gray-900">
                            {userProfile.displayName}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Token Display */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Authentication Tokens
                    </h4>
                    <button
                      onClick={() => setShowTokens(!showTokens)}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {showTokens ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showTokens && (
                    <div className="space-y-2">
                      {accessToken && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Access Token:
                          </p>
                          <p className="text-xs font-mono text-gray-800 break-all">
                            {accessToken.substring(0, 30)}...
                          </p>
                        </div>
                      )}
                      {idToken && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            ID Token:
                          </p>
                          <p className="text-xs font-mono text-gray-800 break-all">
                            {idToken.substring(0, 30)}...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t pt-4 space-y-2">
                  <button
                    onClick={() => refreshProfile()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Refresh Profile
                  </button>
                  <button
                    onClick={() => refreshSession()}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Refresh Session
                  </button>
                </div>
              </div>
            </AuthGuard>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Implementation Guide
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>1. Login with Redirect:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
{`await loginWithLiff('/dashboard'); // Redirects after login`}
              </pre>
            </div>
            <div>
              <strong>2. Get User Profile:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
{`const profile = await getUserProfile();
console.log(profile.displayName, profile.pictureUrl);`}
              </pre>
            </div>
            <div>
              <strong>3. Conditional Rendering:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
{`<AuthGuard requireAuth={true}>
  <ProtectedContent />
</AuthGuard>

<AuthOnly>Show only to authenticated users</AuthOnly>
<GuestOnly>Show only to guests</GuestOnly>`}
              </pre>
            </div>
            <div>
              <strong>4. Use Authentication Hook:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
{`const { isAuthenticated, userProfile, login, logout } = useLiffAuth();`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with LIFF initialization
export default function AuthDemoPage() {
  const [liffInitialized, setLiffInitialized] = useState(false);

  useEffect(() => {
    initializeLiff()
      .then(() => setLiffInitialized(true))
      .catch(console.error);
  }, []);

  if (!liffInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing LIFF...</p>
        </div>
      </div>
    );
  }

  return (
    <LiffMiniDappProvider>
      <AuthenticationDemo />
    </LiffMiniDappProvider>
  );
}