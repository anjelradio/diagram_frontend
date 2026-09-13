import type { CoordinateExtent } from "@xyflow/react";

/**
 * Configuración global centralizada para el lienzo de diagramas (React Flow).
 * 
 * Permite ajustar de forma declarativa y tipada todos los límites de navegación,
 * escala de zoom, cuadrícula de fondo, sincronización de shaders y atajos de teclado.
 */
export const PROJECT_CANVAS_CONFIG = {
  /**
   * Límites y pasos de nivel de zoom.
   * 0.50 = 50% de escala mínima.
   * 1.50 = 150% de escala máxima.
   */
  zoom: {
    min: 0.5,
    max: 1.5,
    default: 0.5,
    step: 0.1,
  },

  /**
   * Parámetros de la cuadrícula de puntos (Dot Grid).
   * Sincronizados entre React Flow y la capa de efecto de iluminación por cursor.
   */
  grid: {
    gap: 24,
    size: 1.25,
    color: "rgba(255, 255, 255, 0.12)",
    bgColor: "#212224",
  },

  /**
   * Límites del lienzo (delimitado, no infinito) para evitar que el usuario se pierda.
   * translateExtent delimita el área visible de navegación del viewport.
   * nodeExtent delimita el área donde pueden situarse y arrastrarse las clases.
   */
  extent: {
    translate: [
      [-2560, -2016],
      [2560, 2016],
    ] as CoordinateExtent,
    node: [
      [-2400, -1856],
      [2400, 1856],
    ] as CoordinateExtent,
  },

  /**
   * Posición y zoom iniciales al montar el lienzo.
   */
  viewport: {
    default: { x: 0, y: 0, zoom: 0.5 },
  },

  /**
   * Atajos y modificadores para control del lienzo.
   */
  shortcuts: {
    zoomActivationKeyCode: ["Control", "Meta"] as const,
  },

  /**
   * Comportamiento de la rueda del mouse y navegación.
   * Cuando se usa solo la rueda (sin Control/Meta), la vista se desplaza verticalmente de forma suave.
   * Cuando se mantiene pulsado Control o Meta, la rueda efectúa zoom.
   */
  navigation: {
    panOnScroll: true,
    panOnScrollMode: "free" as const,
    panOnScrollSpeed: 0.65,
  },
} as const;

export type ProjectCanvasConfig = typeof PROJECT_CANVAS_CONFIG;
