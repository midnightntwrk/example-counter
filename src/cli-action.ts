import {
  buildWalletAndWaitForFunds,
  configureProviders,
  displayCounterValue,
  increment,
  joinContract,
  setLogger,
} from "../counter-cli/src/api.ts";
import { PreprodConfig, PreviewConfig, StandaloneConfig } from "../counter-cli/src/config.ts";
import { createLogger } from "../counter-cli/src/logger-utils.ts";

const command = process.argv[2];

const NETWORKS = {
  preprod: PreprodConfig,
  preview: PreviewConfig,
  standalone: StandaloneConfig,
};

type NetworkKey = keyof typeof NETWORKS;

type CliResult = {
  ok: boolean;
  error?: string;
  network?: NetworkKey;
  contractAddress?: string;
  counterValue?: string | null;
  txId?: string;
  blockHeight?: number;
};

const toCounterValue = (value: bigint | null) => (value === null ? null : value.toString());

async function run(): Promise<CliResult> {
  if (!command) {
    return { ok: false, error: "Missing command. Use get or increment." };
  }

  const network = (process.env.COUNTER_NETWORK ?? "preprod").toLowerCase() as NetworkKey;
  const ConfigClass = NETWORKS[network];
  if (!ConfigClass) {
    return { ok: false, error: `Invalid COUNTER_NETWORK: ${process.env.COUNTER_NETWORK ?? ""}` };
  }

  const seed = process.env.COUNTER_WALLET_SEED;
  const contractAddress = process.env.COUNTER_CONTRACT_ADDRESS;
  if (!seed || !contractAddress) {
    return {
      ok: false,
      error: "Missing COUNTER_WALLET_SEED or COUNTER_CONTRACT_ADDRESS in the environment.",
    };
  }

  const config = new ConfigClass();
  const logger = await createLogger(config.logDir);
  setLogger(logger);

  const walletCtx = await buildWalletAndWaitForFunds(config, seed);
  const providers = await configureProviders(walletCtx, config);
  const contract = await joinContract(providers, contractAddress);

  if (command === "get") {
    const current = await displayCounterValue(providers, contract);
    return {
      ok: true,
      network,
      contractAddress: current.contractAddress,
      counterValue: toCounterValue(current.counterValue),
    };
  }

  if (command === "increment") {
    const tx = await increment(contract);
    const current = await displayCounterValue(providers, contract);
    return {
      ok: true,
      network,
      contractAddress: current.contractAddress,
      counterValue: toCounterValue(current.counterValue),
      txId: tx.txId,
      blockHeight: tx.blockHeight,
    };
  }

  return { ok: false, error: `Unknown command: ${command}` };
}

run()
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.log(JSON.stringify({ ok: false, error: message }));
  });
