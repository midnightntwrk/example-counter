import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { classNames } from "@/lib/utils";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="glass-panel border-red-500/30 bg-red-500/10 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-[0_10px_30px_rgba(239,68,68,0.2)]">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
