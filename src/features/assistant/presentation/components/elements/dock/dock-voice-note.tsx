"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DockVoiceNoteProps {
  /** Invocado al terminar/parar la grabación de voz para procesarla */
  onStop: () => void;
  /** Invocado al cancelar y descartar la sesión de audio */
  onCancel: () => void;
  /** Cantidad de barras en la onda de voz */
  bars?: number;
  /** Clases CSS opcionales */
  className?: string;
}

const SAMPLE_INTERVAL_MS = 60;
const CLAMP = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Función de síntesis estocástica de voz (Bencho VoiceNote standIn)
 * Simula sílabas, frases y pausas naturales para animar las barras de audio.
 */
function standIn(t: number) {
  const syll = Math.abs(Math.sin(t * 6.1) * Math.sin(t * 1.9 + 0.7));
  const phrase = Math.sin(t * 0.9 + 0.4) > -0.55 ? 1 : 0.1;
  return Math.min(1, 0.08 + syll * phrase * (0.5 + Math.random() * 0.5));
}

export function DockVoiceNote({
  onStop,
  onCancel,
  bars = 24,
  className,
}: DockVoiceNoteProps) {
  const n = CLAMP(bars, 14, 36);
  const [levels, setLevels] = useState<number[]>(() => Array(n).fill(0.1));
  const t0 = useRef(0);

  // Manejo de la tecla Escape para cancelar la grabación
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Loop de simulación reactiva de ondas de audio
  useEffect(() => {
    t0.current = performance.now();
    const interval = window.setInterval(() => {
      const elapsed = (performance.now() - t0.current) / 1000;
      const sample = standIn(elapsed);
      setLevels((prev) => {
        const next = [...prev.slice(1), sample];
        return next;
      });
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "h-10 px-2.5 rounded-full bg-blue-600 hover:bg-blue-600 text-white flex items-center gap-2 shadow-lg shadow-blue-900/40 select-none transition-all",
        className
      )}
      role="region"
      aria-label="Grabación de voz activa"
    >
      {/* Botón izquierdo: Cancelar y descartar grabación (X) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition cursor-pointer flex-shrink-0"
        aria-label="Cancelar grabación"
        title="Cancelar grabación (Escape)"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Centro: Barras de espectro de voz blancas estilo Bencho */}
      <div
        className="flex items-center justify-between gap-[3px] flex-1 h-5 px-1 overflow-hidden"
        aria-hidden="true"
      >
        {levels.map((level, i) => {
          const heightPx = Math.round(4 + level * 16);
          return (
            <span
              key={i}
              className="w-[3px] rounded-full bg-white transition-[height] duration-75"
              style={{ height: `${heightPx}px` }}
            />
          );
        })}
      </div>

      {/* Botón derecho: Terminar y procesar grabación (Parar / Check) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStop();
        }}
        className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white active:scale-95 transition cursor-pointer flex-shrink-0"
        aria-label="Terminar y enviar grabación"
        title="Terminar y enviar grabación"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
      </button>
    </div>
  );
}
