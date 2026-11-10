import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./use-agent-chat.ts", import.meta.url), "utf8");
const storeSource = readFileSync(
  new URL("../store/agent-chat-slice.ts", import.meta.url),
  "utf8"
);

test("useAgentChat expone el borrador, la cola y las acciones comunes", () => {
  for (const contract of [
    /isOpen/,
    /setIsOpen/,
    /toggleOpen/,
    /messages/,
    /inputText/,
    /setInputText/,
    /sendMessage/,
    /draftAttachment/,
    /attachImageFile/,
    /removeDraftAttachment/,
    /activeModalImageUrl/,
    /pendingMessages/,
    /takePendingForEdit/,
    /removePending/,
    /discardEdit/,
    /stopActive/,
  ]) assert.match(source, contract);
});

test("useAgentChat adapta el store Zustand compartido por proyecto", () => {
  assert.match(source, /useAppStore\(\(state\) => state\.assistantSessions\[projectId\]/);
  assert.match(source, /setAssistantDraftText/);
  assert.match(source, /submitAssistantDraft/);
  assert.match(source, /ensureAssistantSession/);
});

test("la ejecución depende del backend y no de temporizadores de simulación", () => {
  assert.match(source, /assistantRepositoryImpl\.submitMessage/);
  assert.match(source, /active\.submissionState !== "ready"/);
  assert.match(source, /markSubmitting\(projectId, active\.id\)/);
  assert.doesNotMatch(source, /SIMULATED_EXECUTION_MS|setTimeout\(/);
});

test("el mensaje que sale de la cola promocionada usa el mismo UUID y envío HTTP que dock/chat", () => {
  assert.match(source, /active\.submissionState !== "ready"/);
  assert.match(source, /messageId: active\.id/);
  assert.match(source, /assistantRepositoryImpl\.submitMessage/);
  assert.match(source, /acceptMessage\(projectId, result\.data, currentUserId\)/);
  assert.match(storeSource, /const active = startQueuedMessage\(nextPending\)/);
  assert.match(storeSource, /messages: \[\.\.\.session\.messages, createOptimisticMessage\(active\)\]/);
});

test("la imagen conserva validación de formato y tamaño y solo usa URL local de vista previa", () => {
  assert.match(source, /SUPPORTED_IMAGE_TYPES/);
  assert.match(source, /MAX_IMAGE_SIZE = 10 \* 1024 \* 1024/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /Escribe una instrucción antes de enviar la imagen/);
  assert.match(source, /image: active\.attachment\?\.file/);
});

test("el avatar de sesión acompaña el mensaje optimista y suplantarlo no afecta a colaboradores", () => {
  assert.match(source, /currentUserAvatarUrl/);
  assert.match(source, /submitDraft\(projectId, currentUserId, currentUserName, currentUserAvatarUrl\)/);
  assert.match(storeSource, /avatarUrl: message\.userAvatarUrl \?\? null/);
});

test("recupera historial y activo al montar y al reconectar", () => {
  assert.match(source, /listMessages\(\{ projectId, limit: HISTORY_PAGE_SIZE, offset: 0 \}\)/);
  assert.match(source, /getActiveMessage\(projectId\)/);
  assert.match(source, /realtimeStatus === "connected"/);
  assert.match(source, /getMessage\(projectId, localActive\.id\)/);
});
