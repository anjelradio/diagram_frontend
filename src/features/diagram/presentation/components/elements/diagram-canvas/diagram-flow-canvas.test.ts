import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./diagram-flow-canvas.tsx", import.meta.url), "utf8");

test("el bloqueo de agente conserva pan y zoom pero deshabilita mutaciones", () => {
  assert.match(source, /panOnDrag=\{!canEdit \? \[0, 1, 2\]/);
  assert.match(source, /selectionOnDrag=\{canEdit && isSelectActive\}/);
  assert.match(source, /nodesDraggable=\{canEdit/);
  assert.match(source, /zoomOnScroll=\{true\}/);
});
