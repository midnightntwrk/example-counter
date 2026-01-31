# Preprod Migration Guide

Guide for deploying or upgrading Midnight contracts/dApps to the Preprod network.

---

## 1. Compact Compiler

### Required Version

- **Compact compiler (`compactc`)**: `0.28.0`
- **Compact version manager (`compact`)**: `0.4.0`

### Clean Install (recommended)

Remove any existing Compact installations first:

```bash
# Remove user installations
rm -rf ~/.compact
rm -f ~/.local/bin/compactc ~/.local/bin/compactc.bin ~/.local/bin/compact

# Remove system-wide installations (if any)
sudo rm -f /usr/local/bin/compactc /usr/local/bin/compactc.bin
sudo rm -rf /usr/local/lib/compactc

# Remove old PATH entries from ~/.bashrc (or ~/.zshrc)
# Delete any lines like: export PATH="$HOME/.compact/bin:$PATH"
```

### Install

1. Install the version manager:

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.4.0/compact-installer.sh | sh
```

2. Copy the `compact` binary to the standard location:

```bash
mkdir -p ~/.compact/bin
cp ~/.local/bin/compact ~/.compact/bin/compact
chmod +x ~/.compact/bin/compact
```

3. Install the compiler:

```bash
~/.compact/bin/compact update 0.28.0
```

4. **Fix missing symlinks** — `compact update` does not create symlinks for `compactc.bin` and `zkir`. Add them manually:

```bash
cd ~/.compact/bin
ln -sf ~/.compact/versions/0.28.0/x86_64-unknown-linux-musl/compactc.bin compactc.bin
ln -sf ~/.compact/versions/0.28.0/x86_64-unknown-linux-musl/zkir zkir
```

> **Note**: On macOS use `aarch64-darwin` or `x86_64-darwin` instead of `x86_64-unknown-linux-musl`.

5. Add to PATH in `~/.bashrc` (or `~/.zshrc`):

```bash
# Compact compiler (Midnight)
export PATH="$HOME/.compact/bin:$PATH"
```

Then reload: `source ~/.bashrc`

### Verify

```bash
compactc --version   # expect: 0.28.0
compact --version    # expect: compact 0.4.0
```

### Available Versions Reference

Use `compact list` to see all available compiler versions:

```
0.28.0 - x86_macos, aarch64_macos, x86_linux
0.26.0 - x86_macos, aarch64_macos, x86_linux
0.25.0 - x86_macos, aarch64_macos, x86_linux
0.24.0 - x86_macos, aarch64_macos, x86_linux
0.23.0 - aarch64_macos, x86_linux
0.22.0 - x86_macos, x86_linux
```

### Known Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `compactc.bin: No such file or directory` | `compact update` doesn't symlink `compactc.bin` into `~/.compact/bin/` | Manually create the symlink (see step 4 above) |
| Installer puts binary in snap-specific path | Running installer from VS Code terminal | Copy binary to `~/.compact/bin/` (see step 2 above) |
| Old version still resolving | Stale symlinks in `/usr/local/bin` or `~/.local/bin` | Remove old installations before installing (see Clean Install) |

---

## 2. Contract — Pragma Update

### What Changed

Compact compiler `0.28.0` uses **language version `0.20.0`**. Contracts targeting older language versions (e.g. `>= 0.16 && <= 0.18`) will fail to compile.

### Required Change

Update the `pragma` in your `.compact` file(s):

```diff
- pragma language_version >= 0.16 && <= 0.18;
+ pragma language_version >= 0.20;
```

### Compile

```bash
compact compile src/counter.compact src/managed/counter
```

Expected output:

```
Compiling 1 circuits:
```

### Compiled Artifacts

After a successful compile, `src/managed/counter/` will contain:

```
contract/   — index.js, index.d.ts (TypeScript bindings)
keys/       — increment.prover, increment.verifier (ZK keys)
zkir/       — increment.zkir, increment.bzkir (ZK circuit IR)
```

### Known Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `language version 0.20.0 mismatch` | Pragma range doesn't include `0.20.0` | Update pragma to `>= 0.20` |

---

## 3. JS Dependencies — midnight-js 3.0.0

### What Changed

The midnight-js framework packages were upgraded from `2.0.x` to `3.0.0`. This brings new types from `@midnight-ntwrk/ledger-v7` and a new `CompiledContract` pattern from `@midnight-ntwrk/compact-js`.

### Package Updates

```diff
  "@midnight-ntwrk/compact-runtime": "0.14.0",
  "@midnight-ntwrk/ledger": "^4.0.0",
- "@midnight-ntwrk/midnight-js-contracts": "2.0.2",
- "@midnight-ntwrk/midnight-js-http-client-proof-provider": "2.0.2",
- "@midnight-ntwrk/midnight-js-indexer-public-data-provider": "2.0.2",
- "@midnight-ntwrk/midnight-js-level-private-state-provider": "2.0.2",
- "@midnight-ntwrk/midnight-js-network-id": "2.0.2",
- "@midnight-ntwrk/midnight-js-node-zk-config-provider": "2.0.2",
- "@midnight-ntwrk/midnight-js-types": "2.0.2",
+ "@midnight-ntwrk/midnight-js-contracts": "3.0.0",
+ "@midnight-ntwrk/midnight-js-http-client-proof-provider": "3.0.0",
+ "@midnight-ntwrk/midnight-js-indexer-public-data-provider": "3.0.0",
+ "@midnight-ntwrk/midnight-js-level-private-state-provider": "3.0.0",
+ "@midnight-ntwrk/midnight-js-network-id": "3.0.0",
+ "@midnight-ntwrk/midnight-js-node-zk-config-provider": "3.0.0",
+ "@midnight-ntwrk/midnight-js-types": "3.0.0",
```

### CompiledContract Pattern

midnight-js 3.0.0 uses `CompiledContract` from `@midnight-ntwrk/compact-js` instead of passing raw contract objects. The contract must be piped through `withVacantWitnesses` (if no witnesses) and `withCompiledFileAssets` to resolve the context type to `never`:

```typescript
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Counter } from '@midnight-ntwrk/counter-contract';

const counterCompiledContract = CompiledContract.make('counter', Counter.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(contractConfig.zkConfigPath),
);
```

This `counterCompiledContract` is then passed to `deployContract` and `findDeployedContract` via the `compiledContract` field.

### Circuit Type Changes

Circuit IDs are now branded types (`ImpureCircuitId`) from `@midnight-ntwrk/compact-js`, not plain strings:

```typescript
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';

export type CounterCircuits = ImpureCircuitId<Counter.Contract<CounterPrivateState>>;
```

### Contract Test Changes

The `Simulator` from `@midnight-ntwrk/compact-runtime` now uses a different constructor pattern:

```typescript
import { Simulator } from '@midnight-ntwrk/compact-runtime';

// Old:
const sim = new Simulator(witnesses);
const ledgerState = sim.ledger(Counter.initialState(new Uint8Array(32)));

// New:
const sim = Simulator.make(Counter.Contract, witnesses);
const ledgerState = sim.state('counter').data;
```

---

## 4. Wallet SDK — wallet-sdk-facade Migration

### What Changed

The monolithic `@midnight-ntwrk/wallet` + `@midnight-ntwrk/wallet-api` packages are replaced by the new modular wallet SDK ecosystem. This eliminates the need for `@midnight-ntwrk/zswap` type bridging and most `as any` casts, since the new wallet uses `ledger-v7` types natively.

### Package Changes

```diff
- "@midnight-ntwrk/wallet": "5.0.0",
- "@midnight-ntwrk/wallet-api": "5.0.0",
- "@midnight-ntwrk/zswap": "^4.0.0",
+ "@midnight-ntwrk/wallet-sdk-facade": "1.0.0",
+ "@midnight-ntwrk/wallet-sdk-hd": "3.0.0",
+ "@midnight-ntwrk/wallet-sdk-shielded": "1.0.0",
+ "@midnight-ntwrk/wallet-sdk-dust-wallet": "1.0.0",
+ "@midnight-ntwrk/wallet-sdk-unshielded-wallet": "1.0.0",
+ "@midnight-ntwrk/wallet-sdk-address-format": "3.0.0",
```

### Architecture

The new wallet is composed of three sub-wallets orchestrated by `WalletFacade`:

- **ShieldedWallet** — handles ZK-shielded transactions (zswap)
- **UnshieldedWallet** — handles transparent transactions
- **DustWallet** — handles dust (fee) transactions

Each sub-wallet has its own configuration requirements.

### Key Derivation

Replace `randomBytes`-based seed generation with HD wallet key derivation:

```typescript
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { Buffer } from 'buffer';

const seed = toHex(Buffer.from(generateRandomSeed()));
const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') throw new Error('Failed to initialize HDWallet from seed');

const derivationResult = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);

if (derivationResult.type !== 'keysDerived') throw new Error('Failed to derive keys');
hdWallet.hdWallet.clear();
const keys = derivationResult.keys;
```

### Wallet Initialization

```typescript
import * as ledger from '@midnight-ntwrk/ledger-v7';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import {
  createKeystore, InMemoryTransactionHistoryStorage,
  PublicKey, UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';

const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

const shieldedWallet = ShieldedWallet(shieldedConfig).startWithSecretKeys(shieldedSecretKeys);
const unshieldedWallet = UnshieldedWallet(unshieldedConfig).startWithPublicKey(
  PublicKey.fromKeyStore(unshieldedKeystore),
);
const dustWallet = DustWallet(dustConfig).startWithSecretKey(
  dustSecretKey,
  ledger.LedgerParameters.initialParameters().dust,
);

const wallet = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
await wallet.start(shieldedSecretKeys, dustSecretKey);
```

### Sub-Wallet Configuration

Each sub-wallet requires different config fields:

**ShieldedWallet:**
```typescript
{
  networkId: getNetworkId(),
  indexerClientConnection: { indexerHttpUrl, indexerWsUrl },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, 'ws')),
}
```

**UnshieldedWallet:**
```typescript
{
  networkId: getNetworkId(),
  indexerClientConnection: { indexerHttpUrl, indexerWsUrl },
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}
```

**DustWallet:**
```typescript
{
  networkId: getNetworkId(),
  costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
  indexerClientConnection: { indexerHttpUrl, indexerWsUrl },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, 'ws')),
}
```

### WalletProvider Bridge

The `WalletProvider` / `MidnightProvider` interface used by midnight-js is bridged from the facade:

```typescript
// State access — note .toHexString() for key types
const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
state.shielded.coinPublicKey.toHexString();       // getCoinPublicKey
state.shielded.encryptionPublicKey.toHexString();  // getEncryptionPublicKey

// Transaction balancing — 3-step recipe flow
const recipe = await wallet.balanceUnboundTransaction(tx, { shieldedSecretKeys, dustSecretKey }, { ttl });
const signed = await wallet.signRecipe(recipe, (payload) => unshieldedKeystore.signData(payload));
const finalized = await wallet.finalizeRecipe(signed);

// Submission
wallet.submitTransaction(tx);
```

### Token Type — Critical Breaking Change

The old `nativeToken()` from `@midnight-ntwrk/ledger` (v4) returns a **tagged 68-character hex** token type (`02000000...0000`). The new wallet SDK stores balances keyed by **raw 64-character hex** token types from `@midnight-ntwrk/ledger-v7`.

If you use the wrong token type for balance lookups, the wallet will appear to have zero balance even when funds are present.

```diff
- import { nativeToken } from '@midnight-ntwrk/ledger';
- const balance = state.unshielded.balances[nativeToken()];
+ import { unshieldedToken } from '@midnight-ntwrk/ledger-v7';
+ const balance = state.unshielded.balances[unshieldedToken().raw];
```

> **Debugging tip**: If your wallet shows `Synced: true` but zero balance, log `state.unshielded.balances` and compare the actual key (`0000...0000`, 64 chars) against what your lookup function returns. If you see `02000...0000` (68 chars), you're still using the old `nativeToken()`.

### State Shape Changes

```diff
- state.syncProgress?.synced        → state.isSynced
- state.balances[nativeToken()]     → state.unshielded.balances[unshieldedToken().raw]
```

### Lifecycle Changes

```diff
- wallet.close()  → wallet.stop()
- Wallet & Resource type → WalletContext (custom type bundling wallet + keys)
```

### Removed APIs

- `saveState` / `wallet.serialize()` — serialization not yet supported in facade 1.0.0
- `WalletBuilder` — replaced by direct sub-wallet construction
- `toZswapNetworkId()` — no longer needed, facade uses string network IDs natively

### Private State Provider — Encryption Required

`levelPrivateStateProvider` now **requires** either a `walletProvider` or `privateStoragePasswordProvider` for encrypting private state storage. Passing neither throws an error at runtime.

```diff
  privateStateProvider: levelPrivateStateProvider<typeof CounterPrivateStateId>({
    privateStateStoreName: contractConfig.privateStateStoreName,
+   walletProvider: walletAndMidnightProvider,
  }),
```

You must provide **exactly one** of:
- `walletProvider` — uses the wallet's encryption public key (recommended when using wallet-sdk-facade)
- `privateStoragePasswordProvider: () => string` — a function returning a custom password (min 16 chars)

Providing both will also throw an error.

### Address Formatting

The wallet SDK provides bech32m-encoded addresses for all wallet types via `@midnight-ntwrk/wallet-sdk-address-format`:

```typescript
import {
  MidnightBech32m, ShieldedAddress,
  ShieldedCoinPublicKey, ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';

// Shielded address (mn_shield-addr_<network>1...)
const coinPubKey = ShieldedCoinPublicKey.fromHexString(state.shielded.coinPublicKey.toHexString());
const encPubKey = ShieldedEncryptionPublicKey.fromHexString(state.shielded.encryptionPublicKey.toHexString());
const shieldedAddr = MidnightBech32m.encode(networkId, new ShieldedAddress(coinPubKey, encPubKey)).toString();

// Unshielded address (mn_addr_<network>1...)
const unshieldedAddr = unshieldedKeystore.getBech32Address();

// Dust address (mn_dust_<network>1...)
const dustAddr = state.dust.dustAddress;
```

**Important**: `UnshieldedKeystore` uses `getBech32Address()` (a method), not `.address` (a property).

Address format reference:
| Type | Prefix | Example |
|------|--------|---------|
| Shielded | `mn_shield-addr_<network>1...` | `mn_shield-addr_preprod1q...` |
| Unshielded | `mn_addr_<network>1...` | `mn_addr_preprod1q...` |
| Dust | `mn_dust_<network>1...` | `mn_dust_preprod1w...` |

### Known Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Wallet shows zero balance despite receiving funds | Using `nativeToken()` (68-char tagged) instead of `unshieldedToken().raw` (64-char raw) for balance lookup | Replace `nativeToken()` with `unshieldedToken().raw` from `@midnight-ntwrk/ledger-v7` |
| `Either privateStoragePasswordProvider or walletProvider must be provided` | `levelPrivateStateProvider` now requires encryption config | Pass `walletProvider` or `privateStoragePasswordProvider` in config |
| `Cannot find package '@midnight-ntwrk/wallet-sdk-address-format'` | Transitive dep not hoisted | Add `@midnight-ntwrk/wallet-sdk-address-format` as direct dependency |
| `Unknown field "zswapLedgerEvents"` at runtime | Local standalone indexer too old for new wallet SDK | Update docker images to versions compatible with wallet-sdk-facade |
| `Unknown field "dustLedgerEvents"` at runtime | Same as above | Same — update indexer docker images |
| `Unknown type "UnshieldedAddress"` at runtime | Same as above | Same — update indexer docker images |

---

## 5. Docker Infrastructure — Image Updates

### What Changed

The wallet-sdk-facade and midnight-js 3.0.0 require updated docker images with GraphQL v3 schema support. The indexer now exposes subscription fields for `zswapLedgerEvents`, `dustLedgerEvents`, and `unshieldedTransactions` that the new wallet SDK depends on for syncing.

### Docker Image Updates (`standalone.yml`)

```diff
- image: "midnightnetwork/proof-server:4.0.0"
+ image: 'ghcr.io/midnight-ntwrk/proof-server:7.0.0'

- image: 'midnightntwrk/indexer-standalone:2.1.1'
+ image: 'ghcr.io/midnight-ntwrk/indexer-standalone:3.0.0'

- image: 'midnightnetwork/midnight-node:0.12.0'
+ image: 'ghcr.io/midnight-ntwrk/midnight-node:0.20.0'
```

Note: The registry changed from `midnightnetwork/` and `midnightntwrk/` to `ghcr.io/midnight-ntwrk/`.

For **Preprod/Preview** deployments where you only need a local proof server (indexer and node are remote):

```yaml
# proof-server-preprod.yml
services:
  proof-server:
    image: "midnightnetwork/proof-server:latest"
    command: ["midnight-proof-server -v"]
    ports:
      - "6300:6300"
    environment:
      RUST_BACKTRACE: "full"
```

### Proof Server — CLI Flag Changes

The proof server `7.0.0` **no longer accepts** the `--network` flag. Use `-v` for verbose mode only:

```diff
- command: ["midnight-proof-server", "--network", "testnet"]
+ command: ["midnight-proof-server -v"]
```

### New Indexer Environment Variables

The indexer `3.0.0` requires additional config:

```yaml
environment:
  APP__APPLICATION__NETWORK_ID: 'undeployed'
  APP__INFRA__STORAGE__PASSWORD: 'indexer'
  APP__INFRA__PUB_SUB__PASSWORD: 'indexer'
  APP__INFRA__LEDGER_STATE_STORAGE__PASSWORD: 'indexer'
```

### Healthchecks

Updated healthcheck for proof-server and indexer:

```yaml
# Proof server
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:6300/version']

# Indexer
healthcheck:
  test: ['CMD-SHELL', 'cat /var/run/indexer-standalone/running']
```

### GraphQL API Path

The indexer GraphQL endpoint path changed from v1 to v3:

```diff
- /api/v1/graphql
+ /api/v3/graphql
- /api/v1/graphql/ws
+ /api/v3/graphql/ws
```

---

## 6. Network Configuration

### What Changed

Network configs were updated to use the new GraphQL v3 paths and target the Preview and Preprod networks instead of the old testnet.

### Network Endpoints

**Local (Standalone):**
| Service | Endpoint |
|---------|----------|
| Indexer HTTP | `http://127.0.0.1:8088/api/v3/graphql` |
| Indexer WS | `ws://127.0.0.1:8088/api/v3/graphql/ws` |
| Node | `http://127.0.0.1:9944` |
| Proof Server | `http://127.0.0.1:6300` |
| NetworkId | `undeployed` |

**Preview:**
| Service | Endpoint |
|---------|----------|
| RPC Node | `https://rpc.preview.midnight.network` |
| Indexer HTTP | `https://indexer.preview.midnight.network/api/v3/graphql` |
| Indexer WS | `wss://indexer.preview.midnight.network/api/v3/graphql/ws` |
| Faucet | `https://faucet.preview.midnight.network` |
| Proof Server | `http://localhost:6300` (local) |
| NetworkId | `preview` |

**Preprod:**
| Service | Endpoint |
|---------|----------|
| RPC Node | `https://rpc.preprod.midnight.network` |
| Indexer HTTP | `https://indexer.preprod.midnight.network/api/v3/graphql` |
| Indexer WS | `wss://indexer.preprod.midnight.network/api/v3/graphql/ws` |
| Proof Server | `http://localhost:6300` (local) |
| NetworkId | `preprod` |

### Config Class Changes

```diff
- TestnetLocalConfig   (testnet, local indexer at v1)
- TestnetRemoteConfig  (testnet, remote indexer at v1)
+ PreviewConfig        (preview network, v3 paths)
+ PreprodConfig        (preprod network, v3 paths)
  StandaloneConfig     (local docker, updated to v3 paths)
```

---

## 7. Preprod Deployment Checklist

Quick reference for deploying a DApp to Preprod:

1. **Proof server**: Run locally via Docker (`docker compose -f proof-server-preprod.yml up -d`)
2. **Wallet**: Create or restore from seed — the app connects to remote Preprod indexer and RPC
3. **Fund wallet**: Send tNight to the **unshielded** address via [https://faucet.preprod.midnight.network](https://faucet.preprod.midnight.network)
4. **Deploy contract**: Once funds are detected, deploy your contract through the DApp

### Common Pitfalls

| Pitfall | Resolution |
|---------|------------|
| Wallet shows zero balance after faucet | Ensure you're using `unshieldedToken().raw` (not `nativeToken()`) — see Section 4 |
| `Either privateStoragePasswordProvider or walletProvider must be provided` | Pass `walletProvider` to `levelPrivateStateProvider` — see Section 4 |
| Proof server fails with "unexpected argument '--network'" | Remove `--network` flag, use `-v` only — see Section 5 |
| `@midnight-ntwrk/wallet-sdk-address-format` not found | Add it as a direct dependency in `package.json` |

---

*Migration guide covering: Compact compiler, Contract pragma, JS dependencies (midnight-js 3.0.0), Wallet SDK (wallet-sdk-facade), Docker infrastructure, Network configuration, and Preprod deployment.*
