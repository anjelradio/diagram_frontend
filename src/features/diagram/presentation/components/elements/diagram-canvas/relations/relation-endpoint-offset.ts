import { Position } from "@xyflow/react";
import type { DiagramRelationType } from "../../../../../domain/entities/diagram-relation.entity.ts";

export const RELATION_SYMBOL_SIZES = {
  DIAMOND: 18,
  TRIANGLE: 14,
  ARROW: 12,
} as const;

export type SymbolSizes = {
  sourceSize: number;
  targetSize: number;
};

/**
 * Retorna los tamaños de separación requeridos en origen y destino
 * según el tipo de relación UML.
 */
export function getSymbolSizes(relationType: DiagramRelationType): SymbolSizes {
  switch (relationType) {
    case "AGGREGATION":
    case "COMPOSITION":
      return { sourceSize: RELATION_SYMBOL_SIZES.DIAMOND, targetSize: 0 };
    case "GENERALIZATION":
    case "REALIZATION":
      return { sourceSize: 0, targetSize: RELATION_SYMBOL_SIZES.TRIANGLE };
    case "DEPENDENCY":
      return { sourceSize: 0, targetSize: RELATION_SYMBOL_SIZES.ARROW };
    case "ASSOCIATION":
    default:
      return { sourceSize: 0, targetSize: 0 };
  }
}

export type CalculateEndpointOffsetsParams = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  relationType: DiagramRelationType;
};

export type OffsetEndpoints = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

/**
 * Retorna el vector unitario normal hacia el exterior del nodo según el lado del handle.
 */
function getDirectionVector(pos: Position): { dx: number; dy: number } {
  switch (pos) {
    case Position.Top:
      return { dx: 0, dy: -1 };
    case Position.Bottom:
      return { dx: 0, dy: 1 };
    case Position.Left:
      return { dx: -1, dy: 0 };
    case Position.Right:
      return { dx: 1, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

/**
 * Calcula los puntos de inicio y fin del path de la arista desplazándolos
 * hacia el exterior de las tarjetas para alojar los símbolos UML (rombos, triángulos, flechas)
 * sin que queden cubiertos por los nodos ni que la línea atraviese el interior del símbolo.
 */
export function calculateEndpointOffsets({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  relationType,
}: CalculateEndpointOffsetsParams): OffsetEndpoints {
  const { sourceSize, targetSize } = getSymbolSizes(relationType);

  if (sourceSize === 0 && targetSize === 0) {
    return { sourceX, sourceY, targetX, targetY };
  }

  const dist = Math.hypot(targetX - sourceX, targetY - sourceY);
  const totalRequired = sourceSize + targetSize;

  // Si los nodos están muy próximos, atenuar suavemente para no cruzar o invertir el path
  const scale =
    dist < totalRequired * 1.5
      ? Math.max(0, Math.min(1, (dist - 4) / totalRequired))
      : 1;

  const effSourceSize = sourceSize * scale;
  const effTargetSize = targetSize * scale;

  const srcDir = getDirectionVector(sourcePosition);
  const tgtDir = getDirectionVector(targetPosition);

  return {
    sourceX: sourceX + effSourceSize * srcDir.dx,
    sourceY: sourceY + effSourceSize * srcDir.dy,
    targetX: targetX + effTargetSize * tgtDir.dx,
    targetY: targetY + effTargetSize * tgtDir.dy,
  };
}
