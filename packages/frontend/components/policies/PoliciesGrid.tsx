"use client"

import { useFlightInfo, useFlightMetadata } from "@/hooks/useInsurance"
import { PolicyCard } from "@/components/PolicyCard"
import { useMemo } from "react"

function InsuranceLoader({ insuranceId, onPurchaseSuccess }: { insuranceId: bigint; onPurchaseSuccess: () => void }) {
  const { data: info } = useFlightInfo(insuranceId)
  const { data: meta } = useFlightMetadata(insuranceId)

  if (!info || !meta) return null

  const [producer, depositAmount, insurancePrice, totalPolicies, soldPolicies, _questionId, settled, delayed, _producerWithdrawable, producerWithdrawn] = info as unknown as [
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

  // Only show active policies (not settled and has available slots)
  if (settled || soldPolicies >= totalPolicies) {
    return null
  }

  const vm = useMemo(
    () => ({
      producer,
      depositAmount,
      insurancePrice,
      totalPolicies,
      soldPolicies,
      settled,
      delayed,
      producerWithdrawn,
      flightCode,
      departureAirport,
      arrivalAirport,
      departureTimestamp,
      delayThresholdMinutes,
    }),
    [
      producer,
      depositAmount,
      insurancePrice,
      totalPolicies,
      soldPolicies,
      settled,
      delayed,
      producerWithdrawn,
      flightCode,
      departureAirport,
      arrivalAirport,
      departureTimestamp,
      delayThresholdMinutes,
    ]
  )

  return <PolicyCard insuranceId={insuranceId} flight={vm as any} onPurchaseSuccess={onPurchaseSuccess} />
}

export default function PoliciesGrid({ insuranceIds, onPurchaseSuccess }: { insuranceIds: bigint[]; onPurchaseSuccess: () => void }) {
  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {insuranceIds.map((id) => (
        <InsuranceLoader key={String(id)} insuranceId={id} onPurchaseSuccess={onPurchaseSuccess} />
      ))}
    </div>
  )
}

