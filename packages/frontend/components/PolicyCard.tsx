'use client'

import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useBuyInsurance, useApproveUSDT, useUSDTAllowance, useHasBoughtInsurance } from '@/hooks/useInsurance'
import { contracts } from '@/lib/config'

interface Insurance {
  creator: `0x${string}`
  flightQuestion: string
  depositAmount: bigint
  insurancePrice: bigint
  totalPolicies: bigint
  policiesSold: bigint
  isSettled: boolean
  oracleAnswer: string
  fundsWithdrawn: boolean
}

interface PolicyCardProps {
  insuranceId: bigint
  insurance: Insurance
  onPurchaseSuccess?: () => void
}

export function PolicyCard({ insuranceId, insurance, onPurchaseSuccess }: PolicyCardProps) {
  const { address } = useAccount()
  const [isPurchasing, setIsPurchasing] = useState(false)
  
  const { data: allowance } = useUSDTAllowance(address, contracts.flightDelayInsurance.address)
  const { data: hasBought } = useHasBoughtInsurance(insuranceId, address)
  
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: approveSuccess } = useApproveUSDT()
  const { buyInsurance, isPending: isBuying, isConfirming: isBuyingConfirming, isSuccess: buySuccess, error } = useBuyInsurance()

  const needsApproval = allowance !== undefined && insurance.insurancePrice > (allowance as bigint)
  const availablePolicies = insurance.totalPolicies - insurance.policiesSold
  const payoutPerPolicy = insurance.totalPolicies > 0n ? insurance.depositAmount / insurance.totalPolicies : 0n

  useEffect(() => {
    if (approveSuccess && isPurchasing) {
      buyInsurance(insuranceId)
    }
  }, [approveSuccess, isPurchasing, insuranceId])

  useEffect(() => {
    if (buySuccess) {
      setIsPurchasing(false)
      onPurchaseSuccess?.()
    }
  }, [buySuccess, onPurchaseSuccess])

  const handleBuy = async () => {
    if (!address) return
    
    setIsPurchasing(true)
    
    if (needsApproval) {
      approve(insurance.insurancePrice)
    } else {
      buyInsurance(insuranceId)
    }
  }

  const isProcessing = isApproving || isApprovingConfirming || isBuying || isBuyingConfirming

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {insurance.flightQuestion}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          Policy #{insuranceId.toString()}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <span className="font-semibold">{formatUnits(insurance.insurancePrice, 6)} mUSDT</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Payout per Policy:</span>
          <span className="font-semibold">{formatUnits(payoutPerPolicy, 6)} mUSDT</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Available:</span>
          <span className={`font-semibold ${availablePolicies === 0n ? 'text-red-500' : 'text-green-500'}`}>
            {availablePolicies.toString()} / {insurance.totalPolicies.toString()}
          </span>
        </div>

        {insurance.isSettled && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`font-semibold ${insurance.oracleAnswer === 'Yes' ? 'text-green-500' : 'text-gray-500'}`}>
              {insurance.oracleAnswer === 'Yes' ? '✈️ Delayed' : '✓ On Time'}
            </span>
          </div>
        )}
      </div>

      {address && (
        <>
          {hasBought ? (
            <div className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-center text-sm font-medium">
              ✓ Already Purchased
            </div>
          ) : availablePolicies > 0n && !insurance.isSettled ? (
            <button
              onClick={handleBuy}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isProcessing ? 
                (isApproving || isApprovingConfirming ? 'Approving...' : 'Purchasing...') : 
                (needsApproval ? 'Approve & Buy' : 'Buy Policy')}
            </button>
          ) : availablePolicies === 0n ? (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-center text-sm font-medium">
              Sold Out
            </div>
          ) : (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-center text-sm font-medium">
              Policy Settled
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-red-700 dark:text-red-300 text-xs">
          {error.message}
        </div>
      )}
    </div>
  )
}