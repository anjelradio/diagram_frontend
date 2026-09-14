import type {
  DiagramRelationType,
  RelationPreset,
} from "../entities/diagram-relation.entity.ts";

export type RelationGuidancePhase = "AWAITING_SOURCE" | "AWAITING_TARGET";

export interface RelationGuidance {
  phase: RelationGuidancePhase;
  relationType: DiagramRelationType;
  sourceRole: string;
  targetRole: string;
  message: string;
}

/**
 * Obtiene los papeles semánticos o cardinalidades para los extremos de la relación.
 */
export function getSemanticRoles(preset: RelationPreset): {
  sourceRole: string;
  targetRole: string;
} {
  switch (preset.relationType) {
    case "ASSOCIATION":
      return {
        sourceRole: preset.sourceCardinality ?? "",
        targetRole: preset.targetCardinality ?? "",
      };
    case "AGGREGATION":
    case "COMPOSITION":
      return {
        sourceRole: "Todo",
        targetRole: "Parte",
      };
    case "GENERALIZATION":
      return {
        sourceRole: "Subclase",
        targetRole: "Superclase",
      };
    case "REALIZATION":
      return {
        sourceRole: "Implementador",
        targetRole: "Contrato",
      };
    case "DEPENDENCY":
      return {
        sourceRole: "Cliente",
        targetRole: "Proveedor",
      };
  }
}

/**
 * Derivador puro de fase y texto de orientación desde activeRelationPreset y relationDraftSource.
 */
export function deriveRelationGuidance(
  preset: RelationPreset | null,
  draftSource: { classId: string; handle: string } | null
): RelationGuidance | null {
  if (!preset) return null;

  const { sourceRole, targetRole } = getSemanticRoles(preset);
  const phase: RelationGuidancePhase = draftSource
    ? "AWAITING_TARGET"
    : "AWAITING_SOURCE";

  let message: string;
  if (phase === "AWAITING_SOURCE") {
    if (preset.relationType === "ASSOCIATION") {
      message = `Selecciona la clase de origen (${sourceRole})`;
    } else {
      message = `Selecciona el origen: ${sourceRole}`;
    }
  } else {
    if (preset.relationType === "ASSOCIATION") {
      message = `Selecciona la clase de destino (${targetRole})`;
    } else {
      message = `Selecciona el destino: ${targetRole}`;
    }
  }

  return {
    phase,
    relationType: preset.relationType,
    sourceRole,
    targetRole,
    message,
  };
}
