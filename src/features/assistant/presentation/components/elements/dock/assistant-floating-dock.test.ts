import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./assistant-floating-dock.tsx", import.meta.url), "utf8");

const voiceNoteSource = readFileSync(new URL("./dock-voice-note.tsx", import.meta.url), "utf8");

test("AssistantFloatingDock aplica diseño en píldora con microinteracciones y Framer Motion", () => {
  assert.match(source, /rounded-full/);
  assert.match(source, /bg-\[#191a1d\]\/95/);
  assert.match(source, /motion\.form/);
  assert.match(source, /layoutId="dock-text-pill"/);
  assert.match(source, /bg-\[#282a30\]/);
  assert.match(source, /bg-blue-600[\s\S]*Mic/);
  assert.match(source, /MIN_TEXTAREA_HEIGHT = 42/);
  assert.match(source, /MAX_TEXTAREA_HEIGHT = 160/);
  assert.match(source, /scrollbar-width:thin/);
  assert.match(source, /0\.22,\s*1,\s*0\.36,\s*1/);
});

test("AssistantFloatingDock renderiza ImageAttachmentBadge encima de la barra", () => {
  assert.match(source, /<ImageAttachmentBadge/);
  assert.match(source, /absolute -top-11 left-6/);
  assert.match(source, /draftAttachment/);
});

test("AssistantFloatingDock inhabilita el botón de adjuntar imagen cuando ya existe un adjunto", () => {
  assert.match(source, /disabled=\{isDisabled \|\| Boolean\(draftAttachment\)\}/);
  assert.match(source, /opacity-40 cursor-not-allowed/);
});

test("AssistantFloatingDock alterna dinámicamente entre micrófono y envío según contenido de texto o imagen", () => {
  assert.match(source, /const hasContent = !isInputEmpty \|\| Boolean\(draftAttachment\)/);
  assert.match(source, /<ArrowUp/);
  assert.match(source, /<Mic/);
});

test("AssistantFloatingDock integra DockVoiceNote con botón X, ondas y botón Square", () => {
  assert.match(source, /<DockVoiceNote/);
  assert.match(voiceNoteSource, /bg-blue-600/);
  assert.match(voiceNoteSource, /<X className="w-4 h-4"/);
  assert.match(voiceNoteSource, /<Square className="w-3.5 h-3.5 fill-current"/);
  assert.match(voiceNoteSource, /e\.key === "Escape"/);
});

test("AssistantFloatingDock soporta pegado directo de imágenes desde portapapeles", () => {
  assert.match(source, /onPaste=\{handlePaste\}/);
  assert.match(source, /item\.type\.startsWith\("image\/"\)/);
});
