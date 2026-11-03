"use client";

import { memo, useMemo } from "react";
import { getSmoothStepPath, Position } from "@xyflow/react";
import type {
  DiagramCardinality,
  DiagramRelationHandle,
  DiagramRelationType,
} from "@/features/diagram/domain/entities/diagram-relation.entity";
import { getHandleConfig } from "../diagram-class-node/relation-handles-config";
import { formatCardinalityLabel } from "./diagram-relation-edge.utils";

export interface RelationRubberbandOverlayProps {
  sourcePoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
  relationType: DiagramRelationType | null;
  sourceCardinality: DiagramCardinality | null;
  sourceHandle?: DiagramRelationHandle;
}

/**
 * Overlay SVG interactivo que proyecta una línea elástica ortogonal continua a 60 FPS
 * entre el vértice de origen y el cursor del mouse dentro del lienzo de React Flow.
 */
export const RelationRubberbandOverlay = memo(function RelationRubberbandOverlay({
  sourcePoint,
  currentPoint,
  relationType,
  sourceCardinality,
  sourceHandle,
}: RelationRubberbandOverlayProps) {
  const dx = currentPoint.x - sourcePoint.x;
  const dy = currentPoint.y - sourcePoint.y;

  // Determinar la orientación del vértice de origen
  const handleConfig = useMemo(
    () => (sourceHandle ? getHandleConfig(sourceHandle) : undefined),
    [sourceHandle]
  );

  const srcPosition: Position = useMemo(() => {
    if (handleConfig) {
      switch (handleConfig.side) {
        case "top":
          return Position.Top;
        case "bottom":
          return Position.Bottom;
        case "left":
          return Position.Left;
        case "right":
          return Position.Right;
      }
    }
    return Math.abs(dx) >= Math.abs(dy)
      ? dx >= 0
        ? Position.Right
        : Position.Left
      : dy >= 0
        ? Position.Bottom
        : Position.Top;
  }, [handleConfig, dx, dy]);

  // Determinar la aproximación ortogonal al cursor
  const tgtPosition: Position = useMemo(() => {
    if (srcPosition === Position.Top || srcPosition === Position.Bottom) {
      if (Math.abs(dx) > 16) {
        return dx > 0 ? Position.Left : Position.Right;
      }
      return dy >= 0 ? Position.Top : Position.Bottom;
    }
    if (Math.abs(dy) > 16) {
      return dy > 0 ? Position.Top : Position.Bottom;
    }
    return dx >= 0 ? Position.Left : Position.Right;
  }, [srcPosition, dx, dy]);

  // Generar trayectoria ortogonal con esquinas redondeadas suaves
  const [edgePath] = useMemo(() => {
    return getSmoothStepPath({
      sourceX: sourcePoint.x,
      sourceY: sourcePoint.y,
      sourcePosition: srcPosition,
      targetX: currentPoint.x,
      targetY: currentPoint.y,
      targetPosition: tgtPosition,
      borderRadius: 12,
    });
  }, [sourcePoint, currentPoint, srcPosition, tgtPosition]);

  // Ángulo de orientación de marcadores en origen y destino
  const srcAngleDeg = useMemo(() => {
    switch (srcPosition) {
      case Position.Top:
        return -90;
      case Position.Bottom:
        return 90;
      case Position.Left:
        return 180;
      case Position.Right:
        return 0;
    }
  }, [srcPosition]);

  const tgtAngleDeg = useMemo(() => {
    switch (tgtPosition) {
      case Position.Left:
        return 0;
      case Position.Right:
        return 180;
      case Position.Top:
        return 90;
      case Position.Bottom:
        return -90;
    }
  }, [tgtPosition]);

  const isDashed =
    relationType === "DEPENDENCY" || relationType === "REALIZATION";

  // Posición del badge cerca del origen según el lado de salida
  const { badgeOffsetX, badgeOffsetY } = useMemo(() => {
    switch (srcPosition) {
      case Position.Top:
        return { badgeOffsetX: 0, badgeOffsetY: -24 };
      case Position.Bottom:
        return { badgeOffsetX: 0, badgeOffsetY: 24 };
      case Position.Left:
        return { badgeOffsetX: -28, badgeOffsetY: -12 };
      case Position.Right:
        return { badgeOffsetX: 28, badgeOffsetY: -12 };
    }
  }, [srcPosition]);

  const formattedCardinality = formatCardinalityLabel(sourceCardinality);

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-30"
      aria-hidden="true"
    >
      <defs>
        <filter id="rubberband-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#818cf8" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Línea principal elástica ortogonal */}
      <path
        d={edgePath}
        fill="none"
        stroke="#818cf8"
        strokeWidth={2}
        strokeDasharray={isDashed ? "6,4" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#rubberband-glow)"
      />

      {/* Marcador en origen: Composición (rombo relleno) */}
      {relationType === "COMPOSITION" && (
        <g transform={`translate(${sourcePoint.x}, ${sourcePoint.y}) rotate(${srcAngleDeg})`}>
          <polygon
            points="0,0 8,-5 16,0 8,5"
            fill="#818cf8"
            stroke="#818cf8"
            strokeWidth={1.5}
          />
        </g>
      )}

      {/* Marcador en origen: Agregación (rombo vacío) */}
      {relationType === "AGGREGATION" && (
        <g transform={`translate(${sourcePoint.x}, ${sourcePoint.y}) rotate(${srcAngleDeg})`}>
          <polygon
            points="0,0 8,-5 16,0 8,5"
            fill="#191a1d"
            stroke="#818cf8"
            strokeWidth={1.75}
          />
        </g>
      )}

      {/* Marcador en destino: Generalización / Herencia (flecha triangular hueca) */}
      {relationType === "GENERALIZATION" && (
        <g transform={`translate(${currentPoint.x}, ${currentPoint.y}) rotate(${tgtAngleDeg})`}>
          <polygon
            points="0,0 -14,-7 -14,7"
            fill="#191a1d"
            stroke="#818cf8"
            strokeWidth={2}
          />
        </g>
      )}

      {/* Marcador en destino: Realización (flecha triangular discontinua) */}
      {relationType === "REALIZATION" && (
        <g transform={`translate(${currentPoint.x}, ${currentPoint.y}) rotate(${tgtAngleDeg})`}>
          <polygon
            points="0,0 -14,-7 -14,7"
            fill="#191a1d"
            stroke="#818cf8"
            strokeWidth={2}
            strokeDasharray="3,2"
          />
        </g>
      )}

      {/* Marcador en destino: Dependencia (flecha abierta) */}
      {relationType === "DEPENDENCY" && (
        <g transform={`translate(${currentPoint.x}, ${currentPoint.y}) rotate(${tgtAngleDeg})`}>
          <polyline
            points="-12,-6 0,0 -12,6"
            fill="none"
            stroke="#818cf8"
            strokeWidth={2}
          />
        </g>
      )}

      {/* Badge de cardinalidad de origen neutro y uniforme */}
      {formattedCardinality && (
        <g transform={`translate(${sourcePoint.x + badgeOffsetX}, ${sourcePoint.y + badgeOffsetY})`}>
          <rect
            x={-19}
            y={-10}
            width={38}
            height={20}
            rx={4}
            fill="#17181d"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
            className="shadow-sm"
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={11}
            fontWeight="500"
            fontFamily="monospace"
          >
            {formattedCardinality}
          </text>
        </g>
      )}

      {/* Punto guía en la posición del cursor */}
      <circle
        cx={currentPoint.x}
        cy={currentPoint.y}
        r={3.5}
        fill="#818cf8"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    </svg>
  );
});
