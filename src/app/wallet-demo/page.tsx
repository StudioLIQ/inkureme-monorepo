'use client';

/**
 * Wallet Demo Page
 * Demonstrates Klaytn wallet integration with LineMiniDapp SDK
 */

import React, { useState, useEffect } from 'react';
import { LiffMiniDappProvider } from '@/components/LiffMiniDappProvider';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { TransactionModal, TransactionList } from '@/components/wallet/TransactionModal';
import { initializeLiff } from '@/services/liff/liffInitializer';
import { initializeMiniDapp } from '@/services/liff/miniDappInitializer';
import {
  getWalletAddress,
  signMessage,
  onWalletEvent,
  TransactionError,
} from '@/services/wallet/klaytnWalletService';
import {
  sendManagedTransaction,
  getAllTransactions,
  TransactionRecord,
} from '@/services/wallet/transactionManager';
import {
  transferERC20Token,
  getERC20Balance,
  sendContractTransaction,
} from '@/services/wallet/smartContractService';

function WalletDemo() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test transaction states
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('0.001');
  const [isSending, setIsSending] = useState(false);

  // Message signing states
  const [message, setMessage] = useState('Hello Klaytn!');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeLiff();
        await initializeMiniDapp();
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization failed:', error);
        setError('Failed to initialize LIFF and MiniDapp');
      }
    };

    init();

    // Subscribe to wallet events
    const unsubscribeConnected = onWalletEvent('walletConnected', ({ address }) => {
      setWalletAddress(address);
      loadTransactions();
    });

    const unsubscribeDisconnected = onWalletEvent('walletDisconnected', () => {
      setWalletAddress(null);
      setTransactions([]);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, []);

  const loadTransactions = () => {
    const allTx = getAllTransactions();
    setTransactions(allTx);
  };

  // Send test transaction
  const handleSendTransaction = async () => {
    if (!recipientAddress) {
      setError('Please enter recipient address');
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const tx = {
        to: recipientAddress,
        value: (parseFloat(sendAmount) * 1e18).toString(),
        data: '0x',
      };

      const txRecord = await sendManagedTransaction(tx, {
        onStatusChange: (status) => {
          console.log('Transaction status:', status);
        },
      });

      setSelectedTx(txRecord);
      setIsModalOpen(true);
      loadTransactions();

      // Clear form
      setRecipientAddress('');
      setSendAmount('0.001');
    } catch (error) {
      const txError = error as TransactionError;

      if (txError.code === '4001') {
        setError('Transaction cancelled by user');
      } else if (txError.code === '-32000') {
        setError('Insufficient funds for transaction');
      } else {
        setError(txError.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Sign message
  const handleSignMessage = async () => {
    try {
      setIsSigning(true);
      setError(null);

      const sig = await signMessage(message);
      setSignature(sig);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsSigning(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing MiniDapp SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Klaytn Wallet Integration with LineMiniDapp SDK
        </h1>

        {/* Wallet Connection Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <WalletConnect
            variant="full"
            onConnect={(address) => console.log('Connected:', address)}
            onError={(error) => setError(error.message)}
          />

          <div className="md:col-span-2 space-y-6">
            {/* Send Transaction */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send Transaction
              </h3>

              {walletAddress ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (KLAY)
                    </label>
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      step="0.001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleSendTransaction}
                    disabled={isSending}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {isSending ? 'Sending...' : 'Send Transaction'}
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">Connect wallet to send transactions</p>
              )}
            </div>

            {/* Message Signing */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sign Message
              </h3>

              {walletAddress ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleSignMessage}
                    disabled={isSigning}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {isSigning ? 'Signing...' : 'Sign Message'}
                  </button>

                  {signature && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Signature:
                      </p>
                      <p className="font-mono text-xs text-gray-600 break-all">
                        {signature}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Connect wallet to sign messages</p>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction History
          </h3>
          <TransactionList
            transactions={transactions}
            onSelectTransaction={(tx) => {
              setSelectedTx(tx);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Code Examples */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Implementation Examples
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <strong>1. Retrieve Wallet Address:</strong>
              <pre className="bg-white p-3 rounded mt-2 overflow-x-auto">
{`import { connectKlaytnWallet, getWalletAddress } from '@/services/wallet/klaytnWalletService';

// Connect wallet
const address = await connectKlaytnWallet();
console.log('Connected:', address);

// Get current address
const current = getWalletAddress();`}
              </pre>
            </div>

            <div>
              <strong>2. Sign and Send Transaction:</strong>
              <pre className="bg-white p-3 rounded mt-2 overflow-x-auto">
{`import { sendManagedTransaction } from '@/services/wallet/transactionManager';

const tx = {
  to: '0x123...',
  value: '1000000000000000000', // 1 KLAY in wei
  data: '0x'
};

const receipt = await sendManagedTransaction(tx, {
  onStatusChange: (status) => console.log(status)
});`}
              </pre>
            </div>

            <div>
              <strong>3. Error Handling:</strong>
              <pre className="bg-white p-3 rounded mt-2 overflow-x-auto">
{`try {
  await sendTransaction(tx);
} catch (error) {
  if (error.code === '4001') {
    // User rejected
  } else if (error.code === '-32000') {
    // Insufficient funds
  } else {
    // Other error
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTx}
      />
    </div>
  );
}

export default function WalletDemoPage() {
  return (
    <LiffMiniDappProvider>
      <WalletDemo />
    </LiffMiniDappProvider>
  );
}