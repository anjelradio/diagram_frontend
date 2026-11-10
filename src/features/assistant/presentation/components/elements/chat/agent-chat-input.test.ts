import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./agent-chat-input.tsx", import.meta.url), "utf8");

test("AgentChatInput mantiene vista previa cuadrada dentro del compositor", () => {
  assert.match(source, /<ComposerImagePreview/);
  assert.match(source, /onPreviewAttachment/);
  assert.match(source, /onRemoveAttachment/);
  assert.doesNotMatch(source, /ImageAttachmentBadge/);
});

test("AgentChatInput permite encolar mientras procesa y deshabilita al llegar al máximo", () => {
  assert.match(source, /hasActiveMessage && isQueueFull/);
  assert.match(source, /Añadir mensaje a la cola/);
  assert.match(source, /disabled=\{disabled \|\| isQueueFull\}/);
});

test("AgentChatInput no permite enviar una imagen sin prompt y lo comunica de forma accesible", () => {
  assert.match(source, /const hasPrompt = value\.trim\(\)\.length > 0/);
  assert.match(source, /sendDisabled = disabled \|\| !hasPrompt/);
  assert.match(source, /Escribe una instrucción para poder enviar la imagen/);
  assert.match(source, /disabled=\{sendDisabled\}/);
});

test("AgentChatInput expone cancelar y comunica textualmente el estado de cancelación", () => {
  assert.match(source, /Detener respuesta del asistente/);
  assert.match(source, /isCancelling \? "Cancelando instrucción"/);
  assert.match(source, /<Square/);
});

test("AgentChatInput conserva teclado, autoajuste del área de texto y estados de STT", () => {
  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /MAX_TEXTAREA_HEIGHT/);
  assert.match(source, /textarea\.scrollHeight/);
  assert.match(source, /sttState\?\.status === "downloading"/);
  assert.match(source, /sttState\?\.status === "recording"/);
  assert.match(source, /sttState\?\.status === "transcribing"/);
  assert.match(source, /event\.key === "Escape"/);
});

test("AgentChatInput no muestra descartar edición y unifica el botón dinámico", () => {
  assert.doesNotMatch(source, /Editando mensaje en espera/);
  assert.doesNotMatch(source, /Descartar edición/);
  assert.match(source, /hasContent \? \(/);
  assert.match(source, /hasActiveMessage \? \(/);
});
