"use client"

import Link from "next/link"
import Reveal from "@/components/Reveal"
import { useEffect, useMemo, useState } from "react"
import { useTotalFlights, useFlightInfo, useFlightMetadata } from "@/hooks/useInsurance"
import { PolicyCard } from "@/components/PolicyCard"

function FeaturedItem({ id }: { id: bigint }) {
  const { data: info } = useFlightInfo(id)
  const { data: meta } = useFlightMetadata(id)

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

  // Only show active and upcoming within 4 weeks
  const nowSec = Math.floor(Date.now() / 1000)
  const fourWeeks = 28 * 24 * 60 * 60
  const isUpcoming = Number(departureTimestamp) >= nowSec && Number(departureTimestamp) <= nowSec + fourWeeks
  if (settled || soldPolicies >= totalPolicies || !isUpcoming) return null

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

  return <PolicyCard insuranceId={id} flight={vm as any} featured />
}

export default function FeaturedPolicies() {
  const { data: total } = useTotalFlights()
  const count = total ? Number(total) : 0

  // Prefer the latest policies first
  const candidateIds = useMemo(() => {
    const MAX_CANDIDATES = 12
    const ids: bigint[] = []
    for (let i = count; i >= 1 && ids.length < MAX_CANDIDATES; i--) ids.push(BigInt(i))
    return ids
  }, [count])

  const [maxToShow] = useState(3)

  if (count === 0) return null

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <Reveal as="h2" className="text-xl sm:text-2xl font-bold">Featured Policies</Reveal>
            <p className="text-sm text-muted">Hand-picked active coverage you can buy now</p>
          </div>
          <Link href="/policies" className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all">
            Browse All
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidateIds.slice(0, maxToShow * 6).map((id) => (
            <FeaturedItem key={String(id)} id={id} />
          ))}
        </div>
      </div>
    </section>
  )
}
