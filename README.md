# Counter DApp

[![Generic badge](https://img.shields.io/badge/Compact%20Compiler-0.23.0-1abc9c.svg)](https://shields.io/)  
[![Generic badge](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://shields.io/)

## Prerequisites

1. You must have NodeJS version 22.15 or greater installed.
2. Download the latest version of the Compact compiler from [the compiler release page](https://docs.midnight.network/relnotes/compact) and follow the instructions to install it (in particular the instructions regarding permissions that must be set to compile the contracts).
3. Create a directory for the compiler executables, and unzip the downloaded file into that directory.
4. Add the directory to your shell's $PATH.

   For example, if you unzipped the Compact compiler in `$HOME/bin/compactc`:

   ```sh
   export PATH=$PATH:$HOME/bin/compactc
   ```

5. Run `npm install` in the root folder to install all the necessary packages.
6. Compile and build the code in the `contract` folder before running the code in the `counter-cli` folder.  
   In the `contract` folder, run this command:

   ```sh
   npm run compact && npm run build
   ```

   Follow the instructions in the documentation [to install and launch the proof server](https://docs.midnight.network/develop/tutorial/using/proof-server).

7. Switch to the `counter-cli` folder and run this command:

   ```sh
   npm run start-testnet-remote
   ```

   If you do not have a wallet yet, you will be given the option to create a new one. After getting your address, you can use the [official faucet](https://faucet.testnet-02.midnight.network/) to request coins to deploy a contract on testnet and interact with it.

## The counter contract

The [contract](contract) subdirectory contains:

- the [smart contract](contract/src/counter.compact)
- some [unit tests](contract/src/test/counter.test.ts) to test the smart contract

### The source code

The contract contains a declaration of state stored publicly on the blockchain:

```compact
export ledger round: Counter;
```

and a single transition function to change the state:

```compact
export circuit increment(): [] {
  round.increment(1);
}
```

To verify that the smart contract operates as expected,
we've provided some unit tests in `contract/src/test/counter.test.ts`.

We've also provided tests that use a simple simulator, which illustrates
how to initialize and call the smart contract code locally without running a node in `contract/src/test/counter-simulator.ts`

### Building the smart contract

Compile the contract:

```sh
npm run compact
```

You should see the following output from npm and the Compact compiler:

```sh
> compact
> compactc --skip-zk src/counter.compact src/managed/counter

Compactc version: 0.23.0
```

The compiler will complete very quickly because we've instructed it to skip ZK key generation with the option `--skip-zk`. The compiler's output files will be placed in the directory `contract/src/managed/counter`.

Build the TypeScript source files:

```sh
npm run build
```

This creates the `contract/dist` directory.

Start unit tests:

```sh
npm run test
```

## CLI

After building the smart contract you can deploy it using the project in the subdirectory `counter-cli`:

```sh
cd ../counter-cli
```

Build from source code:

```sh
npm run build
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

Then follow the instructions from the CLI.

If you did not previously create and fund a Midnight Lace wallet, you will need to do so. Funds for testing can be requested from [the official faucet](https://faucet.testnet-02.midnight.network/).

You can find more information in part 2 of the [Midnight developer tutorial](https://docs.midnight.network/develop/tutorial/building).
