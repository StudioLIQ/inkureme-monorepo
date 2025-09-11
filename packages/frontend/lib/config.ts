import { defineChain, type EIP1193Provider } from 'viem'
import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import MockUSDTAbi from './abis/MockUSDT.json'
import FlightDelayInsuranceAbi from './abis/FlightDelayInsurance.json'

// Kaia Testnet Chain Configuration
export const kaiaTestnet = defineChain({
  id: 1001,
  name: 'Kaia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://kaia-baobab.blockpi.network/v1/rpc/public'],
    },
    public: {
      http: ['https://kaia-baobab.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'KaiaScan',
      url: 'https://baobab.kaiascan.io',
    },
  },
  testnet: true,
})

// Contract Addresses
export const contracts = {
  mockUSDT: {
    address: (process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: MockUSDTAbi as readonly unknown[],
  },
  flightDelayInsurance: {
    address: (process.env.NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: FlightDelayInsuranceAbi as readonly unknown[],
  },
}

// Wagmi Configuration
export const config = createConfig({
  chains: [kaiaTestnet],
  transports: {
    [kaiaTestnet.id]: http(),
  },
  // Only support KAIA Wallet (injected) by explicitly targeting KAIA provider
  connectors: [
    injected({
      target: () => ({
        id: 'kaia',
        name: 'KAIA Wallet',
        provider(windowArg) {
          type KaiaProvider = EIP1193Provider & { isKaia?: boolean }
          type WindowWithKaia = Window & {
            kaia?: KaiaProvider
            klaytn?: KaiaProvider
            ethereum?: (KaiaProvider & { providers?: KaiaProvider[] }) | undefined
          }
          const w = windowArg as unknown as WindowWithKaia
          if (w?.kaia) return w.kaia
          if (w?.klaytn) return w.klaytn
          if (w?.ethereum?.isKaia) return w.ethereum
          const providers: KaiaProvider[] = Array.isArray(w?.ethereum?.providers)
            ? (w.ethereum!.providers as KaiaProvider[])
            : []
          const p = providers.find((prov: KaiaProvider) => prov?.isKaia)
          if (p) return p
          return undefined
        },
      }),
    }),
  ],
})
