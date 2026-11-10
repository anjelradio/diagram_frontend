import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("./agent-chat-message-list.tsx", import.meta.url),
  "utf8"
);
const activitySource = readFileSync(
  new URL("./agent-activity-status.tsx", import.meta.url),
  "utf8"
);

test("AgentChatMessageList anima los mensajes con efecto fade-in, pop (zoom-in-95) y retraso suave al abrir", () => {
  assert.match(source, /message\.sender\.role !== "assistant"/);
  assert.match(source, /animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2/);
  assert.match(source, /duration-300 ease-out/);
  assert.match(source, /isInitialMount/);
  assert.match(source, /animationDelay/);
  assert.match(source, /animationFillMode: message\.sender\.role !== "assistant" && isInitialMount/);
});

test("AgentChatMessageList conserva scroll suave y soporte para min-h-0", () => {
  assert.match(source, /min-h-0/);
  assert.match(source, /element\.scrollTo/);
  assert.match(source, /scrollAnchorRef/);
});

test("AgentChatMessageList permite cargar más historial sin perder el ancla", () => {
  assert.match(source, /hasMoreHistory/);
  assert.match(source, /Cargar más/);
  assert.match(source, /anchor\.top \+ element\.scrollHeight - anchor\.height/);
});

test("AgentChatMessageList implementa máscara gradiente para desvanecimiento suave superior e inferior al scrollear", () => {
  assert.match(source, /mask-image:linear-gradient\(to_bottom,transparent_0%,black_24px/);
  assert.match(source, /-webkit-mask-image:linear-gradient\(to_bottom,transparent_0%,black_24px/);
});

test("AgentChatMessageList muestra mensaje plano y centrado cuando no hay mensajes", () => {
  assert.match(source, /Empieza a escribir o pregunta algo al asistente/);
  assert.match(source, /messages\.length === 0/);
});

test("AgentChatMessageList muestra la actividad una vez bajo el mensaje y anuncia cambios accesiblemente", () => {
  assert.match(source, /AgentActivityStatus/);
  assert.match(source, /type=\{message\.activityType\}/);
  assert.match(source, /flex justify-start/);
  assert.match(activitySource, /aria-live="polite"/);
  assert.match(activitySource, /getAgentActivityLabel/);
  assert.match(activitySource, /getAgentActivityType/);
  assert.match(activitySource, /Search/);
  assert.match(activitySource, /Pencil/);
  assert.match(activitySource, /ListTodo/);
  assert.match(activitySource, /Sparkles/);
  assert.match(activitySource, /Square/);
  assert.match(activitySource, /Spinner/);
  assert.match(activitySource, /text-zinc-400/);
  assert.match(activitySource, /pl-1 pr-2 py-0\.5 text-left self-start/);
  assert.match(source, /onResponseAnimationConsumed/);
  assert.match(source, /onAnimationConsumed=\{onResponseAnimationConsumed\}/);
});

test("AgentChatMessageList limpia la actividad efímera al finalizar y refleja cancelación", () => {
  // Solo se monta si el mensaje está en status 'running'
  assert.match(source, /message\.status === "running" &&/);
  // Propaga cancelRequested para mostrar el estado de cancelación
  assert.match(source, /cancelling=\{message\.cancelRequested\}/);
  assert.match(activitySource, /cancelling\s+\?\s+"Cancelando…"/);
});

test("AgentActivityStatus soporta recalling_conversation con etiqueta amigable e icono de búsqueda", async () => {
  const { getAgentActivityLabel, getAgentActivityType } = await import(
    "../../../../domain/entities/agent-activity.entity.ts"
  );
  assert.equal(getAgentActivityLabel("recalling_conversation"), "Recordando conversaciones…");
  assert.equal(getAgentActivityType("recalling_conversation"), "query");
});

test("AgentChatMessageList posiciona el scroll al fondo (último mensaje) en carga inicial", () => {
  assert.match(source, /previousMessageCountRef = useRef\(0\)/);
  assert.match(source, /previousMessageCountRef\.current === 0 && messages\.length > 0/);
  assert.match(source, /scrollToBottom\(true\)/);
  assert.match(source, /bottomSentinelRef/);
});
