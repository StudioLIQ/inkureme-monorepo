#!/usr/bin/env bash
set -euo pipefail

# Seed a batch of example insurances on a given network.
# Reads addresses from packages/contracts/deployments/kairos.json by default for kaia-testnet.
#
# Usage:
#   scripts/seed_insurances.sh [--network kaia-testnet|kaia-mainnet|local]

NETWORK="kaia-testnet"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="$2"; shift 2 ;;
    *)
      echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/packages/contracts"
DEPLOYMENTS_DIR="$CONTRACTS_DIR/deployments"

case "$NETWORK" in
  local)
    RPC_URL="${RPC_URL:-http://localhost:8545}"
    DEP_FILE="$DEPLOYMENTS_DIR/local.json" ;;
  kaia-testnet)
    RPC_URL="${KAIA_TESTNET_RPC_URL:-https://public-en-kairos.node.kaia.io}"
DEP_FILE="$DEPLOYMENTS_DIR/kairos.json" ;;
  kaia-mainnet)
    RPC_URL="${KAIA_MAINNET_RPC_URL:-https://public-en.node.kaia.io}"
    DEP_FILE="$DEPLOYMENTS_DIR/kaia-mainnet.json" ;;
  *)
    echo "Unsupported network: $NETWORK" >&2; exit 1 ;;
esac

# Resolve addresses:
# - Use env overrides if present (INSURANCE_ADDRESS, TOKEN_ADDRESS)
# - Otherwise read from deployments file
if [[ -z "${TOKEN_ADDRESS:-}" || -z "${INSURANCE_ADDRESS:-}" ]]; then
  if [[ ! -f "$DEP_FILE" ]]; then
    echo "Deployment file not found: $DEP_FILE and no env overrides provided" >&2
    exit 1
  fi
  if [[ -z "${TOKEN_ADDRESS:-}" ]]; then
    TOKEN_ADDRESS=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('$DEP_FILE','utf8'));process.stdout.write(j.contracts.MockUSDT||'');")
  fi
  if [[ -z "${INSURANCE_ADDRESS:-}" ]]; then
    INSURANCE_ADDRESS=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('$DEP_FILE','utf8'));process.stdout.write(j.contracts.FlightDelayInsurance||'');")
  fi
fi

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Error: PRIVATE_KEY env var is required to seed insurances" >&2
  exit 1
fi

echo "==> Seeding insurances on $NETWORK"
echo "Token:     $TOKEN_ADDRESS"
echo "Insurance: $INSURANCE_ADDRESS"

(
  cd "$CONTRACTS_DIR"
  INSURANCE_ADDRESS="$INSURANCE_ADDRESS" TOKEN_ADDRESS="$TOKEN_ADDRESS" \
  forge script script/SeedInsurances.s.sol:SeedInsurances \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --skip-simulation \
    --broadcast \
    -vvvv
)

echo "==> Seeding complete"
