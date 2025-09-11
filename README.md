# Flight Delay Insurance - Smart Contracts

An Optimistic Oracle-based flight delay insurance service built with Foundry.

## Overview

This project implements a decentralized flight delay insurance system using smart contracts. The monorepo will eventually contain both smart contracts and a frontend application.

## Smart Contracts

### MockUSDT
A mock USDT token for testing purposes:
- ERC20 token with 6 decimals (matching real USDT)
- Public mint function allowing any user to mint 10,000 mUSDT per day
- 24-hour cooldown period between mints for each address

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inkureme
```

2. Install dependencies:
```bash
forge install
```

## Testing

Run the test suite:
```bash
forge test
```

Run tests with gas reporting:
```bash
forge test --gas-report
```

## Deployment

### Local Deployment (Anvil)

1. Start a local Anvil instance:
```bash
anvil
```

2. Deploy the contracts (in a new terminal):
```bash
forge script script/DeployMockUSDT.s.sol:DeployMockUSDT --rpc-url localhost --broadcast -vvvv --sig "runLocal()"
```

### Network Deployment

1. Create a `.env` file with your private key:
```bash
PRIVATE_KEY=your_private_key_here
```

2. Deploy to a network:
```bash
source .env
forge script script/DeployMockUSDT.s.sol:DeployMockUSDT --rpc-url <RPC_URL> --broadcast -vvvv
```

## Project Structure

```
inkureme/
├── src/                  # Smart contracts
│   └── MockUSDT.sol      # Mock USDT token
├── script/               # Deployment scripts
│   └── DeployMockUSDT.s.sol
├── test/                 # Contract tests
│   └── MockUSDT.t.sol
├── lib/                  # Dependencies
└── foundry.toml          # Foundry configuration
```

## Next Steps

- [ ] Implement flight delay oracle integration
- [ ] Create insurance policy contract
- [ ] Add claim processing logic
- [ ] Develop frontend application
- [ ] Integrate with real flight data APIs

## License

MIT