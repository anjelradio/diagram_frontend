"use client";

import { memo } from "react";

/**
 * Define los marcadores SVG para las cabeceras de flechas, triángulos y rombos UML.
 * Normalizados con markerUnits="userSpaceOnUse", overflow="visible",
 * dimensiones coherentes con relation-endpoint-offset y variantes normal/seleccionada.
 */
export const UmlRelationMarkers = memo(function UmlRelationMarkers() {
  return (
    <svg
      className="absolute w-0 h-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <defs>
        {/* Rombo vacío de Agregación (en origen, longitud 18px) */}
        <marker
          id="aggregation-diamond"
          viewBox="0 0 18 10"
          refX="0"
          refY="5"
          markerWidth="18"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
          overflow="visible"
        >
          <polygon
            points="0,5 9,1 18,5 9,9"
            fill="#212224"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="aggregation-diamond-selected"
          viewBox="0 0 18 10"
          refX="0"
          refY="5"
          markerWidth="18"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
          overflow="visible"
        >
          <polygon
            points="0,5 9,1 18,5 9,9"
            fill="#212224"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </marker>

        {/* Rombo lleno de Composición (en origen, longitud 18px) */}
        <marker
          id="composition-diamond"
          viewBox="0 0 18 10"
          refX="0"
          refY="5"
          markerWidth="18"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
          overflow="visible"
        >
          <polygon
            points="0,5 9,1 18,5 9,9"
            fill="#94a3b8"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="composition-diamond-selected"
          viewBox="0 0 18 10"
          refX="0"
          refY="5"
          markerWidth="18"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
          overflow="visible"
        >
          <polygon
            points="0,5 9,1 18,5 9,9"
            fill="#818cf8"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </marker>

        {/* Triángulo hueco de Generalización (en destino, longitud 14px) */}
        <marker
          id="generalization-triangle"
          viewBox="0 0 14 14"
          refX="0"
          refY="7"
          markerWidth="14"
          markerHeight="14"
          markerUnits="userSpaceOnUse"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="0,1 14,7 0,13"
            fill="#212224"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="generalization-triangle-selected"
          viewBox="0 0 14 14"
          refX="0"
          refY="7"
          markerWidth="14"
          markerHeight="14"
          markerUnits="userSpaceOnUse"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="0,1 14,7 0,13"
            fill="#212224"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </marker>

        {/* Triángulo hueco de Realización (en destino, longitud 14px) */}
        <marker
          id="realization-triangle"
          viewBox="0 0 14 14"
          refX="0"
          refY="7"
          markerWidth="14"
          markerHeight="14"
          markerUnits="userSpaceOnUse"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="0,1 14,7 0,13"
            fill="#212224"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="realization-triangle-selected"
          viewBox="0 0 14 14"
          refX="0"
          refY="7"
          markerWidth="14"
          markerHeight="14"
          markerUnits="userSpaceOnUse"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="0,1 14,7 0,13"
            fill="#212224"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </marker>

        {/* Flecha abierta de Dependencia (en destino, longitud 12px) */}
        <marker
          id="dependency-arrow"
          viewBox="0 0 12 12"
          refX="0"
          refY="6"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto"
          overflow="visible"
        >
          <polyline
            points="1,1 11,6 1,11"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="dependency-arrow-selected"
          viewBox="0 0 12 12"
          refX="0"
          refY="6"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto"
          overflow="visible"
        >
          <polyline
            points="1,1 11,6 1,11"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  );
});
