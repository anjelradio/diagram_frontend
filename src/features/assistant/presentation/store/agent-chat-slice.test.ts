import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import { test } from "node:test";
import type { MultimodalDraftAttachment } from "../../domain/entities/multimodal-draft.entity.ts";
import type { AgentMessage } from "../../domain/entities/agent-message.entity.ts";
import { createAgentChatSlice } from "./agent-chat-slice.ts";

const projectId = "project-test";

function createTestStore() {
  return createStore(createAgentChatSlice);
}

function submit(store: ReturnType<typeof createTestStore>, text: string, attachment?: MultimodalDraftAttachment) {
  store.getState().setAssistantDraftText(projectId, text);
  if (attachment !== undefined) store.getState().setAssistantDraftAttachment(projectId, attachment);
  return store.getState().submitAssistantDraft(projectId, "user-1", "Ada");
}

function terminalMessage(id: string, userId = "user-1", messageProjectId = projectId): AgentMessage {
  return {
    id,
    projectId: messageProjectId,
    userId,
    authorName: "Ada",
    prompt: "Prompt persistido",
    imageUrl: null,
    status: "completed",
    cancelRequested: false,
    responseMarkdown: "Listo.",
    createdAt: "2026-11-04T12:00:00Z",
  };
}

test("mantiene un activo, acepta tres pendientes y conserva el borrador al llenarse", () => {
  const store = createTestStore();
  assert.equal(submit(store, "Activo"), true);
  const originalMessageId = store.getState().assistantSessions[projectId].active?.id as string;

  assert.equal(submit(store, "Pendiente 1"), true);
  assert.equal(submit(store, "Pendiente 2"), true);
  assert.equal(submit(store, "Pendiente 3"), true);
  assert.equal(submit(store, "No cabe"), false);

  const fullSession = store.getState().assistantSessions[projectId];
  assert.equal(fullSession.active?.status, "running");
  assert.equal(fullSession.pending.length, 3);
  assert.equal(fullSession.draft.text, "No cabe");

  store.getState().applyAssistantMessageFinished(projectId, terminalMessage(originalMessageId), "user-1");
  const promotedSession = store.getState().assistantSessions[projectId];
  assert.equal(promotedSession.active?.text, "Pendiente 1");
  assert.equal(promotedSession.active?.submissionState, "ready");
  assert.equal(promotedSession.pending.map(({ text }) => text).join(","), "Pendiente 2,Pendiente 3");

  store.getState().applyAssistantMessageFinished(projectId, terminalMessage(originalMessageId), "user-1");
  assert.equal(store.getState().assistantSessions[projectId].active?.text, "Pendiente 1");
  assert.equal(store.getState().assistantSessions[projectId].messages.filter(({ id }) => id === `${originalMessageId}:response`).length, 1);
});

test("editar extrae el pendiente al input y al reenviar se añade al final de la cola", () => {
  const store = createTestStore();
  submit(store, "Activo");
  submit(store, "Editarme");
  submit(store, "Después");
  store.getState().setAssistantDraftText(projectId, "Borrador previo que se sobreescribe");

  const pending = store.getState().assistantSessions[projectId].pending;
  store.getState().takeAssistantMessageForEdit(projectId, pending[0].id);
  assert.equal(store.getState().assistantSessions[projectId].draft.text, "Editarme");
  assert.equal(store.getState().assistantSessions[projectId].pending.length, 1);

  store.getState().setAssistantDraftText(projectId, "Instrucción editada");
  assert.equal(store.getState().submitAssistantDraft(projectId, "user-1", "Ada"), true);

  const session = store.getState().assistantSessions[projectId];
  assert.deepEqual(session.pending.map(({ text }) => text), ["Después", "Instrucción editada"]);
  assert.equal(session.draft.text, "");
  assert.equal(session.draft.editingMessageId, null);
});

test("la cancelación solicita estado y solo terminal confirmado promueve una vez", () => {
  const store = createTestStore();
  submit(store, "Activo");
  const activeId = store.getState().assistantSessions[projectId].active?.id as string;
  submit(store, "Primero");
  submit(store, "Segundo");

  store.getState().requestAssistantCancellation(projectId, activeId);
  assert.equal(store.getState().assistantSessions[projectId].active?.status, "cancelling");
  assert.equal(store.getState().assistantSessions[projectId].pending.length, 2);

  store.getState().applyAssistantMessageFinished(projectId, { ...terminalMessage(activeId), status: "cancelled", responseMarkdown: "Cancelado." }, "user-1");
  const session = store.getState().assistantSessions[projectId];
  assert.equal(session.active?.text, "Primero");
  assert.equal(session.pending[0].text, "Segundo");

  const promotedId = session.active?.id;
  store.getState().applyAssistantMessageFinished(projectId, { ...terminalMessage(activeId), status: "cancelled", responseMarkdown: "Cancelado." }, "user-1");
  assert.equal(store.getState().assistantSessions[projectId].active?.id, promotedId);
});

test("preserva el adjunto al encolar, extraer para editar y reenviar", () => {
  const store = createTestStore();
  const attachment: MultimodalDraftAttachment = {
    id: "image-1",
    file: {} as File,
    previewUrl: "blob:agent-test-image",
    name: "diagrama.png",
    mimeType: "image/png",
    sizeBytes: 128,
  };
  submit(store, "Activo");
  submit(store, "Analiza este diagrama", attachment);
  const queued = store.getState().assistantSessions[projectId].pending[0];
  store.getState().takeAssistantMessageForEdit(projectId, queued.id);
  assert.equal(store.getState().assistantSessions[projectId].draft.attachment, attachment);
  store.getState().setAssistantDraftText(projectId, "Analiza el diagrama otra vez");
  store.getState().submitAssistantDraft(projectId, "user-1", "Ada");

  const session = store.getState().assistantSessions[projectId];
  assert.equal(session.pending[0].text, "Analiza el diagrama otra vez");
  assert.equal(session.pending[0].attachment, attachment);
});

test("no permite poner una imagen sola en ejecución ni en cola", () => {
  const store = createTestStore();
  store.getState().setAssistantDraftAttachment(projectId, {
    id: "image-only",
    file: {} as File,
    previewUrl: "blob:image-only",
    name: "diagram.png",
    mimeType: "image/png",
    sizeBytes: 10,
  });
  assert.equal(store.getState().submitAssistantDraft(projectId, "user-1", "Ada"), false);
  assert.equal(store.getState().assistantSessions[projectId].active, null);
  assert.ok(store.getState().assistantSessions[projectId].draft.attachment);
});

test("el mensaje aceptado usa el UUID del store y se conserva hasta recibir su terminal", () => {
  const store = createTestStore();
  submit(store, "Prompt correlacionado");
  const active = store.getState().assistantSessions[projectId].active!;
  assert.equal(active.runId, active.id);
  store.getState().markAssistantMessageSubmitting(projectId, active.id);
  store.getState().acceptAssistantMessage(projectId, {
    ...terminalMessage(active.id),
    status: "running",
    responseMarkdown: null,
  }, "user-1");
  assert.equal(store.getState().assistantSessions[projectId].active?.id, active.id);
  assert.equal(store.getState().assistantSessions[projectId].active?.submissionState, "accepted");
});

test("accepted y HTTP reconcilian por UUID sin duplicar ni degradar un terminal", () => {
  const store = createTestStore();
  submit(store, "Crear factura");
  const id = store.getState().assistantSessions[projectId].active!.id;
  const accepted: AgentMessage = {
    ...terminalMessage(id),
    status: "running",
    responseMarkdown: null,
  };

  store.getState().acceptAssistantMessage(projectId, accepted, "user-1");
  store.getState().acceptAssistantMessage(projectId, accepted, "user-1");
  assert.equal(store.getState().assistantSessions[projectId].messages.filter((message) => message.id === id).length, 1);

  store.getState().applyAssistantMessageFinished(projectId, terminalMessage(id), "user-1");
  store.getState().acceptAssistantMessage(projectId, accepted, "user-1");
  const messages = store.getState().assistantSessions[projectId].messages;
  assert.equal(messages.find((message) => message.id === id)?.status, "completed");
  assert.equal(messages.filter((message) => message.id === `${id}:response`).length, 1);
});

test("respuesta recién terminal anima una vez; historial hidratado no se anima", () => {
  const store = createTestStore();
  submit(store, "Completa esto");
  const id = store.getState().assistantSessions[projectId].active!.id;
  store.getState().applyAssistantMessageFinished(projectId, terminalMessage(id), "user-1");
  const responseId = `${id}:response`;
  assert.equal(store.getState().assistantSessions[projectId].messages.find((message) => message.id === responseId)?.animateResponse, true);

  store.getState().clearAssistantResponseAnimation(projectId, responseId);
  assert.equal(store.getState().assistantSessions[projectId].messages.find((message) => message.id === responseId)?.animateResponse, false);

  store.getState().hydrateAssistantHistory(projectId, {
    items: [terminalMessage("history-id")],
    limit: 6,
    offset: 0,
    nextOffset: null,
    hasMore: false,
    snapshotAt: "2026-11-05T12:01:00Z",
  });
  assert.equal(store.getState().assistantSessions[projectId].messages.find((message) => message.id === "history-id:response")?.animateResponse, false);
});

test("un accepted remoto se añade una sola vez y la cola local no se transmite", () => {
  const store = createTestStore();
  submit(store, "Mi mensaje activo");
  submit(store, "Solo local en cola");
  const remote = { ...terminalMessage("remote-id", "peer-1"), status: "running" as const, responseMarkdown: null };
  store.getState().acceptAssistantMessage(projectId, remote, "user-1");
  store.getState().acceptAssistantMessage(projectId, remote, "user-1");

  const session = store.getState().assistantSessions[projectId];
  assert.equal(session.messages.filter((message) => message.id === "remote-id").length, 1);
  assert.deepEqual(session.pending.map(({ text }) => text), ["Solo local en cola"]);
});

test("actividad ignora duplicados, secuencias antiguas y mensajes que ya terminaron", () => {
  const store = createTestStore();
  submit(store, "Activo");
  const id = store.getState().assistantSessions[projectId].active!.id;
  const activity = {
    projectId,
    messageId: id,
    attemptId: "attempt-1",
    sequence: 2,
    activityCode: "editing_class" as const,
    occurredAt: "2026-11-05T12:00:02Z",
  };

  store.getState().applyAssistantMessageActivity(projectId, activity);
  store.getState().applyAssistantMessageActivity(projectId, activity);
  store.getState().applyAssistantMessageActivity(projectId, { ...activity, sequence: 1, activityCode: "planning" });
  assert.equal(store.getState().assistantSessions[projectId].messages.find((message) => message.id === id)?.activityCode, "editing_class");

  store.getState().applyAssistantMessageFinished(projectId, terminalMessage(id), "user-1");
  store.getState().applyAssistantMessageActivity(projectId, { ...activity, sequence: 3, activityCode: "finalizing" });
  const prompt = store.getState().assistantSessions[projectId].messages.find((message) => message.id === id);
  assert.equal(prompt?.status, "completed");
  assert.equal(prompt?.activityCode, undefined);
});

test("nuevo intento ordenado reemplaza la etapa; comparación ambigua vuelve a Pensando", () => {
  const store = createTestStore();
  submit(store, "Activo");
  const id = store.getState().assistantSessions[projectId].active!.id;
  const message = {
    projectId,
    messageId: id,
    attemptId: "attempt-1",
    sequence: 8,
    activityCode: "editing_class" as const,
    occurredAt: "2026-11-05T12:00:00Z",
  };
  store.getState().applyAssistantMessageActivity(projectId, message);
  store.getState().applyAssistantMessageActivity(projectId, {
    ...message,
    attemptId: "attempt-2",
    sequence: 1,
    activityCode: "planning",
    occurredAt: "2026-11-05T12:00:01Z",
  });
  const plannedPrompt = store.getState().assistantSessions[projectId].messages.find((item) => item.id === id);
  assert.equal(plannedPrompt?.activityCode, "planning");
  assert.equal(plannedPrompt?.activityType, "planning");

  store.getState().applyAssistantMessageActivity(projectId, {
    ...message,
    attemptId: "attempt-3",
    sequence: 1,
    activityCode: "reading_classes",
    occurredAt: "invalid-time",
  });
  const prompt = store.getState().assistantSessions[projectId].messages.find((item) => item.id === id);
  assert.equal(prompt?.activityCode, null);
  assert.equal(prompt?.activityType, null);
  assert.equal(prompt?.activityStale, false);
});

test("al desconectar elimina la etapa posiblemente obsoleta y no altera mensajes terminales", () => {
  const store = createTestStore();
  submit(store, "Activo");
  const id = store.getState().assistantSessions[projectId].active!.id;
  store.getState().applyAssistantMessageActivity(projectId, {
    projectId,
    messageId: id,
    attemptId: "attempt-1",
    sequence: 1,
    activityCode: "planning",
    occurredAt: "2026-11-05T12:00:00Z",
  });
  store.getState().setAssistantActivityConnection(projectId, false);
  const prompt = store.getState().assistantSessions[projectId].messages.find((message) => message.id === id);
  assert.equal(prompt?.activityCode, null);
  assert.equal(prompt?.activityType, null);
  assert.equal(prompt?.activityStale, true);
  assert.equal(prompt?.status, "running");

  store.getState().applyAssistantMessageFinished(projectId, terminalMessage(id), "user-1");
  store.getState().setAssistantActivityConnection(projectId, false);
  const terminal = store.getState().assistantSessions[projectId].messages.find((message) => message.id === id);
  assert.equal(terminal?.status, "completed");
  assert.notEqual(terminal?.activityStale, true);
});

test("otra ejecución activa mantiene progreso aislado por message_id", () => {
  const store = createTestStore();
  submit(store, "Ejecución propia");
  const ownId = store.getState().assistantSessions[projectId].active!.id;
  store.getState().acceptAssistantMessage(projectId, {
    ...terminalMessage("peer-active", "peer-1"),
    status: "running",
    responseMarkdown: null,
  }, "user-1");
  store.getState().applyAssistantMessageActivity(projectId, {
    projectId,
    messageId: "peer-active",
    attemptId: "peer-attempt",
    sequence: 1,
    activityCode: "reading_classes",
    occurredAt: "2026-11-05T12:00:00Z",
  });
  const messages = store.getState().assistantSessions[projectId].messages;
  assert.equal(messages.find((message) => message.id === "peer-active")?.activityCode, "reading_classes");
  assert.equal(messages.find((message) => message.id === "peer-active")?.activityType, "query");
  assert.equal(messages.find((message) => message.id === ownId)?.activityCode, undefined);
  assert.equal(store.getState().assistantSessions[projectId].active?.id, ownId);
});

test("un terminal de otro autor no apaga ni avanza la cola local", () => {
  const store = createTestStore();
  submit(store, "Mi ejecución");
  submit(store, "Mi pendiente");
  const ownActiveId = store.getState().assistantSessions[projectId].active!.id;
  store.getState().applyAssistantMessageFinished(projectId, terminalMessage("peer-message", "peer-2"), "user-1");
  assert.equal(store.getState().assistantSessions[projectId].active?.id, ownActiveId);
  assert.equal(store.getState().assistantSessions[projectId].pending.length, 1);
});

test("un evento de otro proyecto no muta la sesión activa", () => {
  const store = createTestStore();
  submit(store, "Proyecto uno");
  store.getState().setAssistantDraftText("project-two", "Trabajo de otro proyecto");
  store.getState().submitAssistantDraft("project-two", "user-1", "Ada");
  const otherMessageId = store.getState().assistantSessions["project-two"].active!.id;
  store.getState().applyAssistantMessageActivity("project-two", {
    projectId: "project-two",
    messageId: otherMessageId,
    attemptId: "other-attempt",
    sequence: 1,
    activityCode: "planning",
    occurredAt: "2026-11-05T12:00:00Z",
  });
  store.getState().applyAssistantMessageFinished("project-two", terminalMessage("other-project-message", "user-1", "project-two"), "user-1");
  assert.equal(store.getState().assistantSessions[projectId].active?.text, "Proyecto uno");
  assert.equal(store.getState().assistantSessions["project-two"].messages.find((message) => message.id === otherMessageId)?.activityCode, "planning");
  assert.equal(store.getState().assistantSessions["project-two"].active?.status, "running");
  assert.ok(store.getState().assistantSessions["project-two"].messages.some((message) => message.id === "other-project-message"));
});

test("mantiene conversaciones separadas por proyecto", () => {
  const store = createTestStore();
  store.getState().setAssistantDraftText("project-a", "A");
  store.getState().submitAssistantDraft("project-a", "user-1", "Ada");
  store.getState().setAssistantDraftText("project-b", "B");

  assert.equal(store.getState().assistantSessions["project-a"].active?.text, "A");
  assert.equal(store.getState().assistantSessions["project-b"].draft.text, "B");
});

test("applyAssistantMessageFinished abre automáticamente el chat del proyecto si estaba cerrado", () => {
  const store = createTestStore();
  // Inicialmente el chat está cerrado
  assert.equal(store.getState().assistantSessions[projectId]?.isOpen ?? false, false);
  store.getState().applyAssistantMessageFinished(projectId, terminalMessage("msg-1"), "user-1");
  assert.equal(store.getState().assistantSessions[projectId].isOpen, true);
});
