'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { PolicyCard } from '@/components/PolicyCard'
import { useTotalInsurances, useInsuranceDetails } from '@/hooks/useInsurance'

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

function InsuranceLoader({ insuranceId, onPurchaseSuccess }: { insuranceId: bigint; onPurchaseSuccess: () => void }) {
  const { data: insurance } = useInsuranceDetails(insuranceId)
  
  if (!insurance) return null
  
  const insuranceData = insurance as unknown as Insurance
  
  // Only show active policies (not settled and has available slots)
  if (insuranceData.isSettled || insuranceData.policiesSold >= insuranceData.totalPolicies) {
    return null
  }
  
  return <PolicyCard insuranceId={insuranceId} insurance={insuranceData} onPurchaseSuccess={onPurchaseSuccess} />
}

export default function AvailablePolicies() {
  const { isConnected } = useAccount()
  const { data: totalInsurances, refetch } = useTotalInsurances()
  const [refreshKey, setRefreshKey] = useState(0)

  const insuranceCount = totalInsurances ? Number(totalInsurances) : 0
  const insuranceIds = Array.from({ length: insuranceCount }, (_, i) => BigInt(i + 1))

  const handlePurchaseSuccess = () => {
    // Trigger a refresh of the list
    setRefreshKey(prev => prev + 1)
    refetch()
  }

  useEffect(() => {
    // Refetch data when component mounts or refreshKey changes
    refetch()
  }, [refreshKey, refetch])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Wallet Required</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to view and purchase insurance policies.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Available Insurance Policies</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and purchase flight delay insurance policies
          </p>
        </div>

        {insuranceCount === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-4">No Policies Available</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There are currently no insurance policies available for purchase.
            </p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create a Policy
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insuranceIds.map((id) => (
              <InsuranceLoader key={`${id}-${refreshKey}`} insuranceId={id} onPurchaseSuccess={handlePurchaseSuccess} />
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Browse available insurance policies</li>
            <li>Click &quot;Buy Policy&quot; to purchase insurance</li>
            <li>Approve mUSDT spending if needed</li>
            <li>Wait for the flight date and oracle settlement</li>
            <li>Claim your payout if the flight is delayed</li>
          </ol>
        </div>
      </div>
    </div>
  )
}