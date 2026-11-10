import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import { createRealtimeSlice, type RealtimeSlice } from "../store/realtime-slice.ts";
import type { RealtimeServerMessage } from "../../domain/entities/realtime.entity.ts";
import { readFileSync } from "node:fs";

describe("useRealtimeSession - Manejo de mensajes de ciclo de vida", () => {
  const setup = () => {
    return createStore<RealtimeSlice>((...args) =>
      createRealtimeSlice(...args)
    );
  };

  it("invalida la etapa al desconectarse y la reconexión revalida el mensaje por HTTP", () => {
    const realtimeHook = readFileSync(
      new URL("./use-realtime-session.ts", import.meta.url),
      "utf8"
    );
    const agentHook = readFileSync(
      new URL("../../../assistant/presentation/hooks/use-agent-chat.ts", import.meta.url),
      "utf8"
    );
    assert.match(realtimeHook, /setAssistantActivityConnection\([\s\S]*status === "connected"/);
    assert.match(agentHook, /realtimeStatus === "connected"/);
    assert.match(agentHook, /getActiveMessage\(projectId\)/);
    assert.match(agentHook, /getMessage\(projectId, localActive\.id\)/);
  });

  it("procesa roleChanged a READER liberando locks locales", () => {
    const store = setup();
    store.getState().setLocalClassLock("class-1");
    assert.equal(store.getState().localLockedClassId, "class-1");

    let notifiedRole: string | null = null;
    const onRoleChanged = (role: string) => {
      notifiedRole = role;
    };

    const handleMessage = (message: RealtimeServerMessage) => {
      if (message.type === "roleChanged") {
        onRoleChanged(message.role);
        if (message.role === "READER") {
          store.getState().releaseAllLocalClassLocks();
        }
      }
    };

    handleMessage({ type: "roleChanged", role: "READER" });

    assert.equal(notifiedRole, "READER");
    assert.equal(store.getState().localLockedClassId, null);
  });

  it("procesa userLeft limpiando presencia, cursores y locks del usuario retirado", () => {
    const store = setup();
    store.getState().setPresence([
      { userId: "u1", userName: "Usuario 1", role: "EDITOR", color: "#38bdf8" },
      { userId: "u2", userName: "Usuario 2", role: "READER", color: "#a78bfa" },
    ]);
    store.getState().setRemoteCursor({
      userId: "u1",
      userName: "Usuario 1",
      x: 50,
      y: 50,
      color: "#38bdf8",
      updatedAt: 1000,
    });
    store.getState().setClassLock({
      classId: "c1",
      userId: "u1",
      userName: "Usuario 1",
      lockedAt: 1000,
      expiresAt: 60000,
      color: "#38bdf8",
    });

    const handleMessage = (message: RealtimeServerMessage) => {
      if (message.type === "userLeft") {
        store.getState().removePresence(message.userId);
        store.getState().removeRemoteCursor(message.userId);
        Object.values(store.getState().classLocks).forEach((lock) => {
          if (lock.userId === message.userId) {
            store.getState().removeClassLock(lock.classId);
          }
        });
      }
    };

    handleMessage({ type: "userLeft", userId: "u1" });

    assert.equal(store.getState().presence["u1"], undefined);
    assert.equal(store.getState().remoteCursors["u1"], undefined);
    assert.equal(store.getState().classLocks["c1"], undefined);
    assert.notEqual(store.getState().presence["u2"], undefined);
  });

  it("procesa eventos de reservas del agente (snapshot, reserva incremental y liberación)", () => {
    const store = setup();

    // 1. Snapshot inicial con reservas
    store.getState().setAgentReservations([
      {
        projectId: "p1",
        messageId: "m1",
        sequence: 1,
        componentType: "class",
        componentId: "class-1",
        activityType: "query",
      },
    ]);
    assert.equal(store.getState().isComponentReservedByAgent("class-1", "class"), true);
    assert.equal(store.getState().getEffectiveComponentReservation("class-1", "class")?.activityType, "query");

    // 2. Evento incremental: promoción a edit
    store.getState().upsertAgentReservation({
      projectId: "p1",
      messageId: "m1",
      sequence: 2,
      componentType: "class",
      componentId: "class-1",
      activityType: "edit",
    });
    assert.equal(store.getState().getEffectiveComponentReservation("class-1", "class")?.activityType, "edit");

    // 3. Liberación de reservas del mensaje m1
    store.getState().releaseAgentReservationsByMessage("m1");
    assert.equal(store.getState().isComponentReservedByAgent("class-1", "class"), false);
  });

  it("al reconectar, presenceSnapshot reemplaza reservas locales obsoletas", () => {
    const store = setup();
    // Estado local previo antes de perder conexión (ej. mensaje m1 que ya terminó en el servidor)
    store.getState().setAgentReservations([
      {
        projectId: "p1",
        messageId: "m1-stale",
        sequence: 1,
        componentType: "class",
        componentId: "class-1",
        activityType: "edit",
      },
    ]);
    assert.equal(store.getState().isComponentReservedByAgent("class-1", "class"), true);

    // Snapshot tras reconexión que contiene únicamente reservas vigentes (o ninguna si terminó)
    const handleMessage = (message: RealtimeServerMessage) => {
      if (message.type === "presenceSnapshot") {
        store.getState().setAgentReservations(message.agentComponentReservations ?? []);
      }
    };

    handleMessage({
      type: "presenceSnapshot",
      peers: [],
      classLocks: [],
      agentComponentReservations: [
        {
          projectId: "p1",
          messageId: "m2-fresh",
          sequence: 1,
          componentType: "class",
          componentId: "class-2",
          activityType: "query",
        },
      ],
    });

    // class-1 ya no está reservada (se reemplazó el snapshot)
    assert.equal(store.getState().isComponentReservedByAgent("class-1", "class"), false);
    // class-2 ahora está reservada por m2
    assert.equal(store.getState().isComponentReservedByAgent("class-2", "class"), true);
  });

  it("agentMessageFinished y agentComponentReservationsReleased liberan selectivamente por mensaje", () => {
    const store = setup();
    store.getState().setAgentReservations([
      {
        projectId: "p1",
        messageId: "m1",
        sequence: 1,
        componentType: "class",
        componentId: "class-1",
        activityType: "edit",
      },
      {
        projectId: "p1",
        messageId: "m2",
        sequence: 1,
        componentType: "class",
        componentId: "class-2",
        activityType: "query",
      },
    ]);

    const handleMessage = (message: RealtimeServerMessage) => {
      if (message.type === "agentComponentReservationsReleased") {
        store.getState().releaseAgentReservationsByMessage(message.messageId);
      }
    };

    handleMessage({
      type: "agentComponentReservationsReleased",
      projectId: "p1",
      messageId: "m1",
    });

    // m1 liberado, m2 conservado
    assert.equal(store.getState().isComponentReservedByAgent("class-1", "class"), false);
    assert.equal(store.getState().isComponentReservedByAgent("class-2", "class"), true);
  });
});
