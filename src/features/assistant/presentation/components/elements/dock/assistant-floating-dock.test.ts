import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./assistant-floating-dock.tsx", import.meta.url), "utf8");
const voiceNoteSource = readFileSync(new URL("./dock-voice-note.tsx", import.meta.url), "utf8");

test("AssistantFloatingDock conserva su diseño adaptable y las microinteracciones", () => {
  assert.match(source, /rounded-full/);
  assert.match(source, /bg-\[#191a1d\]\/95/);
  assert.match(source, /motion\.form/);
  assert.match(source, /layoutId="dock-text-pill"/);
  assert.match(source, /MIN_TEXTAREA_HEIGHT = 42/);
  assert.match(source, /MAX_TEXTAREA_HEIGHT = 160/);
  assert.match(source, /scrollbar-width:thin/);
  assert.match(source, /0\.22,\s*1,\s*0\.36,\s*1/);
});

test("AssistantFloatingDock comparte la tarjeta de cola y permite editar o borrar", () => {
  assert.match(source, /<AgentQueueCard/);
  assert.match(source, /pendingMessages/);
  assert.match(source, /onEditPending/);
  assert.match(source, /onRemovePending/);
  assert.match(source, /pendingMessages\.length > 0 && \(isRecording/);
});

test("AssistantFloatingDock muestra miniatura interna y permite retirar la imagen", () => {
  assert.match(source, /<ComposerImagePreview/);
  assert.match(source, /onPreviewAttachment/);
  assert.match(source, /onRemoveAttachment/);
  assert.doesNotMatch(source, /ImageAttachmentBadge/);
});

test("AssistantFloatingDock conserva la imagen pero bloquea el envío si falta el prompt", () => {
  assert.match(source, /const isInputEmpty = value\.trim\(\)\.length === 0/);
  assert.match(source, /const hasContent = !isInputEmpty \|\| Boolean\(draftAttachment\)/);
  assert.match(source, /isSendDisabled = isDisabled \|\| isInputEmpty/);
  assert.match(source, /Escribe una instrucción para enviar la imagen/);
  assert.match(source, /disabled=\{isSendDisabled\}/);
});

test("AssistantFloatingDock permite enviar mientras procesa, detener y bloquear audio con la cola llena", () => {
  assert.match(source, /isProcessing && isQueueFull/);
  assert.match(source, /Detener respuesta del asistente/);
  assert.match(source, /disabled=\{isAudioDisabled\}/);
  assert.match(source, /isQueueFull/);
});

test("AssistantFloatingDock conserva la grabación y el pegado de imágenes", () => {
  assert.match(source, /<DockVoiceNote/);
  assert.match(voiceNoteSource, /<Square className="w-3\.5 h-3\.5 fill-current"/);
  assert.match(source, /onPaste=\{handlePaste\}/);
  assert.match(source, /item\.type\.startsWith\("image\/"\)/);
});

test("AssistantFloatingDock muestra píldora de transcripción con spinner mientras procesa el audio", () => {
  assert.match(source, /isTranscribing/);
  assert.match(source, /Transcribiendo y enviando…/);
  assert.match(source, /isVoicePill/);
});
