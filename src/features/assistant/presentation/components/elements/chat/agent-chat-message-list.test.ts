import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("./agent-chat-message-list.tsx", import.meta.url),
  "utf8"
);

test("AgentChatMessageList anima los mensajes con efecto fade-in, pop (zoom-in-95) y retraso suave al abrir", () => {
  assert.match(source, /animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2/);
  assert.match(source, /duration-300 ease-out/);
  assert.match(source, /isInitialMount/);
  assert.match(source, /animationDelay/);
  assert.match(source, /animationFillMode: "both"/);
});

test("AgentChatMessageList contiene scroll suave y soporte para min-h-0", () => {
  assert.match(source, /min-h-0/);
  assert.match(source, /listRef\.current\.scrollTo/);
});

test("AgentChatMessageList implementa máscara gradiente para desvanecimiento suave superior e inferior al scrollear", () => {
  assert.match(source, /mask-image:linear-gradient\(to_bottom,transparent_0%,black_24px/);
  assert.match(source, /-webkit-mask-image:linear-gradient\(to_bottom,transparent_0%,black_24px/);
});

