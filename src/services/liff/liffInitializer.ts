/**
 * LIFF SDK Initializer
 * Handles LIFF app initialization with proper error handling
 */

import liff from '@line/liff';
import type { Liff } from '@line/liff';
import { LIFF_CONFIG, LIFF_INIT_OPTIONS, LiffInitCallbacks, validateEnvironment } from './liffConfig';

// Global LIFF instance
let liffInstance: Liff | null = null;
let initializationPromise: Promise<Liff> | null = null;

/**
 * Initialize LIFF SDK with comprehensive error handling
 * @param callbacks - Optional callback functions for success/error handling
 * @returns Promise resolving to LIFF instance
 */
export async function initializeLiff(callbacks?: LiffInitCallbacks): Promise<Liff> {
  try {
    // Return existing instance if already initialized
    if (liffInstance) {
      console.log('LIFF already initialized, returning existing instance');
      return liffInstance;
    }

    // Prevent multiple simultaneous initialization attempts
    if (initializationPromise) {
      console.log('LIFF initialization in progress, waiting...');
      return initializationPromise;
    }

    // Validate environment before initialization
    const validation = validateEnvironment();
    if (!validation.isValid) {
      const error = new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
      callbacks?.onError?.(error);
      throw error;
    }

    console.log('Starting LIFF initialization...');

    // Create initialization promise
    initializationPromise = new Promise<Liff>(async (resolve, reject) => {
      try {
        // Initialize LIFF with configured options
        await liff.init({
          liffId: LIFF_CONFIG.liffId,
          ...LIFF_INIT_OPTIONS,
        });

        console.log('LIFF initialization successful');
        console.log('LIFF Version:', liff.getVersion());
        console.log('LIFF Language:', liff.getLanguage());
        console.log('LIFF OS:', liff.getOS());
        console.log('Is In Client:', liff.isInClient());
        console.log('Is Logged In:', liff.isLoggedIn());

        // Check authentication status
        if (!liff.isLoggedIn()) {
          console.log('User not logged in, authentication may be required');
          callbacks?.onAuthRequired?.();
        }

        // Store LIFF instance
        liffInstance = liff;

        // Execute success callback
        if (callbacks?.onSuccess) {
          await callbacks.onSuccess(liff);
        }

        resolve(liff);
      } catch (error) {
        const liffError = error as Error;
        console.error('LIFF initialization failed:', liffError);

        // Execute error callback
        callbacks?.onError?.(liffError);

        // Clear initialization promise on error
        initializationPromise = null;

        reject(liffError);
      }
    });

    return initializationPromise;
  } catch (error) {
    console.error('Failed to initialize LIFF:', error);
    throw error;
  }
}

/**
 * Get current LIFF instance
 * @throws Error if LIFF is not initialized
 */
export function getLiffInstance(): Liff {
  if (!liffInstance) {
    throw new Error('LIFF is not initialized. Call initializeLiff() first.');
  }
  return liffInstance;
}

/**
 * Check if LIFF is initialized
 */
export function isLiffInitialized(): boolean {
  return liffInstance !== null;
}

/**
 * Login user through LIFF
 * @param redirectUri - Optional redirect URI after login
 */
export async function liffLogin(redirectUri?: string): Promise<void> {
  const instance = getLiffInstance();

  if (instance.isLoggedIn()) {
    console.log('User already logged in');
    return;
  }

  console.log('Initiating LIFF login...');
  instance.login({ redirectUri: redirectUri || window.location.href });
}

/**
 * Logout user from LIFF
 */
export async function liffLogout(): Promise<void> {
  const instance = getLiffInstance();

  if (!instance.isLoggedIn()) {
    console.log('User not logged in');
    return;
  }

  console.log('Logging out from LIFF...');
  instance.logout();
}

/**
 * Get user profile from LIFF
 */
export async function getLiffProfile() {
  const instance = getLiffInstance();

  if (!instance.isLoggedIn()) {
    throw new Error('User must be logged in to get profile');
  }

  try {
    const profile = await instance.getProfile();
    console.log('User profile retrieved:', profile);
    return profile;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
}

/**
 * Get LIFF access token
 */
export function getLiffAccessToken(): string | null {
  const instance = getLiffInstance();

  if (!instance.isLoggedIn()) {
    console.warn('User not logged in, no access token available');
    return null;
  }

  return instance.getAccessToken();
}

/**
 * Send messages through LIFF
 * @param messages - Array of LINE message objects
 */
export async function sendLiffMessages(messages: any[]): Promise<void> {
  const instance = getLiffInstance();

  if (!instance.isInClient()) {
    throw new Error('This feature is only available in LINE app');
  }

  try {
    await instance.sendMessages(messages);
    console.log('Messages sent successfully');
  } catch (error) {
    console.error('Failed to send messages:', error);
    throw error;
  }
}

/**
 * Close LIFF app window
 */
export function closeLiffWindow(): void {
  const instance = getLiffInstance();

  if (!instance.isInClient()) {
    console.warn('Close window is only available in LINE app');
    return;
  }

  instance.closeWindow();
}