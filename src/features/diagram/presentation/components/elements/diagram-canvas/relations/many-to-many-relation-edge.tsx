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
import { getCardinalityLabels, getRelationEdgeVisuals, shouldRenderRelationName } from "./diagram-relation-edge.utils";
import { getSelfLoopPath } from "./relation-path-utils";
import { RelationNameEditor } from "./relation-name-editor";
import { getHandlePoint } from "./relation-handle-geometry";

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

export type ManyToManyEdgeData = {
  relation: DiagramRelation;
  bridgeClassId?: string;
  bridgeHandle?: DiagramRelationHandle;
};

export const ManyToManyRelationEdge = memo(function ManyToManyRelationEdge({
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
  const edgeData = data as ManyToManyEdgeData | undefined;
  const relation = edgeData?.relation;
  const isSelf = relation ? relation.source.classId === relation.target.classId : false;
  const bridgeClassId =
    edgeData?.bridgeClassId || relation?.bridge?.classId || "";
  const bridgeHandle =
    edgeData?.bridgeHandle || relation?.bridge?.handle || "TOP_CENTER";

  const sourceNode = useInternalNode(relation?.source.classId ?? "");
  const targetNode = useInternalNode(relation?.target.classId ?? "");
  const bridgeNode = useInternalNode(bridgeClassId);
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);

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

  // 1. Camino principal entre Source y Target (Loop si es reflexivo o SmoothStep si es normal)
  const [mainPath, centerX, centerY] = isSelf
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
          strokeLinecap="round"
          strokeLinejoin="round"
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
            className="text-[10px] font-medium text-slate-300 bg-[#1b1c22]/95 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm backdrop-blur-sm select-none"
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
            className="text-[10px] font-medium text-slate-300 bg-[#1b1c22]/95 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm backdrop-blur-sm select-none"
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
