"use client";
import React from "react";
import { Trophy, XCircle } from "lucide-react";

export function ResultCard({ 
  result, 
  userChoice 
}: { 
  result: "HEADS" | "TAILS" | null;
  userChoice: "HEADS" | "TAILS" | null;
}) {
  if (!result || !userChoice) return null;

  const isWin = result === userChoice;

  return (
    <div className={`rounded-2xl p-6 sm:p-8 animate-slide-up w-full text-center transition-all duration-700 relative overflow-hidden
      ${isWin 
        ? "bg-gradient-to-b from-[rgba(72,187,120,0.1)] to-[rgba(72,187,120,0.02)] border border-[rgba(72,187,120,0.3)] shadow-[0_0_30px_rgba(72,187,120,0.15)]" 
        : "bg-gradient-to-b from-[rgba(245,101,101,0.1)] to-[rgba(245,101,101,0.02)] border border-[rgba(245,101,101,0.3)] shadow-[0_0_30px_rgba(245,101,101,0.15)]"}
    `}>
      <h2 className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3 font-semibold">Verified Outcome</h2>
      
      <div className="text-4xl sm:text-5xl font-bold mb-6 font-mono tracking-tight drop-shadow-lg">
        {result}
      </div>
      
      <div className={`inline-flex items-center gap-2 text-lg sm:text-xl font-bold tracking-[0.2em] rounded-xl px-6 py-3
        ${isWin ? "text-[#48bb78] bg-[#48bb78]/10" : "text-[#f56565] bg-[#f56565]/10"}
      `}>
        {isWin ? <Trophy className="w-5 h-5 sm:w-6 sm:h-6" /> : <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
        {isWin ? "YOU WIN" : "YOU LOSE"}
      </div>
    </div>
  );
}
