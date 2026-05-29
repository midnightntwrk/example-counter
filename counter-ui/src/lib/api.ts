import { backendGetCounter, backendIncrement } from "@/app/actions";

export interface CounterSnapshot {
  ok: boolean;
  network: "preprod" | "preview" | "standalone";
  contractAddress: string;
  counterValue: string | null;
}

export interface CounterIncrement extends CounterSnapshot {
  txId: string;
  blockHeight?: number;
}

export async function getCounter(): Promise<CounterSnapshot> {
  return backendGetCounter();
}

export async function incrementCounter(): Promise<CounterIncrement> {
  return backendIncrement();
}
