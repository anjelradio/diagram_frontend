import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./use-voice-recorder.ts", import.meta.url), "utf8");

test("cancelar la grabación local no envía audio ni activa un lock compartido", () => {
  const cancelStart = source.indexOf("const cancelRecording");
  const cancelBody = source.slice(cancelStart, source.indexOf("const toggleRecording", cancelStart));
  assert.doesNotMatch(cancelBody, /sendVoiceCommand/);
  assert.match(cancelBody, /audioChunksRef\.current = \[\]/);
  assert.match(cancelBody, /cleanupStream\(\)/);
});

test("detener envía una sola solicitud y libera submitting ante éxito o error", () => {
  assert.equal((source.match(/sendVoiceCommand\(/g) ?? []).length, 1);
  assert.match(source, /setIsSending\(true\)/);
  assert.match(source, /setIsSending\(false\)/);
  assert.match(source, /¡Tarea terminada!/);
});
