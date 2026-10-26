import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./agent-chat-widget.tsx", import.meta.url), "utf8");

test("AgentChatWidget implementa animación fluida y bordes redondeados", () => {
  assert.match(source, /transition-all duration-300/);
  assert.match(source, /rounded-3xl/);
  assert.match(source, /rounded-2xl/);
  assert.match(source, /overflow-hidden/);
});

test("AgentChatWidget maneja la tecla Escape para colapsar", () => {
  assert.match(source, /e\.key === "Escape"/);
  assert.match(source, /chat\.setIsOpen\(false\)/);
  assert.match(source, /window\.addEventListener\("keydown"/);
});

test("AgentChatWidget alterna entre botón y cabecera según el estado de apertura", () => {
  assert.match(source, /AgentTriggerButton/);
  assert.match(source, /AgentChatHeader/);
  assert.match(source, /chat\.isOpen/);
});

test("AgentChatWidget integra AgentChatMessageList y AgentChatInput", () => {
  assert.match(source, /AgentChatMessageList/);
  assert.match(source, /AgentChatInput/);
  assert.match(source, /onSend={chat\.sendMessage}/);
});

test("AgentChatWidget no sobredimensiona el botón durante el colapso", () => {
  assert.doesNotMatch(source, /AgentTriggerButton[^>]*className="w-full h-full"/);
  assert.match(source, /!chat\.isOpen \? \(/);
});

test("AgentChatWidget se expande verticalmente hacia abajo con altura completa", () => {
  assert.match(source, /h-\[calc\(100vh-84px\)\]/);
  assert.match(source, /max-h-\[calc\(100vh-84px\)\]/);
});

test("AgentChatWidget aplica el color de superficie #191a1d", () => {
  assert.match(source, /bg-\[#191a1d\]/);
});

test("AgentChatWidget integra useInBrowserStt y pasa sttState a AgentChatInput", () => {
  assert.match(source, /useInBrowserStt/);
  assert.match(source, /sttState=\{stt\.state\}/);
  assert.match(source, /onPauseClick/);
  assert.match(source, /stt\.cancelSession\(\)/);
});




