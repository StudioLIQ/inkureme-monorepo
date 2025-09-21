/**
 * Klaytn Wallet Service using LineMiniDapp SDK
 * Handles wallet connection, address retrieval, and transaction management
 */

import { MiniDapp } from '@line/liff-mini-dapp';
import { ethers } from 'ethers';
import Caver from 'caver-js';
import { getMiniDappInstance, isMiniDappInitialized } from '../liff/miniDappInitializer';

// Wallet connection state
interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  provider: ethers.providers.Provider | null;
  signer: ethers.Signer | null;
  caver: Caver | null;
  isConnected: boolean;
  connectionError: Error | null;
}

// Transaction types
export interface KlaytnTransaction {
  to?: string;
  from?: string;
  value?: string | ethers.BigNumber;
  data?: string;
  gas?: string | number;
  gasPrice?: string | ethers.BigNumber;
  nonce?: number;
  chainId?: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string;
  gasUsed: ethers.BigNumber;
  status: number;
  logs: any[];
}

// Error types for better error handling
export class WalletConnectionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public code?: string, public txHash?: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

// Wallet state management
let walletState: WalletState = {
  address: null,
  balance: null,
  chainId: null,
  provider: null,
  signer: null,
  caver: null,
  isConnected: false,
  connectionError: null,
};

// Event listeners
const eventListeners = new Map<string, Set<Function>>();

/**
 * Emit wallet events
 */
function emitEvent(event: string, data?: any) {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(listener => listener(data));
  }
}

/**
 * Subscribe to wallet events
 */
export function onWalletEvent(event: string, callback: Function) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);

  // Return unsubscribe function
  return () => {
    eventListeners.get(event)?.delete(callback);
  };
}

/**
 * Connect to Klaytn wallet via MiniDapp SDK
 * @returns Wallet address
 */
export async function connectKlaytnWallet(): Promise<string> {
  try {
    if (!isMiniDappInitialized()) {
      throw new WalletConnectionError('MiniDapp SDK not initialized');
    }

    const miniDapp = getMiniDappInstance();

    console.log('Connecting to Klaytn wallet...');

    // Connect wallet through MiniDapp
    const provider = await miniDapp.requestProvider();

    if (!provider) {
      throw new WalletConnectionError('No wallet provider available');
    }

    // Get accounts
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new WalletConnectionError('No accounts found');
    }

    const address = accounts[0];
    console.log('Wallet connected:', address);

    // Setup ethers provider and signer
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    const signer = ethersProvider.getSigner();

    // Setup Caver for Klaytn-specific features
    const caver = new Caver(provider as any);

    // Get chain ID
    const chainId = await ethersProvider.getNetwork().then(network => network.chainId);

    // Get initial balance
    const balance = await getWalletBalance(address);

    // Update wallet state
    walletState = {
      address,
      balance,
      chainId,
      provider: ethersProvider,
      signer,
      caver,
      isConnected: true,
      connectionError: null,
    };

    // Setup event listeners
    setupWalletEventListeners(provider);

    // Emit connected event
    emitEvent('walletConnected', { address, chainId });

    return address;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    walletState.connectionError = error as Error;

    if (error instanceof WalletConnectionError) {
      throw error;
    }

    // Handle specific error cases
    if ((error as any).code === 4001) {
      throw new WalletConnectionError('User rejected wallet connection', '4001');
    }

    throw new WalletConnectionError(
      `Failed to connect wallet: ${(error as Error).message}`
    );
  }
}

/**
 * Get current wallet address
 * @returns Current wallet address or null
 */
export function getWalletAddress(): string | null {
  return walletState.address;
}

/**
 * Get wallet balance in KLAY
 * @param address - Optional address (defaults to connected wallet)
 */
export async function getWalletBalance(address?: string): Promise<string> {
  try {
    const targetAddress = address || walletState.address;

    if (!targetAddress) {
      throw new Error('No wallet address available');
    }

    if (!walletState.provider && !walletState.caver) {
      throw new Error('No provider available');
    }

    let balanceWei: ethers.BigNumber;

    // Try ethers provider first
    if (walletState.provider) {
      balanceWei = await walletState.provider.getBalance(targetAddress);
    } else if (walletState.caver) {
      const balance = await walletState.caver.klay.getBalance(targetAddress);
      balanceWei = ethers.BigNumber.from(balance);
    } else {
      throw new Error('No provider available');
    }

    // Convert to KLAY (18 decimals)
    const balanceKlay = ethers.utils.formatEther(balanceWei);

    // Update state if it's the connected wallet
    if (targetAddress === walletState.address) {
      walletState.balance = balanceKlay;
    }

    return balanceKlay;
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}

/**
 * Sign and send a Klaytn transaction
 * @param transaction - Transaction object
 * @returns Transaction receipt
 */
export async function signAndSendTransaction(
  transaction: KlaytnTransaction
): Promise<TransactionReceipt> {
  try {
    if (!walletState.isConnected || !walletState.signer) {
      throw new TransactionError('Wallet not connected');
    }

    console.log('Preparing transaction:', transaction);

    // Validate transaction
    validateTransaction(transaction);

    // Prepare transaction with defaults
    const preparedTx = await prepareTransaction(transaction);

    console.log('Sending transaction:', preparedTx);

    // Send transaction
    const txResponse = await walletState.signer.sendTransaction(preparedTx);

    console.log('Transaction sent:', txResponse.hash);

    // Emit pending event
    emitEvent('transactionPending', {
      hash: txResponse.hash,
      from: txResponse.from,
      to: txResponse.to,
      value: txResponse.value?.toString(),
    });

    // Wait for confirmation
    const receipt = await txResponse.wait();

    console.log('Transaction confirmed:', receipt.transactionHash);

    // Update balance after transaction
    await getWalletBalance();

    // Emit confirmed event
    emitEvent('transactionConfirmed', receipt);

    return receipt as TransactionReceipt;
  } catch (error) {
    console.error('Transaction failed:', error);

    // Handle specific error codes
    if ((error as any).code === 4001) {
      throw new TransactionError('User rejected transaction', '4001');
    }

    if ((error as any).code === -32000) {
      throw new TransactionError('Insufficient funds for gas', '-32000');
    }

    if ((error as any).code === -32603) {
      throw new TransactionError('Internal JSON-RPC error', '-32603');
    }

    // Network errors
    if ((error as any).code === 'NETWORK_ERROR') {
      throw new TransactionError('Network error - please check your connection', 'NETWORK_ERROR');
    }

    // Timeout errors
    if ((error as any).code === 'TIMEOUT') {
      throw new TransactionError('Transaction timeout - please try again', 'TIMEOUT');
    }

    throw new TransactionError(
      `Transaction failed: ${(error as Error).message}`,
      (error as any).code,
      (error as any).transactionHash
    );
  }
}

/**
 * Sign a message with the wallet
 * @param message - Message to sign
 * @returns Signature
 */
export async function signMessage(message: string): Promise<string> {
  try {
    if (!walletState.isConnected || !walletState.signer) {
      throw new Error('Wallet not connected');
    }

    console.log('Signing message:', message);

    const signature = await walletState.signer.signMessage(message);

    console.log('Message signed successfully');

    return signature;
  } catch (error) {
    console.error('Failed to sign message:', error);

    if ((error as any).code === 4001) {
      throw new Error('User rejected message signature');
    }

    throw error;
  }
}

/**
 * Validate transaction parameters
 */
function validateTransaction(tx: KlaytnTransaction) {
  // Validate 'to' address for regular transactions
  if (tx.to && !ethers.utils.isAddress(tx.to)) {
    throw new TransactionError(`Invalid recipient address: ${tx.to}`);
  }

  // Validate 'value' if present
  if (tx.value) {
    try {
      ethers.BigNumber.from(tx.value);
    } catch {
      throw new TransactionError(`Invalid transaction value: ${tx.value}`);
    }
  }

  // Validate gas parameters
  if (tx.gas && typeof tx.gas === 'string') {
    if (!/^0x[0-9a-fA-F]+$|^[0-9]+$/.test(tx.gas)) {
      throw new TransactionError(`Invalid gas limit: ${tx.gas}`);
    }
  }
}

/**
 * Prepare transaction with proper formatting
 */
async function prepareTransaction(tx: KlaytnTransaction): Promise<KlaytnTransaction> {
  const prepared: KlaytnTransaction = { ...tx };

  // Set from address
  if (!prepared.from) {
    prepared.from = walletState.address!;
  }

  // Format value if present
  if (prepared.value && typeof prepared.value === 'string') {
    prepared.value = ethers.BigNumber.from(prepared.value);
  }

  // Estimate gas if not provided
  if (!prepared.gas) {
    try {
      const estimatedGas = await walletState.signer!.estimateGas(prepared);
      prepared.gas = estimatedGas.mul(110).div(100).toString(); // Add 10% buffer
    } catch (error) {
      console.warn('Gas estimation failed, using default:', error);
      prepared.gas = '100000'; // Default gas limit
    }
  }

  // Get gas price if not provided
  if (!prepared.gasPrice) {
    prepared.gasPrice = await walletState.provider!.getGasPrice();
  }

  // Set chain ID
  if (!prepared.chainId) {
    prepared.chainId = walletState.chainId!;
  }

  return prepared;
}

/**
 * Setup wallet event listeners
 */
function setupWalletEventListeners(provider: any) {
  // Account changed
  provider.on('accountsChanged', (accounts: string[]) => {
    console.log('Accounts changed:', accounts);

    if (accounts.length === 0) {
      // Wallet disconnected
      disconnectWallet();
    } else {
      // Update address
      walletState.address = accounts[0];
      emitEvent('accountsChanged', accounts);

      // Refresh balance
      getWalletBalance().catch(console.error);
    }
  });

  // Chain changed
  provider.on('chainChanged', (chainId: string) => {
    console.log('Chain changed:', chainId);
    walletState.chainId = parseInt(chainId, 16);
    emitEvent('chainChanged', walletState.chainId);

    // Reload page on chain change (recommended by MetaMask)
    window.location.reload();
  });

  // Disconnect
  provider.on('disconnect', (error: any) => {
    console.log('Wallet disconnected:', error);
    disconnectWallet();
  });
}

/**
 * Disconnect wallet
 */
export function disconnectWallet() {
  walletState = {
    address: null,
    balance: null,
    chainId: null,
    provider: null,
    signer: null,
    caver: null,
    isConnected: false,
    connectionError: null,
  };

  emitEvent('walletDisconnected');
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return walletState.isConnected;
}

/**
 * Get current wallet state
 */
export function getWalletState(): Readonly<WalletState> {
  return { ...walletState };
}

/**
 * Switch to a different Klaytn network
 * @param chainId - Target chain ID (8217 for mainnet, 1001 for testnet)
 */
export async function switchKlaytnNetwork(chainId: number): Promise<void> {
  try {
    if (!walletState.provider) {
      throw new Error('No provider available');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    await (walletState.provider as any).provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });

    walletState.chainId = chainId;
    emitEvent('chainChanged', chainId);
  } catch (error) {
    console.error('Failed to switch network:', error);

    if ((error as any).code === 4902) {
      throw new Error('Network not added to wallet');
    }

    throw error;
  }
}