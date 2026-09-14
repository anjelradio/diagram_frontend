import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveRelationGuidance,
  getSemanticRoles,
} from "./relation-guidance.ts";
import type { RelationPreset } from "../entities/diagram-relation.entity.ts";

describe("relation-guidance - Derivación de roles semánticos y mensajes", () => {
  it("deriva roles para asociaciones según cardinalidades (1 -> 0..*)", () => {
    const preset: RelationPreset = {
      id: "one-to-many",
      label: "Uno a muchos",
      relationType: "ASSOCIATION",
      sourceCardinality: "1",
      targetCardinality: "0..*",
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "1");
    assert.equal(roles.targetRole, "0..*");

    // Fase AWAITING_SOURCE (sin draftSource)
    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.phase, "AWAITING_SOURCE");
    assert.equal(g1.relationType, "ASSOCIATION");
    assert.equal(g1.sourceRole, "1");
    assert.equal(g1.targetRole, "0..*");
    assert.equal(g1.message, "Selecciona la clase de origen (1)");

    // Fase AWAITING_TARGET (con draftSource)
    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "RIGHT_CENTER" });
    assert.ok(g2);
    assert.equal(g2.phase, "AWAITING_TARGET");
    assert.equal(g2.message, "Selecciona la clase de destino (0..*)");
  });

  it("deriva roles para asociaciones muchos a muchos (0..* -> 0..*)", () => {
    const preset: RelationPreset = {
      id: "many-to-many",
      label: "Muchos a muchos",
      relationType: "ASSOCIATION",
      sourceCardinality: "0..*",
      targetCardinality: "0..*",
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "0..*");
    assert.equal(roles.targetRole, "0..*");

    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.message, "Selecciona la clase de origen (0..*)");

    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "BOTTOM_CENTER" });
    assert.ok(g2);
    assert.equal(g2.message, "Selecciona la clase de destino (0..*)");
  });

  it("deriva roles para AGGREGATION (Todo -> Parte)", () => {
    const preset: RelationPreset = {
      id: "aggregation",
      label: "Agregación",
      relationType: "AGGREGATION",
      sourceCardinality: null,
      targetCardinality: null,
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "Todo");
    assert.equal(roles.targetRole, "Parte");

    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.phase, "AWAITING_SOURCE");
    assert.equal(g1.message, "Selecciona el origen: Todo");

    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "TOP_CENTER" });
    assert.ok(g2);
    assert.equal(g2.phase, "AWAITING_TARGET");
    assert.equal(g2.message, "Selecciona el destino: Parte");
  });

  it("deriva roles para COMPOSITION (Todo -> Parte)", () => {
    const preset: RelationPreset = {
      id: "composition",
      label: "Composición",
      relationType: "COMPOSITION",
      sourceCardinality: null,
      targetCardinality: null,
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "Todo");
    assert.equal(roles.targetRole, "Parte");

    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.message, "Selecciona el origen: Todo");

    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "LEFT_CENTER" });
    assert.ok(g2);
    assert.equal(g2.message, "Selecciona el destino: Parte");
  });

  it("deriva roles para GENERALIZATION (Subclase -> Superclase)", () => {
    const preset: RelationPreset = {
      id: "generalization",
      label: "Generalización",
      relationType: "GENERALIZATION",
      sourceCardinality: null,
      targetCardinality: null,
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "Subclase");
    assert.equal(roles.targetRole, "Superclase");

    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.message, "Selecciona el origen: Subclase");

    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "TOP_CENTER" });
    assert.ok(g2);
    assert.equal(g2.message, "Selecciona el destino: Superclase");
  });

  it("deriva roles para REALIZATION (Implementador -> Contrato)", () => {
    const preset: RelationPreset = {
      id: "realization",
      label: "Realización",
      relationType: "REALIZATION",
      sourceCardinality: null,
      targetCardinality: null,
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "Implementador");
    assert.equal(roles.targetRole, "Contrato");

    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.message, "Selecciona el origen: Implementador");

    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "RIGHT_CENTER" });
    assert.ok(g2);
    assert.equal(g2.message, "Selecciona el destino: Contrato");
  });

  it("deriva roles para DEPENDENCY (Cliente -> Proveedor)", () => {
    const preset: RelationPreset = {
      id: "dependency",
      label: "Dependencia",
      relationType: "DEPENDENCY",
      sourceCardinality: null,
      targetCardinality: null,
    };

    const roles = getSemanticRoles(preset);
    assert.equal(roles.sourceRole, "Cliente");
    assert.equal(roles.targetRole, "Proveedor");

    const g1 = deriveRelationGuidance(preset, null);
    assert.ok(g1);
    assert.equal(g1.message, "Selecciona el origen: Cliente");

    const g2 = deriveRelationGuidance(preset, { classId: "c1", handle: "LEFT_CENTER" });
    assert.ok(g2);
    assert.equal(g2.message, "Selecciona el destino: Proveedor");
  });

  it("retorna null si no hay preset activo", () => {
    assert.equal(deriveRelationGuidance(null, null), null);
    assert.equal(deriveRelationGuidance(null, { classId: "c1", handle: "TOP_CENTER" }), null);
  });
});
