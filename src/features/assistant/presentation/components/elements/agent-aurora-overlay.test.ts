import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./agent-aurora-overlay.tsx", import.meta.url), "utf8");

test("la aurora usa velos ondulantes y no un marco", () => {
  assert.match(source, /aurora-stream/);
  assert.match(source, /aurora-glow/);
  assert.match(source, /aurora-haze/);
  assert.match(source, /will-change: transform/);
});

test("la aurora conserva accesibilidad y no captura el puntero", () => {
  assert.match(source, /pointer-events-none/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /aria-hidden=\"true\"/);
});
