"use client";

import React from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTutorialStore } from "@/features/diagram/presentation/store/tutorial-slice";

export interface RestartTutorialButtonProps {
  onRestart: () => void;
  className?: string;
}

/**
 * Botón flotante accesible ubicado arriba del botón de ayuda (?) en /projects,
 * permitiendo relanzar el modal y tutorial dinámico en cualquier momento.
 * Se oculta automáticamente mientras el tutorial esté activo para evitar solapamientos.
 */
export function RestartTutorialButton({
  onRestart,
  className,
}: RestartTutorialButtonProps) {
  const isTutorialActive = useTutorialStore((state) => state.isActive);

  if (isTutorialActive) {
    return null;
  }

  return (
    <div
      data-testid="restart-tutorial-button-wrapper"
      className={cn(
        "fixed bottom-20 right-6 z-40 group flex items-center select-none pointer-events-auto",
        className
      )}
    >
      {/* Tooltip flotante a la izquierda */}
      <div
        role="tooltip"
        className="mr-3 px-3 py-1.5 rounded-lg bg-[#18191e] border border-white/10 text-xs font-medium text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block"
      >
        <span>Ver tutorial interactivo</span>
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18191e] border-t border-r border-white/10 rotate-45" />
      </div>

      {/* Botón flotante circular */}
      <button
        type="button"
        onClick={onRestart}
        data-tutorial="restart-tutorial-btn"
        aria-label="Abrir tutorial interactivo del lienzo"
        className="w-12 h-12 rounded-full bg-[#18191e]/95 hover:bg-[#23252d] border border-white/15 hover:border-indigo-500/50 text-indigo-300 hover:text-white shadow-2xl shadow-black/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
      >
        <GraduationCap className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
      </button>
    </div>
  );
}
