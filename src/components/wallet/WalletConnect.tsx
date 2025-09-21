'use client';

/**
 * Wallet Connection Component
 * Handles Klaytn wallet connection through MiniDapp SDK
 */

import React, { useState, useEffect } from 'react';
import {
  connectKlaytnWallet,
  disconnectWallet,
  getWalletAddress,
  getWalletBalance,
  isWalletConnected,
  onWalletEvent,
  WalletConnectionError,
} from '@/services/wallet/klaytnWalletService';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  onError,
  className = '',
  variant = 'default',
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check initial connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (isWalletConnected()) {
        const address = getWalletAddress();
        if (address) {
          setWalletAddress(address);
          const walletBalance = await getWalletBalance();
          setBalance(walletBalance);
        }
      }
    };

    checkConnection();

    // Subscribe to wallet events
    const unsubscribeConnected = onWalletEvent('walletConnected', ({ address }) => {
      setWalletAddress(address);
      refreshBalance();
    });

    const unsubscribeDisconnected = onWalletEvent('walletDisconnected', () => {
      setWalletAddress(null);
      setBalance(null);
    });

    const unsubscribeAccountsChanged = onWalletEvent('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        refreshBalance();
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeAccountsChanged();
    };
  }, []);

  const refreshBalance = async () => {
    try {
      const walletBalance = await getWalletBalance();
      setBalance(walletBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const address = await connectKlaytnWallet();
      setWalletAddress(address);

      const walletBalance = await getWalletBalance();
      setBalance(walletBalance);

      onConnect?.(address);
    } catch (error) {
      const walletError = error as WalletConnectionError;
      console.error('Wallet connection failed:', walletError);

      // Handle specific error messages
      let errorMessage = 'Failed to connect wallet';

      if (walletError.code === '4001') {
        errorMessage = 'Connection cancelled by user';
      } else if (walletError.message.includes('MiniDapp')) {
        errorMessage = 'Please initialize LIFF first';
      } else if (walletError.message.includes('No wallet')) {
        errorMessage = 'No wallet provider found';
      }

      setError(errorMessage);
      onError?.(walletError);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletAddress(null);
    setBalance(null);
    onDisconnect?.();
  };

  // Compact variant - button only
  if (variant === 'compact') {
    if (walletAddress) {
      return (
        <button
          onClick={handleDisconnect}
          className={`px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition ${className}`}
        >
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </button>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 rounded-md transition ${className}`}
      >
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    );
  }

  // Full variant - detailed card
  if (variant === 'full') {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Klaytn Wallet
        </h3>

        {walletAddress ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Address</div>
              <div className="font-mono text-sm text-gray-900 break-all">
                {walletAddress}
              </div>
            </div>

            {balance && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Balance</div>
                <div className="text-lg font-semibold text-gray-900">
                  {parseFloat(balance).toFixed(4)} KLAY
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={refreshBalance}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Refresh
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Connect your Klaytn wallet to interact with smart contracts
            </p>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WalletIcon />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {walletAddress ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-mono text-gray-700">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            {balance && (
              <span className="text-sm text-gray-600">
                ({parseFloat(balance).toFixed(2)} KLAY)
              </span>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WalletIcon />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}

      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

// Wallet Icon Component
const WalletIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z"
      fill="currentColor"
    />
  </svg>
);