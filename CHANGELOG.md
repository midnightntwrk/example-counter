# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1]

### Changed
- Migrated to the `@midnight-ntwrk/midnight-js` barrel package for cleaner imports
- Bumped all `@midnight-ntwrk/midnight-js-*` packages to `^4.0.4`
- Node.js runtime warnings suppressed in all CLI scripts with `--no-warnings`
- Storage password now derived from base64-encoded coin public key to satisfy all validator rules (character class and repeated-character checks)

### Fixed
- Seed phrase no longer shown on wallet restore or in the post-sync wallet summary — it is now displayed once only when a new wallet is created

## [2.1.0]

### Changed
- Upgraded from ledger-v7 to ledger-v8 stack across all packages
- Replaced `new WalletFacade(s, u, d)` with `WalletFacade.init()` static factory (constructor is private in wallet-sdk-facade v3)
- Replaced `state.dust.walletBalance()` with `state.dust.balance()` (renamed in DustWalletState v3)
- Replaced `state.dust.dustAddress` string with `MidnightBech32m.encode(networkId, state.dust.address)` (property type changed to DustAddress object)
- Replaced `levelPrivateStateProvider({ walletProvider })` with `({ accountId, privateStoragePasswordProvider })` (walletProvider removed in midnight-js v4)
- Replaced `ImpureCircuitId` with `ProvableCircuitId` (renamed in compact-js)
- Updated `moduleResolution` to `Bundler` in tsconfig (required for compact-js sub-path exports)
- Removed `transpileOnly` workaround from tsconfig — fixed root cause by removing `type` keyword from `CounterPrivateStateId` import
- Updated proof server image to `8.0.3` in `proof-server.yml` and `standalone.yml`
- Updated indexer and node images to v8-compatible versions in `standalone.yml`
- Updated `compact-version` in CI to `0.30.0` to match `compact-runtime` `0.15.0`
- Added `dependabot.yml` with daily npm and weekly Actions checks (major updates only)

### Fixed
- Fixed wrong Docker org name (`midnightnetwork` → `midnightntwrk`) in test container image reference
- Fixed `toBeGreaterThan(BigInt(0))` → `toBeGreaterThan(0)` in tests (`blockHeight` is `number` in midnight-js-types v4)
- Fixed CRLF line endings introduced by file tooling

## [1.0.0]

- Initial release of the project

## [2.0.0]

- Update to MidnightJS version 2
- Switch from Jest to Vitest

## [2.0.1]

- Minor package version updates
- README file update

## [2.0.2]

- Minor package version updates
