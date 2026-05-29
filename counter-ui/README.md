# Midnight Counter UI

A Next.js frontend for the Midnight counter contract.

## Getting Started

The UI uses a small CLI runner to talk to the counter contract. You will need:

- A wallet seed (from the CLI wallet creation flow)
- A deployed counter contract address

### 1. Build the contract (one time)

```bash
cd ../contract
npm run compact
npm run build
cd ../counter-ui
```

### 2. Install dependencies and start the UI

The root install is required for CLI helpers:

```bash
cd ..
npm install
cd counter-ui
npm install
npm run dev
```

The UI executes CLI actions from the repo root. Set the required environment
variables in the same terminal before starting the app:

```bash
export COUNTER_NETWORK=preprod
export COUNTER_WALLET_SEED='<your-wallet-seed>'
export COUNTER_CONTRACT_ADDRESS='<your-contract-address>'
```

If you are running preprod or preview, start the proof server first:

```bash
cd ../counter-cli
docker compose -f proof-server.yml up
```

### 3. Interact with the UI

Open `http://localhost:3000` and you can:

- Click **Increment Counter** to submit a transaction.
- Click **Refresh** to read the latest on-chain counter value.
- See recent increments and transaction IDs in the history panel.

If the UI reports an error, confirm the proof server is running and the
environment variables were exported in the same terminal session.
