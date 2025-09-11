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

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function extractFlightInfo(question: string): { flight: string; date: string; route: string } {
  const flightMatch = question.match(/([A-Z]{2}\d{3,4})/i)
  const flight = flightMatch ? flightMatch[1] : 'Flight'
  
  const dateMatch = question.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|[A-Z][a-z]+ \d{1,2}, \d{4})/i)
  const date = dateMatch ? dateMatch[1] : 'Upcoming'
  
  const routeMatch = question.match(/from\s+([A-Z]{3})\s+to\s+([A-Z]{3})/i)
  const route = routeMatch ? `${routeMatch[1]} → ${routeMatch[2]}` : ''
  
  return { flight, date, route }
}

function MyPolicyCard({ insuranceId, isCreator }: { insuranceId: bigint, isCreator: boolean }) {
  const { address } = useAccount()
  const { data: insurance } = useInsuranceDetails(insuranceId)
  const { data: hasBought } = useHasBoughtInsurance(insuranceId, address)
  const { data: hasClaimed } = useHasClaimedPayout(insuranceId, address)
  
  const [oracleAnswer, setOracleAnswer] = useState('Yes')
  const [showDetails, setShowDetails] = useState(false)
  
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
  
  const flightInfo = extractFlightInfo(insuranceData.flightQuestion)
  const soldPercentage = insuranceData.totalPolicies > BigInt(0) 
    ? (Number(insuranceData.policiesSold) / Number(insuranceData.totalPolicies)) * 100 
    : 0

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
    <div className="card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            {flightInfo.route && (
              <div className="text-xs font-medium text-primary mb-1">{flightInfo.route}</div>
            )}
            <h3 className="text-lg font-bold mb-1">
              {flightInfo.flight} • {flightInfo.date}
            </h3>
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Provider
              </span>
            )}
            {!!hasBought && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Insured
              </span>
            )}
          </div>
        </div>
        
        {/* Expandable Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View policy details
        </button>
        
        {showDetails && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-muted">
            <p className="font-medium text-foreground mb-1">Coverage Conditions:</p>
            <p className="italic mb-2">{insuranceData.flightQuestion}</p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <div>
                <span className="font-medium">Total Pool:</span> ${formatNumber(formatUnits(insuranceData.depositAmount, 6))}
              </div>
              <div>
                <span className="font-medium">Price per Policy:</span> ${formatNumber(formatUnits(insuranceData.insurancePrice, 6))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Policy Status</span>
          {insuranceData.isSettled ? (
            <div className="flex items-center gap-2">
              {insuranceData.oracleAnswer === 'Yes' ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Flight Delayed - Payout Available
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Flight On Time - No Payout
                </span>
              )}
            </div>
          ) : (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Active - Awaiting Flight
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {isCreator ? (
          <>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Policies Sold</p>
              <p className="font-bold text-lg">
                {insuranceData.policiesSold.toString()}
                <span className="text-xs font-normal text-muted ml-1">
                  / {insuranceData.totalPolicies.toString()}
                </span>
              </p>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Revenue Earned</p>
              <p className="font-bold text-lg text-primary">
                ${formatNumber(formatUnits(totalRevenue, 6))}
              </p>
              <p className="text-xs text-muted mt-1">
                from premiums
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Premium Paid</p>
              <p className="font-bold text-lg">
                ${formatNumber(formatUnits(insuranceData.insurancePrice, 6))}
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Potential Payout</p>
              <p className="font-bold text-lg text-primary">
                ${formatNumber(formatUnits(payoutPerPolicy, 6))}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Creator Actions */}
        {isCreator && !insuranceData.isSettled && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium mb-3">Simulate Flight Status (Testing)</p>
            <div className="flex gap-2">
              <select
                value={oracleAnswer}
                onChange={(e) => setOracleAnswer(e.target.value)}
                className="flex-1 px-3 py-2 border border-[--color-border] rounded-lg bg-white text-sm"
              >
                <option value="Yes">✈️ Flight Delayed (Trigger Payout)</option>
                <option value="No">✓ Flight On Time (No Payout)</option>
              </select>
              <button
                onClick={handleSettle}
                disabled={isSettling || isSettlingConfirming}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors text-sm font-medium"
              >
                {isSettling || isSettlingConfirming ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Settling...
                  </span>
                ) : 'Settle Policy'}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              In production, oracle automatically provides flight status
            </p>
          </div>
        )}

        {isCreator && insuranceData.isSettled && !insuranceData.fundsWithdrawn && insuranceData.oracleAnswer === 'No' && (
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || isWithdrawingConfirming}
            className="w-full px-4 py-3 bg-foreground text-background rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isWithdrawing || isWithdrawingConfirming ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Withdrawing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdraw ${formatNumber(formatUnits(insuranceData.depositAmount, 6))}
              </span>
            )}
          </button>
        )}

        {isCreator && insuranceData.fundsWithdrawn && (
          <div className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-center text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Funds Withdrawn Successfully
          </div>
        )}

        {/* Buyer Actions */}
        {!!hasBought && insuranceData.isSettled && insuranceData.oracleAnswer === 'Yes' && !hasClaimed && (
          <button
            onClick={handleClaim}
            disabled={isClaiming || isClaimingConfirming}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isClaiming || isClaimingConfirming ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Claiming...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Claim ${formatNumber(formatUnits(payoutPerPolicy, 6))} Payout
              </span>
            )}
          </button>
        )}

        {!!hasBought && !!hasClaimed && (
          <div className="px-4 py-3 bg-primary-100 text-primary rounded-lg text-center text-sm font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Payout Claimed Successfully
          </div>
        )}

        {!!hasBought && insuranceData.isSettled && insuranceData.oracleAnswer === 'No' && (
          <div className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-center text-sm">
            Flight was on time - No payout available
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyPolicies() {
  const { address, isConnected } = useAccount()
  const { data: totalInsurances } = useTotalInsurances()
  const [activeTab, setActiveTab] = useState<'provider' | 'insured'>('provider')
  
  const insuranceCount = totalInsurances ? Number(totalInsurances) : 0
  const insuranceIds = Array.from({ length: insuranceCount }, (_, i) => BigInt(i + 1))

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect to View Policies</h2>
            <p className="text-muted">
              Connect your wallet to manage your insurance policies
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Policy Management</h1>
          <p className="text-muted">
            Track and manage your insurance policies in one place
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[--color-border]">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('provider')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'provider'
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Policies I Provide
              {activeTab === 'provider' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('insured')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'insured'
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              My Coverage
              {activeTab === 'insured' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'provider' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Created Policies</h2>
                <a
                  href="/create"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                >
                  Create New Policy
                </a>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                {insuranceIds.map((id) => (
                  <PolicyChecker key={`created-${id}`} insuranceId={id} address={address!} isCreator={true} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insured' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Purchased Coverage</h2>
                <a
                  href="/policies"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                >
                  Browse More Policies
                </a>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                {insuranceIds.map((id) => (
                  <PolicyChecker key={`purchased-${id}`} insuranceId={id} address={address!} isCreator={false} />
                ))}
              </div>
            </div>
          )}
        </div>

        {insuranceCount === 0 && (
          <div className="card rounded-lg shadow-sm p-12 text-center mt-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Policies Yet</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Start by creating a policy to earn premiums or browse available policies to get coverage
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/create"
                className="px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 transition-colors shadow-sm font-medium"
              >
                Create a Policy
              </a>
              <a
                href="/policies"
                className="px-6 py-3 bg-foreground text-background rounded-full hover:opacity-90 transition-colors shadow-sm font-medium"
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