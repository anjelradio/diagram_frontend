import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { projectDiagramOperation } from "./diagram-operation-projector.ts";
import type { DiagramSnapshot } from "../../domain/entities/diagram-class.entity.ts";
import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity.ts";

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

describe("DiagramRelationDeletion - Proyección de derivados", () => {
  it("elimina una FK secundaria, restaura una PK compartida legada y limpia el puente", () => {
    const snapshot = {
      classes: [
        {
          id: "class-a", name: "A", positionX: 0, positionY: 0,
          attributes: [
            { id: "pk-a", classId: "class-a", name: "id", dataType: "UUID", position: 0, isPrimaryKey: true, isNullable: false },
            { id: "fk-a", classId: "class-a", name: "b_id", dataType: "UUID", position: 1, isPrimaryKey: false, isNullable: true, isForeignKey: true, referencedClassId: "class-b", relationId: "rel-fk" },
          ],
        },
        {
          id: "class-b", name: "B", positionX: 200, positionY: 0,
          attributes: [
            { id: "shared-pk", classId: "class-b", name: "id", dataType: "UUID", position: 0, isPrimaryKey: true, isNullable: false, isForeignKey: true, referencedClassId: "class-a", relationId: "rel-shared" },
          ],
        },
        {
          id: "bridge", name: "AB", positionX: 100, positionY: 200,
          attributes: [{ id: "bridge-pk", classId: "bridge", name: "id", dataType: "UUID", position: 0, isPrimaryKey: true, isNullable: false }],
        },
      ],
      relations: [
        { id: "rel-fk", name: "AB", relationType: "ASSOCIATION", source: { classId: "class-a", handle: "RIGHT_CENTER", cardinality: "1" }, target: { classId: "class-b", handle: "LEFT_CENTER", cardinality: "0..*" }, bridge: null },
        { id: "rel-shared", name: "AB", relationType: "GENERALIZATION", source: { classId: "class-b", handle: "TOP_CENTER", cardinality: null }, target: { classId: "class-a", handle: "BOTTOM_CENTER", cardinality: null }, bridge: { classId: "bridge", handle: "TOP_CENTER" } },
      ],
    } as unknown as DiagramSnapshot;

    const remove = (relationId: string) => projectDiagramOperation(snapshot, {
      operationId: `delete-${relationId}`, viewerId: "viewer", projectId: "project", sequence: 1,
      kind: "DELETE_RELATION", relationId, payload: { relationId },
      createdAt: "2026-11-03T12:00:00.000Z", attempts: 0, state: "pending",
    } satisfies DiagramOperation);

    const afterForeignKeyDelete = remove("rel-fk");
    assert.deepEqual(afterForeignKeyDelete.classes[0]?.attributes.map((attribute) => attribute.id), ["pk-a"]);

    const afterSharedAndBridgeDelete = remove("rel-shared");
    const restoredPk = afterSharedAndBridgeDelete.classes[1]?.attributes[0];
    assert.equal(restoredPk?.isPrimaryKey, true);
    assert.equal(restoredPk?.isForeignKey, false);
    assert.equal(restoredPk?.relationId, null);
    assert.equal(afterSharedAndBridgeDelete.classes.some((diagramClass) => diagramClass.id === "bridge"), false);
  });
});
