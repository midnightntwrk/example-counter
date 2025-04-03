# Counter DApp

[![Generic badge](https://img.shields.io/badge/Compact%20Compiler-0.22.0-1abc9c.svg)](https://shields.io/)  
[![Generic badge](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://shields.io/)

## Prerequisites

1. You must have NodeJS version 22 installed.
2. Download the latest version of the Compact compiler from [the compiler release page](https://docs.midnight.network/relnotes/compact), create a directory for the compiler executables, and unzip the downloaded file in that directory.  Add that directory to your shell's path.  For example, if you unzipped the Compact compiler in `$HOME/bin/compactc`:
   ```sh
   export PATH=$PATH:$HOME/bin/compactc
   ```
   Use the your own path to the compiler.

## The counter contract

The [contract](contract) subdirectory contains:

- the [smart contract](contract/src/counter.compact) itself
- some [unit tests](contract/src/test/counter.test.ts) for it

### The source code

The contract contains a declaration of state stored publicly on the blockchain:

```compact
ledger {
  round: Counter;
}
```

and a single transition function to change this state:

```compact
export circuit increment(): Void {
  ledger.round.increment(1);
}
```

To see how you could verify how your smart contract runs,
there exist unit tests in `contract/src/test/counter.test.ts`.

They use a simple simulator that illustrate
how to initialize and call smart contract code locally without running a node:
`contract/src/test/counter-simulator.ts`

### Building the smart contract

1. Install dependencies:

   ```sh
   cd contract
   npm install
   ```

2. Compile the contract:

   ```sh
   npm run compact
   ```

   You should see output from npm and the Compact compiler:

   ```sh
   > compact
   > compactc --skip-zk src/counter.compact ./src/managed/counter

   Compactc version: 0.22.0
   ```

   The compiler will complete very quickly because we've instructed it to skip ZK key generation with the option `--skip-zk`.  The compiler's output files will be placed in the directory `contract/src/managed/counter`.

3. Build the TypeScript source files:

   ```sh
   npm run build
   ```

   This creates the `contract/dist` directory.

4. Start unit tests:
   ```sh
   npm run test
   ```

## CLI

After building the smart contract you can deploy it using the project in the subdirectory `counter-cli`:

```sh
cd ../counter-cli
```

Install dependencies:

```sh
npm install
```

Build from source code:

```sh
npm run build
```

Import the contract code:

```sh
npm run compile-contract
```

Run the DApp:

```sh
npm run testnet-remote
```

If you want to launch all these steps at once, you can use this command:

```sh
npm run start-testnet-remote
```

The preceding entry point assumes you already have a proof server running locally.
If you want one to be started automatically for you, use instead:

```sh
npm run testnet-remote-ps
```

Then follow the instructions from the CLI. On the first run, you will want to create a new wallet and copy its address, so as to transfer funds to it from your Midnight Lace wallet or from [the official faucet](https://faucet.testnet-02.midnight.network/).

You can find much more information in part 2 of the [Midnight developer tutorial](https://docs.midnight.network/develop/tutorial/building).
