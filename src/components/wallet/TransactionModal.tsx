'use client';

/**
 * Transaction Modal Component
 * Shows transaction status, confirmation, and error handling
 */

import React, { useState, useEffect } from 'react';
import {
  TransactionRecord,
  TransactionStatus,
  onTransactionUpdate,
} from '@/services/wallet/transactionManager';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord | null;
  className?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction: initialTransaction,
  className = '',
}) => {
  const [transaction, setTransaction] = useState<TransactionRecord | null>(
    initialTransaction
  );

  useEffect(() => {
    if (!initialTransaction) return;

    setTransaction(initialTransaction);

    // Subscribe to transaction updates
    const unsubscribe = onTransactionUpdate((updatedTx) => {
      if (updatedTx.id === initialTransaction.id) {
        setTransaction(updatedTx);
      }
    });

    return unsubscribe;
  }, [initialTransaction]);

  if (!isOpen || !transaction) return null;

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50';
      case TransactionStatus.SUBMITTED:
        return 'text-blue-600 bg-blue-50';
      case TransactionStatus.CONFIRMED:
        return 'text-green-600 bg-green-50';
      case TransactionStatus.FAILED:
        return 'text-red-600 bg-red-50';
      case TransactionStatus.CANCELLED:
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
      case TransactionStatus.SUBMITTED:
        return (
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
        );
      case TransactionStatus.CONFIRMED:
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case TransactionStatus.FAILED:
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 max-w-md w-full mx-4 ${className}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Transaction Status
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center mb-6">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(
                transaction.status
              )}`}
            >
              {getStatusIcon(transaction.status)}
              <span className="font-medium capitalize">
                {transaction.status.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3 mb-6">
            {transaction.hash && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Transaction Hash</div>
                <div className="font-mono text-xs text-gray-900 break-all bg-gray-50 p-2 rounded">
                  {transaction.hash}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">From</div>
                <div className="font-mono text-xs text-gray-900">
                  {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}
                </div>
              </div>

              {transaction.to && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">To</div>
                  <div className="font-mono text-xs text-gray-900">
                    {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                  </div>
                </div>
              )}
            </div>

            {transaction.value && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Value</div>
                <div className="font-semibold text-gray-900">
                  {(parseInt(transaction.value) / 1e18).toFixed(4)} KLAY
                </div>
              </div>
            )}

            {transaction.gasUsed && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Gas Used</div>
                  <div className="text-sm text-gray-900">{transaction.gasUsed}</div>
                </div>

                {transaction.blockNumber && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Block</div>
                    <div className="text-sm text-gray-900">
                      #{transaction.blockNumber}
                    </div>
                  </div>
                )}
              </div>
            )}

            {transaction.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm font-medium text-red-800 mb-1">Error</div>
                <div className="text-xs text-red-700">{transaction.error}</div>
              </div>
            )}

            {transaction.retryCount > 0 && (
              <div className="text-sm text-gray-600">
                Retry attempts: {transaction.retryCount}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {transaction.hash && (
              <a
                href={`https://scope.klaytn.com/tx/${transaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-center"
              >
                View on Explorer
              </a>
            )}

            <button
              onClick={onClose}
              className={`${
                transaction.hash ? 'flex-1' : 'w-full'
              } px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Transaction List Component
 * Shows list of recent transactions
 */
export const TransactionList: React.FC<{
  transactions: TransactionRecord[];
  onSelectTransaction?: (tx: TransactionRecord) => void;
  className?: string;
}> = ({ transactions, onSelectTransaction, className = '' }) => {
  if (transactions.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No transactions yet
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          onClick={() => onSelectTransaction?.(tx)}
          className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                tx.status === TransactionStatus.CONFIRMED
                  ? 'bg-green-100 text-green-800'
                  : tx.status === TransactionStatus.FAILED
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {tx.status}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(tx.createdAt).toLocaleTimeString()}
            </span>
          </div>

          {tx.hash && (
            <div className="font-mono text-xs text-gray-700 mb-1">
              {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
            </div>
          )}

          {tx.value && (
            <div className="text-sm font-medium text-gray-900">
              {(parseInt(tx.value) / 1e18).toFixed(4)} KLAY
            </div>
          )}
        </div>
      ))}
    </div>
  );
};