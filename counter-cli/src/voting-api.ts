// This file is part of the Anonymous Voting System
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { type Logger } from 'pino';
import { type CounterProviders } from './common-types';
import { counterContractInstance, getCounterLedgerState } from './api';

let logger: Logger;

export const setVotingLogger = (log: Logger): void => {
  logger = log;
};

// Voting system state - tracks the three contracts for yes/no/abstain votes
export type VotingSystemState = {
  yesContractAddress: ContractAddress | null;
  noContractAddress: ContractAddress | null;
  abstainContractAddress: ContractAddress | null;
  pollQuestion: string;
  hasVoted: boolean;
  myVote: 'yes' | 'no' | 'abstain' | null;
};

// Deploy a new voting poll with three contracts (yes, no, abstain)
export const deployVotingPoll = async (
  providers: CounterProviders,
  pollQuestion: string,
): Promise<VotingSystemState> => {
  logger.info(`Deploying new voting poll: "${pollQuestion}"`);

  // Deploy three contracts - one for each vote option
  logger.info('Deploying YES votes contract...');
  const yesContract = await deployContract(providers, {
    contract: counterContractInstance,
    privateStateId: 'counterPrivateState',
    initialPrivateState: { privateCounter: 0 },
  });
  logger.info(`YES contract deployed at: ${yesContract.deployTxData.public.contractAddress}`);

  logger.info('Deploying NO votes contract...');
  const noContract = await deployContract(providers, {
    contract: counterContractInstance,
    privateStateId: 'counterPrivateState',
    initialPrivateState: { privateCounter: 0 },
  });
  logger.info(`NO contract deployed at: ${noContract.deployTxData.public.contractAddress}`);

  logger.info('Deploying ABSTAIN votes contract...');
  const abstainContract = await deployContract(providers, {
    contract: counterContractInstance,
    privateStateId: 'counterPrivateState',
    initialPrivateState: { privateCounter: 0 },
  });
  logger.info(`ABSTAIN contract deployed at: ${abstainContract.deployTxData.public.contractAddress}`);

  return {
    yesContractAddress: yesContract.deployTxData.public.contractAddress,
    noContractAddress: noContract.deployTxData.public.contractAddress,
    abstainContractAddress: abstainContract.deployTxData.public.contractAddress,
    pollQuestion,
    hasVoted: false,
    myVote: null,
  };
};

// Join an existing voting poll
export const joinVotingPoll = async (
  providers: CounterProviders,
  yesAddress: string,
  noAddress: string,
  abstainAddress: string,
  pollQuestion: string,
): Promise<VotingSystemState> => {
  logger.info('Joining existing voting poll...');

  return {
    yesContractAddress: yesAddress as ContractAddress,
    noContractAddress: noAddress as ContractAddress,
    abstainContractAddress: abstainAddress as ContractAddress,
    pollQuestion,
    hasVoted: false,
    myVote: null,
  };
};

// Cast a vote
export const castVote = async (
  providers: CounterProviders,
  votingState: VotingSystemState,
  vote: 'yes' | 'no' | 'abstain',
): Promise<VotingSystemState> => {
  if (votingState.hasVoted) {
    throw new Error('You have already voted in this poll!');
  }

  let contractAddress: ContractAddress;
  switch (vote) {
    case 'yes':
      if (!votingState.yesContractAddress) throw new Error('YES contract not found');
      contractAddress = votingState.yesContractAddress;
      logger.info('Casting YES vote...');
      break;
    case 'no':
      if (!votingState.noContractAddress) throw new Error('NO contract not found');
      contractAddress = votingState.noContractAddress;
      logger.info('Casting NO vote...');
      break;
    case 'abstain':
      if (!votingState.abstainContractAddress) throw new Error('ABSTAIN contract not found');
      contractAddress = votingState.abstainContractAddress;
      logger.info('Casting ABSTAIN vote...');
      break;
  }

  // Join the contract for this vote option
  const contract = await findDeployedContract(providers, {
    contractAddress,
    contract: counterContractInstance,
    privateStateId: 'counterPrivateState',
    initialPrivateState: { privateCounter: 0 },
  });

  // Increment the counter (this represents one vote)
  logger.info('Submitting anonymous vote to blockchain...');
  await contract.callTx.increment();
  logger.info('Vote submitted successfully!');

  return {
    ...votingState,
    hasVoted: true,
    myVote: vote,
  };
};

// Get voting results
export const getVotingResults = async (
  providers: CounterProviders,
  votingState: VotingSystemState,
): Promise<{ yes: bigint; no: bigint; abstain: bigint; total: bigint }> => {
  logger.info('Fetching voting results...');

  let yes = 0n;
  let no = 0n;
  let abstain = 0n;

  if (votingState.yesContractAddress) {
    const yesCount = await getCounterLedgerState(providers, votingState.yesContractAddress);
    yes = yesCount ?? 0n;
  }

  if (votingState.noContractAddress) {
    const noCount = await getCounterLedgerState(providers, votingState.noContractAddress);
    no = noCount ?? 0n;
  }

  if (votingState.abstainContractAddress) {
    const abstainCount = await getCounterLedgerState(providers, votingState.abstainContractAddress);
    abstain = abstainCount ?? 0n;
  }

  const total = yes + no + abstain;

  return { yes, no, abstain, total };
};

// Display voting results
export const displayVotingResults = async (
  providers: CounterProviders,
  votingState: VotingSystemState,
): Promise<void> => {
  const results = await getVotingResults(providers, votingState);

  console.log('\n=================================');

  console.log('📊 VOTING RESULTS');

  console.log('=================================');

  console.log(`Question: ${votingState.pollQuestion}`);

  console.log('---------------------------------');

  console.log(`✅ YES:     ${results.yes} votes`);

  console.log(`❌ NO:      ${results.no} votes`);

  console.log(`⚪ ABSTAIN: ${results.abstain} votes`);

  console.log('---------------------------------');

  console.log(`📈 TOTAL:   ${results.total} votes`);

  if (results.total > 0n) {
    const yesPercent = (Number(results.yes) / Number(results.total)) * 100;
    const noPercent = (Number(results.no) / Number(results.total)) * 100;
    const abstainPercent = (Number(results.abstain) / Number(results.total)) * 100;

    console.log('---------------------------------');

    console.log(`YES:     ${yesPercent.toFixed(1)}%`);

    console.log(`NO:      ${noPercent.toFixed(1)}%`);

    console.log(`ABSTAIN: ${abstainPercent.toFixed(1)}%`);
  }

  console.log('=================================\n');

  if (votingState.hasVoted) {
    console.log(`Your vote: ${votingState.myVote?.toUpperCase()}`);
  }
};
