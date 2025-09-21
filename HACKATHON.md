# Hackathon Demo Guide

One-command setup to deploy, seed, and run the demo on Kairos (Kaia testnet).

## Prerequisites

- Foundry installed (`forge` available)
- `packages/contracts/.env` with:
  - `PRIVATE_KEY=<hex without 0x>`
  - `KAIA_TESTNET_RPC_URL=https://public-en-kairos.node.kaia.io` (or your endpoint)
- Contracts deployed once to get `MockUSDT` (use `npm run deploy:kaia-testnet` if needed)

## Quickstart

1. Deploy mock oracle + fresh insurance, update frontend envs, seed example flights:
   
   `npm run demo:kairos`

2. Start the frontend:
   
   `npm run frontend:dev`

The app lists 20 active insurances over the next ~14 weeks. Use the "Mint Mock USDT" card to get tokens, then purchase coverage.

## Commands

- Deploy base contracts (MockUSDT + Insurance with on-chain oracle address):
  - `npm run deploy:kaia-testnet`
- Seed insurances for the currently configured deployment:
  - `PRIVATE_KEY=... npm run seed:kaia-testnet`
- End-to-end demo reset (new insurance with mock oracle + seed + env update):
  - `npm run demo:kairos`

