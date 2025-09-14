'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { ReactNode } from 'react'
import { ToastProvider } from '@/components/Toast'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider position="bottom-right" defaultDurations={{ success: 2800, error: 4000, info: 2600 }}>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
