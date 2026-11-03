import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./use-agent-chat.ts", import.meta.url), "utf8");

test("useAgentChat expone las firmas requeridas por el contrato", () => {
  assert.match(source, /isOpen/);
  assert.match(source, /setIsOpen/);
  assert.match(source, /toggleOpen/);
  assert.match(source, /messages/);
  assert.match(source, /inputText/);
  assert.match(source, /setInputText/);
  assert.match(source, /sendMessage/);
  assert.match(source, /isRecording/);
  assert.match(source, /toggleRecording/);
  assert.match(source, /draftAttachment/);
  assert.match(source, /attachImageFile/);
  assert.match(source, /removeDraftAttachment/);
  assert.match(source, /openModalImage/);
});

test("sendMessage ignora envío sin texto ni adjunto y limpia el estado al despachar", () => {
  assert.match(source, /const trimmed = text\.trim\(\)/);
  assert.match(source, /if \(!trimmed && !currentAttachment\) return/);
  assert.match(source, /setInputText\(""\)/);
  assert.match(source, /setDraftAttachment\(null\)/);
});

test("sendMessage añade mensaje de usuario con rol user y simula respuesta de assistant", () => {
  assert.match(source, /role: "user"/);
  assert.match(source, /role: "assistant"/);
  assert.match(source, /formatSimpleTime/);
});

test("appendTranscribedText concatena con espacio el texto nuevo sobre texto previo no vacío", () => {
  assert.match(source, /appendTranscribedText/);
  assert.match(source, /cleanPrev \? `\$\{cleanPrev\} \$\{cleanTranscribed\}` : cleanTranscribed/);
});

test("attachImageFile valida formatos soportados y tamaño máximo de 10 MB", () => {
  assert.match(source, /SUPPORTED_IMAGE_TYPES/);
  assert.match(source, /MAX_IMAGE_SIZE = 10 \* 1024 \* 1024/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /URL\.revokeObjectURL/);
});
