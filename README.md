# Counter DApp

[![Generic badge](https://img.shields.io/badge/Compact%20Compiler-0.28.0-1abc9c.svg)](https://shields.io/) [![Generic badge](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://shields.io/)

A Midnight smart contract example demonstrating a privacy-preserving counter on the Preprod network. The counter value is incremented via zero-knowledge proof transactions on-chain.

> **Note**: This example currently targets the **Preprod** network. Standalone (local) and Preview network support will be added in a future update.

## Project Structure

```
example-counter/
├── contract/               # Smart contract in Compact language
│   ├── src/counter.compact # The counter smart contract
│   └── src/test/           # Contract unit tests
└── counter-cli/            # Command-line interface
    └── src/                # CLI implementation
```

## Prerequisites

- [Node.js v22.15+](https://nodejs.org/) — `node --version` to check
- [Docker](https://docs.docker.com/get-docker/) with `docker compose` — used for the local proof server

### Compact Compiler (v0.28.0)

The Compact compiler converts smart contracts into circuits for zero-knowledge proof generation.

Install the version manager and compiler:

```bash
# Install the Compact version manager
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.4.0/compact-installer.sh | sh

# Add to PATH
source $HOME/.local/bin/env

# Install the compiler version required by this project
compact update 0.28.0

# Verify
compactc --version   # expect: 0.28.0
```

> If `compactc` is not found after installation, see [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed troubleshooting (symlink fixes, PATH setup, clean install).

## Quick Start (Preprod)

### 1. Install dependencies

```bash
npm install
```

### 2. Compile the smart contract

```bash
cd contract && npm run compact
```

Expected output:

```
Compiling 1 circuits:
  circuit "increment" (k=10, rows=29)
```

The first run may download zero-knowledge parameters (~500MB). This is a one-time download.

### 3. Build the project

```bash
npm run build && npm run test
```

### 4. Build the CLI

```bash
cd ../counter-cli && npm run build
```

### 5. Start the proof server

The proof server generates zero-knowledge proofs locally to protect private data. It must be running before you can deploy or interact with contracts.

In a separate terminal:

```bash
cd counter-cli
docker compose -f proof-server-preprod.yml up
```

Wait for it to download ZK key material and start. You should see:

```
INFO actix_server::server: starting service: "actix-web-service-0.0.0.0:6300", workers: 24, listening on: 0.0.0.0:6300
```

**Keep this terminal running.** You can verify the proof server is ready:

```bash
curl http://localhost:6300/version
```

### 6. Run the DApp

In a new terminal:

```bash
cd counter-cli && npm run preprod
```

## Using the Counter DApp

### Step 1: Create a wallet

The CLI uses a headless wallet (separate from browser wallets like Lace).

1. Choose option **[1]** to create a new wallet
2. The system generates a wallet seed and displays your addresses:

```
──────────────────────────────────────────────────────────────
  Wallet Overview                            Network: preprod
──────────────────────────────────────────────────────────────
  Seed: <64-character hex string>

  Unshielded Address (send tNight here):
  mn_addr_preprod1...
──────────────────────────────────────────────────────────────
```

**Save the seed** — you'll need it to restore the wallet later.

### Step 2: Fund your wallet

1. Copy your **unshielded address** (`mn_addr_preprod1...`) from the output
2. Visit the [Preprod faucet](https://faucet.preprod.midnight.network)
3. Paste your address and request tNight tokens
4. The CLI will detect incoming funds automatically

### Step 3: Wait for DUST

After receiving tNight, the CLI automatically registers your NIGHT UTXOs for dust generation. DUST is the non-transferable fee token required for all transactions on Midnight.

The CLI shows progress:

```
  ✓ Registering 1 NIGHT UTXO(s) for dust generation
  ✓ Waiting for dust tokens to generate
  ✓ Configuring providers
```

Once DUST is available, the contract menu appears with your balance:

```
──────────────────────────────────────────────────────────────
  Contract Actions                    DUST: 405,083,000,000,000
──────────────────────────────────────────────────────────────
  [1] Deploy a new counter contract
  [2] Join an existing counter contract
  [3] Monitor DUST balance
  [4] Exit
```

### Step 4: Deploy a counter contract

1. Choose option **[1]** to deploy
2. Wait for proving, balancing, and submission (this involves a zero-knowledge proof round-trip)
3. The contract address is displayed on success:

```
  ✓ Deploying counter contract
  Contract deployed at: <contract address>
```

**Save the contract address** to rejoin the contract in future sessions.

### Step 5: Interact with your contract

After deployment, the counter menu appears:

- **[1] Increment counter** — submits a ZK proof transaction to increment the on-chain counter
- **[2] Display current counter value** — queries the blockchain for the current value
- **[3] Exit**

Each increment creates a real transaction on Midnight Preprod.

### Returning to an existing wallet and contract

Next time you run the DApp:

1. Choose option **[2]** to restore wallet from seed
2. Enter your saved seed
3. Wait for sync and DUST generation
4. Choose option **[2]** to join existing contract
5. Enter your saved contract address

## Monitoring DUST Balance

The contract menu includes a DUST monitor (option **[3]**) that shows a live-updating display:

```
  [10:20:03 PM] DUST: 471,219,000,000,000 (1 coins, 0 pending) | NIGHT: 1 UTXOs, 1 registered | ✓ ready to deploy
```

This is useful for:
- Checking if you have enough DUST before deploying
- Monitoring DUST generation after registering NIGHT
- Diagnosing issues where DUST appears locked (pending coins from failed transactions)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `compactc: command not found` | Run `source $HOME/.local/bin/env` then `compactc --version`. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for details. |
| `connect ECONNREFUSED 127.0.0.1:6300` | Start the proof server: `docker compose -f proof-server-preprod.yml up` |
| `Failed to clone intent` during deploy | Wallet SDK signing bug — already worked around in this codebase. If you see this, ensure you're running the latest code. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) Section 4. |
| DUST balance drops to 0 after failed deploy | Known wallet SDK issue. Restart the DApp to release locked DUST coins. |
| Wallet shows 0 balance after faucet | Wait for sync to complete. If still 0, check that you sent to the correct unshielded address. |
| Could not find a working container runtime strategy | Docker isn't running. Start Docker Desktop and try again. |
| Tests fail with "Cannot find module" | Compile contract first: `cd contract && npm run compact && npm run build && npm run test` |
| Node.js warnings about experimental features | Normal — these don't affect functionality. |

## Useful Links

- [Preprod Faucet](https://faucet.preprod.midnight.network) — Get preprod tNight tokens
- [Midnight Documentation](https://docs.midnight.network/) — Developer guide
- [Compact Language Guide](https://docs.midnight.network/compact) — Smart contract language reference
- [Migration Guide](MIGRATION_GUIDE.md) — Detailed guide for migrating to Preprod with midnight-js 3.0.0 and wallet-sdk-facade 1.0.0
