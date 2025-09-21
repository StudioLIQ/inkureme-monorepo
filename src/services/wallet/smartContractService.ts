/**
 * Smart Contract Service for Klaytn
 * Handles contract interactions, token transfers, and DApp operations
 */

import { ethers } from 'ethers';
import Caver from 'caver-js';
import {
  getWalletState,
  signAndSendTransaction,
  KlaytnTransaction,
  TransactionReceipt,
} from './klaytnWalletService';
import { sendManagedTransaction } from './transactionManager';

// Common contract ABIs
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
];

// Contract instance cache
const contractCache = new Map<string, ethers.Contract>();

/**
 * Get or create contract instance
 */
export function getContract(
  address: string,
  abi: any[],
  signerRequired: boolean = false
): ethers.Contract {
  const cacheKey = `${address}_${signerRequired}`;

  // Check cache
  if (contractCache.has(cacheKey)) {
    return contractCache.get(cacheKey)!;
  }

  const { provider, signer } = getWalletState();

  if (!provider) {
    throw new Error('No provider available');
  }

  if (signerRequired && !signer) {
    throw new Error('No signer available - wallet not connected');
  }

  // Create contract instance
  const contract = new ethers.Contract(
    address,
    abi,
    signerRequired ? signer! : provider
  );

  // Cache instance
  contractCache.set(cacheKey, contract);

  return contract;
}

/**
 * Call a read-only contract method
 */
export async function callContractMethod(
  contractAddress: string,
  abi: any[],
  methodName: string,
  params: any[] = []
): Promise<any> {
  try {
    const contract = getContract(contractAddress, abi, false);

    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }

    const result = await contract[methodName](...params);
    return result;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw new Error(`Failed to call ${methodName}: ${(error as Error).message}`);
  }
}

/**
 * Send a contract transaction
 */
export async function sendContractTransaction(
  contractAddress: string,
  abi: any[],
  methodName: string,
  params: any[] = [],
  options?: {
    value?: string;
    gasLimit?: number;
    gasPrice?: string;
  }
): Promise<TransactionReceipt> {
  try {
    const contract = getContract(contractAddress, abi, true);

    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }

    // Encode function data
    const data = contract.interface.encodeFunctionData(methodName, params);

    // Prepare transaction
    const tx: KlaytnTransaction = {
      to: contractAddress,
      data,
      value: options?.value,
      gas: options?.gasLimit,
      gasPrice: options?.gasPrice,
    };

    // Send transaction with retry logic
    const txRecord = await sendManagedTransaction(tx);

    if (!txRecord.receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    return txRecord.receipt;
  } catch (error) {
    console.error('Contract transaction failed:', error);
    throw error;
  }
}

/**
 * Transfer ERC20 tokens
 */
export async function transferERC20Token(
  tokenAddress: string,
  toAddress: string,
  amount: string,
  decimals?: number
): Promise<TransactionReceipt> {
  try {
    // Get token decimals if not provided
    if (decimals === undefined) {
      decimals = await callContractMethod(tokenAddress, ERC20_ABI, 'decimals');
    }

    // Convert amount to wei units
    const amountWei = ethers.utils.parseUnits(amount, decimals);

    // Send transfer transaction
    return await sendContractTransaction(
      tokenAddress,
      ERC20_ABI,
      'transfer',
      [toAddress, amountWei]
    );
  } catch (error) {
    console.error('Token transfer failed:', error);
    throw new Error(`Failed to transfer tokens: ${(error as Error).message}`);
  }
}

/**
 * Get ERC20 token balance
 */
export async function getERC20Balance(
  tokenAddress: string,
  walletAddress: string
): Promise<{ balance: string; decimals: number; symbol: string }> {
  try {
    // Get token info
    const [balance, decimals, symbol] = await Promise.all([
      callContractMethod(tokenAddress, ERC20_ABI, 'balanceOf', [walletAddress]),
      callContractMethod(tokenAddress, ERC20_ABI, 'decimals'),
      callContractMethod(tokenAddress, ERC20_ABI, 'symbol'),
    ]);

    // Format balance
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    return {
      balance: formattedBalance,
      decimals,
      symbol,
    };
  } catch (error) {
    console.error('Failed to get token balance:', error);
    throw error;
  }
}

/**
 * Approve ERC20 token spending
 */
export async function approveERC20Spending(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  decimals?: number
): Promise<TransactionReceipt> {
  try {
    // Get token decimals if not provided
    if (decimals === undefined) {
      decimals = await callContractMethod(tokenAddress, ERC20_ABI, 'decimals');
    }

    // Convert amount to wei units
    const amountWei = amount === 'max'
      ? ethers.constants.MaxUint256
      : ethers.utils.parseUnits(amount, decimals);

    // Send approve transaction
    return await sendContractTransaction(
      tokenAddress,
      ERC20_ABI,
      'approve',
      [spenderAddress, amountWei]
    );
  } catch (error) {
    console.error('Token approval failed:', error);
    throw error;
  }
}

/**
 * Transfer NFT (ERC721)
 */
export async function transferNFT(
  nftAddress: string,
  toAddress: string,
  tokenId: string
): Promise<TransactionReceipt> {
  try {
    const { address } = getWalletState();

    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Use safeTransferFrom
    return await sendContractTransaction(
      nftAddress,
      ERC721_ABI,
      'safeTransferFrom',
      [address, toAddress, tokenId]
    );
  } catch (error) {
    console.error('NFT transfer failed:', error);
    throw error;
  }
}

/**
 * Get NFT metadata
 */
export async function getNFTMetadata(
  nftAddress: string,
  tokenId: string
): Promise<{ owner: string; tokenURI: string; metadata?: any }> {
  try {
    // Get owner and tokenURI
    const [owner, tokenURI] = await Promise.all([
      callContractMethod(nftAddress, ERC721_ABI, 'ownerOf', [tokenId]),
      callContractMethod(nftAddress, ERC721_ABI, 'tokenURI', [tokenId]),
    ]);

    // Fetch metadata from tokenURI if it's a URL
    let metadata;
    if (tokenURI.startsWith('http://') || tokenURI.startsWith('https://')) {
      try {
        const response = await fetch(tokenURI);
        metadata = await response.json();
      } catch (error) {
        console.warn('Failed to fetch NFT metadata:', error);
      }
    } else if (tokenURI.startsWith('ipfs://')) {
      // Convert IPFS URI to HTTP gateway
      const ipfsHash = tokenURI.replace('ipfs://', '');
      const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      try {
        const response = await fetch(gatewayUrl);
        metadata = await response.json();
      } catch (error) {
        console.warn('Failed to fetch NFT metadata from IPFS:', error);
      }
    }

    return {
      owner,
      tokenURI,
      metadata,
    };
  } catch (error) {
    console.error('Failed to get NFT metadata:', error);
    throw error;
  }
}

/**
 * Deploy a new contract
 */
export async function deployContract(
  abi: any[],
  bytecode: string,
  constructorArgs: any[] = [],
  options?: {
    gasLimit?: number;
    gasPrice?: string;
  }
): Promise<{ address: string; receipt: TransactionReceipt }> {
  try {
    const { signer } = getWalletState();

    if (!signer) {
      throw new Error('Wallet not connected');
    }

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    // Deploy contract
    const contract = await factory.deploy(...constructorArgs, {
      gasLimit: options?.gasLimit,
      gasPrice: options?.gasPrice,
    });

    // Wait for deployment
    const receipt = await contract.deployTransaction.wait();

    return {
      address: contract.address,
      receipt: receipt as TransactionReceipt,
    };
  } catch (error) {
    console.error('Contract deployment failed:', error);
    throw error;
  }
}

/**
 * Estimate gas for contract transaction
 */
export async function estimateContractGas(
  contractAddress: string,
  abi: any[],
  methodName: string,
  params: any[] = [],
  options?: {
    value?: string;
    from?: string;
  }
): Promise<ethers.BigNumber> {
  try {
    const contract = getContract(contractAddress, abi, false);

    if (!contract.estimateGas[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }

    const gasEstimate = await contract.estimateGas[methodName](...params, {
      value: options?.value,
      from: options?.from || getWalletState().address,
    });

    // Add 10% buffer
    return gasEstimate.mul(110).div(100);
  } catch (error) {
    console.error('Gas estimation failed:', error);
    throw error;
  }
}

/**
 * Listen to contract events
 */
export function listenToContractEvent(
  contractAddress: string,
  abi: any[],
  eventName: string,
  callback: (event: any) => void,
  filter?: any
): () => void {
  try {
    const contract = getContract(contractAddress, abi, false);

    if (!contract.filters[eventName]) {
      throw new Error(`Event ${eventName} not found in contract`);
    }

    // Create event filter
    const eventFilter = filter
      ? contract.filters[eventName](...filter)
      : contract.filters[eventName]();

    // Listen to events
    contract.on(eventFilter, callback);

    // Return unsubscribe function
    return () => {
      contract.off(eventFilter, callback);
    };
  } catch (error) {
    console.error('Failed to listen to contract event:', error);
    throw error;
  }
}

/**
 * Get past contract events
 */
export async function getPastContractEvents(
  contractAddress: string,
  abi: any[],
  eventName: string,
  filter?: any,
  fromBlock?: number,
  toBlock?: number
): Promise<any[]> {
  try {
    const contract = getContract(contractAddress, abi, false);

    if (!contract.filters[eventName]) {
      throw new Error(`Event ${eventName} not found in contract`);
    }

    // Create event filter
    const eventFilter = filter
      ? contract.filters[eventName](...filter)
      : contract.filters[eventName]();

    // Query past events
    const events = await contract.queryFilter(
      eventFilter,
      fromBlock || 0,
      toBlock || 'latest'
    );

    return events;
  } catch (error) {
    console.error('Failed to get past events:', error);
    throw error;
  }
}

// Clear cache on wallet disconnect
import { onWalletEvent } from './klaytnWalletService';

onWalletEvent('walletDisconnected', () => {
  contractCache.clear();
});