import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_RELATION_HANDLES,
  RELATION_PRESETS,
  getDirectedRoles,
  isManyToManyRelation,
  SOURCE_VERTEX_OPTIONS,
  TARGET_CARDINALITY_OPTIONS,
  isStructuralRelationType,
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

  it("proporciona catálogo de opciones para vértice origen agrupado correctamente", () => {
    assert.equal(SOURCE_VERTEX_OPTIONS.length, 9);
    const cardinalityOpts = SOURCE_VERTEX_OPTIONS.filter((o) => o.category === "cardinality");
    const structuralOpts = SOURCE_VERTEX_OPTIONS.filter((o) => o.category === "structural_head");

    assert.equal(cardinalityOpts.length, 4);
    assert.equal(structuralOpts.length, 5);

    const badges = cardinalityOpts.map((o) => o.badge);
    assert.ok(badges.includes("1..1"));
    assert.ok(badges.includes("0..1"));
    assert.ok(badges.includes("0..*"));
    assert.ok(badges.includes("1..*"));

    const structuralTypes = structuralOpts.map((o) => o.relationType);
    assert.ok(structuralTypes.includes("COMPOSITION"));
    assert.ok(structuralTypes.includes("AGGREGATION"));
    assert.ok(structuralTypes.includes("GENERALIZATION"));
    assert.ok(structuralTypes.includes("REALIZATION"));
    assert.ok(structuralTypes.includes("DEPENDENCY"));
  });

  it("proporciona catálogo de opciones para vértice destino restringido a cardinalidades asociativas", () => {
    assert.equal(TARGET_CARDINALITY_OPTIONS.length, 4);
    for (const opt of TARGET_CARDINALITY_OPTIONS) {
      assert.equal(opt.category, "cardinality");
      assert.equal(opt.relationType, "ASSOCIATION");
      assert.ok(opt.cardinality);
    }
  });

  it("distingue correctamente tipos de relación estructurales vs asociativos", () => {
    assert.equal(isStructuralRelationType("ASSOCIATION"), false);
    assert.equal(isStructuralRelationType("GENERALIZATION"), true);
    assert.equal(isStructuralRelationType("COMPOSITION"), true);
    assert.equal(isStructuralRelationType("AGGREGATION"), true);
    assert.equal(isStructuralRelationType("REALIZATION"), true);
    assert.equal(isStructuralRelationType("DEPENDENCY"), true);
  });
});

