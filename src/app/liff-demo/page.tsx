'use client';

/**
 * LIFF MiniDapp Demo Page
 * Example implementation showing LIFF and MiniDapp SDK integration
 */

import React, { useState } from 'react';
import { LiffMiniDappProvider, useLiffMiniDapp } from '@/components/LiffMiniDappProvider';

// Demo component using the context
function LiffMiniDappDemo() {
  const {
    // LIFF states
    isLiffReady,
    isLoggedIn,
    userProfile,

    // MiniDapp states
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

    // Loading states
    isInitializing,
    error
  } = useLiffMiniDapp();

  const [txHash, setTxHash] = useState<string>('');
  const [isTransacting, setIsTransacting] = useState(false);

  // Handle sample transaction
  const handleSendTransaction = async () => {
    try {
      setIsTransacting(true);
      const tx = {
        to: '0x0000000000000000000000000000000000000000',
        value: '0x16345785D8A0000', // 0.1 KLAY in hex
        data: '0x'
      };

      const receipt = await sendKlaytnTransaction(tx);
      setTxHash(receipt.transactionHash);
    } catch (err) {
      console.error('Transaction failed:', err);
    } finally {
      setIsTransacting(false);
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing LIFF and MiniDapp...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Initialization Error</h3>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">LIFF MiniDapp Integration Demo</h1>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* LIFF Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">LIFF Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">LIFF Ready:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isLiffReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isLiffReady ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Logged In:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isLoggedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isLoggedIn ? 'Yes' : 'No'}
                </span>
              </div>
              {userProfile && (
                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-3">
                    {userProfile.pictureUrl && (
                      <img
                        src={userProfile.pictureUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{userProfile.displayName}</p>
                      <p className="text-sm text-gray-500">{userProfile.userId}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              {!isLoggedIn ? (
                <button
                  onClick={login}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  Login with LINE
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* MiniDapp Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">MiniDapp Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">MiniDapp Ready:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isMiniDappReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isMiniDappReady ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Wallet Connected:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isWalletConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isWalletConnected ? 'Yes' : 'No'}
                </span>
              </div>
              {walletAddress && (
                <div className="pt-3 border-t space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Address:</p>
                    <p className="text-xs font-mono text-gray-900 break-all">{walletAddress}</p>
                  </div>
                  {walletBalance && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Balance:</span>
                      <span className="font-medium text-gray-900">{walletBalance} KLAY</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {!isWalletConnected ? (
                <div className="space-y-2">
                  <button
                    onClick={() => connectUserWallet('line')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                  >
                    Connect LINE Wallet
                  </button>
                  <button
                    onClick={() => connectUserWallet('kaikas')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  >
                    Connect Kaikas
                  </button>
                </div>
              ) : (
                <button
                  onClick={disconnectUserWallet}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
                >
                  Disconnect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Demo */}
        {isWalletConnected && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction Demo</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={refreshBalance}
                  className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
                >
                  Refresh Balance
                </button>
                <button
                  onClick={handleSendTransaction}
                  disabled={isTransacting}
                  className="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isTransacting ? 'Sending...' : 'Send 0.1 KLAY'}
                </button>
              </div>
              {txHash && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">Transaction Successful!</p>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    Hash: {txHash}
                  </p>
                  <a
                    href={`https://scope.klaytn.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
                  >
                    View on Klaytnscope →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Integration Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Integration Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Set up your LIFF app in LINE Developers Console</li>
            <li>Configure environment variables in .env.local file</li>
            <li>Install required packages: @line/liff and @line/liff-mini-dapp</li>
            <li>Wrap your app with LiffMiniDappProvider component</li>
            <li>Use useLiffMiniDapp hook to access LIFF and wallet features</li>
            <li>Test in LINE app or with LIFF Simulator for best results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Main component with provider
export default function LiffDemoPage() {
  return (
    <LiffMiniDappProvider>
      <LiffMiniDappDemo />
    </LiffMiniDappProvider>
  );
}