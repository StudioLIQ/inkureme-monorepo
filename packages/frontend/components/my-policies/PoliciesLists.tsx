"use client"

import { useEffect, useMemo, useState } from "react"
import { formatUnits } from "viem"
import {
  useFlightInfo,
  useFlightMetadata,
  useHasBoughtInsurance,
  useHasClaimedPayout,
  useSettleInsurance,
  useClaimPayout,
  useWithdrawFunds,
} from "@/hooks/useInsurance"

function formatNumber(num: string | number): string {
  const n = typeof num === "string" ? parseFloat(num) : num
  if (isNaN(n)) return "0"
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function formatDate(ts: bigint) {
  const d = new Date(Number(ts) * 1000)
  return d.toLocaleString()
}

function MyPolicyCard({ insuranceId, isCreator }: { insuranceId: bigint; isCreator: boolean }) {
  const { data: info } = useFlightInfo(insuranceId)
  const { data: meta } = useFlightMetadata(insuranceId)
  const [showDetails, setShowDetails] = useState(false)

  const { settleInsurance, isPending: isSettling, isConfirming: isSettlingConfirming, isSuccess: settleSuccess } = useSettleInsurance()
  const { claimPayout, isPending: isClaiming, isConfirming: isClaimingConfirming, isSuccess: claimSuccess } = useClaimPayout()
  const { withdrawFunds, isPending: isWithdrawing, isConfirming: isWithdrawingConfirming, isSuccess: withdrawSuccess } = useWithdrawFunds()

  useEffect(() => {
    if (settleSuccess || claimSuccess || withdrawSuccess) {
      window.location.reload()
    }
  }, [settleSuccess, claimSuccess, withdrawSuccess])

  if (!info || !meta) return null

  const [producer, depositAmount, insurancePrice, totalPolicies, policiesSold, _questionId, isSettled, delayed, _producerWithdrawable, fundsWithdrawn] = info as unknown as [
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    bigint,
    string,
    boolean,
    boolean,
    bigint,
    boolean,
  ]
  const [flightCode, departureAirport, arrivalAirport, departureTimestamp, delayThresholdMinutes] = meta as unknown as [
    string,
    string,
    string,
    bigint,
    number,
  ]
  const payoutPerPolicy = totalPolicies > BigInt(0) ? depositAmount / totalPolicies : BigInt(0)
  const totalRevenue = insurancePrice * policiesSold
  const soldPercentage = totalPolicies > BigInt(0) ? (Number(policiesSold) / Number(totalPolicies)) * 100 : 0

  const handleSettle = () => settleInsurance(insuranceId)
  const handleClaim = () => claimPayout(insuranceId)
  const handleWithdraw = () => withdrawFunds(insuranceId)

  return (
    <div className="card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-medium text-primary mb-1">{departureAirport} → {arrivalAirport}</div>
            <h3 className="text-lg font-bold mb-1">
              {flightCode} • {formatDate(departureTimestamp)}
            </h3>
          </div>
          <div className="flex gap-2">
            {isCreator && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Provider</span>}
          </div>
        </div>

        {/* Expandable Details */}
        <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View policy details
        </button>

        {showDetails && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-muted">
            <p className="font-medium text-foreground mb-1">Coverage Conditions:</p>
            <p className="italic mb-2">Delay greater than {delayThresholdMinutes} minutes for this flight.</p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <div>
                <span className="font-medium">Total Pool:</span> <span className="tabular-nums">${formatNumber(formatUnits(depositAmount, 6))}</span>
              </div>
              <div>
                <span className="font-medium">Price per Policy:</span> <span className="tabular-nums">${formatNumber(formatUnits(insurancePrice, 6))}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        {isSettled ? (
          delayed ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Delayed - Payout Available
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Settled - On Time
            </span>
          )
        ) : (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active - Awaiting Flight
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {isCreator ? (
          <>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Policies Sold</p>
              <p className="font-bold text-lg tabular-nums">
                {policiesSold.toString()}
                <span className="text-xs font-normal text-muted ml-1">/ {totalPolicies.toString()}</span>
              </p>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${soldPercentage}%` }} />
              </div>
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Revenue Earned</p>
              <p className="font-bold text-lg text-primary tabular-nums">${formatNumber(formatUnits(totalRevenue, 6))}</p>
              <p className="text-xs text-muted mt-1">from premiums</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Premium Paid</p>
              <p className="font-bold text-lg tabular-nums">${formatNumber(formatUnits(insurancePrice, 6))}</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Potential Payout</p>
              <p className="font-bold text-lg text-primary tabular-nums">${formatNumber(formatUnits(payoutPerPolicy, 6))}</p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Creator Actions */}
        {isCreator && !isSettled && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium mb-3">Settle Policy</p>
            <button
              onClick={handleSettle}
              disabled={isSettling || isSettlingConfirming}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              {isSettling || isSettlingConfirming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Settling...
                </span>
              ) : 'Settle via Oracle'}
            </button>
            <p className="text-xs text-muted mt-2">Reads oracle result and finalizes this flight.</p>
          </div>
        )}

        {isCreator && isSettled && !fundsWithdrawn && !delayed && (
          <button onClick={handleWithdraw} disabled={isWithdrawing || isWithdrawingConfirming} className="w-full px-4 py-3 bg-foreground text-background rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors font-medium">
            {isWithdrawing || isWithdrawingConfirming ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Withdrawing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 tabular-nums">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdraw ${formatNumber(formatUnits(depositAmount, 6))}
              </span>
            )}
          </button>
        )}

        {/* Buyer Actions */}
        {!isCreator && isSettled && delayed && (
          <button onClick={handleClaim} disabled={isClaiming || isClaimingConfirming} className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors font-medium">
            {isClaiming || isClaimingConfirming ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Claiming...
              </span>
            ) : 'Claim Payout'}
          </button>
        )}

        {!isCreator && isSettled && !delayed && (
          <div className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-center text-sm">Flight was on time - No payout available</div>
        )}
      </div>
    </div>
  )
}

function PolicyChecker({ insuranceId, address, mode }: { insuranceId: bigint; address: `0x${string}`; mode: "provider" | "insured" }) {
  const { data: info } = useFlightInfo(insuranceId)
  const { data: hasBought } = useHasBoughtInsurance(insuranceId, address)
  if (!info) return null
  const [producer] = info as unknown as [`0x${string}`, bigint, bigint, bigint, bigint, string, boolean, boolean, bigint, boolean]

  if (mode === "provider" && producer === address) {
    return <MyPolicyCard insuranceId={insuranceId} isCreator={true} />
  } else if (mode === "insured" && !!hasBought) {
    return <MyPolicyCard insuranceId={insuranceId} isCreator={false} />
  }
  return null
}

export default function PoliciesLists({ insuranceIds, address, mode }: { insuranceIds: bigint[]; address: `0x${string}`; mode: "provider" | "insured" }) {
  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-2">
      {insuranceIds.map((id) => (
        <PolicyChecker key={`${mode}-${String(id)}`} insuranceId={id} address={address} mode={mode} />
      ))}
    </div>
  )
}

