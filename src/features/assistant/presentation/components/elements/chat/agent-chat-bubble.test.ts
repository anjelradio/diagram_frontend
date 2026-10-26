import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const bubbleSource = readFileSync(
  new URL("./agent-chat-bubble.tsx", import.meta.url),
  "utf8"
);
const aiMessageSource = readFileSync(
  new URL("./agent-ai-message.tsx", import.meta.url),
  "utf8"
);

test("AgentChatBubble aplica azul para usuario actual y gris para colaboradores", () => {
  assert.match(bubbleSource, /bg-blue-600 text-white/);
  assert.match(bubbleSource, /bg-zinc-800 text-zinc-100/);
  assert.match(bubbleSource, /senderName/);
  assert.match(bubbleSource, /"Tú"/);
});

test("AgentChatBubble y AgentAiMessage revelan la hora en hover", () => {
  assert.match(bubbleSource, /group-hover:opacity-100/);
  assert.match(bubbleSource, /formattedTime/);
  assert.match(aiMessageSource, /group-hover:opacity-100/);
  assert.match(aiMessageSource, /formattedTime/);
});

test("AgentAiMessage renderiza texto plano minimalista sin burbuja ni icono", () => {
  assert.doesNotMatch(aiMessageSource, /rounded-2xl/);
  assert.doesNotMatch(aiMessageSource, /bg-blue-600/);
  assert.doesNotMatch(aiMessageSource, /<img/);
  assert.match(aiMessageSource, /text-zinc-200 leading-relaxed/);
});

test("AgentChatBubble implementa límite de altura máxima con degradado y botones Ver más / Ver menos", () => {
  assert.match(bubbleSource, /COLLAPSED_MAX_HEIGHT/);
  assert.match(bubbleSource, /Ver más/);
  assert.match(bubbleSource, /Ver menos/);
  assert.match(bubbleSource, /bg-gradient-to-t from-blue-600/);
  assert.match(bubbleSource, /bg-gradient-to-t from-zinc-800/);
});

