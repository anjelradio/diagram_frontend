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
});

test("sendMessage ignora texto vacío y limpia inputText al enviar", () => {
  assert.match(source, /const trimmed = text\.trim\(\)/);
  assert.match(source, /if \(!trimmed\) return/);
  assert.match(source, /setInputText\(""\)/);
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
