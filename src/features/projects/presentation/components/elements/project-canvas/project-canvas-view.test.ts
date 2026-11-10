import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./project-canvas-view.tsx", import.meta.url), "utf8");

test("ProjectCanvasView configura instancias independientes de STT para el chat lateral y el dock flotante", () => {
  // lateralStt transcribe y coloca en input para revisión manual
  assert.match(source, /lateralStt = useInBrowserStt/);
  assert.match(source, /chat\.appendTranscribedText\(transcribedText\)/);
  assert.match(source, /<AgentChatWidget[^>]*stt=\{lateralStt\}/);

  // dockStt auto-envía directamente la instrucción al finalizar la grabación
  assert.match(source, /dockStt = useInBrowserStt/);
  assert.match(source, /handleDockTranscribeSuccess/);
  assert.match(source, /chat\.sendMessage\(fullText, attachment\)/);
  assert.match(source, /sttState=\{dockStt\.state\}/);
  assert.match(source, /onAudioStart=\{dockStt\.handleRecordClick\}/);
  assert.match(source, /onAudioStop=\{dockStt\.handlePauseClick\}/);
  assert.match(source, /onAudioCancel=\{dockStt\.cancelSession\}/);
});

test("ProjectCanvasView activa visualState recording cuando cualquiera de los STT está grabando", () => {
  assert.match(source, /lateralStt\.state\.status === "recording" \|\| dockStt\.state\.status === "recording"/);
});

test("ProjectCanvasView restringe el botón de integraciones exclusivamente al rol OWNER mediante capabilities.canManageIntegrations", () => {
  assert.match(source, /capabilities\.canManageIntegrations\s*&&\s*\(\s*<div[^>]*>\s*<IntegrationsPopoverButton/);
});

test("ProjectCanvasView ubica el botón de integraciones debajo del botón de miembros del proyecto en la cabecera", () => {
  assert.match(source, /<ProjectMembersPopover[\s\S]*?<IntegrationsPopoverButton/);
});
