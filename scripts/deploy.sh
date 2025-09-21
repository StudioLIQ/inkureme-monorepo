#!/usr/bin/env bash
set -euo pipefail

# Deploy all contracts with Foundry and sync addresses/ABIs to the frontend.
#
# Usage:
#   scripts/deploy.sh [--network local|kaia-testnet|kaia-mainnet] [--existing-token 0x...]
#
# Notes:
# - For non-local networks, set PRIVATE_KEY and appropriate RPC URL envs.
# - RPC envs supported: KAIA_TESTNET_RPC_URL, KAIA_MAINNET_RPC_URL.
# - Frontend addresses are written to packages/frontend/.env.local

NETWORK="local"
EXISTING_TOKEN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="$2"; shift 2 ;;
    --existing-token)
      EXISTING_TOKEN="$2"; shift 2 ;;
    *)
      echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/packages/contracts"
FRONTEND_DIR="$ROOT_DIR/packages/frontend"
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env.local"
FRONTEND_ABI_DIR="$FRONTEND_DIR/lib/abis"

if [[ ! -d "$CONTRACTS_DIR" ]]; then
  echo "Contracts directory not found at $CONTRACTS_DIR" >&2
  exit 1
fi

mkdir -p "$FRONTEND_ABI_DIR"

# Resolve RPC URL and script signature by network
SIG="run()"
PRIVATE_KEY_ARG=()
case "$NETWORK" in
  local)
    RPC_URL="${RPC_URL:-http://localhost:8545}"
    SIG="runLocal()"
    ;;
  kaia-testnet)
    RPC_URL="${KAIA_TESTNET_RPC_URL:-https://public-en-kairos.node.kaia.io}"
    if [[ -z "${PRIVATE_KEY:-}" ]]; then
      echo "Error: PRIVATE_KEY env var is required for kaia-testnet" >&2
      exit 1
    fi
    PRIVATE_KEY_ARG=(--private-key "$PRIVATE_KEY")
    ;;
  kaia-mainnet)
    RPC_URL="${KAIA_MAINNET_RPC_URL:-https://public-en.node.kaia.io}"
    if [[ -z "${PRIVATE_KEY:-}" ]]; then
      echo "Error: PRIVATE_KEY env var is required for kaia-mainnet" >&2
      exit 1
    fi
    PRIVATE_KEY_ARG=(--private-key "$PRIVATE_KEY")
    ;;
  *)
    echo "Unsupported network: $NETWORK" >&2
    exit 1
    ;;
esac

echo "==> Building contracts (forge build --skip test)"
(
  cd "$CONTRACTS_DIR"
  forge build --skip test >/dev/null
)

DEPLOY_LOG="$(mktemp -t deploy_log_XXXX.txt)"
trap 'rm -f "$DEPLOY_LOG"' EXIT

echo "==> Deploying with forge script on network: $NETWORK"
(
  cd "$CONTRACTS_DIR"
  if [[ -n "$EXISTING_TOKEN" ]]; then
    # Use existing token address with runWithExistingToken(address)
    forge script script/DeployAll.s.sol:DeployAll \
      --rpc-url "$RPC_URL" \
      "${PRIVATE_KEY_ARG[@]}" \
      --broadcast \
      --sig "runWithExistingToken(address)" "$EXISTING_TOKEN" \
      -vvvv 2>&1 | tee "$DEPLOY_LOG"
  else
    forge script script/DeployAll.s.sol:DeployAll \
      --rpc-url "$RPC_URL" \
      "${PRIVATE_KEY_ARG[@]}" \
      --broadcast \
      --sig "$SIG" \
      -vvvv 2>&1 | tee "$DEPLOY_LOG"
  fi
)

# Extract deployed addresses from console logs
parse_address() {
  local label="$1"; shift
  # Find the last occurrence and take the final field (address)
  grep -E "$label" "$DEPLOY_LOG" | tail -n 1 | awk '{print $NF}'
}

MOCK_ADDR="$(parse_address "MockUSDT deployed at:")"
INSURANCE_ADDR="$(parse_address "FlightDelayInsurance deployed at:")"

if [[ -z "$INSURANCE_ADDR" ]]; then
  echo "Failed to parse deployed addresses. See log at $DEPLOY_LOG" >&2
  exit 1
fi

echo "==> Deployed addresses"
echo "MockUSDT:            ${MOCK_ADDR:-<existing>}"
echo "FlightDelayInsurance: $INSURANCE_ADDR"

echo "==> Syncing ABIs to frontend ($FRONTEND_ABI_DIR)"
extract_abi() {
  local src="$1"; shift
  local dst="$1"; shift
  node -e '
    const fs = require("fs");
    const [src, dst] = process.argv.slice(1);
    const j = JSON.parse(fs.readFileSync(src, "utf8"));
    const abi = j.abi || (j.output && j.output.abi) || j; 
    fs.writeFileSync(dst, JSON.stringify(abi, null, 2));
  ' "$src" "$dst"
}

MOCK_ARTIFACT="$CONTRACTS_DIR/out/MockUSDT.sol/MockUSDT.json"
INS_ARTIFACT="$CONTRACTS_DIR/out/FlightDelayInsurance.sol/FlightDelayInsurance.json"

if [[ -f "$MOCK_ARTIFACT" ]]; then
  extract_abi "$MOCK_ARTIFACT" "$FRONTEND_ABI_DIR/MockUSDT.json"
fi
if [[ -f "$INS_ARTIFACT" ]]; then
  extract_abi "$INS_ARTIFACT" "$FRONTEND_ABI_DIR/FlightDelayInsurance.json"
fi

echo "==> Updating frontend environment file ($FRONTEND_ENV_FILE)"
mkdir -p "$(dirname "$FRONTEND_ENV_FILE")"
touch "$FRONTEND_ENV_FILE"

upsert_env() {
  local key="$1"; shift
  local value="$1"; shift
  if grep -qE "^${key}=" "$FRONTEND_ENV_FILE"; then
    # Replace existing line
    sed -i '' -E "s|^${key}=.*|${key}=${value}|" "$FRONTEND_ENV_FILE"
  else
    echo "${key}=${value}" >> "$FRONTEND_ENV_FILE"
  fi
}

if [[ -n "${MOCK_ADDR:-}" ]]; then
  upsert_env NEXT_PUBLIC_MOCK_USDT_ADDRESS "$MOCK_ADDR"
fi
upsert_env NEXT_PUBLIC_FLIGHT_INSURANCE_ADDRESS "$INSURANCE_ADDR"

echo "==> Done"
echo
echo "Summary:"
echo "- Network:               $NETWORK"
echo "- RPC URL:               $RPC_URL"
echo "- MockUSDT address:      ${MOCK_ADDR:-<existing or not deployed>}"
echo "- Insurance address:     $INSURANCE_ADDR"
echo "- Frontend .env updated: $FRONTEND_ENV_FILE"
echo "- ABIs written to:       $FRONTEND_ABI_DIR"
echo
echo "Next steps:"
echo "- Start the frontend: \"cd packages/frontend && npm run dev\""
echo "- Verify addresses in the UI load correctly."
