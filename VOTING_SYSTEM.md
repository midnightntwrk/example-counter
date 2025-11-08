# Anonymous Voting System

An anonymous voting system built on the Midnight Network that leverages zero-knowledge proofs to ensure complete vote privacy while maintaining public verifiability of results.

## Overview

This voting system demonstrates the privacy-preserving capabilities of the Midnight blockchain:

- **Anonymous Voting**: Your vote is completely private using zero-knowledge proofs
- **Public Results**: Vote tallies are publicly visible on the blockchain
- **Verifiable**: All votes are cryptographically verified
- **Double-Vote Protection**: The system ensures each participant can only vote once

## Architecture

The voting system uses a novel approach leveraging the counter contract infrastructure:

### How It Works

1. **Poll Creation**: When a poll is created, three separate smart contracts are deployed:
   - YES votes contract
   - NO votes contract
   - ABSTAIN votes contract

2. **Casting Votes**: When you vote:
   - Your wallet generates a zero-knowledge proof
   - The proof verifies you're eligible to vote without revealing your identity
   - The vote increments the chosen contract's counter
   - Your local state records that you've voted (prevents double voting)

3. **Privacy Guarantees**:
   - The blockchain only sees that a valid vote was cast
   - Your identity is never linked to your vote choice
   - The proof system ensures you can't vote twice
   - Only the vote counts are public

### Smart Contract

The voting system leverages the existing `counter.compact` contract for vote tallying. The Compact language smart contract (`voting.compact`) is included for reference and demonstrates how a dedicated voting contract could be implemented.

## Prerequisites

### 1. Node.js
You need NodeJS version 22.15 or greater:
```bash
node --version
```

### 2. Compact Compiler
Install the Compact compiler to compile smart contracts:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

Add to your PATH:
```bash
source $HOME/.local/bin/env
```

Verify installation:
```bash
compact --version
```

### 3. Docker
The proof server runs in Docker:
```bash
docker --version
```

[Install Docker Desktop](https://docs.docker.com/desktop/) if not already installed.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Smart Contracts
```bash
cd contract && npm run compact
```

Expected output:
```
Compiling 1 circuits:
  circuit "increment" (k=10, rows=29)
```

### 3. Build the Project
```bash
cd .. && npm run build --workspaces
```

### 4. Start the Proof Server
The proof server must be running before using the voting system:

```bash
docker pull midnightnetwork/proof-server:latest
docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'
```

**Keep this terminal running!**

## Using the Voting System

### Start the Voting CLI

In a new terminal:

```bash
cd counter-cli && npm run start-voting
```

### Workflow

1. **Create a Wallet**
   - Choose option `1` to build a fresh wallet
   - Save your seed and address!

2. **Fund Your Wallet**
   - Visit the [testnet faucet](https://midnight.network/test-faucet)
   - Paste your wallet address
   - Wait for funds to arrive

3. **Create a Poll**
   - Choose option `1` to create a new voting poll
   - Enter your poll question
   - **Save the three contract addresses!**

4. **Cast Your Vote**
   - Choose option `1` for YES
   - Choose option `2` for NO
   - Choose option `3` for ABSTAIN
   - Your vote is recorded anonymously on the blockchain

5. **View Results**
   - Choose option `4` to see current results
   - Results show vote counts and percentages

### Joining an Existing Poll

If you want to participate in a poll created by someone else:

1. Start the voting CLI
2. Choose option `2` to join an existing poll
3. Enter the poll question
4. Enter the three contract addresses (YES, NO, ABSTAIN)
5. Cast your vote

## Example Usage

```
🗳️  Welcome to the Anonymous Voting System
==========================================
This system uses zero-knowledge proofs to ensure your vote
is completely anonymous while being verifiably counted.
==========================================

You can do one of the following:
  1. Create a new voting poll
  2. Join an existing voting poll
  3. Exit
Which would you like to do? 1

Enter the poll question: Should we implement feature X?

Deploying YES votes contract...
YES contract deployed at: 0x1234...
Deploying NO votes contract...
NO contract deployed at: 0x5678...
Deploying ABSTAIN votes contract...
ABSTAIN contract deployed at: 0x9abc...

=================================
🗳️  VOTING POLL ACTIVE
=================================
Question: Should we implement feature X?
---------------------------------
YES contract:     0x1234...
NO contract:      0x5678...
ABSTAIN contract: 0x9abc...
=================================

⚠️  SAVE THESE ADDRESSES! You'll need them to join this poll again.

You can do one of the following:
  1. Vote YES
  2. Vote NO
  3. Vote ABSTAIN
  4. View voting results
  5. Exit
Which would you like to do? 1

Casting YES vote...
Submitting anonymous vote to blockchain...
✅ Your YES vote has been recorded anonymously!

You can do one of the following:
  1. Vote YES
  2. Vote NO
  3. Vote ABSTAIN
  4. View voting results
  5. Exit
Which would you like to do? 4

=================================
📊 VOTING RESULTS
=================================
Question: Should we implement feature X?
---------------------------------
✅ YES:     5 votes
❌ NO:      2 votes
⚪ ABSTAIN: 1 vote
---------------------------------
📈 TOTAL:   8 votes
---------------------------------
YES:     62.5%
NO:      25.0%
ABSTAIN: 12.5%
=================================

Your vote: YES
```

## Security Features

### Zero-Knowledge Proofs
Every vote generates a cryptographic proof that verifies:
- You have the right to vote
- You haven't voted before
- The vote is valid

All without revealing your identity or vote choice.

### Double-Vote Prevention
Your wallet maintains local state tracking whether you've voted. The smart contract enforces this through zero-knowledge proofs.

### Public Verifiability
Anyone can query the blockchain to see:
- Total number of votes cast
- Vote distribution (YES/NO/ABSTAIN)
- Contract addresses and deployment info

But they **cannot** see:
- Who voted
- What each person voted for
- Any link between identity and vote choice

## Technical Details

### File Structure

```
midnight-study/
├── contract/
│   └── src/
│       ├── voting.compact           # Voting smart contract (reference)
│       ├── counter.compact          # Counter contract (used for vote tallying)
│       └── ...
└── counter-cli/
    └── src/
        ├── voting-api.ts            # Voting system API
        ├── voting-cli.ts            # CLI interface
        ├── voting-testnet-remote.ts # Entry point
        └── ...
```

### Voting System API

The `voting-api.ts` module provides:

- `deployVotingPoll()` - Deploy a new poll
- `joinVotingPoll()` - Join an existing poll
- `castVote()` - Cast an anonymous vote
- `getVotingResults()` - Query current results
- `displayVotingResults()` - Pretty-print results

### Privacy Architecture

```
┌─────────────────┐
│   Your Wallet   │
│  (Private Keys) │
└────────┬────────┘
         │
         ├─ Private State: hasVoted, myVote
         │
         ▼
┌─────────────────┐
│  Zero-Knowledge │
│  Proof Server   │
└────────┬────────┘
         │
         ├─ Generates proof without revealing private data
         │
         ▼
┌─────────────────┐
│  Midnight Node  │
│   (Blockchain)  │
└────────┬────────┘
         │
         ├─ Public State: Vote counts
         │
         ▼
┌─────────────────┐
│ Public Ledger   │
│ YES: 5, NO: 2   │
│ ABSTAIN: 1      │
└─────────────────┘
```

## Limitations

- **One Vote Per Wallet**: Each wallet address can only vote once per poll
- **Testnet Only**: Currently configured for Midnight testnet
- **Poll Lifecycle**: Polls don't automatically close (future enhancement)
- **No Vote Changes**: Once cast, votes cannot be changed

## Future Enhancements

- [ ] Poll closing mechanism
- [ ] Weighted voting
- [ ] Multiple-choice polls
- [ ] Vote delegation
- [ ] Time-based voting windows
- [ ] Quorum requirements
- [ ] On-chain poll metadata

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `compact: command not found` | Run `source $HOME/.local/bin/env` and verify with `compact --version` |
| `connect ECONNREFUSED 127.0.0.1:6300` | Start proof server: `docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'` |
| "You have already voted" | Each wallet can only vote once. Use a different wallet to vote again |
| Contract deployment fails | Ensure wallet has sufficient funds from the faucet |

## Resources

- [Midnight Network Documentation](https://docs.midnight.network/)
- [Compact Language Guide](https://docs.midnight.network/develop/tutorial/compact)
- [Testnet Faucet](https://midnight.network/test-faucet)
- [Zero-Knowledge Proofs Explained](https://docs.midnight.network/develop/tutorial/using/zero-knowledge-proofs)

## License

Apache-2.0
