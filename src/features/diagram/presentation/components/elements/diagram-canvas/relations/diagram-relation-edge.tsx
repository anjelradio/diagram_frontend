"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { DiagramRelation } from "@/features/diagram/domain/entities/diagram-relation.entity";
import {
  getCardinalityLabels,
  getRelationEdgeVisuals,
  shouldRenderRelationName,
} from "./diagram-relation-edge.utils";
import { calculateEndpointOffsets } from "./relation-endpoint-offset";
import { RelationNameEditor } from "./relation-name-editor";

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

  const {
    sourceX: effSourceX,
    sourceY: effSourceY,
    targetX: effTargetX,
    targetY: effTargetY,
  } = relation
    ? calculateEndpointOffsets({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        relationType: relation.relationType,
      })
    : { sourceX, sourceY, targetX, targetY };

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: effSourceX,
    sourceY: effSourceY,
    sourcePosition,
    targetX: effTargetX,
    targetY: effTargetY,
    targetPosition,
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

  const srcOffset = getCardinalityOffset(sourcePosition);
  const tgtOffset = getCardinalityOffset(targetPosition);

  const srcLabelPos = {
    x: sourceX + srcOffset.x,
    y: sourceY + srcOffset.y,
  };

  const tgtLabelPos = {
    x: targetX + tgtOffset.x,
    y: targetY + tgtOffset.y,
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
          stroke: visuals.stroke,
          strokeWidth: visuals.strokeWidth,
          strokeDasharray: visuals.strokeDasharray,
        }}
        markerStart={visuals.markerStart}
        markerEnd={visuals.markerEnd}
        interactionWidth={0}
      />

      <EdgeLabelRenderer>
        {/* Cardinalidad en origen */}
        {cardinalities.source && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${srcLabelPos.x}px,${srcLabelPos.y}px)`,
              pointerEvents: "none",
            }}
            className="text-[10.5px] font-mono font-medium text-slate-300 bg-[#1e1f23]/90 px-1.5 py-0.5 rounded border border-white/10 shadow-sm backdrop-blur-sm select-none"
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
            className="text-[10.5px] font-mono font-medium text-slate-300 bg-[#1e1f23]/90 px-1.5 py-0.5 rounded border border-white/10 shadow-sm backdrop-blur-sm select-none"
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
