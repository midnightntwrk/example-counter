"use client";
import React from "react";
import { classNames, truncateHash } from "@/lib/utils";
import { Lock, Unlock, ShieldCheck, HelpCircle, Loader2, Trophy, XCircle, CheckCircle2 } from "lucide-react";
import { ChoiceButtons } from "./ChoiceButtons";
import { ResultCard } from "./ResultCard";

export type LoadingPhase = null | "locking" | "revealing" | "verifying";

interface TimelineProps {
  gameState: "idle" | "committed" | "chosen" | "revealed" | "verified";
  loadingPhase: LoadingPhase;
  commitHash: string | null;
  userChoice: "HEADS" | "TAILS" | null;
  secret: string | null;
  result: "HEADS" | "TAILS" | null;
  isVerified: boolean | null;
  onChoice: (choice: "HEADS" | "TAILS") => void;
}

function StepIndicator({ isActive, isCompleted, icon: Icon }: { isActive: boolean; isCompleted: boolean; icon: any }) {
  return (
    <div className={classNames(
      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 z-10 bg-background",
      isCompleted ? "border-brand-purple bg-brand-purple/10 text-brand-purple" : 
      isActive ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
      "border-white/10 text-white/30"
    )}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

export function TimelineStepper({
  gameState, loadingPhase, commitHash, userChoice, secret, result, isVerified, onChoice
}: TimelineProps) {
  
  if (gameState === "idle" && !loadingPhase) return null;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-0 relative animate-slide-up mt-8">
      {/* Connecting Line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-white/10" />

      {/* Step 1: Lock Result */}
      <div className="flex gap-4 relative pb-8">
        <StepIndicator 
          isActive={loadingPhase === "locking" || gameState === "committed"} 
          isCompleted={!!commitHash} 
          icon={Lock} 
        />
        <div className="flex-1 pt-2 animate-fade-in">
          <h3 className={classNames("text-lg font-bold mb-1", commitHash ? "text-brand-purple" : "text-white")}>
            Lock Result
          </h3>
          {loadingPhase === "locking" ? (
            <div className="flex items-center gap-2 text-white/60 text-sm mt-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Locking cryptographically...
            </div>
          ) : commitHash ? (
            <div className="mt-2 glass-panel p-3 rounded-xl border-white/5 border text-sm font-mono text-white/80 select-all group">
              <span className="text-white/40 select-none mr-2">Hash:</span>
              <span className="group-hover:text-white transition-colors">{commitHash}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Step 2: Your Choice */}
      {(gameState !== "idle" && commitHash) && (
        <div className="flex gap-4 relative pb-8 animate-slide-up">
          <StepIndicator 
            isActive={gameState === "committed"} 
            isCompleted={!!userChoice} 
            icon={HelpCircle} 
          />
          <div className="flex-1 pt-2 w-full">
            <h3 className={classNames("text-lg font-bold mb-3", userChoice ? "text-brand-purple" : "text-white")}>
              Your Choice
            </h3>
            {!userChoice ? (
              <ChoiceButtons onChoice={onChoice} disabled={loadingPhase !== null} choice={null} />
            ) : (
              <div className="mt-2 inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-xl border-white/5 border text-sm font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-brand-purple" />
                You chose {userChoice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Reveal Outcome */}
      {(userChoice) && (
        <div className="flex gap-4 relative pb-8 animate-slide-up">
          <StepIndicator 
            isActive={loadingPhase === "revealing" || gameState === "revealed"} 
            isCompleted={!!secret} 
            icon={Unlock} 
          />
          <div className="flex-1 pt-2">
            <h3 className={classNames("text-lg font-bold mb-1", secret ? "text-brand-purple" : "text-white")}>
              Reveal Outcome
            </h3>
            {loadingPhase === "revealing" ? (
              <div className="flex items-center gap-2 text-white/60 text-sm mt-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching secure payload...
              </div>
            ) : secret ? (
              <div className="mt-2 glass-panel p-3 rounded-xl border-white/5 border text-sm font-mono text-white/80 select-all">
                <span className="text-white/40 select-none mr-2">Secret:</span>
                {secret}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Step 4: Verification */}
      {(secret) && (
        <div className="flex gap-4 relative animate-slide-up">
          <StepIndicator 
            isActive={loadingPhase === "verifying" || gameState === "verified"} 
            isCompleted={isVerified !== null} 
            icon={ShieldCheck} 
          />
          <div className="flex-1 pt-2">
            <h3 className={classNames("text-lg font-bold mb-1", isVerified ? "text-brand-purple" : "text-white")}>
              Proof Verified
            </h3>
            {loadingPhase === "verifying" ? (
              <div className="flex items-center gap-2 text-white/60 text-sm mt-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking cryptographic seal...
              </div>
            ) : isVerified !== null ? (
              <div className="mt-3 bg-brand-purple/10 border border-brand-purple/20 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand-purple mt-0.5 shrink-0" />
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                    This result was cryptographically locked <span className="text-white font-bold">before</span> your choice. 
                    The hash flawlessly matches the revealed secret payload.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
