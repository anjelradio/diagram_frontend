"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { DiagramRelation } from "@/features/diagram/domain/entities/diagram-relation.entity";
import {
  getCardinalityLabels,
  getRelationEdgeVisuals,
  shouldRenderRelationName,
} from "./diagram-relation-edge.utils";
import { getSelfLoopPath } from "./relation-path-utils";
import { RelationNameEditor } from "./relation-name-editor";
import { getHandlePoint } from "./relation-handle-geometry";
import { AgentReservationIndicator } from "@/features/realtime/presentation/components/elements/agent-reservation-indicator";

function getCardinalityOffset(pos: Position) {
  switch (pos) {
    case Position.Top:
      return { x: 0, y: -14 };
    case Position.Bottom:
      return { x: 0, y: 14 };
    case Position.Left:
      return { x: -18, y: 0 };
    case Position.Right:
      return { x: 18, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export type DiagramRelationEdgeData = {
  relation: DiagramRelation;
};

export const DiagramRelationEdge = memo(function DiagramRelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
}: EdgeProps) {
  const relation = (data as DiagramRelationEdgeData | undefined)?.relation;
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);
  const effectiveReservation = useAppStore((s) =>
    relation ? s.getEffectiveComponentReservation(relation.id, "relation") : null
  );

  const isSelf = relation ? relation.source.classId === relation.target.classId : false;

  const sourceNode = useInternalNode(relation?.source.classId ?? "");
  const targetNode = useInternalNode(relation?.target.classId ?? "");

  const sourcePoint = sourceNode && relation
    ? getHandlePoint(sourceNode, relation.source.handle)
    : null;
  const targetPoint = targetNode && relation
    ? getHandlePoint(targetNode, relation.target.handle)
    : null;

  const effSourceX = sourcePoint ? sourcePoint.x : sourceX;
  const effSourceY = sourcePoint ? sourcePoint.y : sourceY;
  const effSourcePosition = sourcePoint ? sourcePoint.position : sourcePosition;

  const effTargetX = targetPoint ? targetPoint.x : targetX;
  const effTargetY = targetPoint ? targetPoint.y : targetY;
  const effTargetPosition = targetPoint ? targetPoint.position : targetPosition;

  const [edgePath, labelX, labelY] = isSelf
    ? getSelfLoopPath({
        sourceX: effSourceX,
        sourceY: effSourceY,
        sourcePosition: effSourcePosition,
        targetX: effTargetX,
        targetY: effTargetY,
        targetPosition: effTargetPosition,
      })
    : getSmoothStepPath({
        sourceX: effSourceX,
        sourceY: effSourceY,
        sourcePosition: effSourcePosition,
        targetX: effTargetX,
        targetY: effTargetY,
        targetPosition: effTargetPosition,
        borderRadius: 8,
      });

  if (!relation) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
      />
    );
  }

  const isSelected = !!selected;
  const visuals = getRelationEdgeVisuals(relation.relationType, isSelected);
  const cardinalities = getCardinalityLabels(relation);

  const srcOffset = getCardinalityOffset(effSourcePosition);
  const tgtOffset = getCardinalityOffset(effTargetPosition);

  const srcLabelPos = {
    x: effSourceX + srcOffset.x,
    y: effSourceY + srcOffset.y,
  };

  const tgtLabelPos = {
    x: effTargetX + tgtOffset.x,
    y: effTargetY + tgtOffset.y,
  };

  const handleSelectRelation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRelationId(relation.id);
  };

  return (
    <>
      {/* Línea interactiva invisible más ancha para facilitar el clic */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={handleSelectRelation}
      />

      {/* Arista visible con marcadores UML */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: isSelected
            ? visuals.stroke
            : effectiveReservation?.activityType === "edit"
              ? "#a855f7"
              : effectiveReservation?.activityType === "query"
                ? "#38bdf8"
                : visuals.stroke,
          strokeWidth: effectiveReservation ? visuals.strokeWidth + 0.5 : visuals.strokeWidth,
          strokeDasharray: visuals.strokeDasharray,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
        markerStart={visuals.markerStart}
        markerEnd={visuals.markerEnd}
        interactionWidth={0}
      />

      <EdgeLabelRenderer>
        {/* Señal visual de reserva del agente */}
        {effectiveReservation?.isReserved && effectiveReservation.activityType && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 24}px)`,
              pointerEvents: "none",
            }}
          >
            <AgentReservationIndicator activityType={effectiveReservation.activityType} />
          </div>
        )}

        {/* Cardinalidad en origen */}
        {cardinalities.source && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${srcLabelPos.x}px,${srcLabelPos.y}px)`,
              pointerEvents: "none",
            }}
            className="text-[10px] font-mono font-medium text-slate-300 bg-[#17181d]/95 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm backdrop-blur-sm select-none"
          >
            {cardinalities.source}
          </div>
        )}

        {/* Cardinalidad en destino */}
        {cardinalities.target && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${tgtLabelPos.x}px,${tgtLabelPos.y}px)`,
              pointerEvents: "none",
            }}
            className="text-[10px] font-mono font-medium text-slate-300 bg-[#17181d]/95 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm backdrop-blur-sm select-none"
          >
            {cardinalities.target}
          </div>
        )}

        {/* Nombre central de la relación con soporte de renombrado inline (solo ASSOCIATION) */}
        {shouldRenderRelationName(relation.relationType) && (
          <RelationNameEditor
            relationId={relation.id}
            name={relation.name}
            isSelected={isSelected}
            labelX={labelX}
            labelY={labelY}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});
