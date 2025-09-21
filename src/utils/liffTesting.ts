/**
 * LIFF Testing Utilities
 * Tools for testing and debugging LIFF applications
 */

import liff from '@line/liff';
import type { Liff } from '@line/liff';

// LIFF Test Configuration
export interface LiffTestConfig {
  liffId: string;
  mockMode?: boolean;
  debugMode?: boolean;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

// Test utilities state
let testConfig: LiffTestConfig | null = null;
let debugConsole: string[] = [];

/**
 * Initialize LIFF testing environment
 */
export async function initLiffTesting(config: LiffTestConfig): Promise<void> {
  testConfig = config;

  if (config.debugMode) {
    enableDebugMode();
  }

  if (config.mockMode) {
    setupMockEnvironment();
  }

  // Setup console interceptor for debugging
  if (config.logLevel && config.logLevel !== 'none') {
    interceptConsole(config.logLevel);
  }
}

/**
 * Generate LIFF URL for testing
 */
export function generateLiffUrl(
  liffId: string,
  path: string = '/',
  params?: Record<string, string>
): string {
  const baseUrl = `https://liff.line.me/${liffId}`;
  const url = new URL(baseUrl);

  // Add path
  if (path && path !== '/') {
    url.pathname = `${liffId}${path}`;
  }

  // Add query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

/**
 * Generate QR code for LIFF URL
 */
export function generateQRCodeUrl(liffUrl: string): string {
  // Using QR Server API for simplicity
  const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
  const params = new URLSearchParams({
    size: '300x300',
    data: liffUrl,
    margin: '10',
  });

  return `${qrApiUrl}?${params.toString()}`;
}

/**
 * Test LIFF initialization with detailed logging
 */
export async function testLiffInit(liffId?: string): Promise<{
  success: boolean;
  error?: Error;
  details: Record<string, any>;
}> {
  const startTime = Date.now();
  const details: Record<string, any> = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
  };

  try {
    // Initialize LIFF
    await liff.init({
      liffId: liffId || testConfig?.liffId || '',
      withLoginOnExternalBrowser: true,
    });

    const initTime = Date.now() - startTime;

    // Collect LIFF environment info
    details.initTime = `${initTime}ms`;
    details.liffVersion = liff.getVersion();
    details.isInClient = liff.isInClient();
    details.isLoggedIn = liff.isLoggedIn();
    details.os = liff.getOS();
    details.language = liff.getLanguage();
    details.isApiAvailable = {
      shareTargetPicker: liff.isApiAvailable('shareTargetPicker'),
      scanCode: liff.isApiAvailable('scanCode'),
    };

    // Get context if available
    const context = liff.getContext();
    if (context) {
      details.context = {
        type: context.type,
        viewType: context.viewType,
        userId: context.userId ? 'Present' : 'Not available',
        utouId: context.utouId ? 'Present' : 'Not available',
        roomId: context.roomId ? 'Present' : 'Not available',
        groupId: context.groupId ? 'Present' : 'Not available',
      };
    }

    // Get access token status
    if (liff.isLoggedIn()) {
      const token = liff.getAccessToken();
      details.accessToken = token ? 'Present' : 'Not available';

      try {
        const profile = await liff.getProfile();
        details.profile = {
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl ? 'Present' : 'Not available',
          statusMessage: profile.statusMessage || 'Not set',
        };
      } catch (err) {
        details.profileError = (err as Error).message;
      }
    }

    logDebug('LIFF initialization successful', details);

    return {
      success: true,
      details,
    };
  } catch (error) {
    const err = error as Error;
    logError('LIFF initialization failed', err);

    details.error = {
      message: err.message,
      stack: err.stack,
    };

    return {
      success: false,
      error: err,
      details,
    };
  }
}

/**
 * Enable debug mode with detailed logging
 */
function enableDebugMode(): void {
  // Add debug panel to page
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'liff-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 8px;
      overflow-y: auto;
      z-index: 9999;
      display: none;
    `;

    document.body.appendChild(debugPanel);

    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'liff-debug-toggle';
    toggleButton.textContent = '🐛';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #06C755;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    toggleButton.onclick = () => {
      const panel = document.getElementById('liff-debug-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    };

    document.body.appendChild(toggleButton);
  }
}

/**
 * Intercept console for debugging
 */
function interceptConsole(logLevel: string): void {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  const shouldLog = (level: string): boolean => {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  };

  // Override console methods
  console.log = (...args) => {
    if (shouldLog('debug')) {
      addToDebugConsole('LOG', args);
      originalConsole.log(...args);
    }
  };

  console.error = (...args) => {
    if (shouldLog('error')) {
      addToDebugConsole('ERROR', args);
      originalConsole.error(...args);
    }
  };

  console.warn = (...args) => {
    if (shouldLog('warn')) {
      addToDebugConsole('WARN', args);
      originalConsole.warn(...args);
    }
  };

  console.info = (...args) => {
    if (shouldLog('info')) {
      addToDebugConsole('INFO', args);
      originalConsole.info(...args);
    }
  };
}

/**
 * Add message to debug console
 */
function addToDebugConsole(level: string, args: any[]): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');

  const logEntry = `[${timestamp}] ${level}: ${message}`;
  debugConsole.push(logEntry);

  // Keep only last 100 entries
  if (debugConsole.length > 100) {
    debugConsole.shift();
  }

  // Update debug panel if exists
  const panel = document.getElementById('liff-debug-panel');
  if (panel) {
    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #06C755;">
        LIFF Debug Console
      </div>
      ${debugConsole.map(entry => {
        const color = entry.includes('ERROR') ? '#ff3030' :
                     entry.includes('WARN') ? '#ffb900' :
                     entry.includes('INFO') ? '#007aff' : '#00ff00';
        return `<div style="color: ${color}; margin-bottom: 4px;">${entry}</div>`;
      }).join('')}
    `;
    panel.scrollTop = panel.scrollHeight;
  }
}

/**
 * Setup mock LIFF environment for development
 */
function setupMockEnvironment(): void {
  if (typeof window !== 'undefined') {
    // Mock LIFF object for development
    (window as any).liffMock = {
      isInClient: () => false,
      isLoggedIn: () => true,
      getVersion: () => '2.23.1',
      getLanguage: () => 'en',
      getOS: () => 'web',
      getLineVersion: () => '12.0.0',
      isApiAvailable: () => true,
      getAccessToken: () => 'mock_access_token_' + Date.now(),
      getIDToken: () => 'mock_id_token_' + Date.now(),
      getProfile: () => Promise.resolve({
        userId: 'U' + Math.random().toString(36).substr(2, 9),
        displayName: 'Test User',
        pictureUrl: 'https://via.placeholder.com/100',
        statusMessage: 'Testing LIFF',
      }),
      getContext: () => ({
        type: 'none',
        viewType: 'full',
        userId: 'U' + Math.random().toString(36).substr(2, 9),
        liffId: testConfig?.liffId,
      }),
    };

    logInfo('Mock LIFF environment enabled');
  }
}

/**
 * Common LIFF error diagnostics
 */
export function diagnoseLiffError(error: Error): {
  cause: string;
  solution: string;
  checkpoints: string[];
} {
  const errorMessage = error.message.toLowerCase();

  // Common error patterns
  if (errorMessage.includes('liffid')) {
    return {
      cause: 'Invalid or missing LIFF ID',
      solution: 'Verify LIFF ID is correct and properly configured in LINE Developers Console',
      checkpoints: [
        'Check LIFF ID in .env file',
        'Verify LIFF app exists in LINE Developers Console',
        'Ensure LIFF ID format is correct (e.g., 1234567890-abcdefgh)',
      ],
    };
  }

  if (errorMessage.includes('init')) {
    return {
      cause: 'LIFF initialization failed',
      solution: 'Check network connection and LIFF configuration',
      checkpoints: [
        'Verify internet connection',
        'Check if running on HTTPS (required for LIFF)',
        'Ensure domain is whitelisted in LIFF settings',
        'Check browser console for detailed errors',
      ],
    };
  }

  if (errorMessage.includes('https')) {
    return {
      cause: 'LIFF requires HTTPS',
      solution: 'Use HTTPS or test using ngrok for local development',
      checkpoints: [
        'Deploy to HTTPS server',
        'Use ngrok for local testing: ngrok http 3000',
        'Add localhost exception in LIFF settings (development only)',
      ],
    };
  }

  if (errorMessage.includes('domain') || errorMessage.includes('origin')) {
    return {
      cause: 'Domain not whitelisted',
      solution: 'Add your domain to LIFF endpoint URL in LINE Developers Console',
      checkpoints: [
        'Go to LINE Developers Console',
        'Select your LIFF app',
        'Add domain to Endpoint URL',
        'Wait 5-10 minutes for changes to propagate',
      ],
    };
  }

  if (errorMessage.includes('profile') || errorMessage.includes('unauthorized')) {
    return {
      cause: 'User not logged in or insufficient permissions',
      solution: 'Ensure user is logged in and has granted necessary permissions',
      checkpoints: [
        'Check if user is logged in with liff.isLoggedIn()',
        'Request login with liff.login()',
        'Verify scope permissions in LIFF settings',
        'Check if running in LINE app or external browser',
      ],
    };
  }

  // Default diagnosis
  return {
    cause: 'Unknown error',
    solution: 'Check browser console and network tab for more details',
    checkpoints: [
      'Open browser developer console (F12)',
      'Check Network tab for failed requests',
      'Look for CORS errors',
      'Verify all environment variables are set',
      'Test in actual LINE app instead of browser',
    ],
  };
}

// Logging utilities
function logDebug(message: string, data?: any): void {
  if (testConfig?.debugMode) {
    console.debug(`[LIFF Debug] ${message}`, data);
  }
}

function logInfo(message: string, data?: any): void {
  if (testConfig?.logLevel && testConfig.logLevel !== 'none') {
    console.info(`[LIFF Info] ${message}`, data);
  }
}

function logError(message: string, error: Error): void {
  console.error(`[LIFF Error] ${message}`, error);
}

/**
 * Export debug console logs
 */
export function exportDebugLogs(): string {
  return debugConsole.join('\n');
}

/**
 * Clear debug console
 */
export function clearDebugLogs(): void {
  debugConsole = [];
  const panel = document.getElementById('liff-debug-panel');
  if (panel) {
    panel.innerHTML = '';
  }
}