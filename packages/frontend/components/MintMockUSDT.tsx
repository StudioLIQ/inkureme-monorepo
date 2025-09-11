'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { contracts } from '@/lib/config'

export function MintMockUSDT() {
  const { address, isConnected } = useAccount()
  const [txStatus, setTxStatus] = useState<string>('')

  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read current balance
  const { data: balance } = useReadContract({
    address: contracts.mockUSDT.address,
    abi: contracts.mockUSDT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const handleMint = async () => {
    if (!address) return
    
    setTxStatus('Initiating transaction...')
    
    try {
      writeContract({
        address: contracts.mockUSDT.address,
        abi: contracts.mockUSDT.abi,
        functionName: 'mint',
        args: [address, BigInt(10000 * 10 ** 6)], // 10,000 USDT with 6 decimals
      })
    } catch (err) {
      console.error('Error minting:', err)
      setTxStatus('Error occurred')
    }
  }

  // Update status based on transaction state
  if (isConfirming && txStatus !== 'Transaction pending...') {
    setTxStatus('Transaction pending...')
  }
  if (isSuccess && txStatus !== 'Mint successful!') {
    setTxStatus('Mint successful!')
    setTimeout(() => setTxStatus(''), 5000)
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to mint Mock USDT
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Mock USDT Faucet</h2>
      
      {balance !== undefined && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">Your Balance:</p>
          <p className="text-xl font-mono font-semibold">
            {formatUnits(balance as bigint, 6)} mUSDT
          </p>
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={isPending || isConfirming}
        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-semibold"
      >
        {isPending || isConfirming ? 'Processing...' : 'Mint 10,000 mUSDT'}
      </button>

      {txStatus && (
        <div className={`mt-4 p-3 rounded-lg ${
          txStatus.includes('successful') 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
            : txStatus.includes('Error')
            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        }`}>
          {txStatus}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">
            Error: {error.message}
          </p>
        </div>
      )}

      {hash && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash:</p>
          <a 
            href={`https://baobab.kaiascan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-500 hover:text-blue-600 break-all"
          >
            {hash}
          </a>
        </div>
      )}
    </div>
  )
}