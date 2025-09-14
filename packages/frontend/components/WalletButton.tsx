'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useState, useEffect } from 'react'
import type { EIP1193Provider } from 'viem'
import { useToast } from '@/components/Toast'

type KaiaProvider = EIP1193Provider & { isKaia?: boolean }
type WindowWithKaia = Window & {
  kaia?: KaiaProvider
  klaytn?: KaiaProvider
  ethereum?: (KaiaProvider & { providers?: KaiaProvider[] }) | undefined
}

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { addToast } = useToast()
  const { switchChain, isPending: isSwitching } = useSwitchChain({
    onSuccess(data) {
      const name = data?.name || (data?.id === 1001 ? 'KAIA Kairos' : data?.id === 8217 ? 'KAIA Mainnet' : 'Selected')
      addToast(`Switched to ${name}`, 'success')
    },
    onError(err) {
      addToast(err?.message?.includes('User rejected') ? 'Network switch rejected' : 'Failed to switch network', 'error')
    },
  })
  const [mounted, setMounted] = useState(false)
  const [kaiaAvailable, setKaiaAvailable] = useState<boolean>(true)
  const [attemptedAutoSwitch, setAttemptedAutoSwitch] = useState(false)
  const isDefault = chainId === 1001

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

  // Auto-switch to Kairos after connecting, if on another network
  useEffect(() => {
    if (!mounted) return
    if (isConnected && !isDefault && !isSwitching && !attemptedAutoSwitch) {
      try {
        switchChain({ chainId: 1001 })
      } catch {
        // toast handled by onError in hook
      } finally {
        setAttemptedAutoSwitch(true)
      }
    }
    if (!isConnected && attemptedAutoSwitch) {
      setAttemptedAutoSwitch(false)
    }
  }, [mounted, isConnected, isDefault, isSwitching, attemptedAutoSwitch, switchChain])

  if (!mounted) return null

  const injectedConnector = connectors.find((c) => c.id === 'kaia')

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const networkName = chainId === 1001 ? 'KAIA Kairos' : chainId === 8217 ? 'KAIA Mainnet' : 'Unknown'
  const isKnown = chainId === 1001 || chainId === 8217

  const handleClick = () => {
    if (isConnected) {
      disconnect()
      return
    }
    if (injectedConnector) {
      connect({ connector: injectedConnector, chainId: 1001 })
    }
  }

  

  const baseClasses = 'px-4 py-2 rounded-full text-sm font-medium transition-colors'
  const connectedClasses = 'border border-[--color-border] text-foreground hover:bg-gray-50'
  const connectClasses = 'bg-primary text-white hover:opacity-90 disabled:bg-gray-400 shadow-sm'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isPending || (!isConnected && (!injectedConnector || !kaiaAvailable))}
        title={!kaiaAvailable ? 'KAIA Wallet not detected' : undefined}
        className={`${baseClasses} ${isConnected ? connectedClasses : connectClasses}`}
      >
        {isPending
          ? 'Connecting…'
          : isConnected
          ? `${networkName} • ${shortAddress}`
          : 'Connect KAIA Wallet'}
      </button>
      {isConnected && !isDefault && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-amber-600">{isKnown ? 'Default: Kairos' : 'Wrong network'}</span>
          <button
            onClick={() => switchChain({ chainId: 1001 })}
            disabled={isSwitching}
            className="px-2.5 py-1.5 rounded-full border border-[--color-border] text-xs hover:bg-gray-50"
          >
            {isSwitching ? 'Switching…' : 'Switch to Kairos'}
          </button>
        </div>
      )}
      {(!isConnected && !kaiaAvailable) && (
        <span className="text-xs text-muted">KAIA Wallet not detected</span>
      )}
      {error && (
        <div className="text-red-500 text-sm">{error.message}</div>
      )}
    </div>
  )
}
