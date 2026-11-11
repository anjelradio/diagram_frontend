import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const hookSource = readFileSync(
  new URL("./use-diagram-tutorial.ts", import.meta.url),
  "utf8"
);
const canvasViewSource = readFileSync(
  new URL("../../../projects/presentation/components/elements/project-canvas/project-canvas-view.tsx", import.meta.url),
  "utf8"
);

describe("useDiagramTutorial hook and canvas integration", () => {
  it("contiene los pasos de modelado US1: toolbar, create class, rename y relation", () => {
    assert.match(hookSource, /SCENE_2_TOOLBAR_EXPLORE/);
    assert.match(hookSource, /SCENE_3_FOCUS_CREATE_CLASS/);
    assert.match(hookSource, /SCENE_4_CLICK_CANVAS/);
    assert.match(hookSource, /SCENE_5_CLASS_CREATED/);
    assert.match(hookSource, /SCENE_6_RENAME_DETECTED/);
    assert.match(hookSource, /SCENE_7_TWO_CLASSES_CREATED/);
    assert.match(hookSource, /SCENE_8_RELATION_TOOLBAR/);
    assert.match(hookSource, /SCENE_11_RELATION_DONE/);
  });

  it("project-canvas-view renderiza TutorialSpotlightOverlay, TutorialPetBubble y TutorialExitButton", () => {
    assert.match(canvasViewSource, /<TutorialSpotlightOverlay/);
    assert.match(canvasViewSource, /<TutorialPetBubble/);
    assert.match(canvasViewSource, /<TutorialExitButton/);
  });

  it("cubre escenas de User Story 2: agente IA (12, 13, 14) e integraciones (15, 16, 17)", () => {
    assert.match(hookSource, /SCENE_12_FOCUS_AGENT/);
    assert.match(hookSource, /SCENE_13_AGENT_OPEN/);
    assert.match(hookSource, /SCENE_14_AGENT_FIRST_MESSAGE/);
    assert.match(hookSource, /SCENE_15_FOCUS_INTEGRATIONS/);
    assert.match(hookSource, /SCENE_16_INTEGRATIONS_OPEN/);
    assert.match(hookSource, /SCENE_17_TUTORIAL_COMPLETED/);
  });
});
