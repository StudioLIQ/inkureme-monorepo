#!/usr/bin/env bash
set -euo pipefail

# One-command hackathon demo setup for Kairos (testnet):
# - Deploy a mock Reality oracle and a fresh FlightDelayInsurance
# - Point frontend to the new insurance address
# - Seed 20 example insurances
#
# Usage:
#   scripts/demo_setup.sh [--network kaia-testnet|local]

NETWORK="kaia-testnet"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/packages/contracts"
FRONTEND_DIR="$ROOT_DIR/packages/frontend"
DEPLOYMENTS_DIR="$CONTRACTS_DIR/deployments"

case "$NETWORK" in
  kaia-testnet)
    RPC_URL="${KAIA_TESTNET_RPC_URL:-https://public-en-kairos.node.kaia.io}"
    CHAIN_ID=1001
    DEP_FILE="$DEPLOYMENTS_DIR/kairos.json" ;;
  local)
    RPC_URL="${RPC_URL:-http://localhost:8545}"
    CHAIN_ID=31337
    DEP_FILE="$DEPLOYMENTS_DIR/local.json" ;;
  *) echo "Unsupported network: $NETWORK" >&2; exit 1 ;;
esac

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  # Try to source from contracts .env
  if [[ -f "$CONTRACTS_DIR/.env" ]]; then
    # shellcheck disable=SC1090
    source "$CONTRACTS_DIR/.env"
  fi
fi

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Error: PRIVATE_KEY env var is required" >&2
  exit 1
fi

mkdir -p "$DEPLOYMENTS_DIR"

# Resolve token address: prefer deployments, fallback to frontend env
TOKEN_ADDRESS=""
if [[ -f "$DEP_FILE" ]]; then
  TOKEN_ADDRESS=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('$DEP_FILE','utf8'));process.stdout.write(j.contracts?.MockUSDT||'');")
fi
if [[ -z "$TOKEN_ADDRESS" && -f "$FRONTEND_DIR/.env.kairos" ]]; then
  TOKEN_ADDRESS=$(awk -F= '/^NEXT_PUBLIC_MOCK_USDT_ADDRESS=/{print $2}' "$FRONTEND_DIR/.env.kairos" || true)
fi
if [[ -z "$TOKEN_ADDRESS" && -f "$FRONTEND_DIR/.env.local" ]]; then
  TOKEN_ADDRESS=$(awk -F= '/^NEXT_PUBLIC_MOCK_USDT_ADDRESS=/{print $2}' "$FRONTEND_DIR/.env.local" || true)
fi
if [[ -z "$TOKEN_ADDRESS" ]]; then
  echo "Error: Could not resolve MockUSDT token address. Deploy contracts first." >&2
  exit 1
fi

echo "==> Deploying mock oracle + insurance on $NETWORK"
(
  cd "$CONTRACTS_DIR"
  TOKEN_ADDRESS="$TOKEN_ADDRESS" forge script script/DeployMockInsurance.s.sol:DeployMockInsurance \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --skip-simulation \
    --broadcast \
    -vvvv
)

# Read newly deployed Insurance address from broadcast file
BROADCAST_DIR="$CONTRACTS_DIR/broadcast/DeployMockInsurance.s.sol/$CHAIN_ID"
RUN_FILE="$BROADCAST_DIR/run-latest.json"
if [[ ! -f "$RUN_FILE" ]]; then
  echo "Broadcast output not found: $RUN_FILE" >&2
  exit 1
fi

NEW_INSURANCE=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('$RUN_FILE','utf8'));const tx=j.transactions.find(t=>t.contractName==='FlightDelayInsurance');process.stdout.write((tx&&tx.contractAddress)||'');")
if [[ -z "$NEW_INSURANCE" ]]; then
  echo "Failed to extract new insurance address from broadcast" >&2
  exit 1
fi

echo "==> Updating deployments and frontend env"
MOCK_USDT="$TOKEN_ADDRESS"
mkdir -p "$DEPLOYMENTS_DIR"
cat > "$DEP_FILE" <<JSON
{
  "chainId": $CHAIN_ID,
  "network": "$NETWORK",
  "contracts": {
    "MockUSDT": "$MOCK_USDT",
    "FlightDelayInsurance": "$NEW_INSURANCE"
  },
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

for ENV in "$FRONTEND_DIR/.env.kairos" "$FRONTEND_DIR/.env.local"; do
  [[ -f "$ENV" ]] || continue
  if grep -qE '^NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS=' "$ENV"; then
    sed -i '' -E "s|^NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS=.*|NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS=$NEW_INSURANCE|" "$ENV"
  else
    echo "NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS=$NEW_INSURANCE" >> "$ENV"
  fi
done

echo "==> Seeding example insurances"
INSURANCE_ADDRESS="$NEW_INSURANCE" TOKEN_ADDRESS="$MOCK_USDT" PRIVATE_KEY="$PRIVATE_KEY" KAIA_TESTNET_RPC_URL="$RPC_URL" \
bash "$ROOT_DIR/scripts/seed_insurances.sh" --network "$NETWORK"

echo "==> Demo setup complete"
echo "- Insurance: $NEW_INSURANCE"
echo "- Token:     $MOCK_USDT"
echo "- Frontend env updated (.env.kairos, .env.local if present)"

