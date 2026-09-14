"use client";

import { memo } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type {
  DiagramRelation,
  DiagramRelationHandle,
} from "@/features/diagram/domain/entities/diagram-relation.entity";
import {
  getCardinalityLabels,
  getRelationEdgeVisuals,
  shouldRenderRelationName,
} from "./diagram-relation-edge.utils";
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

function getHandlePoint(
  node: {
    internals: { positionAbsolute: { x: number; y: number } };
    measured?: { width?: number; height?: number };
  },
  handleId?: DiagramRelationHandle
) {
  const x = node.internals.positionAbsolute.x;
  const y = node.internals.positionAbsolute.y;
  const width = node.measured?.width ?? 220;
  const height = node.measured?.height ?? 100;

  switch (handleId) {
    case "TOP_LEFT":
      return { x: x + width * 0.25, y, position: Position.Top };
    case "TOP_CENTER":
      return { x: x + width * 0.5, y, position: Position.Top };
    case "TOP_RIGHT":
      return { x: x + width * 0.75, y, position: Position.Top };
    case "RIGHT_TOP":
      return { x: x + width, y: y + height * 0.25, position: Position.Right };
    case "RIGHT_CENTER":
      return { x: x + width, y: y + height * 0.5, position: Position.Right };
    case "RIGHT_BOTTOM":
      return { x: x + width, y: y + height * 0.75, position: Position.Right };
    case "BOTTOM_RIGHT":
      return { x: x + width * 0.75, y: y + height, position: Position.Bottom };
    case "BOTTOM_CENTER":
      return { x: x + width * 0.5, y: y + height, position: Position.Bottom };
    case "BOTTOM_LEFT":
      return { x: x + width * 0.25, y: y + height, position: Position.Bottom };
    case "LEFT_BOTTOM":
      return { x, y: y + height * 0.75, position: Position.Left };
    case "LEFT_CENTER":
      return { x, y: y + height * 0.5, position: Position.Left };
    case "LEFT_TOP":
      return { x, y: y + height * 0.25, position: Position.Left };
    default:
      return { x: x + width * 0.5, y, position: Position.Top };
  }
}

export type ManyToManyEdgeData = {
  relation: DiagramRelation;
  bridgeClassId?: string;
  bridgeHandle?: DiagramRelationHandle;
};

export const ManyToManyRelationEdge = memo(function ManyToManyRelationEdge({
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
  const edgeData = data as ManyToManyEdgeData | undefined;
  const relation = edgeData?.relation;
  const bridgeClassId =
    edgeData?.bridgeClassId || relation?.bridge?.classId || "";
  const bridgeHandle =
    edgeData?.bridgeHandle || relation?.bridge?.handle || "TOP_CENTER";

  const bridgeNode = useInternalNode(bridgeClassId);
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);

  // 1. Camino principal entre Source y Target
  const [mainPath, centerX, centerY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // 2. Rama perpendicular hacia la clase puente (formando la T)
  let branchPath = "";
  if (bridgeNode) {
    const bridgePoint = getHandlePoint(bridgeNode, bridgeHandle);
    const branchSourcePosition =
      centerY < bridgePoint.y ? Position.Bottom : Position.Top;

    const [branch] = getSmoothStepPath({
      sourceX: centerX,
      sourceY: centerY,
      sourcePosition: branchSourcePosition,
      targetX: bridgePoint.x,
      targetY: bridgePoint.y,
      targetPosition: bridgePoint.position,
      borderRadius: 8,
    });
    branchPath = branch;
  }

  if (!relation) {
    return (
      <path
        d={mainPath}
        fill="none"
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
      {/* Líneas interactivas invisibles más anchas para facilitar el clic */}
      <path
        d={mainPath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={handleSelectRelation}
      />
      {branchPath && (
        <path
          d={branchPath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="cursor-pointer"
          onClick={handleSelectRelation}
        />
      )}

      {/* Trazo visible principal (Origen <-> Destino) */}
      <path
        d={mainPath}
        fill="none"
        stroke={visuals.stroke}
        strokeWidth={visuals.strokeWidth}
        style={style}
        className="transition-colors pointer-events-none"
      />

      {/* Trazo visible en T (Centro <-> Clase Puente) */}
      {branchPath && (
        <path
          d={branchPath}
          fill="none"
          stroke={visuals.stroke}
          strokeWidth={visuals.strokeWidth}
          style={style}
          className="transition-colors pointer-events-none"
        />
      )}

      {/* Punto de unión en el centro de la T */}
      <circle
        cx={centerX}
        cy={centerY}
        r={visuals.strokeWidth + 1}
        fill={visuals.stroke}
        className="pointer-events-none"
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
            className="text-[10.5px] font-mono font-medium text-indigo-300 bg-[#1e1f23]/90 px-1.5 py-0.5 rounded border border-indigo-500/20 shadow-sm backdrop-blur-sm select-none"
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
            className="text-[10.5px] font-mono font-medium text-indigo-300 bg-[#1e1f23]/90 px-1.5 py-0.5 rounded border border-indigo-500/20 shadow-sm backdrop-blur-sm select-none"
          >
            {cardinalities.target}
          </div>
        )}

        {/* Nombre central de la relación N:M con soporte de renombrado inline */}
        {shouldRenderRelationName(relation.relationType) && (
          <RelationNameEditor
            relationId={relation.id}
            name={relation.name}
            isSelected={isSelected}
            labelX={centerX}
            labelY={centerY}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
});
