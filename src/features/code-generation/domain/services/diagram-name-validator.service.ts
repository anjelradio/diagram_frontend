/**
 * Servicio de dominio puro para validar unicidad de nombres de clases y atributos
 * en el diagrama previo a la generación del backend.
 *
 * Conforme al Principio 1 de la Constitución de Frontend: TypeScript puro sin
 * dependencias de React, hooks, DOM ni librerías de infraestructura.
 */

export interface DiagramAttributeCandidate {
  name: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

export interface DiagramClassCandidate {
  name: string;
  attributes: DiagramAttributeCandidate[];
}

export type DiagramNameValidationErrorType =
  | "DUPLICATE_CLASSES"
  | "DUPLICATE_ATTRIBUTES";

export type DiagramNameValidationResult =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      errorType: DiagramNameValidationErrorType;
      conflictClassName: string;
      conflictAttributeName?: string;
      message: string;
    };

/**
 * Valida que todas las clases tengan nombres distintos en el proyecto y que
 * todos los atributos de una sola clase (incluyendo llaves primarias y foráneas)
 * tengan nombres distintos entre sí.
 *
 * La comparación es insensible a mayúsculas/minúsculas y espacios extremos.
 */
export function validateDiagramNames(
  classes: DiagramClassCandidate[]
): DiagramNameValidationResult {
  // 1. Validar unicidad global de clases
  const seenClassNames = new Map<string, string>();

  for (const cls of classes) {
    const rawName = cls.name ?? "";
    const trimmedName = rawName.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (!normalizedName) continue;

    if (seenClassNames.has(normalizedName)) {
      const conflictName = seenClassNames.get(normalizedName) || trimmedName;
      return {
        isValid: false,
        errorType: "DUPLICATE_CLASSES",
        conflictClassName: conflictName,
        message: `Hay clases con nombres iguales ('${conflictName}').`,
      };
    }

    seenClassNames.set(normalizedName, trimmedName);
  }

  // 2. Validar unicidad de atributos dentro de cada clase
  for (const cls of classes) {
    const className = (cls.name ?? "").trim() || "Sin nombre";
    const seenAttributeNames = new Map<string, string>();

    for (const attr of cls.attributes ?? []) {
      const rawAttrName = attr.name ?? "";
      const trimmedAttrName = rawAttrName.trim();
      const normalizedAttrName = trimmedAttrName.toLowerCase();

      if (!normalizedAttrName) continue;

      if (seenAttributeNames.has(normalizedAttrName)) {
        const conflictAttrName =
          seenAttributeNames.get(normalizedAttrName) || trimmedAttrName;
        return {
          isValid: false,
          errorType: "DUPLICATE_ATTRIBUTES",
          conflictClassName: className,
          conflictAttributeName: conflictAttrName,
          message: `Hay atributos con nombres iguales en la clase '${className}'.`,
        };
      }

      seenAttributeNames.set(normalizedAttrName, trimmedAttrName);
    }
  }

  return { isValid: true };
}
