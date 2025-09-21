/**
 * LIFF and LineMiniDapp Configuration
 * Manages LIFF app settings and MiniDapp SDK configurations
 */

import type { Liff } from '@line/liff';
import type { MiniDapp } from '@line/liff-mini-dapp';

// Environment variables for secure credential management
export const LIFF_CONFIG = {
  liffId: process.env.NEXT_PUBLIC_LIFF_ID || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '', // Server-side only
  miniDappEndpoint: process.env.NEXT_PUBLIC_MINIDAPP_ENDPOINT || '',
  klaytnRpcUrl: process.env.NEXT_PUBLIC_KLAYTN_RPC_URL || 'https://public-en-cypress.klaytn.net',
  klaytnChainId: process.env.NEXT_PUBLIC_KLAYTN_CHAIN_ID || '8217', // Mainnet: 8217, Testnet: 1001
} as const;

// LIFF initialization options
export const LIFF_INIT_OPTIONS = {
  withLoginOnExternalBrowser: true, // Enable login on external browsers
  moduleMode: true, // Enable module mode for better performance
} as const;

// MiniDapp configuration for Klaytn blockchain
export const MINIDAPP_CONFIG = {
  blockchain: {
    network: 'klaytn',
    chainId: parseInt(LIFF_CONFIG.klaytnChainId),
    rpcUrl: LIFF_CONFIG.klaytnRpcUrl,
    explorerUrl: 'https://scope.klaytn.com',
  },
  wallet: {
    enableMetaMask: false, // LINE MiniDapp uses LINE's built-in wallet
    enableKaikas: true, // Klaytn's native wallet
    enableWalletConnect: true,
  },
  features: {
    enableSocialLogin: true,
    enableBiometricAuth: true,
    enableQRCodeScanner: true,
  },
} as const;

// Type definitions for callback functions
export interface LiffInitCallbacks {
  onSuccess?: (liff: Liff) => void | Promise<void>;
  onError?: (error: Error) => void;
  onAuthRequired?: () => void;
}

export interface MiniDappInitCallbacks {
  onSuccess?: (miniDapp: MiniDapp) => void | Promise<void>;
  onError?: (error: Error) => void;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

// Validation function for environment setup
export function validateEnvironment(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!LIFF_CONFIG.liffId) {
    errors.push('LIFF ID is not configured. Please set NEXT_PUBLIC_LIFF_ID in your environment.');
  }

  if (!LIFF_CONFIG.klaytnRpcUrl) {
    errors.push('Klaytn RPC URL is not configured. Please set NEXT_PUBLIC_KLAYTN_RPC_URL.');
  }

  if (typeof window !== 'undefined' && LIFF_CONFIG.channelAccessToken) {
    console.warn('WARNING: Channel Access Token should not be exposed on client-side!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}