import { Position } from "@xyflow/react";
import type { DiagramRelationHandle } from "@/features/diagram/domain/entities/diagram-relation.entity";

export type HandlePoint = {
  x: number;
  y: number;
  position: Position;
};

export type MinimalNodeGeometry = {
  internals?: {
    positionAbsolute?: { x: number; y: number };
  };
  position?: { x: number; y: number };
  measured?: {
    width?: number;
    height?: number;
  };
  width?: number;
  height?: number;
};

export const DEFAULT_CLASS_NODE_WIDTH = 236;
export const DEFAULT_CLASS_NODE_HEIGHT = 120;

/**
 * Retorna las coordenadas exactas de anclaje (en el perímetro exterior del nodo)
 * para un handle UML específico, garantizando:
 * 1. Gap 0: La arista conecta directamente hasta el borde perimetral de la tarjeta.
 * 2. Inmunidad a renders y zoom: No depende de getBoundingClientRect() de los handles DOM.
 * 3. Estabilidad: La creación o alteración de otras relaciones no desplaza las aristas existentes.
 */
export function getHandlePoint(
  node?: MinimalNodeGeometry | null,
  handleId?: DiagramRelationHandle
): HandlePoint {
  if (!node) {
    return { x: 0, y: 0, position: Position.Top };
  }

  const x = node.internals?.positionAbsolute?.x ?? node.position?.x ?? 0;
  const y = node.internals?.positionAbsolute?.y ?? node.position?.y ?? 0;
  const width = node.measured?.width ?? node.width ?? DEFAULT_CLASS_NODE_WIDTH;
  const height = node.measured?.height ?? node.height ?? DEFAULT_CLASS_NODE_HEIGHT;

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
