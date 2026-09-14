import type { DiagramAttribute } from "../entities/diagram-attribute.entity.ts";

export type DiagramAttributeCapabilities = {
  canRename: boolean;
  canChangeType: boolean;
  canChangeNullable: boolean;
  canReposition: boolean;
  canDelete: boolean;
};

/**
 * Determina si un atributo es una llave primaria compartida (subclase en generalización).
 */
export function isSharedPrimaryKey(attribute: DiagramAttribute): boolean {
  return Boolean(attribute.isPrimaryKey && attribute.isForeignKey);
}

/**
 * Determina si un atributo es una llave foránea secundaria derivada por una relación.
 */
export function isDerivedForeignKey(attribute: DiagramAttribute): boolean {
  return Boolean(attribute.isForeignKey && !attribute.isPrimaryKey);
}

/**
 * Deriva las capacidades de edición y mutación de un atributo según su tipo (manual, PK, FK o PK compartida)
 * y los permisos globales de edición sobre el lienzo.
 *
 * Invariantes constitucionales (US4 / RF-020):
 * - Reader (canEditCanvas = false): bloquea absolutamente todo.
 * - PK compartida (isPrimaryKey && isForeignKey): bloquea absolutamente todo.
 * - PK normal (isPrimaryKey): inmutable en tipo, nulabilidad, posición, renombrado y borrado.
 * - FK secundaria (isForeignKey): tipo UUID y nulabilidad estáticos, posición y borrado bloqueados; únicamente renombrable.
 * - Atributo manual: edición y borrado completos.
 */
export function deriveDiagramAttributeCapabilities(
  attribute: DiagramAttribute,
  canEditCanvas: boolean
): DiagramAttributeCapabilities {
  if (!canEditCanvas) {
    return {
      canRename: false,
      canChangeType: false,
      canChangeNullable: false,
      canReposition: false,
      canDelete: false,
    };
  }

  // Precedencia de PK compartida: completamente inmutable mientras persista la relación
  if (attribute.isPrimaryKey && attribute.isForeignKey) {
    return {
      canRename: false,
      canChangeType: false,
      canChangeNullable: false,
      canReposition: false,
      canDelete: false,
    };
  }

  // PK normal de clase: inmutable
  if (attribute.isPrimaryKey) {
    return {
      canRename: false,
      canChangeType: false,
      canChangeNullable: false,
      canReposition: false,
      canDelete: false,
    };
  }

  // FK secundaria derivada: solo renombre permitido
  if (attribute.isForeignKey) {
    return {
      canRename: true,
      canChangeType: false,
      canChangeNullable: false,
      canReposition: false,
      canDelete: false,
    };
  }

  // Atributo manual estándar
  return {
    canRename: true,
    canChangeType: true,
    canChangeNullable: true,
    canReposition: true,
    canDelete: true,
  };
}
