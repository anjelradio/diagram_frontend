import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("./voice-recorder-bar.tsx", import.meta.url),
  "utf8"
);

test("VoiceRecorderBar incluye visualización aurora y controles de cancelar y enviar", () => {
  assert.match(source, /aurora-wave-pulse/);
  assert.match(source, /aurora-fluid-flow/);
  assert.match(source, /aurora-spectrum-bar/);
  assert.match(source, /Cancelar grabación/);
  assert.match(source, /Enviar orden de voz/);
});

test("VoiceRecorderBar es accesible y maneja estados idle, recording y sending", () => {
  assert.match(source, /role="status"/);
  assert.match(source, /state === "idle"/);
  assert.match(source, /Enviando orden\.\.\./);
  assert.match(source, /Escuchando\.\.\./);
});
