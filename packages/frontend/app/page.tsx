'use client'

import { MintMockUSDT } from '@/components/MintMockUSDT'
import { useAccount } from 'wagmi'
import Link from 'next/link'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50 to-white" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                Protect Your Journey
                <span className="block text-primary">With Smart Flight Insurance</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted max-w-2xl">
                Get automatic compensation when your flight is delayed. Fair, transparent, and powered by blockchain technology.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link href="/policies" className="w-full sm:w-auto px-5 py-3 rounded-full bg-primary text-white font-semibold shadow-sm hover:opacity-90 transition-all hover:shadow-md text-center">
                  Browse Available Coverage
                </Link>
                <Link href="/create" className="w-full sm:w-auto px-5 py-3 rounded-full border border-[--color-border] text-foreground font-semibold hover:bg-gray-50 transition-all text-center">
                  Become a Provider
                </Link>
              </div>
            </div>
            <div className="md:col-span-5">
              {isConnected ? (
                <MintMockUSDT />
              ) : (
                <div className="card p-4 sm:p-6">
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Testnet Demo
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Start Your Trial</h3>
                  <p className="text-sm text-muted mb-4">Get free test tokens to explore the platform risk-free.</p>
                  <div className="rounded-lg border border-dashed border-[--color-border] p-4 sm:p-6 text-center text-sm text-muted">
                    Connect your wallet to receive test tokens instantly
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
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Simple as 1-2-3</h2>
            <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto">Get covered in minutes with our streamlined process</p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-semibold mb-2 text-lg">Select Coverage</h3>
              <p className="text-sm text-muted leading-relaxed">Browse available policies for your flight route and choose your coverage level.</p>
            </div>
            <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-semibold mb-2 text-lg">Quick Purchase</h3>
              <p className="text-sm text-muted leading-relaxed">Complete your purchase in seconds with instant blockchain confirmation.</p>
            </div>
            <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-semibold mb-2 text-lg">Automatic Payout</h3>
              <p className="text-sm text-muted leading-relaxed">Receive compensation automatically if your flight is delayed - no paperwork needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[--color-border]" />

      {/* Trust & Transparency */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Built on Trust</h2>
            <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto">Your protection is secured by smart contracts and verified data</p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl mb-4">
                🔒
              </div>
              <h3 className="font-semibold mb-2 text-lg">Secure & Audited</h3>
              <p className="text-sm text-muted leading-relaxed">Smart contracts built with industry-standard security practices and open-source libraries.</p>
              <div className="mt-4 inline-flex items-center text-xs text-primary font-medium">
                Learn more →
              </div>
            </div>
            <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl mb-4">
                📊
              </div>
              <h3 className="font-semibold mb-2 text-lg">Fully Transparent</h3>
              <p className="text-sm text-muted leading-relaxed">All transactions are visible on the blockchain - track every policy and payout in real-time.</p>
              <div className="mt-4 inline-flex items-center text-xs text-primary font-medium">
                View on explorer →
              </div>
            </div>
            <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl mb-4">
                ✅
              </div>
              <h3 className="font-semibold mb-2 text-lg">Verified Data</h3>
              <p className="text-sm text-muted leading-relaxed">Flight status verified by independent oracles ensuring fair and accurate claim settlements.</p>
              <div className="mt-4 inline-flex items-center text-xs text-primary font-medium">
                How it works →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-16 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">100%</div>
              <div className="text-xs sm:text-sm text-muted mt-1">Automated Claims</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">&lt; 1 min</div>
              <div className="text-xs sm:text-sm text-muted mt-1">Purchase Time</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
              <div className="text-xs sm:text-sm text-muted mt-1">Platform Availability</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">0</div>
              <div className="text-xs sm:text-sm text-muted mt-1">Hidden Fees</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
