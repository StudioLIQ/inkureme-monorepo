# Inkureme Frontend

A Next.js dApp for flight delay insurance on Kaia Network.

## Project Structure

```
packages/frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── Providers.tsx      # Wagmi & React Query providers
│   ├── WalletButton.tsx   # Wallet connection component
│   └── MintMockUSDT.tsx   # Mock USDT minting component
├── lib/                   # Utilities and config
│   ├── config.ts          # Wagmi & chain configuration
│   └── abis/              # Contract ABIs
│       ├── MockUSDT.json
│       └── FlightDelayInsurance.json
├── .env.local             # Environment variables
└── package.json           # Dependencies

```

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Update contract addresses in `.env.local`:**
```env
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x... # Your deployed MockUSDT address
NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS=0x... # Your deployed insurance contract
```

3. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features Implemented

✅ **Wallet Connection**
- Connect/disconnect wallet button
- Support for MetaMask and other injected wallets
- Shows connected address and network name

✅ **Mock USDT Minting**
- Mint 10,000 mUSDT with one click
- Shows current balance
- Transaction status feedback
- Links to block explorer

✅ **Configuration**
- Environment variables for contract addresses
- Centralized configuration in `lib/config.ts`
- Kaia Testnet network configuration

✅ **UI/UX**
- Responsive design with Tailwind CSS
- Dark mode support
- Loading states and error handling
- Transaction feedback

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **wagmi** - Ethereum interactions
- **viem** - Ethereum library
- **Tailwind CSS** - Styling
- **@tanstack/react-query** - Data fetching

## Next Steps

To extend this dApp, you can:
1. Add insurance purchase functionality
2. Implement policy listing and management
3. Add claim submission interface
4. Integrate with the Reality Oracle
5. Add more detailed flight search/selection