'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'

export function WalletButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="text-gray-600 dark:text-gray-400">Connected to {chain?.name || 'Unknown Network'}</div>
          <div className="font-mono text-xs text-gray-500 dark:text-gray-500">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          {isPending ? 'Connecting...' : `Connect with ${connector.name}`}
        </button>
      ))}
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error.message}
        </div>
      )}
    </div>
  )
}