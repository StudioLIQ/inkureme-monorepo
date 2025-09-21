/**
 * Transaction Manager for Klaytn
 * Handles transaction queuing, retries, and monitoring
 */

import { ethers } from 'ethers';
import {
  signAndSendTransaction,
  KlaytnTransaction,
  TransactionReceipt,
  TransactionError,
  getWalletAddress,
  onWalletEvent,
} from './klaytnWalletService';

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Transaction record
export interface TransactionRecord {
  id: string;
  hash?: string;
  from: string;
  to?: string;
  value?: string;
  data?: string;
  status: TransactionStatus;
  error?: string;
  receipt?: TransactionReceipt;
  createdAt: Date;
  submittedAt?: Date;
  confirmedAt?: Date;
  retryCount: number;
  gasPrice?: string;
  gasUsed?: string;
  blockNumber?: number;
}

// Transaction queue
const transactionQueue: Map<string, TransactionRecord> = new Map();
const pendingTransactions: Set<string> = new Set();

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const CONFIRMATION_BLOCKS = 2;
const TRANSACTION_TIMEOUT = 300000; // 5 minutes

// Event emitter for transaction updates
type TransactionListener = (tx: TransactionRecord) => void;
const transactionListeners: Set<TransactionListener> = new Set();

/**
 * Subscribe to transaction updates
 */
export function onTransactionUpdate(listener: TransactionListener): () => void {
  transactionListeners.add(listener);
  return () => transactionListeners.delete(listener);
}

/**
 * Emit transaction update
 */
function emitTransactionUpdate(tx: TransactionRecord) {
  transactionListeners.forEach(listener => listener(tx));
}

/**
 * Send a managed transaction with retry logic
 */
export async function sendManagedTransaction(
  transaction: KlaytnTransaction,
  options?: {
    retries?: number;
    onStatusChange?: (status: TransactionStatus) => void;
  }
): Promise<TransactionRecord> {
  const txId = generateTransactionId();
  const from = getWalletAddress();

  if (!from) {
    throw new TransactionError('No wallet connected');
  }

  // Create transaction record
  const txRecord: TransactionRecord = {
    id: txId,
    from,
    to: transaction.to,
    value: transaction.value?.toString(),
    data: transaction.data,
    status: TransactionStatus.PENDING,
    createdAt: new Date(),
    retryCount: 0,
  };

  // Add to queue
  transactionQueue.set(txId, txRecord);
  pendingTransactions.add(txId);
  emitTransactionUpdate(txRecord);

  try {
    // Update status
    options?.onStatusChange?.(TransactionStatus.PENDING);

    // Execute transaction with retries
    const receipt = await executeWithRetry(
      async () => {
        // Update status to submitted
        txRecord.status = TransactionStatus.SUBMITTED;
        txRecord.submittedAt = new Date();
        emitTransactionUpdate(txRecord);
        options?.onStatusChange?.(TransactionStatus.SUBMITTED);

        // Send transaction
        const receipt = await signAndSendTransaction(transaction);

        // Update with hash
        txRecord.hash = receipt.transactionHash;
        emitTransactionUpdate(txRecord);

        return receipt;
      },
      {
        maxRetries: options?.retries ?? MAX_RETRIES,
        delay: RETRY_DELAY,
        onRetry: (attempt, error) => {
          console.log(`Transaction retry attempt ${attempt}:`, error.message);
          txRecord.retryCount = attempt;
          txRecord.error = error.message;
          emitTransactionUpdate(txRecord);
        },
      }
    );

    // Transaction confirmed
    txRecord.status = TransactionStatus.CONFIRMED;
    txRecord.confirmedAt = new Date();
    txRecord.receipt = receipt;
    txRecord.gasUsed = receipt.gasUsed.toString();
    txRecord.blockNumber = receipt.blockNumber;
    txRecord.error = undefined;

    emitTransactionUpdate(txRecord);
    options?.onStatusChange?.(TransactionStatus.CONFIRMED);

    // Remove from pending
    pendingTransactions.delete(txId);

    return txRecord;
  } catch (error) {
    // Transaction failed
    txRecord.status = TransactionStatus.FAILED;
    txRecord.error = (error as Error).message;

    emitTransactionUpdate(txRecord);
    options?.onStatusChange?.(TransactionStatus.FAILED);

    // Remove from pending
    pendingTransactions.delete(txId);

    throw error;
  }
}

/**
 * Execute function with retry logic
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    delay: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on user rejection
      if ((error as any).code === 4001 || (error as any).code === '4001') {
        throw error;
      }

      // Don't retry if max attempts reached
      if (attempt === options.maxRetries) {
        break;
      }

      // Call retry callback
      options.onRetry?.(attempt + 1, lastError);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
  }

  throw lastError!;
}

/**
 * Send batch transactions
 */
export async function sendBatchTransactions(
  transactions: KlaytnTransaction[],
  options?: {
    sequential?: boolean;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<TransactionRecord[]> {
  const results: TransactionRecord[] = [];
  const total = transactions.length;

  if (options?.sequential) {
    // Send transactions sequentially
    for (let i = 0; i < transactions.length; i++) {
      try {
        const result = await sendManagedTransaction(transactions[i]);
        results.push(result);
        options.onProgress?.(i + 1, total);
      } catch (error) {
        console.error(`Batch transaction ${i + 1} failed:`, error);
        // Continue with next transaction
      }
    }
  } else {
    // Send transactions in parallel
    const promises = transactions.map((tx, index) =>
      sendManagedTransaction(tx)
        .then(result => {
          options?.onProgress?.(results.length + 1, total);
          return result;
        })
        .catch(error => {
          console.error(`Batch transaction ${index + 1} failed:`, error);
          return null;
        })
    );

    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter((r): r is TransactionRecord => r !== null));
  }

  return results;
}

/**
 * Cancel a pending transaction (if possible)
 */
export async function cancelTransaction(txId: string): Promise<boolean> {
  const txRecord = transactionQueue.get(txId);

  if (!txRecord) {
    throw new Error('Transaction not found');
  }

  if (txRecord.status !== TransactionStatus.PENDING) {
    throw new Error('Can only cancel pending transactions');
  }

  // Update status
  txRecord.status = TransactionStatus.CANCELLED;
  emitTransactionUpdate(txRecord);

  // Remove from pending
  pendingTransactions.delete(txId);

  return true;
}

/**
 * Get transaction by ID
 */
export function getTransaction(txId: string): TransactionRecord | undefined {
  return transactionQueue.get(txId);
}

/**
 * Get all transactions
 */
export function getAllTransactions(): TransactionRecord[] {
  return Array.from(transactionQueue.values());
}

/**
 * Get pending transactions
 */
export function getPendingTransactions(): TransactionRecord[] {
  return Array.from(pendingTransactions)
    .map(id => transactionQueue.get(id))
    .filter((tx): tx is TransactionRecord => tx !== undefined);
}

/**
 * Clear transaction history
 */
export function clearTransactionHistory(): void {
  transactionQueue.clear();
  pendingTransactions.clear();
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Monitor transaction status
 */
export async function monitorTransaction(
  txHash: string,
  options?: {
    confirmations?: number;
    timeout?: number;
    onUpdate?: (status: string) => void;
  }
): Promise<TransactionReceipt> {
  const { confirmations = CONFIRMATION_BLOCKS, timeout = TRANSACTION_TIMEOUT } = options || {};

  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    // Set timeout
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      reject(new TransactionError('Transaction timeout', 'TIMEOUT', txHash));
    }, timeout);

    // Poll for transaction receipt
    intervalId = setInterval(async () => {
      try {
        const receipt = await checkTransactionStatus(txHash);

        if (receipt) {
          options?.onUpdate?.('mined');

          // Check confirmations
          const currentBlock = await getCurrentBlockNumber();
          const confirmationCount = currentBlock - receipt.blockNumber;

          if (confirmationCount >= confirmations) {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            options?.onUpdate?.('confirmed');
            resolve(receipt);
          } else {
            options?.onUpdate?.(`${confirmationCount}/${confirmations} confirmations`);
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        reject(error);
      }
    }, 2000); // Poll every 2 seconds
  });
}

/**
 * Check transaction status by hash
 */
async function checkTransactionStatus(txHash: string): Promise<TransactionReceipt | null> {
  try {
    const { provider } = await import('./klaytnWalletService').then(m => m.getWalletState());

    if (!provider) {
      throw new Error('No provider available');
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt as TransactionReceipt | null;
  } catch (error) {
    console.error('Failed to check transaction status:', error);
    return null;
  }
}

/**
 * Get current block number
 */
async function getCurrentBlockNumber(): Promise<number> {
  const { provider } = await import('./klaytnWalletService').then(m => m.getWalletState());

  if (!provider) {
    throw new Error('No provider available');
  }

  return await provider.getBlockNumber();
}

// Setup wallet event listeners
onWalletEvent('walletDisconnected', () => {
  // Clear pending transactions on disconnect
  pendingTransactions.clear();
});

// Export types
export type { TransactionRecord, TransactionListener };