"use client";

import { useEffect, useMemo, useState } from "react";
import { Toast } from "@/components/Toast";
import { classNames, truncateHash } from "@/lib/utils";
import { CounterIncrement, CounterSnapshot, getCounter, incrementCounter } from "@/lib/api";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Hash,
  Plus,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

type CounterEvent = {
  counterValue: string | null;
  txId: string;
  blockHeight?: number;
  timestamp: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CounterSnapshot | null>(null);
  const [history, setHistory] = useState<CounterEvent[]>([]);
  const [pulseKey, setPulseKey] = useState(0);

  const networkLabel = useMemo(() => {
    if (!snapshot?.network) return "—";
    return snapshot.network.charAt(0).toUpperCase() + snapshot.network.slice(1);
  }, [snapshot?.network]);

  const counterValue = snapshot?.counterValue ?? "—";
  const contractAddress = snapshot?.contractAddress ?? "";

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const next = await getCounter();
      setSnapshot(next);
      setPulseKey((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Unable to load counter state.");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    try {
      setBusy(true);
      setError(null);
      const res: CounterIncrement = await incrementCounter();
      setSnapshot(res);
      setHistory((prev) =>
        [
          {
            counterValue: res.counterValue,
            txId: res.txId,
            blockHeight: res.blockHeight,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 6)
      );
      setPulseKey((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Increment failed. Check the backend setup.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main className="min-h-screen relative flex flex-col px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto w-full">
        <header className="flex flex-col gap-6 sm:gap-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 w-fit mx-auto sm:mx-0">
            <Activity className="w-4 h-4 text-brand-teal" />
            <span className="text-xs uppercase tracking-[0.35em] text-white/60">
              Midnight Counter
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white">
              Increment the ledger. Watch the value update live.
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-2xl">
              This UI talks directly to the counter contract through the CLI runner. Press increment to
              submit a transaction, then read the latest on-chain value.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            <button
              onClick={handleIncrement}
              disabled={busy || loading}
              className={classNames(
                "px-8 py-4 rounded-2xl font-semibold tracking-[0.2em] uppercase text-sm flex items-center gap-3 transition-all",
                "bg-gradient-to-r from-brand-teal via-brand-amber to-brand-gold text-black shadow-[0_12px_30px_rgba(34,211,238,0.3)]",
                busy || loading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
              )}
            >
              <Plus className={classNames("w-5 h-5", busy ? "animate-spin" : "")} />
              {busy ? "Incrementing..." : "Increment Counter"}
            </button>
            <button
              onClick={refresh}
              disabled={busy}
              className={classNames(
                "px-5 py-4 rounded-2xl font-semibold tracking-[0.2em] uppercase text-xs flex items-center gap-2 border border-white/10 bg-white/5",
                busy ? "opacity-60 cursor-not-allowed" : "hover:border-white/30"
              )}
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
            <div className="inline-flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="w-4 h-4 text-brand-amber" />
              Network: {networkLabel}
            </div>
          </div>
        </header>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Live Counter</h2>
                <p className="text-sm text-white/50">
                  Current ledger value pulled from the contract state.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-white/40">
                <Clock className="w-4 h-4" />
                {loading ? "Syncing..." : "Up to date"}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Counter Value</p>
                <p
                  key={pulseKey}
                  className="text-5xl sm:text-6xl font-semibold mt-4 text-brand-amber animate-counter-pop"
                >
                  {counterValue}
                </p>
                <p className="text-xs text-white/50 mt-2">
                  Incrementing submits an on-chain transaction and updates this value.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Contract</p>
                  <p className="text-sm font-mono mt-2 text-white/70" title={contractAddress}>
                    {contractAddress ? truncateHash(contractAddress) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Latest Tx</p>
                  <p className="text-sm font-mono mt-2 text-white/70">
                    {history[0]?.txId ? truncateHash(history[0].txId) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6">
              <h3 className="text-lg font-semibold">Recent Increments</h3>
              <p className="text-sm text-white/50">Most recent transactions from this session.</p>
              <div className="mt-4 flex flex-col gap-3">
                {history.length === 0 && (
                  <div className="text-sm text-white/40 border border-white/10 rounded-2xl px-4 py-3">
                    Increment the counter to build history.
                  </div>
                )}
                {history.map((entry, index) => (
                  <div
                    key={`${entry.txId}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs text-white/50">{entry.timestamp}</span>
                      <span className="text-sm font-mono text-white/80">
                        {truncateHash(entry.txId)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-brand-amber">{entry.counterValue ?? "—"}</p>
                      {entry.blockHeight !== undefined && (
                        <p className="text-xs text-white/40">Block {entry.blockHeight}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">How it works</h3>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {[
                  {
                    title: "Wallet",
                    text: "The backend restores your wallet seed and syncs with Midnight.",
                  },
                  {
                    title: "Increment",
                    text: "Calling increment submits a transaction that updates the public ledger state.",
                  },
                  {
                    title: "Read",
                    text: "The UI fetches the latest counter value right after the transaction lands.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">{item.title}</p>
                    <p className="mt-2 text-sm text-white/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Contract increments are recorded on Midnight via the `increment` circuit.
          </div>
          <a
            href="https://docs.midnight.network/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white transition"
            target="_blank"
            rel="noreferrer"
          >
            Docs
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>
      </div>

      <Toast message={error} onClose={() => setError(null)} />
    </main>
  );
}
