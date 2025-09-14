"use client"

import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useBuyInsurance, useApproveUSDT, useUSDTAllowance, useHasBoughtInsurance } from '@/hooks/useInsurance'
import { contracts } from '@/lib/config'
import TiltCard from '@/components/TiltCard'

export interface FlightVM {
  producer: `0x${string}`
  depositAmount: bigint
  insurancePrice: bigint
  totalPolicies: bigint
  soldPolicies: bigint
  settled: boolean
  delayed: boolean
  producerWithdrawn: boolean
  flightCode: string
  departureAirport: string
  arrivalAirport: string
  departureTimestamp: bigint
  delayThresholdMinutes: number
}

interface PolicyCardProps {
  insuranceId: bigint
  flight: FlightVM
  onPurchaseSuccess?: () => void
}

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDate(ts: bigint) {
  const d = new Date(Number(ts) * 1000)
  return d.toLocaleString()
}

export function PolicyCard({ insuranceId, flight, onPurchaseSuccess }: PolicyCardProps) {
  const { address } = useAccount()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  const { data: allowance } = useUSDTAllowance(address, contracts.flightDelayInsurance.address)
  const { data: hasBought } = useHasBoughtInsurance(insuranceId, address)
  
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: approveSuccess } = useApproveUSDT()
  const { buyInsurance, isPending: isBuying, isConfirming: isBuyingConfirming, isSuccess: buySuccess, error } = useBuyInsurance()

  const needsApproval = allowance !== undefined && flight.insurancePrice > (allowance as bigint)
  const availablePolicies = flight.totalPolicies - flight.soldPolicies
  const payoutPerPolicy = flight.totalPolicies > BigInt(0) ? flight.depositAmount / flight.totalPolicies : BigInt(0)
  
  // Calculate coverage ratio (payout / premium)
  const coverageRatio = payoutPerPolicy > BigInt(0) && flight.insurancePrice > BigInt(0)
    ? Number(payoutPerPolicy) / Number(flight.insurancePrice)
    : 0
  
  // Calculate percentage sold
  const percentageSold = flight.totalPolicies > BigInt(0)
    ? (Number(flight.soldPolicies) / Number(flight.totalPolicies)) * 100
    : 0

  useEffect(() => {
    if (approveSuccess && isPurchasing) {
      buyInsurance(insuranceId)
    }
  }, [approveSuccess, isPurchasing, insuranceId, buyInsurance])

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
    <TiltCard className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="text-xs font-medium text-primary mb-1">{flight.departureAirport} → {flight.arrivalAirport}</div>
            <h3 className="font-bold text-base sm:text-lg mb-1">
              {flight.flightCode} • {formatDate(flight.departureTimestamp)}
            </h3>
          </div>
          {coverageRatio > 3 && (
            <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              High Value
            </div>
          )}
        </div>
        
        {/* Coverage Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View coverage details
        </button>
        
        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-muted">
            <p className="font-medium text-foreground mb-1">Coverage Conditions:</p>
            <p className="italic">Delay greater than {flight.delayThresholdMinutes} minutes for this flight.</p>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 flex-1">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-muted mb-1">Premium</p>
          <p className="font-bold text-lg tabular-nums">
            ${formatNumber(formatUnits(flight.insurancePrice, 6))}
          </p>
        </div>
        <div className="bg-primary-50 rounded-lg p-3">
          <p className="text-xs text-muted mb-1">Payout if Delayed</p>
          <p className="font-bold text-lg text-primary tabular-nums">
            ${formatNumber(formatUnits(payoutPerPolicy, 6))}
          </p>
        </div>
      </div>

      {/* Coverage Ratio Badge */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Coverage Ratio</span>
            <span className="font-bold text-primary tabular-nums">{coverageRatio.toFixed(1)}x</span>
          </div>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary transition-all duration-500"
              style={{ width: `${Math.min(coverageRatio * 20, 100)}%` }}
            />
          </div>
        </div>

      {/* Availability */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted">Available</span>
          <span className={`font-semibold tabular-nums ${availablePolicies === BigInt(0) ? 'text-red-500' : 'text-foreground'}`}>
            {availablePolicies.toString()} of {flight.totalPolicies.toString()}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${100 - percentageSold}%` }}
          />
        </div>
        {percentageSold > 70 && availablePolicies > BigInt(0) && (
          <p className="text-xs text-orange-600 mt-1">Only {availablePolicies.toString()} left!</p>
        )}
      </div>

      {/* Action Button */}
      {address && (
        <>
          {!!hasBought ? (
            <div className="px-4 py-3 bg-primary-100 text-primary rounded-full text-center text-sm font-medium">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Already Covered
              </div>
            </div>
          ) : availablePolicies > BigInt(0) && !flight.settled ? (
            <button
              onClick={handleBuy}
              disabled={isProcessing}
              className="w-full px-4 py-3 sm:px-5 sm:py-3 bg-primary text-white rounded-full hover:opacity-90 disabled:bg-gray-400 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isApproving || isApprovingConfirming ? 'Approving...' : 'Purchasing...'}
                </span>
              ) : needsApproval ? (
                `Get Coverage for $${formatNumber(formatUnits(flight.insurancePrice, 6))}`
              ) : (
                `Get Coverage for $${formatNumber(formatUnits(flight.insurancePrice, 6))}`
              )}
            </button>
          ) : availablePolicies === BigInt(0) ? (
            <div className="px-4 py-3 bg-gray-100 text-gray-500 rounded-full text-center text-sm font-medium">
              Sold Out
            </div>
          ) : (
            <div className="px-4 py-3 bg-gray-100 text-gray-500 rounded-full text-center text-sm font-medium">
              Policy Settled
            </div>
          )}
        </>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs">Unable to complete purchase. Please try again.</p>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Secured by Smart Contract</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Instant Payout</span>
        </div>
      </div>
    </TiltCard>
  )
}
