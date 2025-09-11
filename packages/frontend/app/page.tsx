'use client'

import { MintMockUSDT } from '@/components/MintMockUSDT'
import { useAccount } from 'wagmi'
import Link from 'next/link'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50 to-white" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Flight Delay Insurance,
                <span className="block text-primary">simple and decentralized.</span>
              </h1>
              <p className="mt-5 text-lg text-muted max-w-2xl">
                Protect your trips with transparent, on-chain coverage. Powered by Kaia and oracles.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/policies" className="px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-sm hover:opacity-90">
                  Browse Policies
                </Link>
                <Link href="/create" className="px-6 py-3 rounded-full border border-[--color-border] text-foreground font-semibold hover:bg-gray-50">
                  Create a Policy
                </Link>
              </div>
            </div>
            <div className="md:col-span-5">
              {isConnected ? (
                <MintMockUSDT />
              ) : (
                <div className="card p-6">
                  <h3 className="text-xl font-semibold mb-2">Get Test Tokens</h3>
                  <p className="text-sm text-muted mb-4">Mint mUSDT for testing on Kaia Testnet.</p>
                  <div className="rounded-lg border border-dashed border-[--color-border] p-6 text-center text-sm text-muted">
                    Connect your KAIA Wallet to mint test tokens.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[--color-border]" />

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="text-primary text-2xl mb-2">①</div>
              <h3 className="font-semibold mb-1">Choose a policy</h3>
              <p className="text-sm text-muted">Select coverage for your specific flight and price.</p>
            </div>
            <div className="card p-6">
              <div className="text-primary text-2xl mb-2">②</div>
              <h3 className="font-semibold mb-1">Purchase on-chain</h3>
              <p className="text-sm text-muted">Pay with mUSDT and receive coverage instantly.</p>
            </div>
            <div className="card p-6">
              <div className="text-primary text-2xl mb-2">③</div>
              <h3 className="font-semibold mb-1">Auto claim</h3>
              <p className="text-sm text-muted">If delayed, payouts are processed transparently via oracle.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[--color-border]" />

      {/* Trust & Transparency */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Trust & Transparency</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="text-primary text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-1">Audited Building Blocks</h3>
              <p className="text-sm text-muted">Contracts built on open standards and reputable libraries to reduce risk.</p>
            </div>
            <div className="card p-6">
              <div className="text-primary text-2xl mb-2">🧾</div>
              <h3 className="font-semibold mb-1">On-Chain Transparency</h3>
              <p className="text-sm text-muted">Every policy and payout is recorded on the Kaia blockchain.</p>
            </div>
            <div className="card p-6">
              <div className="text-primary text-2xl mb-2">🛰️</div>
              <h3 className="font-semibold mb-1">Oracle Evidence</h3>
              <p className="text-sm text-muted">Independent oracle responses determine outcomes in a verifiable way.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
