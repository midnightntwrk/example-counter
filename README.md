# Counter DApp

[![Generic badge](https://img.shields.io/badge/Compact%20Compiler-0.21.0-1abc9c.svg)](https://shields.io/)  
[![Generic badge](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://shields.io/)

## Prerequisites

1. The Midnight team recommends using [NVM](https://github.com/nvm-sh/nvm#installing-and-updating) to install the Node.js version that this project requires. After installing it, you should be able to verify its presence with:
   ```shell
   nvm --version
   ```
   You should see a version number printed, such as `0.39.5`.
2. In this directory (or the top level directory of the examples repository):

   ```shell
   nvm install
   ```

3. Make sure you have Yarn. NVM can get it for you:

   ```shell
   corepack enable
   ```

   You can verify Yarn's presence with:

   ```shell
   yarn --version
   ```

   You should see a version number printed, such as `3.6.0`.

4. Download the Compact compiler, create a directory in which to place it, unzip the file in that directory, and export the following environment variable to point to it:
   ```sh
   export COMPACT_HOME=~/work/midnight/testnet-compact
   ```
   Use the your own correct path, of course.

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
there exist unit tests in `/contract/src/test/counter.test.ts`.

They use a simple simulator that illustrate
how to initialize and call smart contract code locally without running a node:
`examples/counter/contract/src/test/counter-simulator.ts`

### Building the smart contract

1. Install dependencies:

   ```sh
   cd contract
   yarn
   ```

2. Compile the contract

   ```sh
   yarn compact
   ```

   > If this doesn't work, you need to export the current path to the Compact compiler to your console with `export COMPACT_PATH="/path/to/compactc"`

   You should see output from the Compact compiler with some details about generated circuits:

   ```sh
   increment: Uses around 2^5 out of 2^20 constraints (rounded up to the nearest power of two).
   ```

   The compiler also produces a directory with a TypeScript API for the contract and additional matierals in `src/managed`.

3. Build TypeScript source files

   ```sh
   npx turbo build
   ```

   This creates the `dist` directory.

4. Start unit tests:
   ```sh
   npx turbo test
   ```

## CLI

After building the smart contract you can deploy it using the project in the subdirectory `counter-cli`:

```sh
cd ../counter-cli
```

Install dependencies:

```sh
yarn
```

Build from source code:

```sh
yarn build
```

Run the DApp:

```sh
yarn testnet-remote
```

The preceding entry point assumes you already have a proof server running locally.
If you want one to be started automatically for you, use instead:

```sh
yarn testnet-remote-ps
```

Then follow the instructions from the CLI. On the first run, you will want to create a new wallet and copy its address, so as to transfer funds to it from your Midnight Lace wallet.

You can find much more information in part 2 of the [Midnight developer tutorial](https://docs.midnight.network/develop/tutorial/building).
