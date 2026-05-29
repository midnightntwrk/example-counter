"use client";
import React from "react";

export function ChoiceButtons({ 
  onChoice, 
  disabled, 
  choice 
}: { 
  onChoice: (choice: "HEADS" | "TAILS") => void; 
  disabled: boolean;
  choice: "HEADS" | "TAILS" | null;
}) {
  return (
    <div className="flex gap-4 justify-center animate-slide-up w-full">
      <button
        onClick={() => onChoice("HEADS")}
        disabled={disabled}
        className={`flex-1 py-5 rounded-2xl font-bold tracking-[0.2em] text-sm sm:text-base transition-all duration-300 relative overflow-hidden group
          ${disabled 
            ? choice === "HEADS" ? "bg-white/10 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-brand-purple/50" : "bg-white/5 text-muted/40 cursor-not-allowed border border-transparent"
            : "glass-panel hover:bg-white/10 text-white border-white/10 hover:border-brand-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-95"
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite] group-hover:translate-x-[150%] transition-transform duration-1000" />
        HEADS
      </button>
      <button
        onClick={() => onChoice("TAILS")}
        disabled={disabled}
        className={`flex-1 py-5 rounded-2xl font-bold tracking-[0.2em] text-sm sm:text-base transition-all duration-300 relative overflow-hidden group
          ${disabled 
            ? choice === "TAILS" ? "bg-white/10 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-brand-blue/50" : "bg-white/5 text-muted/40 cursor-not-allowed border border-transparent"
            : "glass-panel hover:bg-white/10 text-white border-white/10 hover:border-brand-blue/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95"
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite] group-hover:translate-x-[150%] transition-transform duration-1000" />
        TAILS
      </button>
    </div>
  );
}
