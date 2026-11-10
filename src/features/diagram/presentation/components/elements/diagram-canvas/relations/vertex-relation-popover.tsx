"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import {
  SOURCE_VERTEX_OPTIONS,
  TARGET_CARDINALITY_OPTIONS,
  type VertexOptionIconType,
  type VertexOptionItem,
  type VertexPopoverAnchor,
} from "@/features/diagram/domain/entities/diagram-relation.entity";
import { getHandleConfig } from "../diagram-class-node/relation-handles-config";

export interface VertexRelationPopoverProps {
  anchor: VertexPopoverAnchor;
  step: "source" | "target";
  onSelectOption: (option: VertexOptionItem) => void;
  onClose: () => void;
}

function StructuralHeadIcon({ iconType }: { iconType?: VertexOptionIconType }) {
  switch (iconType) {
    case "rombo_relleno":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          className="flex-shrink-0 text-white"
          aria-hidden="true"
        >
          <polygon points="8,2 14,8 8,14 2,8" fill="currentColor" />
        </svg>
      );
    case "rombo_vacio":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          className="flex-shrink-0 text-white"
          aria-hidden="true"
        >
          <polygon
            points="8,2 14,8 8,14 2,8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "flecha_triangular":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          className="flex-shrink-0 text-white"
          aria-hidden="true"
        >
          <polygon
            points="3,3 13,8 3,13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "flecha_discontinua":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          className="flex-shrink-0 text-white"
          aria-hidden="true"
        >
          <polygon
            points="3,3 13,8 3,13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeDasharray="2.5,2"
          />
        </svg>
      );
    case "flecha_abierta":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          className="flex-shrink-0 text-white"
          aria-hidden="true"
        >
          <polyline
            points="4,3 13,8 4,13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Menú contextual anclado directamente al vértice de conexión de una clase UML.
 * Posicionamiento inteligente relativo al lado del vértice con auto-inversión
 * y sujeción (clamping) estricta a los bordes de la pantalla.
 * Presenta una lista simple y unificada con badge/icono a la izquierda y texto a la derecha.
 */
export function VertexRelationPopover({
  anchor,
  step,
  onSelectOption,
  onClose,
}: VertexRelationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleConfig = getHandleConfig(anchor.handleId);
  const side = handleConfig?.side ?? "top";

  // Posición inicial calculada para evitar parpadeos visuales
  const [coords, setCoords] = useState<{ x: number; y: number }>(() => {
    const estW = 224;
    const estH = step === "source" ? 340 : 160;
    const padding = 12;
    const gap = 12;
    let x = anchor.screenPosition.x;
    let y = anchor.screenPosition.y;

    if (side === "top") {
      x -= estW / 2;
      y = y - estH - gap < padding ? y + gap : y - estH - gap;
    } else if (side === "bottom") {
      x -= estW / 2;
      y = typeof window !== "undefined" && y + gap + estH > window.innerHeight - padding ? y - estH - gap : y + gap;
    } else if (side === "left") {
      x = x - estW - gap < padding ? x + gap : x - estW - gap;
      y -= estH / 2;
    } else {
      x = typeof window !== "undefined" && x + gap + estW > window.innerWidth - padding ? x - estW - gap : x + gap;
      y -= estH / 2;
    }

    if (typeof window !== "undefined") {
      x = Math.max(padding, Math.min(x, window.innerWidth - estW - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - estH - padding));
    }
    return { x, y };
  });

  // Medición dinámica y clamping estricto al viewport
  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const w = rect.width || 224;
    const h = rect.height || (step === "source" ? 340 : 160);
    const padding = 12;
    const gap = 12;

    const screenX = anchor.screenPosition.x;
    const screenY = anchor.screenPosition.y;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let targetX = screenX;
    let targetY = screenY;

    if (side === "top") {
      targetX = screenX - w / 2;
      targetY = screenY - h - gap;
      if (targetY < padding) {
        targetY = screenY + gap;
      }
    } else if (side === "bottom") {
      targetX = screenX - w / 2;
      targetY = screenY + gap;
      if (targetY + h > winH - padding) {
        targetY = screenY - h - gap;
      }
    } else if (side === "left") {
      targetX = screenX - w - gap;
      targetY = screenY - h / 2;
      if (targetX < padding) {
        targetX = screenX + gap;
      }
    } else if (side === "right") {
      targetX = screenX + gap;
      targetY = screenY - h / 2;
      if (targetX + w > winW - padding) {
        targetX = screenX - w - gap;
      }
    }

    const clampedX = Math.max(padding, Math.min(targetX, winW - w - padding));
    const clampedY = Math.max(padding, Math.min(targetY, winH - h - padding));

    setCoords({ x: clampedX, y: clampedY });
  }, [anchor.screenPosition.x, anchor.screenPosition.y, anchor.handleId, side, step]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose]);

  const isAnchorReserved = useAppStore((s) =>
    s.isComponentReservedByAgent(anchor.classId, "class")
  );
  useEffect(() => {
    if (isAnchorReserved) {
      onClose();
    }
  }, [isAnchorReserved, onClose]);

  const options =
    step === "source" ? SOURCE_VERTEX_OPTIONS : TARGET_CARDINALITY_OPTIONS;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={
        step === "source"
          ? "Seleccionar relación de origen"
          : "Seleccionar cardinalidad de destino"
      }
      className="fixed z-50 w-56 rounded-xl bg-[#17181d]/95 backdrop-blur-md border border-white/10 shadow-2xl p-1.5 text-white animate-in fade-in-0 zoom-in-95 pointer-events-auto select-none"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="space-y-0.5">
        {options.map((opt: VertexOptionItem) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectOption(opt)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer group"
          >
            {opt.category === "cardinality" ? (
              <span className="inline-flex w-10 h-5 items-center justify-center rounded-md bg-indigo-500/25 font-mono text-[11px] font-semibold text-indigo-300 select-none flex-shrink-0 shadow-sm">
                {opt.badge}
              </span>
            ) : (
              <span className="inline-flex w-10 h-5 items-center justify-center rounded-md bg-white/10 text-white select-none flex-shrink-0 shadow-sm">
                <StructuralHeadIcon iconType={opt.iconType} />
              </span>
            )}
            <span className="truncate">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
