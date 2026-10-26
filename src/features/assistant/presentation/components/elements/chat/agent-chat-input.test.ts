import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./agent-chat-input.tsx", import.meta.url), "utf8");

test("AgentChatInput incluye botón de imagen a la izquierda", () => {
  assert.match(source, /ImagePlus/);
  assert.match(source, /onImageClick/);
  assert.match(source, /Adjuntar imagen/);
});

test("AgentChatInput conmuta dinámicamente el botón derecho entre Mic y ArrowUp", () => {
  assert.match(source, /const isInputEmpty = value\.trim\(\)\.length === 0/);
  assert.match(source, /isInputEmpty \?/);
  assert.match(source, /<Mic/);
  assert.match(source, /<ArrowUp/);
  assert.match(source, /bg-blue-600/);
});

test("AgentChatInput maneja tecla Enter y envío de formulario", () => {
  assert.match(source, /e\.key === "Enter"/);
  assert.match(source, /onSend\(value\)/);
  assert.match(source, /handleSubmit/);
});

test("AgentChatInput implementa diseño con color gris claro con contraste sin contorno ni sombra", () => {
  assert.doesNotMatch(source, /border-t border-white\/10/);
  assert.doesNotMatch(source, /border border-white/);
  assert.doesNotMatch(source, /shadow-xl/);
  assert.match(source, /rounded-2xl/);
  assert.match(source, /bg-\[#282a30\]/);
});

test("AgentChatInput estructura el dock en dos filas: textarea arriba y botones fijados abajo", () => {
  assert.match(source, /<textarea/);
  assert.match(source, /flex flex-col/);
  assert.match(source, /flex items-center justify-between/);
});

test("AgentChatInput expande dinámicamente el textarea hacia arriba y activa scroll al alcanzar el máximo", () => {
  assert.match(source, /MAX_TEXTAREA_HEIGHT/);
  assert.match(source, /textarea\.scrollHeight/);
  assert.match(source, /textarea\.style\.overflowY = "auto"/);
  assert.match(source, /textarea\.style\.overflowY = "hidden"/);
});

test("AgentChatInput garantiza por defecto la altura mínima de una sola línea cuando no hay texto", () => {
  assert.match(source, /MIN_TEXTAREA_HEIGHT/);
  assert.match(source, /if \(!value\)/);
  assert.match(source, /style=\{\{ height: MIN_TEXTAREA_HEIGHT \}\}/);
});

test("AgentChatInput soporta estados de STT: downloading con icono de descarga y progreso SVG, recording con cuadrado rojo y transcribing con spinner", () => {
  assert.match(source, /sttState\?\.status === "downloading"/);
  assert.match(source, /sttState\.progress/);
  assert.match(source, /<Download/);
  assert.match(source, /sttState\?\.status === "recording"/);
  assert.match(source, /bg-red-600/);
  assert.match(source, /<Square/);
  assert.match(source, /sttState\?\.status === "transcribing"/);
  assert.match(source, /<Loader2/);
  assert.match(source, /onPauseClick/);
});



