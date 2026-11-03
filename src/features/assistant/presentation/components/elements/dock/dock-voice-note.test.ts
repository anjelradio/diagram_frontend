import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./dock-voice-note.tsx", import.meta.url), "utf8");

test("DockVoiceNote aplica diseño en píldora azul y barras de audio blancas", () => {
  assert.match(source, /bg-blue-600/);
  assert.match(source, /text-white/);
  assert.match(source, /rounded-full/);
  assert.match(source, /bg-white/);
});

test("DockVoiceNote incluye botón cancelar X a la izquierda y botón de parada a la derecha", () => {
  assert.match(source, /<X className="w-4 h-4"/);
  assert.match(source, /<Square className="w-3.5 h-3.5 fill-current"/);
  assert.match(source, /onCancel\(\)/);
  assert.match(source, /onStop\(\)/);
});

test("DockVoiceNote maneja la tecla Escape para cancelar la sesión de audio", () => {
  assert.match(source, /e\.key === "Escape"/);
  assert.match(source, /onCancel\(\)/);
  assert.match(source, /window\.addEventListener\("keydown"/);
});

test("DockVoiceNote incluye simulación estocástica de ondas de voz standIn", () => {
  assert.match(source, /function standIn\(t: number\)/);
  assert.match(source, /Math\.sin\(t \* 6\.1\)/);
});
