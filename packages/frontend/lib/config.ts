import { defineChain, type EIP1193Provider } from 'viem'
import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import MockUSDTAbi from './abis/MockUSDT.json'
import FlightDelayInsuranceAbi from './abis/FlightDelayInsurance.json'
import kairos from './deployments/kairos.json'

// Kaia Testnet (Kairos)
export const kaiaTestnet = defineChain({
  id: 1001,
  name: 'KAIA Kairos',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://public-en-kairos.node.kaia.io'],
    },
    public: {
      http: ['https://public-en-kairos.node.kaia.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'KairosScan',
      url: 'https://kairos.kaiascan.io',
    },
  },
  testnet: true,
})

// Kaia Mainnet (Cypress)
export const kaiaMainnet = defineChain({
  id: 8217,
  name: 'KAIA Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://public-en.node.kaia.io'],
    },
    public: {
      http: ['https://public-en.node.kaia.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'KaiaScan',
      url: 'https://kaiascan.io',
    },
  },
})

// Contract Addresses
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_KAIA_CHAIN_ID || 1001)
const fromEnv = {
  mock: process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS,
  insurance: process.env.NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS,
}
const fromDeployments = CHAIN_ID === 1001
  ? { mock: kairos.MockUSDT, insurance: kairos.FlightDelayInsurance }
  : { mock: undefined, insurance: undefined }

const mockAddress = (fromDeployments.mock || fromEnv.mock || '0x0000000000000000000000000000000000000000') as `0x${string}`
const insuranceAddress = (fromDeployments.insurance || fromEnv.insurance || '0x0000000000000000000000000000000000000000') as `0x${string}`

export const contracts = {
  mockUSDT: {
    address: mockAddress,
    abi: MockUSDTAbi as readonly unknown[],
  },
  flightDelayInsurance: {
    address: insuranceAddress,
    abi: FlightDelayInsuranceAbi as readonly unknown[],
  },
}

// Wagmi Configuration
export const config = createConfig({
  chains: [kaiaMainnet, kaiaTestnet],
  transports: {
    [kaiaMainnet.id]: http(),
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
