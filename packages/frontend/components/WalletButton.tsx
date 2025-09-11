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
          <div className="text-muted">Connected to {chain?.name || 'Unknown Network'}</div>
          <div className="font-mono text-xs text-muted">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-colors"
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
          className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors"
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
