import { describe, it } from "node:test";
import assert from "node:assert/strict";

export type DeletionTarget =
  | { type: "attribute"; classId: string; attributeId: string }
  | { type: "relation"; relationId: string }
  | { type: "classes"; classIds: string[] }
  | null;

/**
 * Resuelve la prioridad de borrado para teclas Delete / Backspace:
 * 1. Atributo secundario seleccionado (la PK no se borra)
 * 2. Relación UML seleccionada
 * 3. Clases seleccionadas
 * Si el foco está dentro de un control editable (input, textarea, etc.), no actúa.
 */
export function resolveDeletionTarget(params: {
  selectedAttribute: { classId: string; attributeId: string; isPrimaryKey?: boolean } | null;
  selectedRelationId: string | null;
  selectedClassIds: string[];
  isInputFocused: boolean;
}): DeletionTarget {
  if (params.isInputFocused) {
    return null;
  }

  if (params.selectedAttribute) {
    if (params.selectedAttribute.isPrimaryKey) {
      return null;
    }
    return {
      type: "attribute",
      classId: params.selectedAttribute.classId,
      attributeId: params.selectedAttribute.attributeId,
    };
  }

  if (params.selectedRelationId) {
    return {
      type: "relation",
      relationId: params.selectedRelationId,
    };
  }

  if (params.selectedClassIds.length > 0) {
    return {
      type: "classes",
      classIds: params.selectedClassIds,
    };
  }

  return null;
}

/**
 * Verifica si un elemento DOM o selector corresponde a un control editable
 * o contenedor de diálogo/popover que deba protegerse del borrado de elementos del lienzo.
 */
export function isEditableOrDialogContext(tagName: string, closestSlots: string[] = []): boolean {
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  const protectedRoles = ["dialog", "popover"];
  const protectedSlots = ["dialog", "popover-content"];
  return closestSlots.some(
    (slot) => protectedRoles.includes(slot) || protectedSlots.includes(slot)
  );
}

describe("DiagramRelationDeletion - Prioridad de selección y protección de teclado", () => {
  it("Prioridad 1: da preferencia al atributo secundario seleccionado sobre relación y clases", () => {
    const target = resolveDeletionTarget({
      selectedAttribute: { classId: "class-1", attributeId: "attr-1" },
      selectedRelationId: "rel-1",
      selectedClassIds: ["class-1", "class-2"],
      isInputFocused: false,
    });

    assert.deepEqual(target, {
      type: "attribute",
      classId: "class-1",
      attributeId: "attr-1",
    });
  });

  it("no elimina un atributo si es llave primaria (PK es inmutable)", () => {
    const target = resolveDeletionTarget({
      selectedAttribute: { classId: "class-1", attributeId: "attr-pk", isPrimaryKey: true },
      selectedRelationId: "rel-1",
      selectedClassIds: ["class-1"],
      isInputFocused: false,
    });

    assert.equal(target, null);
  });

  it("Prioridad 2: da preferencia a la relación seleccionada sobre las clases seleccionadas", () => {
    const target = resolveDeletionTarget({
      selectedAttribute: null,
      selectedRelationId: "rel-1",
      selectedClassIds: ["class-1", "class-2"],
      isInputFocused: false,
    });

    assert.deepEqual(target, {
      type: "relation",
      relationId: "rel-1",
    });
  });

  it("Prioridad 3: elimina clases seleccionadas cuando no hay atributo ni relación seleccionada", () => {
    const target = resolveDeletionTarget({
      selectedAttribute: null,
      selectedRelationId: null,
      selectedClassIds: ["class-1", "class-2"],
      isInputFocused: false,
    });

    assert.deepEqual(target, {
      type: "classes",
      classIds: ["class-1", "class-2"],
    });
  });

  it("Protección: ignora eventos de Delete/Backspace si el foco está dentro de un input o control editable", () => {
    const target = resolveDeletionTarget({
      selectedAttribute: { classId: "class-1", attributeId: "attr-1" },
      selectedRelationId: "rel-1",
      selectedClassIds: ["class-1"],
      isInputFocused: true,
    });

    assert.equal(target, null);
  });

  it("identifica correctamente contextos editables y diálogos/popovers para no interceptar teclas", () => {
    assert.equal(isEditableOrDialogContext("INPUT"), true);
    assert.equal(isEditableOrDialogContext("TEXTAREA"), true);
    assert.equal(isEditableOrDialogContext("SELECT"), true);
    assert.equal(isEditableOrDialogContext("DIV", ["dialog"]), true);
    assert.equal(isEditableOrDialogContext("DIV", ["popover-content"]), true);
    assert.equal(isEditableOrDialogContext("DIV", []), false);
  });
});
