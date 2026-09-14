import type {
  DiagramRelation,
  DiagramRelationType,
} from "../../../../../domain/entities/diagram-relation.entity.ts";

export type RelationEdgeVisuals = {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  markerStart?: string;
  markerEnd?: string;
};

export type CardinalityLabels = {
  source: string | null;
  target: string | null;
};

export type DiagramFlowEdge = {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  type: "diagramRelation" | "manyToManyRelation";
  selected: boolean;
  data: {
    relation: DiagramRelation;
    bridgeClassId?: string;
    bridgeHandle?: string;
  };
};

/**
 * Retorna las propiedades visuales SVG de la arista según el tipo UML y estado de selección.
 */
export function getRelationEdgeVisuals(
  relationType: DiagramRelationType,
  isSelected: boolean
): RelationEdgeVisuals {
  const stroke = isSelected ? "#818cf8" : "#94a3b8";
  const strokeWidth = isSelected ? 2.5 : 1.5;

  switch (relationType) {
    case "ASSOCIATION":
      return {
        stroke,
        strokeWidth,
      };

    case "AGGREGATION":
      return {
        stroke,
        strokeWidth,
        markerStart: isSelected
          ? "url(#aggregation-diamond-selected)"
          : "url(#aggregation-diamond)",
      };

    case "COMPOSITION":
      return {
        stroke,
        strokeWidth,
        markerStart: isSelected
          ? "url(#composition-diamond-selected)"
          : "url(#composition-diamond)",
      };

    case "GENERALIZATION":
      return {
        stroke,
        strokeWidth,
        markerEnd: isSelected
          ? "url(#generalization-triangle-selected)"
          : "url(#generalization-triangle)",
      };

    case "REALIZATION":
      return {
        stroke,
        strokeWidth,
        strokeDasharray: "5,5",
        markerEnd: isSelected
          ? "url(#realization-triangle-selected)"
          : "url(#realization-triangle)",
      };

    case "DEPENDENCY":
      return {
        stroke,
        strokeWidth,
        strokeDasharray: "5,5",
        markerEnd: isSelected
          ? "url(#dependency-arrow-selected)"
          : "url(#dependency-arrow)",
      };

    default:
      return {
        stroke,
        strokeWidth,
      };
  }
}


/**
 * Retorna las etiquetas de cardinalidad únicamente si la relación es de tipo ASSOCIATION.
 * Para los demás tipos UML dirigidos, las cardinalidades son nulas.
 */
export function getCardinalityLabels(
  relation: DiagramRelation
): CardinalityLabels {
  if (relation.relationType === "ASSOCIATION") {
    return {
      source: relation.source.cardinality,
      target: relation.target.cardinality,
    };
  }
  return {
    source: null,
    target: null,
  };
}

/**
 * Determina si una relación debe mostrar etiqueta de nombre y editor inline.
 * RF-021: Solo las relaciones de tipo ASSOCIATION (incluyendo N:M) admiten nombre y renombrado.
 */
export function shouldRenderRelationName(
  relationType: DiagramRelationType
): boolean {
  return relationType === "ASSOCIATION";
}

/**
 * Convierte una entidad canónica DiagramRelation a un Edge de React Flow.
 */
export function convertRelationToEdge(
  relation: DiagramRelation,
  selectedRelationId?: string | null
): DiagramFlowEdge {
  const isSelected = selectedRelationId === relation.id;

  if (relation.bridge !== null) {
    return {
      id: relation.id,
      source: relation.source.classId,
      sourceHandle: relation.source.handle,
      target: relation.target.classId,
      targetHandle: relation.target.handle,
      type: "manyToManyRelation",
      selected: isSelected,
      data: {
        relation,
        bridgeClassId: relation.bridge.classId,
        bridgeHandle: relation.bridge.handle,
      },
    };
  }

  return {
    id: relation.id,
    source: relation.source.classId,
    sourceHandle: relation.source.handle,
    target: relation.target.classId,
    targetHandle: relation.target.handle,
    type: "diagramRelation",
    selected: isSelected,
    data: {
      relation,
    },
  };
}

/**
 * Convierte una lista de relaciones a sus correspondientes edges para React Flow.
 */
export function convertRelationsToEdges(
  relations: DiagramRelation[],
  selectedRelationId?: string | null
): DiagramFlowEdge[] {
  return relations.map((rel) =>
    convertRelationToEdge(rel, selectedRelationId)
  );
}
