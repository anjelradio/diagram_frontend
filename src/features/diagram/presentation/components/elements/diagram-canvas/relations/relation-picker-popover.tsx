"use client";

import { useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import {
  RELATION_PRESETS,
  type RelationPreset,
} from "@/features/diagram/domain/entities/diagram-relation.entity";

function getPresetIcon(preset: RelationPreset) {
  if (preset.badge) {
    let colorClass = "text-blue-400 group-hover:border-blue-500/40";
    if (preset.badge === "*..*") {
      colorClass = "text-indigo-400 group-hover:border-indigo-500/40";
    } else if (preset.badge === "1..1") {
      colorClass = "text-cyan-400 group-hover:border-cyan-500/40";
    } else if (preset.badge === "0..*") {
      colorClass = "text-emerald-400 group-hover:border-emerald-500/40";
    } else if (preset.badge === "0..1") {
      colorClass = "text-amber-400 group-hover:border-amber-500/40";
    }

    return (
      <div
        className={cn(
          "w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono font-semibold transition-colors",
          colorClass
        )}
      >
        {preset.badge}
      </div>
    );
  }

  switch (preset.relationType) {
    case "AGGREGATION":
      return (
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
          <svg
            className="w-4 h-4 text-slate-200 group-hover:text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path d="M7 12l5-5 5 5-5 5z" />
            <line x1="17" x2="22" y1="12" y2="12" />
          </svg>
        </div>
      );
    case "COMPOSITION":
      return (
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
          <svg
            className="w-4 h-4 text-slate-200 group-hover:text-white"
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
        </div>
      );
    case "GENERALIZATION":
      return (
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
          <svg
            className="w-4 h-4 text-slate-200 group-hover:text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path d="M14 6l6 6-6 6z" />
            <line x1="2" x2="14" y1="12" y2="12" />
          </svg>
        </div>
      );
    case "REALIZATION":
      return (
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
          <svg
            className="w-4 h-4 text-slate-200 group-hover:text-white"
            fill="none"
            stroke="currentColor"
            strokeDasharray="2 2"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <line x1="2" x2="14" y1="12" y2="12" />
            <path d="M14 6l6 6-6 6z" strokeDasharray="none" />
          </svg>
        </div>
      );
    case "DEPENDENCY":
      return (
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
          <svg
            className="w-4 h-4 text-slate-200 group-hover:text-white"
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
        </div>
      );
    default:
      return null;
  }
}

type RelationPickerPopoverProps = {
  className?: string;
  onSelect?: () => void;
};

/**
 * Panel desplegable de catálogo de relaciones UML y accesos directos Stitch.
 * Proporciona selección de presets asociativos y no asociativos para el lienzo.
 */
export function RelationPickerPopover({
  className,
  onSelect,
}: RelationPickerPopoverProps) {
  const isRelationPickerOpen = useAppStore((s) => s.isRelationPickerOpen);
  const setRelationPickerOpen = useAppStore((s) => s.setRelationPickerOpen);
  const activeRelationPreset = useAppStore((s) => s.activeRelationPreset);
  const selectRelationPreset = useAppStore((s) => s.selectRelationPreset);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isRelationPickerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        // Verificar si el clic fue en el botón del toolbar para no hacer toggle redundante
        const targetEl = e.target as HTMLElement | null;
        if (targetEl?.closest('[data-relation-toolbar-button="true"]')) {
          return;
        }
        setRelationPickerOpen(false);
      }
    };

    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [isRelationPickerOpen, setRelationPickerOpen]);

  if (!isRelationPickerOpen) {
    return null;
  }

  const handleSelectPreset = (preset: RelationPreset) => {
    selectRelationPreset(preset);
    onSelect?.();
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Catálogo de relaciones UML"
      className={cn(
        "w-72 bg-[#191a1d] border border-white/10 shadow-2xl rounded-2xl p-3.5 flex flex-col z-40 backdrop-blur-md select-none animate-in fade-in slide-in-from-right-2 duration-150",
        className
      )}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10 px-1">
        <span className="text-xs font-semibold text-white tracking-tight font-brand">
          Relaciones
        </span>
        <svg
          className="w-4 h-4 text-slate-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path
            d="M8.7 13.3L15.3 16.7M15.3 7.3L8.7 10.7"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Contenedor scrolleable */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar flex flex-col space-y-1 pr-1">
        {RELATION_PRESETS.map((preset) => {
          const isSelected = activeRelationPreset?.id === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition group text-left w-full",
                isSelected
                  ? "bg-white/10 border border-white/20"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                {getPresetIcon(preset)}
                <span
                  className={cn(
                    "text-xs font-medium transition",
                    isSelected
                      ? "text-white font-semibold"
                      : "text-slate-200 group-hover:text-white"
                  )}
                >
                  {preset.label}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
