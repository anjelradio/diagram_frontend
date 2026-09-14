import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELATION_PRESETS,
  type DiagramRelationHandle,
  type RelationPreset,
} from "../../domain/entities/diagram-relation.entity.ts";
import { deriveRelationGuidance } from "../../domain/services/relation-guidance.ts";

export type RelationGuidanceStoreState = {
  activeRelationPreset: RelationPreset | null;
  relationDraftSource: { classId: string; handle: DiagramRelationHandle } | null;
  activeTool: "cursor" | "hand" | "create-class" | "relation";
  canEdit: boolean;
};

export function createInitialGuidanceState(): RelationGuidanceStoreState {
  return {
    activeRelationPreset: null,
    relationDraftSource: null,
    activeTool: "cursor",
    canEdit: true,
  };
}

export function selectPresetAction(
  state: RelationGuidanceStoreState,
  preset: RelationPreset
): RelationGuidanceStoreState {
  if (!state.canEdit) return state;
  return {
    ...state,
    activeRelationPreset: preset,
    relationDraftSource: null,
    activeTool: "relation",
  };
}

export function setDraftSourceAction(
  state: RelationGuidanceStoreState,
  classId: string,
  handle: DiagramRelationHandle
): RelationGuidanceStoreState {
  if (!state.canEdit || !state.activeRelationPreset) return state;
  return {
    ...state,
    relationDraftSource: { classId, handle },
  };
}

/**
 * En 010 (US1), presionar Escape cancela COMPLETAMENTE la creación de relación
 * en una sola pulsación, limpiando preset, draft y volviendo a cursor.
 */
export function cancelRelationInSingleEscape(
  state: RelationGuidanceStoreState
): RelationGuidanceStoreState {
  return {
    ...state,
    activeRelationPreset: null,
    relationDraftSource: null,
    activeTool: "cursor",
  };
}

export function completeRelationAction(
  state: RelationGuidanceStoreState
): RelationGuidanceStoreState {
  return {
    ...state,
    activeRelationPreset: null,
    relationDraftSource: null,
    activeTool: "cursor",
  };
}

export function invalidateRelationDraftAction(
  state: RelationGuidanceStoreState
): RelationGuidanceStoreState {
  return {
    ...state,
    activeRelationPreset: null,
    relationDraftSource: null,
    activeTool: "cursor",
  };
}

export function handlePermissionDowngrade(
  state: RelationGuidanceStoreState
): RelationGuidanceStoreState {
  return {
    ...state,
    canEdit: false,
    activeRelationPreset: null,
    relationDraftSource: null,
    activeTool: "cursor",
  };
}

describe("diagram-relation-guidance - Ciclo de vida y cancelación unificada", () => {
  const preset = RELATION_PRESETS[0]; // one-to-many

  it("muestra guía de origen al activar preset y guía de destino al anclar origen", () => {
    let state = createInitialGuidanceState();
    assert.equal(deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource), null);

    state = selectPresetAction(state, preset);
    const g1 = deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource);
    assert.ok(g1);
    assert.equal(g1.phase, "AWAITING_SOURCE");

    state = setDraftSourceAction(state, "class-1", "RIGHT_CENTER");
    const g2 = deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource);
    assert.ok(g2);
    assert.equal(g2.phase, "AWAITING_TARGET");
  });

  it("cancela completamente preset, draft y guía con una sola pulsación de Escape", () => {
    let state = selectPresetAction(createInitialGuidanceState(), preset);
    state = setDraftSourceAction(state, "class-1", "RIGHT_CENTER");
    assert.ok(state.activeRelationPreset);
    assert.ok(state.relationDraftSource);

    // Un solo Escape
    state = cancelRelationInSingleEscape(state);
    assert.equal(state.activeRelationPreset, null);
    assert.equal(state.relationDraftSource, null);
    assert.equal(state.activeTool, "cursor");
    assert.equal(deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource), null);
  });

  it("limpia preset, draft y guía al completar exitosamente una relación", () => {
    let state = selectPresetAction(createInitialGuidanceState(), preset);
    state = setDraftSourceAction(state, "class-1", "RIGHT_CENTER");

    state = completeRelationAction(state);
    assert.equal(state.activeRelationPreset, null);
    assert.equal(state.relationDraftSource, null);
    assert.equal(state.activeTool, "cursor");
    assert.equal(deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource), null);
  });

  it("limpia preset, draft y guía ante invalidación del origen (ej: clase eliminada)", () => {
    let state = selectPresetAction(createInitialGuidanceState(), preset);
    state = setDraftSourceAction(state, "class-1", "RIGHT_CENTER");

    state = invalidateRelationDraftAction(state);
    assert.equal(state.activeRelationPreset, null);
    assert.equal(state.relationDraftSource, null);
    assert.equal(deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource), null);
  });

  it("limpia preset, draft y guía al perder permisos de edición (downgrade a reader)", () => {
    let state = selectPresetAction(createInitialGuidanceState(), preset);
    state = setDraftSourceAction(state, "class-1", "RIGHT_CENTER");

    state = handlePermissionDowngrade(state);
    assert.equal(state.canEdit, false);
    assert.equal(state.activeRelationPreset, null);
    assert.equal(state.relationDraftSource, null);
    assert.equal(deriveRelationGuidance(state.activeRelationPreset, state.relationDraftSource), null);
  });
});
