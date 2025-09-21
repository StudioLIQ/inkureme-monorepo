/**
 * LIFF Authentication Service
 * Handles user authentication, profile management, and session persistence
 */

import liff from '@line/liff';
import type { Liff, Profile } from '@line/liff';
import { getLiffInstance, isLiffInitialized } from './liffInitializer';

// User profile cache
let cachedProfile: Profile | null = null;

// Session storage keys
const SESSION_KEYS = {
  USER_PROFILE: 'liff_user_profile',
  ACCESS_TOKEN: 'liff_access_token',
  LOGIN_TIMESTAMP: 'liff_login_timestamp',
  REDIRECT_URL: 'liff_redirect_url',
} as const;

/**
 * Configure and execute LIFF login with redirect handling
 * @param redirectUri - Optional custom redirect URI after login
 */
export async function loginWithLiff(redirectUri?: string): Promise<void> {
  try {
    const instance = getLiffInstance();

    // Check if already logged in
    if (instance.isLoggedIn()) {
      console.log('User already logged in');
      return;
    }

    // Store current URL for redirect after login
    const currentUrl = window.location.href;
    sessionStorage.setItem(SESSION_KEYS.REDIRECT_URL, redirectUri || currentUrl);

    // Configure redirect URI
    const loginConfig = {
      redirectUri: redirectUri || currentUrl,
    };

    console.log('Initiating LIFF login with redirect to:', loginConfig.redirectUri);

    // Execute login (this will redirect to LINE login page)
    instance.login(loginConfig);
  } catch (error) {
    console.error('LIFF login failed:', error);
    throw new Error(`Login failed: ${(error as Error).message}`);
  }
}

/**
 * Handle post-login redirect
 * Call this on app initialization to restore user to original page
 */
export function handleLoginRedirect(): void {
  if (typeof window === 'undefined') return;

  const savedRedirectUrl = sessionStorage.getItem(SESSION_KEYS.REDIRECT_URL);

  if (savedRedirectUrl && savedRedirectUrl !== window.location.href) {
    sessionStorage.removeItem(SESSION_KEYS.REDIRECT_URL);

    // Use replace to avoid adding to history
    window.location.replace(savedRedirectUrl);
  }
}

/**
 * Retrieve and cache user profile
 * @returns User profile object with display name, picture URL, etc.
 */
export async function getUserProfile(): Promise<Profile | null> {
  try {
    const instance = getLiffInstance();

    // Check login status
    if (!instance.isLoggedIn()) {
      console.warn('Cannot get profile: User not logged in');
      return null;
    }

    // Return cached profile if available
    if (cachedProfile) {
      console.log('Returning cached profile');
      return cachedProfile;
    }

    // Fetch profile from LINE
    console.log('Fetching user profile from LINE...');
    const profile = await instance.getProfile();

    // Cache profile
    cachedProfile = profile;

    // Store in session storage for persistence
    sessionStorage.setItem(SESSION_KEYS.USER_PROFILE, JSON.stringify(profile));
    sessionStorage.setItem(SESSION_KEYS.LOGIN_TIMESTAMP, Date.now().toString());

    console.log('Profile retrieved:', {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl ? 'Present' : 'Not available',
      statusMessage: profile.statusMessage || 'No status',
    });

    return profile;
  } catch (error) {
    console.error('Failed to get user profile:', error);

    // Try to load from session storage as fallback
    const storedProfile = sessionStorage.getItem(SESSION_KEYS.USER_PROFILE);
    if (storedProfile) {
      console.log('Loading profile from session storage');
      cachedProfile = JSON.parse(storedProfile);
      return cachedProfile;
    }

    return null;
  }
}

/**
 * Check if user is currently logged in
 * @returns Boolean indicating login status
 */
export function isUserLoggedIn(): boolean {
  if (!isLiffInitialized()) {
    return false;
  }

  try {
    const instance = getLiffInstance();
    return instance.isLoggedIn();
  } catch {
    return false;
  }
}

/**
 * Get LIFF access token
 * @returns Access token or null if not logged in
 */
export function getAccessToken(): string | null {
  try {
    const instance = getLiffInstance();

    if (!instance.isLoggedIn()) {
      return null;
    }

    const token = instance.getAccessToken();

    if (token) {
      // Store token in session storage
      sessionStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, token);
    }

    return token;
  } catch (error) {
    console.error('Failed to get access token:', error);

    // Try to load from session storage as fallback
    return sessionStorage.getItem(SESSION_KEYS.ACCESS_TOKEN);
  }
}

/**
 * Get ID token for server verification
 * @returns ID token or null if not available
 */
export function getIdToken(): string | null {
  try {
    const instance = getLiffInstance();

    if (!instance.isLoggedIn()) {
      return null;
    }

    return instance.getIDToken();
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}

/**
 * Logout user and clear session
 */
export async function logoutUser(): Promise<void> {
  try {
    const instance = getLiffInstance();

    // Clear cached data
    cachedProfile = null;

    // Clear session storage
    Object.values(SESSION_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });

    // Clear any additional app-specific data
    localStorage.removeItem('app_user_preferences');

    // Execute LIFF logout
    if (instance.isLoggedIn()) {
      console.log('Logging out from LIFF...');
      instance.logout();
    }
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

/**
 * Verify access token with LINE server
 * @param token - Access token to verify
 * @returns Boolean indicating if token is valid
 */
export async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Token verified:', {
        scope: data.scope,
        expiresIn: data.expires_in,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

/**
 * Check session validity
 * @returns Boolean indicating if session is still valid
 */
export function isSessionValid(): boolean {
  const loginTimestamp = sessionStorage.getItem(SESSION_KEYS.LOGIN_TIMESTAMP);

  if (!loginTimestamp) {
    return false;
  }

  const loginTime = parseInt(loginTimestamp);
  const currentTime = Date.now();
  const sessionDuration = currentTime - loginTime;

  // Session expires after 24 hours
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

  return sessionDuration < SESSION_TIMEOUT;
}

/**
 * Refresh user session
 * Re-fetches profile and validates token
 */
export async function refreshSession(): Promise<boolean> {
  try {
    if (!isUserLoggedIn()) {
      return false;
    }

    // Clear cached profile to force refresh
    cachedProfile = null;

    // Re-fetch profile
    const profile = await getUserProfile();

    if (!profile) {
      return false;
    }

    // Verify token is still valid
    const token = getAccessToken();
    if (token) {
      const isValid = await verifyAccessToken(token);
      if (!isValid) {
        console.warn('Token is invalid, logging out');
        await logoutUser();
        return false;
      }
    }

    console.log('Session refreshed successfully');
    return true;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return false;
  }
}

/**
 * Get login URL for external browser
 * Useful for QR code login or desktop browsers
 */
export function getExternalLoginUrl(state?: string): string {
  const instance = getLiffInstance();
  const liffId = instance.id;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: liffId,
    redirect_uri: window.location.origin + '/auth/callback',
    state: state || 'liff_login',
    scope: 'profile openid',
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}