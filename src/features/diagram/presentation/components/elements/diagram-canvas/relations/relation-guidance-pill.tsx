"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Undo2,
} from "lucide-react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import {
  deriveRelationGuidance,
  type RelationGuidancePhase,
} from "@/features/diagram/domain/services/relation-guidance";
import type { RelationPreset } from "@/features/diagram/domain/entities/diagram-relation.entity";
import { cn } from "@/lib/utils";

function getPresetBadgeOrIcon(preset: RelationPreset) {
  if (preset.badge) {
    let colorClass = "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (preset.badge === "*..*") {
      colorClass = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
    } else if (preset.badge === "1..1") {
      colorClass = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
    } else if (preset.badge === "0..*") {
      colorClass = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    } else if (preset.badge === "0..1") {
      colorClass = "text-amber-400 border-amber-500/30 bg-amber-500/10";
    }

    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-lg border text-xs font-mono font-bold tracking-tight shadow-sm shrink-0",
          colorClass
        )}
      >
        {preset.badge}
      </span>
    );
  }

  switch (preset.relationType) {
    case "AGGREGATION":
      return (
        <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path d="M7 12l5-5 5 5-5 5z" />
            <line x1="17" x2="22" y1="12" y2="12" />
          </svg>
        </span>
      );
    case "COMPOSITION":
      return (
        <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path d="M7 12l5-5 5 5-5 5z" />
            <line
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              x1="17"
              x2="22"
              y1="12"
              y2="12"
            />
          </svg>
        </span>
      );
    case "GENERALIZATION":
      return (
        <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path d="M14 6l6 6-6 6z" />
            <line x1="2" x2="14" y1="12" y2="12" />
          </svg>
        </span>
      );
    case "REALIZATION":
      return (
        <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeDasharray="2 2"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <line x1="2" x2="14" y1="12" y2="12" />
            <path d="M14 6l6 6-6 6z" strokeDasharray="none" />
          </svg>
        </span>
      );
    case "DEPENDENCY":
      return (
        <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeDasharray="2.5 2"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <line x1="3" x2="18" y1="12" y2="12" />
            <path
              d="M14 8l5 4-5 4"
              strokeDasharray="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    default:
      return null;
  }
}

/**
 * Tarjeta contextual de orientación paso a paso durante la creación de relaciones UML.
 *
 * Ofrece escala ampliada, indicaciones explícitas de cardinalidad y roles,
 * previsualización de la clase origen anclada, navegación hacia atrás al Paso 1
 * y animación direccional en cascada entre pasos con efecto fade.
 */
export function RelationGuidancePill(): React.JSX.Element | null {
  const activeRelationPreset = useAppStore((s) => s.activeRelationPreset);
  const relationDraftSource = useAppStore((s) => s.relationDraftSource);
  const setRelationDraftSource = useAppStore((s) => s.setRelationDraftSource);
  const cancelRelationCreation = useAppStore((s) => s.cancelRelationCreation);
  const nodes = useAppStore((s) => s.nodes);
  const canEdit = useAppStore((s) => s.canEdit);

  const guidance = deriveRelationGuidance(
    activeRelationPreset,
    relationDraftSource
  );

  const [step, setStep] = useState<1 | 2>(
    guidance?.phase === "AWAITING_TARGET" ? 2 : 1
  );
  const [prevStep, setPrevStep] = useState<1 | 2 | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const prevPhaseRef = useRef<RelationGuidancePhase | null>(null);
  const prevPresetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!guidance || !activeRelationPreset) {
      prevPhaseRef.current = null;
      prevPresetIdRef.current = null;
      setPrevStep(null);
      return;
    }

    const currentPhase = guidance.phase;
    const currentPresetId = activeRelationPreset.id;

    // Si cambia el preset, reiniciamos el paso sin animación cruzada
    if (prevPresetIdRef.current !== currentPresetId) {
      prevPresetIdRef.current = currentPresetId;
      prevPhaseRef.current = currentPhase;
      setStep(currentPhase === "AWAITING_SOURCE" ? 1 : 2);
      setPrevStep(null);
      return;
    }

    // Transición de fase (Paso 1 <-> Paso 2)
    if (prevPhaseRef.current && prevPhaseRef.current !== currentPhase) {
      if (
        prevPhaseRef.current === "AWAITING_SOURCE" &&
        currentPhase === "AWAITING_TARGET"
      ) {
        // Avanzar al Paso 2: Paso 1 va hacia abajo y se desvanece; Paso 2 entra desde arriba
        setPrevStep(1);
        setStep(2);
        setDirection("forward");
      } else if (
        prevPhaseRef.current === "AWAITING_TARGET" &&
        currentPhase === "AWAITING_SOURCE"
      ) {
        // Retroceder al Paso 1: Paso 2 va hacia arriba y se desvanece; Paso 1 entra desde abajo
        setPrevStep(2);
        setStep(1);
        setDirection("backward");
      }
      prevPhaseRef.current = currentPhase;

      const timer = setTimeout(() => {
        setPrevStep(null);
      }, 260);
      return () => clearTimeout(timer);
    } else {
      prevPhaseRef.current = currentPhase;
      setStep(currentPhase === "AWAITING_SOURCE" ? 1 : 2);
    }
  }, [guidance?.phase, activeRelationPreset?.id]);

  const handleBackToStep1 = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setRelationDraftSource(null);
    },
    [setRelationDraftSource]
  );

  const handleCancel = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      cancelRelationCreation();
    },
    [cancelRelationCreation]
  );

  if (!canEdit || !activeRelationPreset || !guidance) {
    return null;
  }

  const sourceNode = relationDraftSource
    ? (nodes ?? []).find((n) => n.id === relationDraftSource.classId)
    : null;
  const sourceClassName = sourceNode?.data?.name || "Clase origen";

  const renderCardContent = (stepNum: 1 | 2) => {
    const isStep1 = stepNum === 1;

    return (
      <div className="flex flex-col justify-between h-full gap-2">
        {/* Cabecera: Nombre de relación y Controles de acción */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          {/* Izquierda: Badge/Icono + Nombre de la relación */}
          <div className="flex items-center gap-2 min-w-0">
            {getPresetBadgeOrIcon(activeRelationPreset)}
            <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[260px]">
              {activeRelationPreset.label}
            </span>
          </div>

          {/* Derecha: Botón Volver (si es paso 2) + Botón Cancelar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isStep1 && (
              <button
                type="button"
                onClick={handleBackToStep1}
                className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                title="Volver al Paso 1 y seleccionar otra clase de origen"
              >
                <Undo2 className="w-3 h-3 text-indigo-300" />
                <span>Volver</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 px-2 py-0.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
              title="Cancelar creación de relación (Esc)"
            >
              <span>Cancelar</span>
              <kbd className="font-mono text-[9px] bg-white/10 px-1 py-0.5 rounded text-zinc-300">
                Esc
              </kbd>
            </button>
          </div>
        </div>

        {/* Bloque central: Diagrama interactivo de flujo con mini-clases */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 px-0.5">
          {/* Tarjeta Origen */}
          <div
            className={cn(
              "flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 min-w-0",
              isStep1
                ? "bg-indigo-500/15 border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.25)]"
                : "bg-emerald-500/10 border-emerald-500/30"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                isStep1
                  ? "bg-indigo-500 text-white animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              )}
            >
              {isStep1 ? (
                <Compass className="w-3.5 h-3.5 text-white" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Origen
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-300">
                  [{guidance.sourceRole || "1"}]
                </span>
              </div>
              <span
                className={cn(
                  "text-xs truncate font-medium",
                  isStep1 ? "text-indigo-200" : "text-white font-semibold"
                )}
              >
                {isStep1 ? "Haz clic en una clase..." : sourceClassName}
              </span>
            </div>
          </div>

          {/* Indicador de conexión con flecha y cardinalidad destacada en el centro */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="flex items-center text-zinc-400">
              <div className="w-3 h-[1.5px] bg-white/20" />
              <ArrowRight className="w-4 h-4 text-indigo-400 mx-0.5 shrink-0" />
              <div className="w-3 h-[1.5px] bg-white/20" />
            </div>
            <span className="mt-0.5 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 border border-white/15 text-indigo-200 tracking-wide shadow-sm whitespace-nowrap">
              {activeRelationPreset.relationType === "ASSOCIATION"
                ? `${guidance.sourceRole} ➔ ${guidance.targetRole}`
                : activeRelationPreset.label}
            </span>
          </div>

          {/* Tarjeta Destino */}
          <div
            className={cn(
              "flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 min-w-0",
              isStep1
                ? "bg-white/[0.02] border-white/5 opacity-60"
                : "bg-indigo-500/15 border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.25)]"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                isStep1
                  ? "bg-white/5 text-zinc-400 border border-white/10"
                  : "bg-indigo-500 text-white animate-pulse"
              )}
            >
              {isStep1 ? (
                <span className="text-[10px] font-mono">2</span>
              ) : (
                <Compass className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Destino
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-300">
                  [{guidance.targetRole || "*"}]
                </span>
              </div>
              <span
                className={cn(
                  "text-xs truncate font-medium",
                  isStep1 ? "text-zinc-500" : "text-indigo-200"
                )}
              >
                {isStep1 ? "En espera de origen" : "Haz clic en la clase destino"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative pointer-events-auto select-none flex items-center justify-center w-[560px] max-w-[calc(100vw-2.5rem)] min-h-[106px]"
    >
      {/* Vista del paso saliente durante la transición */}
      {prevStep !== null && (
        <div
          key={`prev-step-${prevStep}`}
          className={cn(
            "absolute inset-0 rounded-2xl bg-[#191a1d]/95 backdrop-blur-xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-3 pointer-events-none flex flex-col justify-between",
            direction === "forward"
              ? "animate-relation-step-exit-down"
              : "animate-relation-step-exit-up"
          )}
        >
          {renderCardContent(prevStep)}
        </div>
      )}

      {/* Vista del paso entrante o activo */}
      <div
        key={`curr-step-${step}`}
        className={cn(
          "w-full rounded-2xl bg-[#191a1d]/95 backdrop-blur-xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-3 flex flex-col justify-between",
          prevStep !== null &&
            (direction === "forward"
              ? "animate-relation-step-enter-down"
              : "animate-relation-step-enter-up")
        )}
      >
        {renderCardContent(step)}
      </div>
    </div>
  );
}
