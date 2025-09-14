'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { contracts } from '@/lib/config'

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export function MintMockUSDT() {
  const { address, isConnected } = useAccount()
  const [txStatus, setTxStatus] = useState<string>('')
  const [showTransaction, setShowTransaction] = useState(false)

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
    
    setTxStatus('Preparing transaction...')
    setShowTransaction(false)
    
    try {
      writeContract({
        address: contracts.mockUSDT.address,
        abi: contracts.mockUSDT.abi,
        functionName: 'mint',
        args: [address, BigInt(10000 * 10 ** 6)], // 10,000 USDT with 6 decimals
      })
    } catch (err) {
      console.error('Error minting:', err)
      setTxStatus('')
    }
  }

  // Update status based on transaction state
  useEffect(() => {
    if (isConfirming) {
      setTxStatus('Processing your request...')
      return
    }
    if (isSuccess) {
      setTxStatus('Success! Test tokens added to your wallet.')
      setShowTransaction(true)
      const t = setTimeout(() => {
        setTxStatus('')
        setShowTransaction(false)
      }, 8000)
      return () => clearTimeout(t)
    }
  }, [isConfirming, isSuccess])

  if (!isConnected) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-sm text-muted">Connect your wallet to receive test tokens</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Test Token Faucet</h2>
          <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            Testnet Only
          </span>
        </div>
        <p className="text-sm text-muted">Get free test tokens to try the platform</p>
      </div>
      
      {balance !== undefined && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted mb-1">Your Test Balance</p>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(formatUnits(balance as bigint, 6))}
                <span className="text-sm font-normal text-muted ml-2">USDT</span>
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={isPending || isConfirming}
        className="w-full px-5 py-3 bg-primary text-white rounded-full hover:opacity-90 disabled:bg-gray-400 transition-all font-semibold shadow-sm hover:shadow-md"
      >
        {isPending || isConfirming ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Get 10,000 Test USDT
          </span>
        )}
      </button>

      {txStatus && (
        <div className={`mt-4 p-4 rounded-lg transition-all ${
          txStatus.includes('Success') 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-primary-50 border border-primary-200'
        }`}>
          <div className="flex items-start gap-3">
            {txStatus.includes('Success') ? (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="animate-spin h-5 w-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                txStatus.includes('Success') ? 'text-green-700' : 'text-primary'
              }`}>
                {txStatus}
              </p>
              {showTransaction && hash && (
                <a 
                  href={`https://baobab.kaiascan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:opacity-90 mt-1 inline-flex items-center gap-1"
                >
                  View transaction
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-700 text-sm font-medium">Transaction Failed</p>
              <p className="text-red-600 text-xs mt-1">Please try again or check your wallet connection</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-muted">
          <strong>Note:</strong> These are test tokens for demonstration purposes only. They have no real value and can only be used on the Kaia testnet.
        </p>
      </div>
    </div>
  )
}
