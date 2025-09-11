'use client'

import { MintMockUSDT } from '@/components/MintMockUSDT'
import { useAccount } from 'wagmi'
import Link from 'next/link'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Flight Delay Insurance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Decentralized insurance for flight delays on Kaia Network
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Getting Started
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Connect your wallet to Kaia Testnet</li>
              <li>Mint some test mUSDT tokens</li>
              <li>Purchase flight delay insurance</li>
              <li>Claim automatically if your flight is delayed</li>
            </ol>
            <div className="mt-6 flex gap-3">
              <Link
                href="/create"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Create Policy
              </Link>
              <Link
                href="/policies"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                Browse Policies
              </Link>
            </div>
          </div>

          {isConnected && <MintMockUSDT />}
          
          {!isConnected && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Connect Wallet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to interact with the smart contracts
              </p>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Contract Addresses
            </h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mock USDT:</span>
                <span className="text-gray-900 dark:text-white">
                  {process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Insurance Contract:</span>
                <span className="text-gray-900 dark:text-white">
                  {process.env.NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              ⚠️ Update these addresses in .env.local with your deployed contracts
            </p>
          </div>
        )}
      </main>
    </div>
  )
}