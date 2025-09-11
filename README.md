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

### FlightDelayInsurance
The core insurance contract that manages flight delay insurance policies:
- **Insurance Creation**: Producers can create insurance offerings by depositing collateral
- **Policy Purchase**: Buyers can purchase insurance policies for specific flights
- **Oracle Integration**: Uses RealityERC20 oracle for decentralized flight delay verification
- **Claim Processing**: Automatic payout distribution when flights are confirmed as delayed
- **Refund Mechanism**: Producers can reclaim deposits and premiums when flights are not delayed

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

2. Deploy all contracts (in a new terminal):
```bash
forge script script/DeployAll.s.sol:DeployAll --rpc-url localhost --broadcast -vvvv --sig "runLocal()"
```

### Network Deployment (KAIA Testnet)

1. Create a `.env` file with your private key:
```bash
PRIVATE_KEY=your_private_key_here
```

2. Deploy to KAIA testnet:
```bash
source .env
forge script script/DeployAll.s.sol:DeployAll --rpc-url https://public-en.kairos.node.kaia.io --broadcast -vvvv
```

### Deploy with Existing Token

If you already have a token deployed:
```bash
forge script script/DeployAll.s.sol:DeployAll --rpc-url <RPC_URL> --broadcast -vvvv --sig "runWithExistingToken(address)" -- <TOKEN_ADDRESS>
```

## Project Structure

```
inkureme/
├── src/                          # Smart contracts
│   ├── MockUSDT.sol             # Mock USDT token
│   ├── FlightDelayInsurance.sol # Core insurance contract
│   └── interfaces/              # Contract interfaces
│       └── IRealityERC20.sol    # Oracle interface
├── script/                       # Deployment scripts
│   ├── DeployMockUSDT.s.sol    # Deploy MockUSDT only
│   └── DeployAll.s.sol          # Deploy all contracts
├── test/                         # Contract tests
│   ├── MockUSDT.t.sol           # MockUSDT tests
│   └── FlightDelayInsurance.t.sol # Insurance contract tests
├── lib/                          # Dependencies
│   ├── forge-std/               # Foundry standard library
│   ├── openzeppelin-contracts/  # OpenZeppelin contracts
│   └── reality-kaia/            # RealityERC20 oracle
└── foundry.toml                  # Foundry configuration
```

## Contract Functions

### FlightDelayInsurance

#### Core Functions
- `createInsurance(flightQuestion, depositAmount, insurancePrice, totalPolicies)` - Create new insurance offering
- `buyInsurance(flightId)` - Purchase insurance policy for a flight
- `resolveInsurance(flightId)` - Resolve insurance status via oracle
- `claimPayout(flightId)` - Claim payout if flight was delayed
- `refundDeposit(flightId)` - Producer refunds deposit if flight wasn't delayed

#### View Functions
- `getFlightInfo(flightId)` - Get complete flight insurance information
- `hasPurchasedPolicy(flightId, buyer)` - Check if address purchased policy
- `hasClaimedPayout(flightId, buyer)` - Check if payout was claimed
- `getTotalFlights()` - Get total number of flights registered

## Next Steps

- [x] Implement flight delay oracle integration
- [x] Create insurance policy contract
- [x] Add claim processing logic
- [ ] Develop frontend application
- [ ] Integrate with real flight data APIs
- [ ] Add emergency pause functionality
- [ ] Implement fee structure for platform sustainability

## License

MIT