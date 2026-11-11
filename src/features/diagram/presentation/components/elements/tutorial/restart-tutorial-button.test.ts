import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const restartButtonSource = readFileSync(
  new URL("./restart-tutorial-button.tsx", import.meta.url),
  "utf8"
);
const projectsViewSource = readFileSync(
  new URL("../../../../../projects/presentation/components/elements/projects-list/projects-view.tsx", import.meta.url),
  "utf8"
);

describe("RestartTutorialButton and ProjectsView integration", () => {
  it("RestartTutorialButton incluye data-tutorial='restart-tutorial-btn' y icono GraduationCap", () => {
    assert.match(restartButtonSource, /data-tutorial="restart-tutorial-btn"/);
    assert.match(restartButtonSource, /GraduationCap/);
    assert.match(restartButtonSource, /Ver tutorial interactivo/);
  });

  it("ProjectsView renderiza RestartTutorialButton conectado a restartTutorial", () => {
    assert.match(projectsViewSource, /<RestartTutorialButton\s+onRestart=\{.*restartTutorial\(\)\}/);
  });
});
