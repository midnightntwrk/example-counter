// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { CompiledCounter, Witnesses, CompiledCounterContract } from '@midnight-ntwrk/counter-contract';
import * as ledger from '@midnight-ntwrk/ledger-v7';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import {
  type FinalizedTxData,
  type MidnightProvider,
  type WalletProvider,
  UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import { assertIsContractAddress } from '@midnight-ntwrk/midnight-js-utils';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// New wallet SDK imports
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey as UnshieldedPublicKey,
  type UnshieldedKeystore,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';

import { webcrypto } from 'crypto';
import { type Logger } from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';
import {
  CounterPrivateStateId,
  type CounterProviders,
  type DeployedCounterContract,
} from './common-types';
import { type Config, contractConfig } from './config';
import { FinalizedTransaction } from '@midnight-ntwrk/ledger-v7';

let logger: Logger;
// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

// Types for the new wallet
export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
}

export const getCounterLedgerState = async (
  providers: CounterProviders,
  contractAddress: ContractAddress,
): Promise<bigint | null> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract ledger state...');
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? CompiledCounter.ledger(contractState.data.state).round : null));
  logger.info(`Ledger state: ${state}`);
  return state;
};

export const joinContract = async (
  providers: CounterProviders,
  contractAddress: string,
): Promise<DeployedCounterContract> => {
  const counterContract = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: CompiledCounterContract,
    privateStateId: 'counterPrivateState',
    initialPrivateState: { privateCounter: 0 },
  });
  logger.info(`Joined contract at address: ${counterContract.deployTxData.public.contractAddress}`);
  return counterContract;
};

export const deploy = async (
  providers: CounterProviders,
  privateState: Witnesses.CounterPrivateState,
): Promise<DeployedCounterContract> => {
  logger.info('Deploying counter contract...');
  const counterContract = await deployContract(providers, {
    compiledContract: CompiledCounterContract,
    privateStateId: CounterPrivateStateId,
    initialPrivateState: privateState,
  });
  logger.info(`Deployed contract at address: ${counterContract.deployTxData.public.contractAddress}`);
  return counterContract;
};

export const increment = async (counterContract: DeployedCounterContract): Promise<FinalizedTxData> => {
  logger.info('Incrementing...');
  const finalizedTxData = await counterContract.callTx.increment();
  logger.info(`Transaction ${finalizedTxData.public.txId} added in block ${finalizedTxData.public.blockHeight}`);
  return finalizedTxData.public;
};

export const displayCounterValue = async (
  providers: CounterProviders,
  counterContract: DeployedCounterContract,
): Promise<{ counterValue: bigint | null; contractAddress: string }> => {
  const contractAddress = counterContract.deployTxData.public.contractAddress;
  const counterValue = await getCounterLedgerState(providers, contractAddress);
  if (counterValue === null) {
    logger.info(`There is no counter contract deployed at ${contractAddress}.`);
  } else {
    logger.info(`Current counter value: ${Number(counterValue)}`);
  }
  return { contractAddress, counterValue };
};

/**
 * Create wallet and midnight provider from the new WalletFacade
 */
export const createWalletAndMidnightProvider = async (
  walletContext: WalletContext,
): Promise<WalletProvider & MidnightProvider> => {
  // Wait for wallet to sync first
  await Rx.firstValueFrom(
    walletContext.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );

  return {
    getCoinPublicKey(): ledger.CoinPublicKey {
      return walletContext.shieldedSecretKeys.coinPublicKey;
    },
    getEncryptionPublicKey(): ledger.EncPublicKey {
      return walletContext.shieldedSecretKeys.encryptionPublicKey;
    },
    async balanceTx(
      tx: UnboundTransaction,
      ttl?: Date,
    ): Promise<FinalizedTransaction> {
      // Use the wallet facade to balance the transaction
      const txTtl = ttl ?? new Date(Date.now() + 30 * 60 * 1000); // 30 min default TTL
      const bound = tx.bind();
      const finalizedTransactionRecipe = await walletContext.wallet.balanceFinalizedTransaction(
        bound,
        {
          shieldedSecretKeys: walletContext.shieldedSecretKeys, 
          dustSecretKey: walletContext.dustSecretKey
        },
        {
          ttl: txTtl
        },
      );    
      const signed = await walletContext.wallet.signRecipe(finalizedTransactionRecipe, (payload) => walletContext.unshieldedKeystore.signData(payload));
      const finalizedTx = await walletContext.wallet.finalizeRecipe(signed);
      
      return finalizedTx;
    },
    async submitTx(tx: ledger.FinalizedTransaction): Promise<ledger.TransactionId> {
      return await walletContext.wallet.submitTransaction(tx);
    },
  };
};

export const waitForSync = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        logger.info(`Waiting for wallet sync. Synced: ${state.isSynced}`);
      }),
      Rx.filter((state) => state.isSynced),
    ),
  );

export const waitForFunds = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const unshielded = state.unshielded?.balances[ledger.nativeToken().raw] ?? 0n;
        const shielded = state.shielded?.balances[ledger.nativeToken().raw] ?? 0n;
        logger.info(`Waiting for funds. Synced: ${state.isSynced}, Unshielded: ${unshielded}, Shielded: ${shielded}`);
      }),
      Rx.filter((state) => state.isSynced),
      Rx.map((s) => (s.unshielded?.balances[ledger.nativeToken().raw] ?? 0n) + (s.shielded?.balances[ledger.nativeToken().raw] ?? 0n)),
      Rx.filter((balance) => balance > 0n),
    ),
  );

/**
 * Display wallet balances (unshielded, shielded, dust)
 */
export const displayWalletBalances = async (wallet: WalletFacade): Promise<{ unshielded: bigint; shielded: bigint; dust: bigint }> => {
  const state = await Rx.firstValueFrom(wallet.state());
  const unshielded = state.unshielded?.balances[ledger.nativeToken().raw] ?? 0n;
  const shielded = state.shielded?.balances[ledger.nativeToken().raw] ?? 0n;
  const dust = state.dust?.walletBalance(new Date()) ?? 0n;

  logger.info(`Unshielded balance: ${unshielded} tNIGHT`);
  logger.info(`Shielded balance: ${shielded}`);
  logger.info(`Dust balance: ${dust}`);

  return { unshielded, shielded, dust };
};

/**
 * Dust status information
 */
export interface DustStatus {
  dustBalance: bigint;
  unregisteredUtxoCount: number;
  hasSufficientDust: boolean;
}

/**
 * Check dust status - returns info about dust balance and unregistered UTXOs
 */
export const checkDustStatus = async (walletContext: WalletContext): Promise<DustStatus> => {
  const state = await Rx.firstValueFrom(walletContext.wallet.state().pipe(Rx.filter((s) => s.isSynced)));

  const dustBalance = state.dust?.walletBalance(new Date()) ?? 0n;
  const unregisteredNightUtxos = state.unshielded?.availableCoins.filter(
    (coin) => coin.meta.registeredForDustGeneration === false
  ) ?? [];

  logger.info(`Dust balance: ${dustBalance}`);
  logger.info(`Unregistered Night UTXOs: ${unregisteredNightUtxos.length}`);

  return {
    dustBalance,
    unregisteredUtxoCount: unregisteredNightUtxos.length,
    hasSufficientDust: dustBalance > 0n,
  };
};

/**
 * Register unshielded Night UTXOs for dust generation
 * This allows the wallet to pay transaction fees
 * Based on official Midnight SDK designation.ts example
 */
export const registerForDustProduction = async (walletContext: WalletContext): Promise<boolean> => {
  const state = await Rx.firstValueFrom(walletContext.wallet.state().pipe(Rx.filter((s) => s.isSynced)));

  // Get ALL available coins - the SDK will handle which ones need registration
  const availableCoins = state.unshielded?.availableCoins ?? [];

  if (availableCoins.length === 0) {
    logger.info('No unshielded Night UTXOs available for dust registration');
    return false;
  }

  logger.info(`Registering ${availableCoins.length} Night UTXOs for dust production...`);

  // Follow the exact pattern from the official SDK docs (designation.ts)
  const recipe = await walletContext.wallet.registerNightUtxosForDustGeneration(
    availableCoins,
    walletContext.unshieldedKeystore.getPublicKey(),
    (payload) => walletContext.unshieldedKeystore.signData(payload),
  );

  logger.info('Finalizing dust registration transaction...');
  const finalizedTx = await walletContext.wallet.finalizeTransaction(recipe.transaction);

  logger.info('Submitting dust registration transaction...');
  try {
    const txId = await walletContext.wallet.submitTransaction(finalizedTx);
    logger.info(`Dust registration submitted with tx id: ${txId}`);

    // Wait for dust to be available
    logger.info('Waiting for dust to be generated...');
    await Rx.firstValueFrom(
      walletContext.wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.tap((s) => {
          const currentDust = s.dust?.walletBalance(new Date()) ?? 0n;
          logger.info(`Dust balance: ${currentDust}`);
        }),
        Rx.filter((s) => (s.dust?.walletBalance(new Date()) ?? 0n) > 0n),
        Rx.timeout(60_000), // 60 second timeout
      ),
    );

    logger.info('Dust registration complete!');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for error 139 or other transaction errors
    if (errorMessage.includes('139') || errorMessage.includes('Invalid Transaction')) {
      logger.warn('Dust registration failed.');
      logger.info('');
      logger.info('Please designate DUST production manually using the Midnight Lace Wallet (Preview):');
      logger.info('https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg');
      logger.info('');
      logger.info('Checking if dust is already being generated...');

      // Wait a bit and check if dust is accumulating anyway
      try {
        await Rx.firstValueFrom(
          walletContext.wallet.state().pipe(
            Rx.throttleTime(5_000),
            Rx.filter((s) => (s.dust?.walletBalance(new Date()) ?? 0n) > 0n),
            Rx.timeout(30_000), // 30 second timeout
          ),
        );
        logger.info('Dust is being generated! Proceeding...');
        return true;
      } catch {
        logger.info('No dust detected. Please use Lace wallet to designate DUST production.');
        return false;
      }
    }

    throw error;
  }
};

/**
 * Convert mnemonic phrase to seed buffer using BIP39 standard
 * Returns first 32 bytes of BIP39 seed to match Lace wallet derivation
 */
export const mnemonicToSeed = async (mnemonic: string): Promise<Buffer> => {
  const words = mnemonic.trim().split(/\s+/);
  if (!bip39.validateMnemonic(words.join(' '), english)) {
    throw new Error('Invalid mnemonic phrase');
  }
  // Use BIP39 standard seed derivation (PBKDF2) - produces 64 bytes
  // Take first 32 bytes to match Lace wallet behavior
  const seed = await bip39.mnemonicToSeed(words.join(' '));
  return Buffer.from(seed.subarray(0, 32));
};

/**
 * Initialize wallet with seed using the new wallet SDK
 * Uses individual role derivation to match Lace wallet behavior
 */
export const initWalletWithSeed = async (
  seed: Buffer,
  config: Config,
): Promise<WalletContext> => {
  const hdWalletResult = HDWallet.fromSeed(seed);

  if (hdWalletResult.type !== 'seedOk') {
    throw new Error('Failed to initialize HDWallet');
  }

  const hdWallet = hdWalletResult.hdWallet;

  // Derive each role separately (matches Lace wallet derivation pattern)
  const zswapResult = hdWallet.selectAccount(0).selectRole(Roles.Zswap).deriveKeyAt(0);
  if (zswapResult.type === 'keyOutOfBounds') {
    throw new Error('Zswap key derivation out of bounds');
  }

  const nightResult = hdWallet.selectAccount(0).selectRole(Roles.NightExternal).deriveKeyAt(0);
  if (nightResult.type === 'keyOutOfBounds') {
    throw new Error('NightExternal key derivation out of bounds');
  }

  const dustResult = hdWallet.selectAccount(0).selectRole(Roles.Dust).deriveKeyAt(0);
  if (dustResult.type === 'keyOutOfBounds') {
    throw new Error('Dust key derivation out of bounds');
  }

  hdWallet.clear();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(zswapResult.key);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(dustResult.key);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unshieldedKeystore = createKeystore(nightResult.key, config.networkId as any);

  // Dust parameters - must match testkit configuration for dust registration to work
  const dustParams = ledger.LedgerParameters.initialParameters().dust;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletConfiguration: any = {
    networkId: config.networkId,
    costParameters: {
      ledgerParams: ledger.LedgerParameters.initialParameters(),
      additionalFeeOverhead: 1_000_000_000_000_000n,
      feeBlocksMargin: 5,
    },
    relayURL: new URL(config.node),
    provingServerUrl: new URL(config.proofServer),
    indexerClientConnection: {
      indexerHttpUrl: config.indexer,
      indexerWsUrl: config.indexerWS,
    },
    indexerUrl: config.indexerWS,
  };

  const shieldedWallet = ShieldedWallet(walletConfiguration).startWithSecretKeys(shieldedSecretKeys);
  // Use startWithSeed like testkit does, not startWithSecretKey
  const dustWallet = DustWallet(walletConfiguration).startWithSeed(dustResult.key, dustParams);
  const unshieldedWallet = UnshieldedWallet({
    ...walletConfiguration,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  }).startWithPublicKey(UnshieldedPublicKey.fromKeyStore(unshieldedKeystore));

  const facade: WalletFacade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
  await facade.start(shieldedSecretKeys, dustSecretKey);

  return { wallet: facade, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

/**
 * Build wallet from mnemonic and wait for funds
 */
export const buildWalletAndWaitForFunds = async (
  config: Config,
  mnemonic: string,
): Promise<WalletContext> => {
  logger.info('Building wallet from mnemonic...');

  const seed = await mnemonicToSeed(mnemonic);
  const walletContext = await initWalletWithSeed(seed, config);

  logger.info(`Your wallet address: ${walletContext.unshieldedKeystore.getBech32Address().asString()}`);

  // Wait for sync first
  logger.info('Waiting for wallet to sync...');
  await waitForSync(walletContext.wallet);

  // Display and check balance
  const { unshielded } = await displayWalletBalances(walletContext.wallet);

  if (unshielded === 0n) {
    logger.info('Waiting to receive tokens...');
    await waitForFunds(walletContext.wallet);
    await displayWalletBalances(walletContext.wallet);
  }

  return walletContext;
};

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
};

/**
 * Generate a fresh wallet with random mnemonic
 */
export const buildFreshWallet = async (config: Config): Promise<WalletContext> => {
  const mnemonic = bip39.generateMnemonic(english, 256);
  logger.info(`Generated new wallet mnemonic: ${mnemonic}`);
  return await buildWalletAndWaitForFunds(config, mnemonic);
};

/**
 * Build wallet from hex seed (for backwards compatibility with genesis wallet)
 */
export const buildWalletFromHexSeed = async (
  config: Config,
  hexSeed: string,
): Promise<WalletContext> => {
  logger.info('Building wallet from hex seed...');
  const seed = Buffer.from(hexSeed, 'hex');
  const walletContext = await initWalletWithSeed(seed, config);

  logger.info(`Your wallet address: ${walletContext.unshieldedKeystore.getBech32Address().asString()}`);

  // Wait for sync first
  logger.info('Waiting for wallet to sync...');
  await waitForSync(walletContext.wallet);

  // Display and check balance
  const { unshielded } = await displayWalletBalances(walletContext.wallet);

  if (unshielded === 0n) {
    logger.info('Waiting to receive tokens...');
    await waitForFunds(walletContext.wallet);
    await displayWalletBalances(walletContext.wallet);
  }

  return walletContext;
};

export const configureProviders = async (walletContext: WalletContext, config: Config) => {
  // Set global network ID - required before contract deployment
  setNetworkId(config.networkId);

  const walletAndMidnightProvider = await createWalletAndMidnightProvider(walletContext);

  // Get storage password from environment or use default
  const storagePassword = process.env.MIDNIGHT_STORAGE_PASSWORD ?? 'counter-dapp-default-password';

  let zkConfigProvider = new NodeZkConfigProvider<'increment'>(contractConfig.zkConfigPath);
  return {
    privateStateProvider: levelPrivateStateProvider<typeof CounterPrivateStateId>({
      privateStateStoreName: contractConfig.privateStateStoreName,
      privateStoragePasswordProvider: async () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

export function setLogger(_logger: Logger) {
  logger = _logger;
}

export const closeWallet = async (walletContext: WalletContext): Promise<void> => {
  try {
    await walletContext.wallet.stop();
  } catch (e) {
    logger.error(`Error closing wallet: ${e}`);
  }
};
