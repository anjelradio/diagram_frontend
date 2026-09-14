import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_RELATION_HANDLES,
  RELATION_PRESETS,
  getDirectedRoles,
  isManyToManyRelation,
} from "./diagram-relation.entity.ts";

describe("DiagramRelation Entity - Catálogo, Presets y Roles", () => {
  it("contiene exactamente doce handles de conexión distribuidos en 4 lados", () => {
    assert.equal(ALL_RELATION_HANDLES.length, 12);
    const topHandles = ALL_RELATION_HANDLES.filter((h) => h.startsWith("TOP_"));
    const rightHandles = ALL_RELATION_HANDLES.filter((h) => h.startsWith("RIGHT_"));
    const bottomHandles = ALL_RELATION_HANDLES.filter((h) => h.startsWith("BOTTOM_"));
    const leftHandles = ALL_RELATION_HANDLES.filter((h) => h.startsWith("LEFT_"));

    assert.equal(topHandles.length, 3);
    assert.equal(rightHandles.length, 3);
    assert.equal(bottomHandles.length, 3);
    assert.equal(leftHandles.length, 3);
  });

  it("incluye los presets canónicos del catálogo", () => {
    assert.ok(RELATION_PRESETS.length >= 10);
    const presetIds = RELATION_PRESETS.map((p) => p.id);
    assert.ok(presetIds.includes("one-to-many"));
    assert.ok(presetIds.includes("many-to-many"));
    assert.ok(presetIds.includes("one-to-one"));
    assert.ok(presetIds.includes("zero-to-many"));
    assert.ok(presetIds.includes("zero-to-one"));
    assert.ok(presetIds.includes("aggregation"));
    assert.ok(presetIds.includes("composition"));
    assert.ok(presetIds.includes("generalization"));
    assert.ok(presetIds.includes("realization"));
    assert.ok(presetIds.includes("dependency"));
  });

  it("identifica correctamente relaciones muchos a muchos", () => {
    assert.equal(isManyToManyRelation("ASSOCIATION", "0..*", "0..*"), true);
    assert.equal(isManyToManyRelation("ASSOCIATION", "1..*", "0..*"), true);
    assert.equal(isManyToManyRelation("ASSOCIATION", "0..*", "1..*"), true);
    assert.equal(isManyToManyRelation("ASSOCIATION", "1..*", "1..*"), true);

    assert.equal(isManyToManyRelation("ASSOCIATION", "1", "0..*"), false);
    assert.equal(isManyToManyRelation("ASSOCIATION", "0..1", "0..*"), false);
    assert.equal(isManyToManyRelation("ASSOCIATION", "1", "1"), false);
    assert.equal(isManyToManyRelation("ASSOCIATION", "0..1", "0..1"), false);
    assert.equal(isManyToManyRelation("AGGREGATION", null, null), false);
    assert.equal(isManyToManyRelation("GENERALIZATION", null, null), false);
  });

  it("define roles dirigidos semánticos para tipos no asociativos", () => {
    assert.deepEqual(getDirectedRoles("AGGREGATION"), {
      sourceRole: "Todo",
      targetRole: "Parte",
    });
    assert.deepEqual(getDirectedRoles("COMPOSITION"), {
      sourceRole: "Todo",
      targetRole: "Parte",
    });
    assert.deepEqual(getDirectedRoles("GENERALIZATION"), {
      sourceRole: "Subclase",
      targetRole: "Superclase",
    });
    assert.deepEqual(getDirectedRoles("REALIZATION"), {
      sourceRole: "Implementador",
      targetRole: "Interfaz/Contrato",
    });
    assert.deepEqual(getDirectedRoles("DEPENDENCY"), {
      sourceRole: "Cliente",
      targetRole: "Proveedor",
    });
    assert.equal(getDirectedRoles("ASSOCIATION"), null);
  });
});
