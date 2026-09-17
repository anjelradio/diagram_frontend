"use client";

import React from "react";
import { Mic, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceRecorderBarState } from "../../hooks/use-voice-recorder";

interface VoiceRecorderBarProps {
  state: VoiceRecorderBarState;
  onCancel: () => void;
  onSend: () => void;
}

/**
 * Componente flotante inferior para grabación de órdenes de voz con visualización estilo aurora boreal.
 */
export function VoiceRecorderBar({
  state,
  onCancel,
  onSend,
}: VoiceRecorderBarProps): React.JSX.Element | null {
  if (state === "idle") {
    return null;
  }

  const isSending = state === "sending";

  return (
    <aside
      role="status"
      aria-label="Grabación de orden de voz"
      className="pointer-events-auto select-none flex items-center justify-center transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4"
    >
      <style>{`
        @keyframes aurora-wave-pulse {
          0%, 100% {
            height: 8px;
            opacity: 0.5;
            filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.4));
          }
          50% {
            height: 28px;
            opacity: 1;
            filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.8));
          }
        }
        @keyframes aurora-fluid-flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .aurora-spectrum-bar {
          animation: aurora-wave-pulse 1.4s ease-in-out infinite;
          border-radius: 9999px;
          width: 3.5px;
        }
      `}</style>

      <div className="relative overflow-hidden flex items-center gap-4 bg-[#191a1d]/95 text-white border border-white/15 px-5 py-2.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl min-w-[340px] max-w-md justify-between">
        {/* Fondo sutil de resplandor aurora */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background:
              "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.35), rgba(192, 132, 252, 0.3), rgba(52, 211, 153, 0.25))",
            backgroundSize: "250% 250%",
            animation: "aurora-fluid-flow 6s ease infinite",
          }}
        />

        {/* Indicador de estado y micro */}
        <div className="flex items-center gap-2.5 z-10">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
              isSending
                ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 animate-pulse"
                : "bg-rose-500/20 border border-rose-500/40 text-rose-400"
            )}
          >
            <Mic className={cn("w-3.5 h-3.5", !isSending && "animate-pulse")} />
          </div>

          <span className="text-xs font-semibold tracking-tight text-zinc-200">
            {isSending ? "Enviando orden..." : "Escuchando..."}
          </span>
        </div>

        {/* Espectro de ondas sonoras estilo aurora */}
        <div className="flex items-center gap-1.5 h-8 px-2 z-10">
          {!isSending ? (
            <>
              <div
                className="aurora-spectrum-bar bg-gradient-to-t from-cyan-500 to-sky-300"
                style={{ animationDelay: "0.0s", height: "12px" }}
              />
              <div
                className="aurora-spectrum-bar bg-gradient-to-t from-sky-400 to-indigo-400"
                style={{ animationDelay: "0.25s", height: "22px" }}
              />
              <div
                className="aurora-spectrum-bar bg-gradient-to-t from-indigo-500 to-purple-400"
                style={{ animationDelay: "0.45s", height: "28px" }}
              />
              <div
                className="aurora-spectrum-bar bg-gradient-to-t from-purple-500 to-fuchsia-400"
                style={{ animationDelay: "0.15s", height: "18px" }}
              />
              <div
                className="aurora-spectrum-bar bg-gradient-to-t from-fuchsia-400 to-pink-400"
                style={{ animationDelay: "0.35s", height: "24px" }}
              />
              <div
                className="aurora-spectrum-bar bg-gradient-to-t from-indigo-400 to-teal-300"
                style={{ animationDelay: "0.55s", height: "14px" }}
              />
            </>
          ) : (
            <span className="text-[11px] text-zinc-400 font-medium animate-pulse">
              Procesando audio...
            </span>
          )}
        </div>

        {/* Botones de acción (Cancelar y Enviar) */}
        <div className="flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            aria-label="Cancelar grabación"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-zinc-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            aria-label="Enviar orden de voz"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
