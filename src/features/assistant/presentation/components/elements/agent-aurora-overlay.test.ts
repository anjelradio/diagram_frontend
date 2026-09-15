import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./agent-aurora-overlay.tsx", import.meta.url), "utf8");

test("la aurora usa velos ondulantes y no un marco", () => {
  assert.match(source, /agent-aurora-wave-one/);
  assert.match(source, /agent-aurora-wave-two/);
  assert.match(source, /agent-aurora-wave-three/);
  assert.match(source, /agent-aurora-drift-one/);
  assert.match(source, /will-change: transform, opacity/);
});

test("la aurora conserva accesibilidad y no captura el puntero", () => {
  assert.match(source, /pointer-events-none/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /aria-hidden=\"true\"/);
});
