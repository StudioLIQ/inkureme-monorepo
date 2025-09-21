"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useTotalFlights } from '@/hooks/useInsurance'
import { useMounted } from '@/hooks/useMounted'
import Reveal from '@/components/Reveal'
import CountUp from '@/components/CountUp'
import dynamic from 'next/dynamic'

const PoliciesGrid = dynamic(() => import('@/components/policies/PoliciesGrid'), {
  ssr: false,
  loading: () => (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-3 sm:p-4 animate-pulse">
          <div className="h-3.5 w-20 bg-gray-200 rounded mb-1.5" />
          <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="h-9 bg-gray-100 rounded" />
            <div className="h-9 bg-gray-100 rounded" />
          </div>
          <div className="h-8 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  ),
})


export default function AvailablePolicies() {
  const mounted = useMounted()
  const { isConnected } = useAccount()
  const { data: totalInsurances, refetch } = useTotalFlights()
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'best-value' | 'popular'>('all')

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-3 sm:p-4 animate-pulse">
                <div className="h-3.5 w-20 bg-gray-200 rounded mb-1.5" />
                <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="h-9 bg-gray-100 rounded" />
                  <div className="h-9 bg-gray-100 rounded" />
                </div>
                <div className="h-8 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <Reveal as="h2" className="text-xl sm:text-2xl font-bold mb-2">Connect to Browse Policies</Reveal>
            <Reveal delayMs={80} className="text-sm sm:text-base text-muted">Connect your wallet to view and purchase flight insurance policies</Reveal>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <Reveal as="h1" className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Flight Delay Protection</Reveal>
              <Reveal delayMs={80} className="text-sm sm:text-lg text-muted mb-4 sm:mb-6">Browse available coverage options and protect your journey with smart insurance policies.</Reveal>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Instant Coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Transparent Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium">Automatic Payouts</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                <CountUp to={insuranceCount} className="text-3xl font-bold text-primary tabular-nums" />
                <div className="text-sm text-muted">Active Policies</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                <div className="text-3xl font-bold text-primary tabular-nums"><CountUp to={24} />/7</div>
                <div className="text-sm text-muted">Available</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                <div className="text-3xl font-bold text-primary tabular-nums"><CountUp to={100} suffix="%" /></div>
                <div className="text-sm text-muted">Automated</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                <div className="text-3xl font-bold text-primary tabular-nums"><CountUp to={0} /></div>
                <div className="text-sm text-muted">Hidden Fees</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <Reveal as="h2" className="text-xl sm:text-2xl font-bold mb-1">Available Coverage</Reveal>
            <Reveal delayMs={80} className="text-xs sm:text-sm text-muted">Select a policy that matches your flight details</Reveal>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-[--color-border] text-muted hover:bg-gray-50'
              }`}
            >
              All Policies
            </button>
            <button
              onClick={() => setFilterType('best-value')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'best-value'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-[--color-border] text-muted hover:bg-gray-50'
              }`}
            >
              Best Value
            </button>
            <button
              onClick={() => setFilterType('popular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'popular'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-[--color-border] text-muted hover:bg-gray-50'
              }`}
            >
              Most Popular
            </button>
          </div>
        </div>

        {insuranceCount === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Policies Available</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              There are currently no insurance policies available. Be the first to create one and start earning premiums!
            </p>
            <a
              href="/create"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 transition-colors shadow-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Policy
            </a>
          </div>
        ) : (
          <>
            <PoliciesGrid insuranceIds={insuranceIds} onPurchaseSuccess={handlePurchaseSuccess} />

            {/* Info Section */}
            <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
              <Reveal as="h3" className="font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Purchase Coverage
              </Reveal>
              <div className="grid md:grid-cols-4 gap-4">
                <Reveal>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Find Your Flight</p>
                    <p className="text-xs text-muted">Match the policy to your flight details</p>
                  </div>
                </div>
                </Reveal>
                <Reveal delayMs={80}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Review Coverage</p>
                    <p className="text-xs text-muted">Check the payout amount and conditions</p>
                  </div>
                </div>
                </Reveal>
                <Reveal delayMs={160}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Purchase Policy</p>
                    <p className="text-xs text-muted">Complete payment with USDT</p>
                  </div>
                </div>
                </Reveal>
                <Reveal delayMs={240}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Get Protected</p>
                    <p className="text-xs text-muted">Receive automatic payout if delayed</p>
                  </div>
                </div>
                </Reveal>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
