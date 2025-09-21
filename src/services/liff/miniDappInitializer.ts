/**
 * LINE MiniDapp SDK Initializer
 * Handles MiniDapp SDK initialization for Klaytn blockchain integration
 */

import { MiniDapp } from '@line/liff-mini-dapp';
import { MINIDAPP_CONFIG, MiniDappInitCallbacks } from './liffConfig';
import { getLiffInstance, isLiffInitialized } from './liffInitializer';
import type { ethers } from 'ethers';

// Global MiniDapp instance
let miniDappInstance: MiniDapp | null = null;
let miniDappInitPromise: Promise<MiniDapp> | null = null;

// Wallet connection state
let connectedAddress: string | null = null;
let provider: ethers.providers.Provider | null = null;

/**
 * Initialize MiniDapp SDK with Klaytn blockchain configuration
 * @param callbacks - Optional callback functions for success/error handling
 * @returns Promise resolving to MiniDapp instance
 */
export async function initializeMiniDapp(callbacks?: MiniDappInitCallbacks): Promise<MiniDapp> {
  try {
    // Check if LIFF is initialized first
    if (!isLiffInitialized()) {
      throw new Error('LIFF must be initialized before MiniDapp SDK');
    }

    // Return existing instance if already initialized
    if (miniDappInstance) {
      console.log('MiniDapp already initialized, returning existing instance');
      return miniDappInstance;
    }

    // Prevent multiple simultaneous initialization attempts
    if (miniDappInitPromise) {
      console.log('MiniDapp initialization in progress, waiting...');
      return miniDappInitPromise;
    }

    console.log('Starting MiniDapp initialization...');

    // Create initialization promise
    miniDappInitPromise = new Promise<MiniDapp>(async (resolve, reject) => {
      try {
        const liff = getLiffInstance();

        // Initialize MiniDapp with Klaytn configuration
        const miniDapp = new MiniDapp({
          liff,
          blockchain: {
            name: MINIDAPP_CONFIG.blockchain.network,
            chainId: MINIDAPP_CONFIG.blockchain.chainId,
            rpcUrl: MINIDAPP_CONFIG.blockchain.rpcUrl,
            nativeCurrency: {
              name: 'KLAY',
              symbol: 'KLAY',
              decimals: 18,
            },
            blockExplorerUrl: MINIDAPP_CONFIG.blockchain.explorerUrl,
          },
          wallet: {
            enableProviders: ['line', 'kaikas', 'walletconnect'],
            autoConnect: true,
            preferredProvider: 'line',
          },
          ui: {
            theme: 'auto', // auto, light, or dark
            language: liff.getLanguage() || 'en',
          },
        });

        // Wait for MiniDapp to be ready
        await miniDapp.ready();

        console.log('MiniDapp initialization successful');
        console.log('Blockchain:', miniDapp.getBlockchain());
        console.log('Connected:', miniDapp.isConnected());

        // Set up wallet event listeners
        miniDapp.on('walletConnected', (address: string) => {
          console.log('Wallet connected:', address);
          connectedAddress = address;
          callbacks?.onWalletConnected?.(address);
        });

        miniDapp.on('walletDisconnected', () => {
          console.log('Wallet disconnected');
          connectedAddress = null;
          callbacks?.onWalletDisconnected?.();
        });

        miniDapp.on('chainChanged', (chainId: number) => {
          console.log('Chain changed:', chainId);
        });

        miniDapp.on('accountsChanged', (accounts: string[]) => {
          console.log('Accounts changed:', accounts);
          if (accounts.length > 0) {
            connectedAddress = accounts[0];
            callbacks?.onWalletConnected?.(accounts[0]);
          } else {
            connectedAddress = null;
            callbacks?.onWalletDisconnected?.();
          }
        });

        // Store MiniDapp instance
        miniDappInstance = miniDapp;

        // Execute success callback
        if (callbacks?.onSuccess) {
          await callbacks.onSuccess(miniDapp);
        }

        resolve(miniDapp);
      } catch (error) {
        const miniDappError = error as Error;
        console.error('MiniDapp initialization failed:', miniDappError);

        // Execute error callback
        callbacks?.onError?.(miniDappError);

        // Clear initialization promise on error
        miniDappInitPromise = null;

        reject(miniDappError);
      }
    });

    return miniDappInitPromise;
  } catch (error) {
    console.error('Failed to initialize MiniDapp:', error);
    throw error;
  }
}

/**
 * Get current MiniDapp instance
 * @throws Error if MiniDapp is not initialized
 */
export function getMiniDappInstance(): MiniDapp {
  if (!miniDappInstance) {
    throw new Error('MiniDapp is not initialized. Call initializeMiniDapp() first.');
  }
  return miniDappInstance;
}

/**
 * Check if MiniDapp is initialized
 */
export function isMiniDappInitialized(): boolean {
  return miniDappInstance !== null;
}

/**
 * Connect wallet through MiniDapp
 * @param providerName - Optional specific provider to connect
 */
export async function connectWallet(providerName?: 'line' | 'kaikas' | 'walletconnect'): Promise<string> {
  const miniDapp = getMiniDappInstance();

  try {
    console.log('Connecting wallet...', providerName || 'auto');
    const account = await miniDapp.connectWallet({
      provider: providerName,
    });

    connectedAddress = account;
    provider = miniDapp.getProvider();

    console.log('Wallet connected successfully:', account);
    return account;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  const miniDapp = getMiniDappInstance();

  try {
    await miniDapp.disconnectWallet();
    connectedAddress = null;
    provider = null;
    console.log('Wallet disconnected successfully');
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    throw error;
  }
}

/**
 * Get connected wallet address
 */
export function getConnectedAddress(): string | null {
  return connectedAddress;
}

/**
 * Get blockchain provider
 */
export function getProvider(): ethers.providers.Provider | null {
  if (!miniDappInstance) {
    return null;
  }
  return miniDappInstance.getProvider();
}

/**
 * Get signer for transactions
 */
export function getSigner(): ethers.Signer | null {
  if (!miniDappInstance || !connectedAddress) {
    return null;
  }
  return miniDappInstance.getSigner();
}

/**
 * Switch blockchain network
 * @param chainId - Target chain ID
 */
export async function switchNetwork(chainId: number): Promise<void> {
  const miniDapp = getMiniDappInstance();

  try {
    await miniDapp.switchChain(chainId);
    console.log('Network switched to chain ID:', chainId);
  } catch (error) {
    console.error('Failed to switch network:', error);
    throw error;
  }
}

/**
 * Request transaction signature
 * @param transaction - Transaction object
 */
export async function signTransaction(transaction: any): Promise<string> {
  const miniDapp = getMiniDappInstance();
  const signer = getSigner();

  if (!signer) {
    throw new Error('No wallet connected');
  }

  try {
    console.log('Requesting transaction signature...');
    const signedTx = await signer.signTransaction(transaction);
    console.log('Transaction signed successfully');
    return signedTx;
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}

/**
 * Send transaction
 * @param transaction - Transaction object
 */
export async function sendTransaction(transaction: any): Promise<any> {
  const miniDapp = getMiniDappInstance();
  const signer = getSigner();

  if (!signer) {
    throw new Error('No wallet connected');
  }

  try {
    console.log('Sending transaction...');
    const txResponse = await signer.sendTransaction(transaction);
    console.log('Transaction sent:', txResponse.hash);

    // Wait for transaction confirmation
    const receipt = await txResponse.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);

    return receipt;
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}

/**
 * Get wallet balance
 * @param address - Optional address to check (defaults to connected address)
 */
export async function getBalance(address?: string): Promise<string> {
  const provider = getProvider();
  const targetAddress = address || connectedAddress;

  if (!provider || !targetAddress) {
    throw new Error('Provider not available or no address specified');
  }

  try {
    const balance = await provider.getBalance(targetAddress);
    return balance.toString();
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}