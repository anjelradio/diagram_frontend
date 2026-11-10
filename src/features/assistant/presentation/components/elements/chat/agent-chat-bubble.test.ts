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

test("AgentAiMessage renderiza Markdown seguro sin burbuja ni icono", () => {
  assert.doesNotMatch(aiMessageSource, /rounded-2xl/);
  assert.doesNotMatch(aiMessageSource, /bg-blue-600/);
  assert.doesNotMatch(aiMessageSource, /<img/);
  assert.match(aiMessageSource, /ReactMarkdown/);
  assert.match(aiMessageSource, /remarkGfm/);
  assert.match(aiMessageSource, /rel="noopener noreferrer"/);
  assert.doesNotMatch(aiMessageSource, /rehypeRaw/);
});

test("AgentChatBubble implementa límite de altura máxima con degradado y botones Ver más / Ver menos", () => {
  assert.match(bubbleSource, /COLLAPSED_MAX_HEIGHT/);
  assert.match(bubbleSource, /Ver más/);
  assert.match(bubbleSource, /Ver menos/);
  assert.match(bubbleSource, /bg-gradient-to-t from-blue-600/);
  assert.match(bubbleSource, /bg-gradient-to-t from-zinc-800/);
});

test("AgentChatBubble integra Message, MessageAvatar, Avatar y Bubble con anclaje superior", () => {
  assert.match(bubbleSource, /Message/);
  assert.match(bubbleSource, /MessageAvatar/);
  assert.match(bubbleSource, /Avatar/);
  assert.match(bubbleSource, /AvatarImage/);
  assert.match(bubbleSource, /src=\{message\.sender\.avatarUrl/);
  assert.match(bubbleSource, /AvatarFallback/);
  assert.match(bubbleSource, /Bubble/);
  assert.match(bubbleSource, /align=\{isCurrentUser \? "end" : "start"\}/);
});

test("la respuesta Markdown recién terminada anima solo su contenedor y conserva movimiento reducido", () => {
  assert.match(aiMessageSource, /ReactMarkdown/);
  assert.match(aiMessageSource, /motion-safe:animate-in/);
  assert.match(aiMessageSource, /onAnimationConsumed/);
  assert.match(aiMessageSource, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(aiMessageSource, /onAnimationEnd=\{consumeAnimation\}/);
});

test("AgentChatBubble protege contra falsos desbordamientos en textos cortos como palabras simples", () => {
  assert.match(bubbleSource, /content\.length <= 120 && lineCount <= 4/);
  assert.match(bubbleSource, /requestAnimationFrame/);
});

