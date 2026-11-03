"use client";

import { memo } from "react";
import { Handle, Position, useReactFlow, useStore } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { DiagramRelationHandle } from "@/features/diagram/domain/entities/diagram-relation.entity";
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
 * En el modo interactivo de relaciones (`activeTool === 'relation'`), cada handle captura
 * el evento de clic para desplegar el popover contextual de opciones o completar la conexión.
 */
export const RelationHandles = memo(function RelationHandles({
  classId,
}: RelationHandlesProps) {
  const { screenToFlowPosition } = useReactFlow();
  const activeTool = useAppStore((s) => s.activeTool);
  const canEdit = useAppStore((s) => s.canEdit);
  const relationDraft = useAppStore((s) => s.relationDraft);
  const openVertexMenu = useAppStore((s) => s.openVertexMenu);
  const completeStructuralRelation = useAppStore(
    (s) => s.completeStructuralRelation
  );

  const isRelationMode = canEdit && activeTool === "relation";
  const sourceAnchor = relationDraft?.source;
  const isSourceNode = sourceAnchor?.classId === classId;
  const isTracking = relationDraft?.phase === "tracking_cursor";

  // Compensa el zoom del lienzo para conservar el tamaño visual exacto en pantalla (zoom-invariant)
  const zoom = useStore((s) => s.transform[2]) || 1;
  const zoomScale = zoom > 0 ? 1 / zoom : 1;

  const handleHandleClick = (
    e: React.MouseEvent,
    handleId: DiagramRelationHandle
  ) => {
    if (!isRelationMode) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const screenPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const flowPosition = screenToFlowPosition(screenPosition);

    const draft = useAppStore.getState().relationDraft;

    // Paso 1: Vértice de origen (primer clic)
    if (
      !draft ||
      draft.phase === "idle" ||
      draft.phase === "source_popover_open"
    ) {
      openVertexMenu({
        classId,
        handleId,
        step: "source",
        screenPosition,
        flowPosition,
      });
      return;
    }

    // Paso 2: Vértice de destino tras trazado elástico
    if (draft.phase === "tracking_cursor") {
      // Edge Case: Clic en el mismo vértice de origen cancela el borrador
      if (
        draft.source?.classId === classId &&
        draft.source?.handle === handleId
      ) {
        useAppStore.getState().cancelRelationCreation();
        return;
      }

      // Relación asociativa -> Menú de cardinalidad de destino
      if (draft.selectedRelationType === "ASSOCIATION") {

        openVertexMenu({
          classId,
          handleId,
          step: "target",
          screenPosition,
          flowPosition,
        });
        return;
      }

      // Relación estructural con cabeza -> Conexión directa
      if (draft.selectedRelationType) {
        if (draft.source?.classId === classId) {
          appToast.info(
            "Las relaciones recursivas solo están permitidas para asociaciones"
          );
          return;
        }
        void completeStructuralRelation(classId, handleId);
      }
    }
  };

  return (
    <>
      {RELATION_HANDLE_CONFIGS.map((config) => {
        const isSelectedSource =
          isSourceNode && sourceAnchor?.handle === config.id;

        return (
          <Handle
            key={config.id}
            id={config.id}
            type="source"
            position={SIDE_TO_POSITION[config.side]}
            isConnectable={false}
            style={config.style}
            aria-label={`Punto de conexión ${config.id}`}
            onPointerDown={(e) => {
              if (isRelationMode) {
                e.stopPropagation();
              }
            }}
            onMouseDown={(e) => {
              if (isRelationMode) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => handleHandleClick(e, config.id)}
            className={cn(
              "nodrag nopan !w-4 !h-4 !rounded-full !border-0 !bg-transparent z-30 flex items-center justify-center",
              isRelationMode
                ? cn(
                    "!pointer-events-auto cursor-crosshair",
                    "before:absolute before:-inset-3 before:content-[''] before:z-10"
                  )
                : "!bg-transparent !border-transparent opacity-0 !pointer-events-none"
            )}
          >
            {/* Indicador visual zoom-invariant con tamaño aumentado un 25% (18px) */}
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: "center center",
              }}
              className={cn(
                "w-[18px] h-[18px] rounded-full border-2 border-[#17181d] transition-[background-color,border-color,box-shadow,opacity] duration-150 pointer-events-none",
                isRelationMode
                  ? cn(
                      isSelectedSource
                        ? "bg-cyan-400 ring-2 ring-cyan-400/60"
                        : isTracking
                          ? "bg-indigo-400 opacity-90 hover:bg-indigo-300 hover:ring-2 hover:ring-indigo-300/60"
                          : "bg-indigo-500 opacity-60 group-hover:opacity-100 hover:opacity-100 hover:bg-indigo-400 hover:ring-2 hover:ring-indigo-400/50"
                    )
                  : "bg-transparent border-transparent opacity-0"
              )}
            />
          </Handle>
        );
      })}
    </>
  );
});

