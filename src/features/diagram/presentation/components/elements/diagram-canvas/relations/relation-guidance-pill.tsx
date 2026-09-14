"use client";

import React from "react";
import { ArrowRight, Compass } from "lucide-react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { deriveRelationGuidance } from "@/features/diagram/domain/services/relation-guidance";

/**
 * Píldora accesible de orientación contextual durante la creación de relaciones UML.
 *
 * Se posiciona en la barra inferior del lienzo y orienta paso a paso qué clase
 * seleccionar como origen y destino según el tipo de relación y sus cardinalidades/roles.
 */
export function RelationGuidancePill(): React.JSX.Element | null {
  const activeRelationPreset = useAppStore((s) => s.activeRelationPreset);
  const relationDraftSource = useAppStore((s) => s.relationDraftSource);
  const canEdit = useAppStore((s) => s.canEdit);

  if (!canEdit || !activeRelationPreset) {
    return null;
  }

  const guidance = deriveRelationGuidance(
    activeRelationPreset,
    relationDraftSource
  );

  if (!guidance) {
    return null;
  }

  const isAwaitingSource = guidance.phase === "AWAITING_SOURCE";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none select-none flex items-center justify-center transition-all duration-200 ease-out"
    >
      <div className="flex items-center gap-2.5 bg-[#191a1d] text-white border border-white/10 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md">
        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
          {isAwaitingSource ? (
            <Compass className="w-3 h-3 text-indigo-300 animate-pulse" />
          ) : (
            <ArrowRight className="w-3 h-3 text-indigo-300" />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 border border-white/10 text-indigo-300 uppercase tracking-wider">
            {isAwaitingSource ? "Paso 1" : "Paso 2"}
          </span>
          <span className="text-slate-200 font-medium tracking-tight">
            {guidance.message}
          </span>
        </div>

        <span className="text-[10px] text-slate-400 ml-1.5 border-l border-white/10 pl-2">
          Presiona <kbd className="font-mono text-[9px] bg-white/10 px-1 py-0.5 rounded text-slate-300">Esc</kbd> para cancelar
        </span>
      </div>
    </div>
  );
}
