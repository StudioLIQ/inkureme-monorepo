"use client"

import { useFlightInfo, useFlightMetadata } from "@/hooks/useInsurance"
import { PolicyCard } from "@/components/PolicyCard"
import { useMemo } from "react"

function InsuranceLoader({ insuranceId, onPurchaseSuccess }: { insuranceId: bigint; onPurchaseSuccess: () => void }) {
  const { data: info } = useFlightInfo(insuranceId)
  const { data: meta } = useFlightMetadata(insuranceId)

  const vm = useMemo(() => {
    if (!info || !meta) return null
    const fi = info as any
    const md = meta as any

    // Support both tuple and named result shapes
    const producer = (fi?.producer ?? fi?.[0]) as `0x${string}`
    const depositAmount = (fi?.depositAmount ?? fi?.[1]) as bigint
    const insurancePrice = (fi?.insurancePrice ?? fi?.[2]) as bigint
    const totalPolicies = (fi?.totalPolicies ?? fi?.[3]) as bigint
    const soldPolicies = (fi?.soldPolicies ?? fi?.[4]) as bigint
    const settled = (fi?.settled ?? fi?.[6]) as boolean
    const delayed = (fi?.delayed ?? fi?.[7]) as boolean
    const producerWithdrawn = (fi?.producerWithdrawn ?? fi?.[9]) as boolean

    const flightCode = (md?.flightCode ?? md?.[0]) as string
    const departureAirport = (md?.departureAirport ?? md?.[1]) as string
    const arrivalAirport = (md?.arrivalAirport ?? md?.[2]) as string
    const departureTimestamp = (md?.departureTimestamp ?? md?.[3]) as bigint
    const delayThresholdMinutes = (md?.delayThresholdMinutes ?? md?.[4]) as number

    // Ensure numerics are BigInt
    const validNumerics = [depositAmount, insurancePrice, totalPolicies, soldPolicies, departureTimestamp].every(
      (v) => typeof v === 'bigint'
    )
    if (!validNumerics) return null

    // Filter inactive
    if (settled || (soldPolicies as bigint) >= (totalPolicies as bigint)) return null

    return {
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
    }
  }, [info, meta])

  if (!vm) return null
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
