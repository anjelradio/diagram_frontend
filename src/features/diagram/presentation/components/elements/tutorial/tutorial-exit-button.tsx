"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TutorialExitButtonProps {
  onExit: () => void;
  className?: string;
}

/**
 * Botón persistente y visible en la parte inferior derecha que permite al usuario
 * cancelar o salir del tutorial dinámico en cualquier instante.
 */
export function TutorialExitButton({
  onExit,
  className,
}: TutorialExitButtonProps) {
  return (
    <div
      data-testid="tutorial-exit-button-wrapper"
      className={cn(
        "fixed bottom-6 right-6 z-50 pointer-events-auto select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={onExit}
        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-200 hover:text-white shadow-xl shadow-black/60 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        title="Salir del tutorial y volver al modo normal"
        aria-label="Salir del tutorial"
      >
        <LogOut className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-100 transition-colors" />
        <span>Salir del tutorial</span>
      </button>
    </div>
  );
}
