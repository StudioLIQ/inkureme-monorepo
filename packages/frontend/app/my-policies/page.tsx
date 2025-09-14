"use client"

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useTotalFlights } from '@/hooks/useInsurance'
import Reveal from '@/components/Reveal'
import dynamic from 'next/dynamic'

const PoliciesLists = dynamic(() => import('@/components/my-policies/PoliciesLists'), {
  ssr: false,
  loading: () => (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded mb-2.5" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="h-9 bg-gray-100 rounded" />
            <div className="h-9 bg-gray-100 rounded" />
          </div>
          <div className="h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  ),
})

export default function MyPolicies() {
  const { address, isConnected } = useAccount()
  const { data: totalInsurances } = useTotalFlights()
  const [activeTab, setActiveTab] = useState<'provider' | 'insured'>('provider')

  const insuranceCount = totalInsurances ? Number(totalInsurances) : 0
  const insuranceIds = Array.from({ length: insuranceCount }, (_, i) => BigInt(i + 1))

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <Reveal as="h2" className="text-2xl font-bold mb-2">Connect to View Policies</Reveal>
            <Reveal delayMs={80} className="text-muted">Connect your wallet to manage your insurance policies</Reveal>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Reveal as="h1" className="text-3xl sm:text-4xl font-bold mb-2">Policy Management</Reveal>
          <Reveal delayMs={80} className="text-muted">Track and manage your insurance policies in one place</Reveal>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[--color-border]">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('provider')} className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'provider' ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
              Policies I Provide
              {activeTab === 'provider' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button onClick={() => setActiveTab('insured')} className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'insured' ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
              My Coverage
              {activeTab === 'insured' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 sm:space-y-8">
          {activeTab === 'provider' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Created Policies</h2>
                <a href="/create" className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium">
                  Create New Policy
                </a>
              </div>
              <PoliciesLists insuranceIds={insuranceIds} address={address!} mode="provider" />
            </div>
          )}

          {activeTab === 'insured' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Purchased Coverage</h2>
                <a href="/policies" className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium">
                  Browse More Policies
                </a>
              </div>
              <PoliciesLists insuranceIds={insuranceIds} address={address!} mode="insured" />
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
            <p className="text-muted mb-6 max-w-md mx-auto">Start by creating a policy to earn premiums or browse available policies to get coverage</p>
            <div className="flex gap-3 justify-center">
              <a href="/create" className="px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 transition-colors shadow-sm font-medium">
                Create a Policy
              </a>
              <a href="/policies" className="px-6 py-3 bg-foreground text-background rounded-full hover:opacity-90 transition-colors shadow-sm font-medium">
                Browse Policies
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
