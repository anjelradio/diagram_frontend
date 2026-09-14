"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import {
  RELATION_HANDLE_CONFIGS,
  type HandleSide,
} from "./relation-handles-config";

const SIDE_TO_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

type RelationHandlesProps = {
  classId: string;
};

/**
 * Renderiza los 12 handles de conexión UML distribuidos en los cuatro lados de la clase
 * (3 en top, 3 en right, 3 en bottom, 3 en left).
 * Con ConnectionMode.Loose en el lienzo, type="source" permite tanto origen como destino.
 * Los handles permanecen en el DOM con posiciones fijas para que React Flow trace las aristas,
 * pero solo se vuelven interactivos y visibles cuando la herramienta de relación está activa.
 */
export const RelationHandles = memo(function RelationHandles({
  classId,
}: RelationHandlesProps) {
  const activeTool = useAppStore((s) => s.activeTool);
  const activeRelationPreset = useAppStore((s) => s.activeRelationPreset);
  const relationDraftSource = useAppStore((s) => s.relationDraftSource);
  const canEdit = useAppStore((s) => s.canEdit);

  const isRelationMode =
    canEdit && (activeTool === "relation" || activeRelationPreset !== null);
  const isConnecting = canEdit && relationDraftSource !== null;
  const isSourceNode = canEdit && relationDraftSource?.classId === classId;

  return (
    <>
      {RELATION_HANDLE_CONFIGS.map((config) => {
        const isDraftHandle =
          isSourceNode && relationDraftSource.handle === config.id;

        return (
          <Handle
            key={config.id}
            id={config.id}
            type="source"
            position={SIDE_TO_POSITION[config.side]}
            isConnectable={isRelationMode}
            style={config.style}
            aria-label={`Punto de conexión ${config.id}`}
            className={cn(
              "!w-2.5 !h-2.5 !rounded-full !border-2 !border-[#17181d] transition-all duration-150 z-20",
              isRelationMode
                ? cn(
                    "!bg-indigo-500 hover:!bg-indigo-400 hover:!scale-150 hover:!ring-2 hover:!ring-indigo-400/50 cursor-crosshair",
                    isDraftHandle
                      ? "!bg-cyan-400 !scale-125 !ring-2 !ring-cyan-400/60"
                      : isConnecting
                        ? "opacity-90 !bg-indigo-400"
                        : "opacity-40 group-hover:opacity-100"
                  )
                : "!bg-transparent !border-transparent opacity-0 pointer-events-none"
            )}
          />
        );
      })}
    </>
  );
});
