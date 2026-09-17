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

test("handleNodeDragStop preserva el lock si el nodo continúa seleccionado", () => {
  assert.match(source, /isStillSelected/);
  assert.match(source, /if \(!isStillSelected\) \{/);
  assert.match(source, /sendRealtimeMessage\(\{ type: "class_lock_release"/);
});

test("handleSelectionChange adquiere lock del nodo seleccionado y libera deseleccionados", () => {
  assert.match(source, /handleSelectionChange/);
  assert.match(source, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: selectedId \}\)/);
  assert.match(source, /sendRealtimeMessage\(\{ type: "class_lock_release", class_id: classId \}\)/);
});

test("handlePaneClick libera todos los locks del viewerId al hacer clic en el lienzo vacío", () => {
  assert.match(source, /handlePaneClick/);
  assert.match(source, /state\.classLocks\[classId\]\.userId === viewerId/);
  assert.match(source, /sendRealtimeMessage\(\{ type: "class_lock_release", class_id: classId \}\)/);
});
