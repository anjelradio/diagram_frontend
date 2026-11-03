import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./eye-tracker.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("./eye-tracker.css", import.meta.url), "utf8");

test("EyeTracker exporta tanto Watcher como EyeTracker", () => {
  assert.match(source, /export function Watcher/);
  assert.match(source, /export const EyeTracker = Watcher;/);
});

test("EyeTracker establece Pill y Slant como valores por defecto", () => {
  assert.match(source, /shape = "Pill"/);
  assert.match(source, /eyes: look = "Slant"/);
  assert.match(source, /follow = 25/);
  assert.match(source, /bounce = 30/);
});

test("EyeTracker soporta configuración de fill light y dark", () => {
  assert.match(source, /fill = "light"/);
  assert.match(source, /"--fill-slab": "#ffffff"/);
  assert.match(source, /"--fill-on": "#0b0b0d"/);
  assert.match(source, /"--fill-slab": "#191a1d"/);
});

test("EyeTracker aplica CSS encapsulado bajo el selector .eyt sin contaminar root", () => {
  assert.match(cssSource, /\.eyt \{/);
  assert.match(cssSource, /\.eyt-body \{/);
  assert.match(cssSource, /\.eyt-eye \{/);
  assert.match(cssSource, /--fill-slab/);
  assert.match(cssSource, /--fill-on/);
  assert.doesNotMatch(cssSource, /:root\s*\{[^}]*--fill-slab/);
});

test("EyeTracker registra seguimiento de puntero global en window", () => {
  assert.match(source, /window\.addEventListener\("pointermove", aim/);
  assert.match(source, /const dx = e\.clientX - \(r\.left \+ r\.width \/ 2\)/);
});

