/**
 * LIFF MiniDapp Provider Component
 * Provides LIFF and MiniDapp context to the entire application
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Liff } from '@line/liff';
import type { MiniDapp } from '@line/liff-mini-dapp';
import { initializeLiff, getLiffProfile, liffLogin, liffLogout } from '../services/liff/liffInitializer';
import {
  initializeMiniDapp,
  connectWallet,
  disconnectWallet,
  getConnectedAddress,
  getBalance,
  sendTransaction
} from '../services/liff/miniDappInitializer';

// Context types
interface LiffMiniDappContextType {
  // LIFF related
  liff: Liff | null;
  isLiffReady: boolean;
  isLoggedIn: boolean;
  userProfile: any | null;

  // MiniDapp related
  miniDapp: MiniDapp | null;
  isMiniDappReady: boolean;
  walletAddress: string | null;
  walletBalance: string | null;
  isWalletConnected: boolean;

  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  connectUserWallet: (provider?: 'line' | 'kaikas' | 'walletconnect') => Promise<void>;
  disconnectUserWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendKlaytnTransaction: (tx: any) => Promise<any>;

  // Loading states
  isInitializing: boolean;
  error: Error | null;
}

// Create context
const LiffMiniDappContext = createContext<LiffMiniDappContextType | null>(null);

// Provider component
export const LiffMiniDappProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // LIFF states
  const [liff, setLiff] = useState<Liff | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // MiniDapp states
  const [miniDapp, setMiniDapp] = useState<MiniDapp | null>(null);
  const [isMiniDappReady, setIsMiniDappReady] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Loading and error states
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize LIFF on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Initialize LIFF
        const liffInstance = await initializeLiff({
          onSuccess: async (instance) => {
            setLiff(instance);
            setIsLiffReady(true);
            setIsLoggedIn(instance.isLoggedIn());

            // Get user profile if logged in
            if (instance.isLoggedIn()) {
              try {
                const profile = await getLiffProfile();
                setUserProfile(profile);
              } catch (err) {
                console.error('Failed to get profile:', err);
              }
            }

            // Initialize MiniDapp after LIFF is ready
            const miniDappInstance = await initializeMiniDapp({
              onSuccess: (mdInstance) => {
                setMiniDapp(mdInstance);
                setIsMiniDappReady(true);
              },
              onWalletConnected: (address) => {
                setWalletAddress(address);
                setIsWalletConnected(true);
              },
              onWalletDisconnected: () => {
                setWalletAddress(null);
                setWalletBalance(null);
                setIsWalletConnected(false);
              },
              onError: (err) => {
                console.error('MiniDapp error:', err);
                setError(err);
              }
            });

            // Check if wallet is already connected
            const connectedAddr = getConnectedAddress();
            if (connectedAddr) {
              setWalletAddress(connectedAddr);
              setIsWalletConnected(true);
            }
          },
          onError: (err) => {
            setError(err);
            console.error('LIFF initialization error:', err);
          },
          onAuthRequired: () => {
            console.log('Authentication required');
            setIsLoggedIn(false);
          }
        });
      } catch (err) {
        setError(err as Error);
        console.error('Initialization failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const balance = await getBalance(walletAddress);
      // Convert from wei to KLAY (18 decimals)
      const klayBalance = (parseFloat(balance) / 1e18).toFixed(4);
      setWalletBalance(klayBalance);
    } catch (err) {
      console.error('Failed to get balance:', err);
    }
  }, [walletAddress]);

  // Refresh balance when wallet connects
  useEffect(() => {
    if (walletAddress) {
      refreshBalance();
    }
  }, [walletAddress, refreshBalance]);

  // Login action
  const login = useCallback(async () => {
    try {
      await liffLogin();
      setIsLoggedIn(true);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Logout action
  const logout = useCallback(async () => {
    try {
      await liffLogout();
      setIsLoggedIn(false);
      setUserProfile(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Connect wallet action
  const connectUserWallet = useCallback(async (provider?: 'line' | 'kaikas' | 'walletconnect') => {
    try {
      const address = await connectWallet(provider);
      setWalletAddress(address);
      setIsWalletConnected(true);
      await refreshBalance();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [refreshBalance]);

  // Disconnect wallet action
  const disconnectUserWallet = useCallback(async () => {
    try {
      await disconnectWallet();
      setWalletAddress(null);
      setWalletBalance(null);
      setIsWalletConnected(false);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Send transaction action
  const sendKlaytnTransaction = useCallback(async (tx: any) => {
    try {
      const receipt = await sendTransaction(tx);
      await refreshBalance();
      return receipt;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [refreshBalance]);

  // Context value
  const contextValue: LiffMiniDappContextType = {
    // LIFF
    liff,
    isLiffReady,
    isLoggedIn,
    userProfile,

    // MiniDapp
    miniDapp,
    isMiniDappReady,
    walletAddress,
    walletBalance,
    isWalletConnected,

    // Actions
    login,
    logout,
    connectUserWallet,
    disconnectUserWallet,
    refreshBalance,
    sendKlaytnTransaction,

    // States
    isInitializing,
    error
  };

  return (
    <LiffMiniDappContext.Provider value={contextValue}>
      {children}
    </LiffMiniDappContext.Provider>
  );
};

// Custom hook to use context
export const useLiffMiniDapp = (): LiffMiniDappContextType => {
  const context = useContext(LiffMiniDappContext);
  if (!context) {
    throw new Error('useLiffMiniDapp must be used within LiffMiniDappProvider');
  }
  return context;
};

// Export context for advanced use cases
export { LiffMiniDappContext };