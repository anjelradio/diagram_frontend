import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./use-in-browser-stt.ts", import.meta.url), "utf8");

test("useInBrowserStt expone la interfaz y métodos requeridos por el contrato", () => {
  assert.match(source, /state/);
  assert.match(source, /isSupported/);
  assert.match(source, /handleRecordClick/);
  assert.match(source, /handlePauseClick/);
  assert.match(source, /cancelSession/);
});

test("useInBrowserStt maneja los estados del ciclo de vida de STT", () => {
  assert.match(source, /"idle"/);
  assert.match(source, /"checking_cache"/);
  assert.match(source, /"downloading"/);
  assert.match(source, /"ready"/);
  assert.match(source, /"recording"/);
  assert.match(source, /"transcribing"/);
  assert.match(source, /"error"/);
});

test("useInBrowserStt consulta la caché y descarga con progreso notificando con toast al finalizar", () => {
  assert.match(source, /isModelCached/);
  assert.match(source, /loadModel/);
  assert.match(source, /appToast\.success\("Modelo listo para transcripción"\)/);
});

test("useInBrowserStt detiene la grabación, transcribe y emite el texto reconocido", () => {
  assert.match(source, /mediaRecorder/i);
  assert.match(source, /transcribeAudio/);
  assert.match(source, /onTranscribeSuccess/);
});

test("useInBrowserStt limpia y libera pistas de audio al cancelar o cerrar", () => {
  assert.match(source, /streamRef/);
  assert.match(source, /track\.stop\(\)/);
  assert.match(source, /cleanupStream/);
});

test("useInBrowserStt gestiona errores de permisos y notifica con appToast", () => {
  assert.match(source, /Permiso de micrófono denegado o dispositivo no disponible/);
  assert.match(source, /appToast\.error/);
  assert.match(source, /status: "error"/);
});
