import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELATION_PRESETS,
  type DiagramRelationHandle,
  type RelationPreset,
} from "../../domain/entities/diagram-relation.entity.ts";

export type RelationSelectionState = {
  isRelationToolActive: boolean;
  activePreset: RelationPreset | null;
  draftSource: { classId: string; handle: DiagramRelationHandle } | null;
  errorMessage: string | null;
};

export function createInitialRelationSelectionState(): RelationSelectionState {
  return {
    isRelationToolActive: false,
    activePreset: null,
    draftSource: null,
    errorMessage: null,
  };
}

export function activateRelationPreset(
  state: RelationSelectionState,
  preset: RelationPreset
): RelationSelectionState {
  return {
    ...state,
    isRelationToolActive: true,
    activePreset: preset,
    draftSource: null,
    errorMessage: null,
  };
}

export function startRelationDraft(
  state: RelationSelectionState,
  classId: string,
  handle: DiagramRelationHandle
): RelationSelectionState {
  if (!state.isRelationToolActive || !state.activePreset) {
    return state;
  }
  return {
    ...state,
    draftSource: { classId, handle },
    errorMessage: null,
  };
}

export function validateAndCompleteConnection(
  state: RelationSelectionState,
  targetClassId: string,
  targetHandle: DiagramRelationHandle
): { success: boolean; error?: string; state: RelationSelectionState } {
  void targetHandle;
  if (!state.draftSource) {
    return {
      success: false,
      error: "No hay punto de origen seleccionado.",
      state,
    };
  }

  if (state.draftSource.classId === targetClassId) {
    return {
      success: false,
      error: "No se puede conectar una clase consigo misma.",
      state: {
        ...state,
        errorMessage: "No se puede conectar una clase consigo misma.",
      },
    };
  }

  return {
    success: true,
    state: {
      ...state,
      draftSource: null,
      errorMessage: null,
    },
  };
}

export function cancelRelationAction(
  state: RelationSelectionState
): RelationSelectionState {
  if (state.draftSource) {
    return {
      ...state,
      draftSource: null,
      errorMessage: null,
    };
  }
  return {
    ...state,
    isRelationToolActive: false,
    activePreset: null,
    errorMessage: null,
  };
}

describe("DiagramRelationSelection - Estado de selección, autorrelación y cancelación", () => {
  it("inicia sin herramienta de relación activa", () => {
    const state = createInitialRelationSelectionState();
    assert.equal(state.isRelationToolActive, false);
    assert.equal(state.activePreset, null);
    assert.equal(state.draftSource, null);
  });

  it("activa la herramienta al elegir un preset", () => {
    const preset = RELATION_PRESETS[0];
    const state = activateRelationPreset(createInitialRelationSelectionState(), preset);
    assert.equal(state.isRelationToolActive, true);
    assert.equal(state.activePreset?.id, preset.id);
  });

  it("registra el borrador de origen solo si la herramienta está activa", () => {
    const inactive = startRelationDraft(createInitialRelationSelectionState(), "class-1", "TOP_CENTER");
    assert.equal(inactive.draftSource, null);

    const preset = RELATION_PRESETS[0];
    const active = activateRelationPreset(createInitialRelationSelectionState(), preset);
    const withDraft = startRelationDraft(active, "class-1", "TOP_CENTER");
    assert.deepEqual(withDraft.draftSource, {
      classId: "class-1",
      handle: "TOP_CENTER",
    });
  });

  it("rechaza conectar una clase consigo misma", () => {
    const preset = RELATION_PRESETS[0];
    const active = activateRelationPreset(createInitialRelationSelectionState(), preset);
    const withDraft = startRelationDraft(active, "class-1", "TOP_CENTER");

    const result = validateAndCompleteConnection(withDraft, "class-1", "BOTTOM_CENTER");
    assert.equal(result.success, false);
    assert.equal(result.error, "No se puede conectar una clase consigo misma.");
    assert.equal(result.state.errorMessage, "No se puede conectar una clase consigo misma.");
  });

  it("cancela el borrador de conexión en primer escape y desactiva la herramienta en segundo", () => {
    const preset = RELATION_PRESETS[0];
    const active = activateRelationPreset(createInitialRelationSelectionState(), preset);
    const withDraft = startRelationDraft(active, "class-1", "TOP_CENTER");

    const afterFirstEscape = cancelRelationAction(withDraft);
    assert.equal(afterFirstEscape.draftSource, null);
    assert.equal(afterFirstEscape.isRelationToolActive, true);

    const afterSecondEscape = cancelRelationAction(afterFirstEscape);
    assert.equal(afterSecondEscape.isRelationToolActive, false);
    assert.equal(afterSecondEscape.activePreset, null);
  });
});
