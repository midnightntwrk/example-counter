// This file is part of the Anonymous Voting System
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type StartedDockerComposeEnvironment, type DockerComposeEnvironment } from 'testcontainers';
import { type CounterProviders } from './common-types';
import { type Config, StandaloneConfig } from './config';
import * as api from './api';
import * as votingApi from './voting-api';

let logger: Logger;

/**
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Create a new voting poll
  2. Join an existing voting poll
  3. Exit
Which would you like to do? `;

const MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Vote YES
  2. Vote NO
  3. Vote ABSTAIN
  4. View voting results
  5. Exit
Which would you like to do? `;

const join = async (providers: CounterProviders, rli: Interface): Promise<votingApi.VotingSystemState> => {
  const pollQuestion = await rli.question('What is the poll question? ');
  const yesAddress = await rli.question('YES contract address (in hex): ');
  const noAddress = await rli.question('NO contract address (in hex): ');
  const abstainAddress = await rli.question('ABSTAIN contract address (in hex): ');
  return await votingApi.joinVotingPoll(providers, yesAddress, noAddress, abstainAddress, pollQuestion);
};

const deployOrJoin = async (
  providers: CounterProviders,
  rli: Interface,
): Promise<votingApi.VotingSystemState | null> => {
  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1': {
        const pollQuestion = await rli.question('Enter the poll question: ');
        return await votingApi.deployVotingPoll(providers, pollQuestion);
      }
      case '2':
        return await join(providers, rli);
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const mainLoop = async (providers: CounterProviders, rli: Interface): Promise<void> => {
  let votingState = await deployOrJoin(providers, rli);
  if (votingState === null) {
    return;
  }

  // Display poll info
  console.log('\n=================================');
  console.log('🗳️  VOTING POLL ACTIVE');
  console.log('=================================');
  console.log(`Question: ${votingState.pollQuestion}`);
  console.log('---------------------------------');
  console.log(`YES contract:     ${votingState.yesContractAddress}`);
  console.log(`NO contract:      ${votingState.noContractAddress}`);
  console.log(`ABSTAIN contract: ${votingState.abstainContractAddress}`);
  console.log('=================================\n');
  console.log("⚠️  SAVE THESE ADDRESSES! You'll need them to join this poll again.\n");

  while (true) {
    const choice = await rli.question(MAIN_LOOP_QUESTION);
    try {
      switch (choice) {
        case '1':
          votingState = await votingApi.castVote(providers, votingState, 'yes');
          console.log('✅ Your YES vote has been recorded anonymously!');
          break;
        case '2':
          votingState = await votingApi.castVote(providers, votingState, 'no');
          console.log('❌ Your NO vote has been recorded anonymously!');
          break;
        case '3':
          votingState = await votingApi.castVote(providers, votingState, 'abstain');
          console.log('⚪ Your ABSTAIN vote has been recorded anonymously!');
          break;
        case '4':
          await votingApi.displayVotingResults(providers, votingState);
          break;
        case '5':
          logger.info('Exiting...');
          return;
        default:
          logger.error(`Invalid choice: ${choice}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
  }
};

const buildWalletFromSeed = async (config: Config, rli: Interface): Promise<Wallet & Resource> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await api.buildWalletAndWaitForFunds(config, seed, '');
};

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface): Promise<(Wallet & Resource) | null> => {
  if (config instanceof StandaloneConfig) {
    return await api.buildWalletAndWaitForFunds(config, GENESIS_MINT_WALLET_SEED, '');
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return await api.buildFreshWallet(config);
      case '2':
        return await buildWalletFromSeed(config, rli);
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);

  mappedUrl.port = String(container.getFirstMappedPort());

  return mappedUrl.toString().replace(/\/+$/, '');
};

export const run = async (config: Config, _logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {
  logger = _logger;
  api.setLogger(_logger);
  votingApi.setVotingLogger(_logger);

  const rli = createInterface({ input, output, terminal: true });
  let env;
  if (dockerEnv !== undefined) {
    env = await dockerEnv.up();

    if (config instanceof StandaloneConfig) {
      config.indexer = mapContainerPort(env, config.indexer, 'counter-indexer');
      config.indexerWS = mapContainerPort(env, config.indexerWS, 'counter-indexer');
      config.node = mapContainerPort(env, config.node, 'counter-node');
      config.proofServer = mapContainerPort(env, config.proofServer, 'counter-proof-server');
    }
  }

  console.log('\n🗳️  Welcome to the Anonymous Voting System');
  console.log('==========================================');
  console.log('This system uses zero-knowledge proofs to ensure your vote');
  console.log('is completely anonymous while being verifiably counted.');
  console.log('==========================================\n');

  const wallet = await buildWallet(config, rli);
  try {
    if (wallet !== null) {
      const providers = await api.configureProviders(wallet, config);
      await mainLoop(providers, rli);
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Found error '${e.message}'`);
      logger.info('Exiting...');
      logger.debug(`${e.stack}`);
    } else {
      throw e;
    }
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logger.error(`Error closing readline interface: ${e}`);
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {
        logger.error(`Error closing wallet: ${e}`);
      } finally {
        try {
          if (env !== undefined) {
            await env.down();
            logger.info('Goodbye');
          }
        } catch (e) {
          logger.error(`Error shutting down docker environment: ${e}`);
        }
      }
    }
  }
};
