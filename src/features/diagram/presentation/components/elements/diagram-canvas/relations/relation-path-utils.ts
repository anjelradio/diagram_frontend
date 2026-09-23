import { Position } from "@xyflow/react";

export type SelfLoopPathParams = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  offset?: number;
};

/**
 * Obtiene el vector unitario de dirección según la posición del handle de React Flow.
 */
function getPositionDirection(pos: Position): { dx: number; dy: number } {
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
      return { dx: 1, dy: 0 };
  }
}

/**
 * Calcula la trayectoria SVG y coordenadas del label para una relación auto-referenciada (bucle / loop).
 */
export function getSelfLoopPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  offset = 60,
}: SelfLoopPathParams): [path: string, labelX: number, labelY: number] {
  const dir1 = getPositionDirection(sourcePosition);
  const dir2 = getPositionDirection(targetPosition);

  // Si ambos extremos apuntan en la misma dirección
  let cp1x = sourceX + dir1.dx * offset;
  let cp1y = sourceY + dir1.dy * offset;
  let cp2x = targetX + dir2.dx * offset;
  let cp2y = targetY + dir2.dy * offset;

  // Si están en lados opuestos (ej. Top y Bottom o Left y Right), se desvían lateralmente
  if (dir1.dx === -dir2.dx && dir1.dy === -dir2.dy) {
    if (dir1.dx === 0) {
      // Vertical opuesto: desviar hacia la derecha
      cp1x += offset;
      cp2x += offset;
    } else {
      // Horizontal opuesto: desviar hacia abajo
      cp1y += offset;
      cp2y += offset;
    }
  }

  const path = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;

  // Punto central en la curva Bezier cúbica (t = 0.5)
  // B(0.5) = 0.125*P0 + 0.375*P1 + 0.375*P2 + 0.125*P3
  const labelX =
    0.125 * sourceX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * targetX;
  const labelY =
    0.125 * sourceY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * targetY;

  return [path, labelX, labelY];
}
