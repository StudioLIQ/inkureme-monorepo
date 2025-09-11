import { defineChain } from 'viem'
import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import MockUSDTAbi from './abis/MockUSDT.json'
import FlightDelayInsuranceAbi from './abis/FlightDelayInsurance.json'

// Kaia Testnet Chain Configuration
export const kaiaTestnet = defineChain({
  id: 1001,
  name: 'Kaia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KLAY',
    symbol: 'KLAY',
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
  connectors: [
    injected(),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          }),
        ]
      : []),
  ],
})