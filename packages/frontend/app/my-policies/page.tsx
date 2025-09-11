'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { 
  useTotalInsurances, 
  useInsuranceDetails, 
  useHasBoughtInsurance,
  useHasClaimedPayout,
  useSettleInsurance,
  useClaimPayout,
  useWithdrawFunds
} from '@/hooks/useInsurance'

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

function MyPolicyCard({ insuranceId, isCreator }: { insuranceId: bigint, isCreator: boolean }) {
  const { address } = useAccount()
  const { data: insurance } = useInsuranceDetails(insuranceId)
  const { data: hasBought } = useHasBoughtInsurance(insuranceId, address)
  const { data: hasClaimed } = useHasClaimedPayout(insuranceId, address)
  
  const [oracleAnswer, setOracleAnswer] = useState('Yes')
  
  const { settleInsurance, isPending: isSettling, isConfirming: isSettlingConfirming, isSuccess: settleSuccess } = useSettleInsurance()
  const { claimPayout, isPending: isClaiming, isConfirming: isClaimingConfirming, isSuccess: claimSuccess } = useClaimPayout()
  const { withdrawFunds, isPending: isWithdrawing, isConfirming: isWithdrawingConfirming, isSuccess: withdrawSuccess } = useWithdrawFunds()

  // Refresh states after successful transactions
  useEffect(() => {
    if (settleSuccess || claimSuccess || withdrawSuccess) {
      // Force re-render by updating a state
      window.location.reload()
    }
  }, [settleSuccess, claimSuccess, withdrawSuccess])

  if (!insurance) return null
  
  const insuranceData = insurance as unknown as Insurance
  const payoutPerPolicy = insuranceData.totalPolicies > BigInt(0) ? insuranceData.depositAmount / insuranceData.totalPolicies : BigInt(0)
  const totalRevenue = insuranceData.insurancePrice * insuranceData.policiesSold

  const handleSettle = () => {
    settleInsurance(insuranceId, oracleAnswer)
  }

  const handleClaim = () => {
    claimPayout(insuranceId)
  }

  const handleWithdraw = () => {
    withdrawFunds(insuranceId)
  }

  return (
    <div className="card rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {insuranceData.flightQuestion}
        </h3>
        <div className="flex gap-2 text-xs">
          <span className="text-muted font-mono">
            Policy #{insuranceId.toString()}
          </span>
          {isCreator && (
            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary rounded">
              Creator
            </span>
          )}
          {!!hasBought && (
            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary rounded">
              Buyer
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Status:</span>
          <span className={`font-semibold ${insuranceData.isSettled ? 'text-primary' : 'text-yellow-500'}`}>
            {insuranceData.isSettled ? 'Settled' : 'Active'}
          </span>
        </div>
        
        {insuranceData.isSettled && (
          <div className="flex justify-between">
            <span className="text-muted">Oracle Answer:</span>
            <span className={`font-semibold ${insuranceData.oracleAnswer === 'Yes' ? 'text-emerald-500' : 'text-muted'}`}>
              {insuranceData.oracleAnswer === 'Yes' ? '✈️ Delayed' : '✓ On Time'}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted">Policies Sold:</span>
          <span className="font-semibold">
            {insuranceData.policiesSold.toString()} / {insuranceData.totalPolicies.toString()}
          </span>
        </div>

        {isCreator && (
          <>
            <div className="flex justify-between">
              <span className="text-muted">Total Deposit:</span>
              <span className="font-semibold">{formatUnits(insuranceData.depositAmount, 6)} mUSDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total Revenue:</span>
              <span className="font-semibold">{formatUnits(totalRevenue, 6)} mUSDT</span>
            </div>
          </>
        )}

        {!!hasBought && (
          <div className="flex justify-between">
            <span className="text-muted">Potential Payout:</span>
            <span className="font-semibold">{formatUnits(payoutPerPolicy, 6)} mUSDT</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Creator Actions */}
        {isCreator && !insuranceData.isSettled && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={oracleAnswer}
                onChange={(e) => setOracleAnswer(e.target.value)}
                className="flex-1 px-3 py-2 border border-[--color-border] rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="Yes">Yes - Flight Delayed</option>
                <option value="No">No - On Time</option>
              </select>
              <button
                onClick={handleSettle}
                disabled={isSettling || isSettlingConfirming}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors text-sm font-medium"
              >
                {isSettling || isSettlingConfirming ? 'Settling...' : 'Settle'}
              </button>
            </div>
            <p className="text-xs text-muted">
              Simulate oracle response for testing (in production, oracle provides answer)
            </p>
          </div>
        )}

        {isCreator && insuranceData.isSettled && !insuranceData.fundsWithdrawn && insuranceData.oracleAnswer === 'No' && (
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || isWithdrawingConfirming}
            className="w-full px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isWithdrawing || isWithdrawingConfirming ? 'Withdrawing...' : 'Withdraw Funds'}
          </button>
        )}

        {isCreator && insuranceData.fundsWithdrawn && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-center text-sm">
            Funds Withdrawn
          </div>
        )}

        {/* Buyer Actions */}
        {!!hasBought && insuranceData.isSettled && insuranceData.oracleAnswer === 'Yes' && !hasClaimed && (
          <button
            onClick={handleClaim}
            disabled={isClaiming || isClaimingConfirming}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isClaiming || isClaimingConfirming ? 'Claiming...' : `Claim ${formatUnits(payoutPerPolicy, 6)} mUSDT`}
          </button>
        )}

        {!!hasBought && !!hasClaimed && (
          <div className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary rounded-lg text-center text-sm font-medium">
            ✓ Payout Claimed
          </div>
        )}

        {!!hasBought && insuranceData.isSettled && insuranceData.oracleAnswer === 'No' && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-muted rounded-lg text-center text-sm">
            No payout (flight on time)
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyPolicies() {
  const { address, isConnected } = useAccount()
  const { data: totalInsurances } = useTotalInsurances()
  
  const insuranceCount = totalInsurances ? Number(totalInsurances) : 0
  const insuranceIds = Array.from({ length: insuranceCount }, (_, i) => BigInt(i + 1))

  // Note: In production, you would filter policies based on events or indexed data
  // For now, we display all policies and let the component filter based on creator/buyer status

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="card rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Wallet Required</h2>
            <p className="text-muted">
              Please connect your wallet to view your insurance policies.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">My Policies</h1>
          <p className="text-muted">
            Manage your created and purchased insurance policies
          </p>
        </div>

        <div className="space-y-8">
          {/* Created Policies */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Created Policies</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insuranceIds.map((id) => (
                <PolicyChecker key={`created-${id}`} insuranceId={id} address={address!} isCreator={true} />
              ))}
            </div>
          </div>

          {/* Purchased Policies */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Purchased Policies</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insuranceIds.map((id) => (
                <PolicyChecker key={`purchased-${id}`} insuranceId={id} address={address!} isCreator={false} />
              ))}
            </div>
          </div>
        </div>

        {insuranceCount === 0 && (
          <div className="card rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-4">No Policies Yet</h2>
            <p className="text-muted mb-6">
              You haven&apos;t created or purchased any insurance policies yet.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/create"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
              >
                Create a Policy
              </a>
              <a
                href="/policies"
                className="px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-colors shadow-sm"
              >
                Browse Policies
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component to check if policy belongs to user
function PolicyChecker({ insuranceId, address, isCreator }: { 
  insuranceId: bigint, 
  address: `0x${string}`, 
  isCreator: boolean 
}) {
  const { data: insurance } = useInsuranceDetails(insuranceId)
  const { data: hasBought } = useHasBoughtInsurance(insuranceId, address)
  
  if (!insurance) return null
  
  const insuranceData = insurance as unknown as Insurance
  
  // Show only if user is creator or has bought
  if (isCreator && insuranceData.creator === address) {
    return <MyPolicyCard insuranceId={insuranceId} isCreator={true} />
  } else if (!isCreator && !!hasBought) {
    return <MyPolicyCard insuranceId={insuranceId} isCreator={false} />
  }
  
  return null
}
