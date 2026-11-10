import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const messageSource = readFileSync(new URL("./message.tsx", import.meta.url), "utf8");
const bubbleSource = readFileSync(new URL("./bubble.tsx", import.meta.url), "utf8");
const avatarSource = readFileSync(new URL("./avatar.tsx", import.meta.url), "utf8");

test("Message implementa alineación superior y reversión de fila para usuario actual", () => {
  assert.match(messageSource, /items-start/);
  assert.match(messageSource, /flex-row-reverse justify-start/);
  assert.match(messageSource, /flex-row justify-start/);
  assert.match(messageSource, /MessageContext/);
  assert.match(messageSource, /data-slot="message"/);
});

test("MessageAvatar se ancla estrictamente en la parte superior sin encogerse", () => {
  assert.match(messageSource, /self-start/);
  assert.match(messageSource, /shrink-0/);
});

test("Bubble implementa variantes default (azul) y muted (gris) con bordes circulares rounded-2xl", () => {
  assert.match(bubbleSource, /bg-blue-600 text-white/);
  assert.match(bubbleSource, /bg-zinc-800 text-zinc-100/);
  assert.match(bubbleSource, /rounded-2xl/);
  assert.match(bubbleSource, /BubbleContent/);
});

test("Avatar implementa primitivas accesibles Avatar, AvatarImage y AvatarFallback", () => {
  assert.match(avatarSource, /AvatarPrimitive\.Root/);
  assert.match(avatarSource, /AvatarPrimitive\.Image/);
  assert.match(avatarSource, /AvatarPrimitive\.Fallback/);
  assert.match(avatarSource, /rounded-full/);
});
