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
 * Calcula los puntos de inicio y fin del path de la arista.
 * Con los marcadores SVG anclados en su vértice de conexión (refX alineado),
 * la arista conecta directamente hasta el borde de cada clase sin dejar ningún espacio o gap.
 */
export function calculateEndpointOffsets({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: CalculateEndpointOffsetsParams): OffsetEndpoints {
  return { sourceX, sourceY, targetX, targetY };
}
