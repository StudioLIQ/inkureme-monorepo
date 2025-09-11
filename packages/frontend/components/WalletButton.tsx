'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import type { EIP1193Provider } from 'viem'

type KaiaProvider = EIP1193Provider & { isKaia?: boolean }
type WindowWithKaia = Window & {
  kaia?: KaiaProvider
  klaytn?: KaiaProvider
  ethereum?: (KaiaProvider & { providers?: KaiaProvider[] }) | undefined
}

export function WalletButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  const [kaiaAvailable, setKaiaAvailable] = useState<boolean>(true)

  useEffect(() => {
    setMounted(true)
    try {
      const w = typeof window !== 'undefined' ? (window as WindowWithKaia) : undefined
      const providers: KaiaProvider[] = Array.isArray(w?.ethereum?.providers)
        ? (w!.ethereum!.providers as KaiaProvider[])
        : []
      const hasKaia = Boolean(
        w?.kaia || w?.klaytn || w?.ethereum?.isKaia || providers.some((p: KaiaProvider) => p?.isKaia)
      )
      setKaiaAvailable(hasKaia)
    } catch {
      setKaiaAvailable(false)
    }
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

  const injectedConnector = connectors.find((c) => c.id === 'kaia')

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        disabled={isPending || !injectedConnector || !kaiaAvailable}
        className="px-6 py-2.5 bg-primary text-white rounded-full hover:opacity-90 disabled:bg-gray-400 transition-colors text-sm font-medium shadow-sm"
      >
        {isPending ? 'Connecting…' : 'Connect KAIA Wallet'}
      </button>
      {!kaiaAvailable && (
        <p className="text-sm text-muted">
          KAIA Wallet not detected. Please install and refresh.
        </p>
      )}
      {error && (
        <div className="text-red-500 text-sm mt-2">{error.message}</div>
      )}
    </div>
  )
}
