import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import {
  createRealtimeSlice,
  type RealtimeSlice,
} from "./realtime-slice.ts";
import type {
  RealtimeClassLock,
  RealtimePresenceUser,
  RealtimeRemoteCursor,
} from "../../domain/entities/realtime.entity.ts";

describe("RealtimeSlice", () => {
  const setup = () => {
    return createStore<RealtimeSlice>((...args) =>
      createRealtimeSlice(...args)
    );
  };

  it("inicia con valores por defecto desconectados", () => {
    const store = setup();
    const state = store.getState();
    assert.equal(state.realtimeStatus, "disconnected");
    assert.deepEqual(state.presence, {});
    assert.deepEqual(state.classLocks, {});
    assert.deepEqual(state.remoteCursors, {});
    assert.equal(state.localLockedClassId, null);
  });

  it("actualiza estado de presencia (setPresence, upsertPresence, removePresence)", () => {
    const store = setup();
    const user1: RealtimePresenceUser = {
      userId: "u1",
      userName: "User 1",
      role: "OWNER",
      color: "#22d3ee",
    };
    const user2: RealtimePresenceUser = {
      userId: "u2",
      userName: "User 2",
      role: "EDITOR",
      color: "#a78bfa",
    };

    store.getState().setPresence([user1]);
    assert.equal(Object.keys(store.getState().presence).length, 1);
    assert.equal(store.getState().presence["u1"]?.userName, "User 1");

    store.getState().upsertPresence(user2);
    assert.equal(Object.keys(store.getState().presence).length, 2);

    store.getState().removePresence("u1");
    assert.equal(Object.keys(store.getState().presence).length, 1);
    assert.equal(store.getState().presence["u1"], undefined);
    assert.equal(store.getState().presence["u2"]?.userName, "User 2");
  });

  it("gestiona bloqueos de clase (setClassLock, removeClassLock, isClassLockedByOther)", () => {
    const store = setup();
    const lock1: RealtimeClassLock = {
      classId: "c1",
      userId: "u1",
      userName: "User 1",
      lockedAt: 1000,
      expiresAt: 61000,
      color: "#22d3ee",
    };

    store.getState().setClassLock(lock1);
    assert.equal(store.getState().classLocks["c1"]?.userId, "u1");

    // u1 no está bloqueado para sí mismo
    assert.equal(store.getState().isClassLockedByOther("c1", "u1"), false);
    // u1 está bloqueado para u2
    assert.equal(store.getState().isClassLockedByOther("c1", "u2"), true);
    // clase no bloqueada
    assert.equal(store.getState().isClassLockedByOther("c2", "u2"), false);

    store.getState().removeClassLock("c1");
    assert.equal(store.getState().classLocks["c1"], undefined);
    assert.equal(store.getState().isClassLockedByOther("c1", "u2"), false);
  });

  it("gestiona cursores remotos (setRemoteCursor, removeRemoteCursor)", () => {
    const store = setup();
    const cursor1: RealtimeRemoteCursor = {
      userId: "u1",
      userName: "User 1",
      x: 100,
      y: 200,
      color: "#22d3ee",
      updatedAt: 1000,
    };

    store.getState().setRemoteCursor(cursor1);
    assert.equal(store.getState().remoteCursors["u1"]?.x, 100);

    store.getState().removeRemoteCursor("u1");
    assert.equal(store.getState().remoteCursors["u1"], undefined);
  });

  it("gestiona bloqueos de clase locales y masivos", () => {
    const store = setup();
    const locks: RealtimeClassLock[] = [
      {
        classId: "c1",
        userId: "u1",
        userName: "Ana",
        lockedAt: 1000,
        expiresAt: 61000,
        color: "#22d3ee",
      },
      {
        classId: "c2",
        userId: "u2",
        userName: "Carlos",
        lockedAt: 1000,
        expiresAt: 61000,
        color: "#a78bfa",
      },
    ];

    store.getState().setClassLocks(locks);
    assert.equal(Object.keys(store.getState().classLocks).length, 2);

    store.getState().setLocalClassLock("c1");
    assert.equal(store.getState().localLockedClassId, "c1");

    // clearLocalClassLock para una clase distinta no debe limpiar c1
    store.getState().clearLocalClassLock("c2");
    assert.equal(store.getState().localLockedClassId, "c1");

    // clearLocalClassLock para c1 debe limpiar
    store.getState().clearLocalClassLock("c1");
    assert.equal(store.getState().localLockedClassId, null);

    // releaseAllLocalClassLocks
    store.getState().setLocalClassLock("c1");
    store.getState().releaseAllLocalClassLocks();
    assert.equal(store.getState().localLockedClassId, null);
  });

  it("reinicia el estado de realtime con resetRealtime", () => {
    const store = setup();
    store.getState().setRealtimeStatus("connected");
    store.getState().setLocalClassLock("c1");
    store.getState().resetRealtime();

    const state = store.getState();
    assert.equal(state.realtimeStatus, "disconnected");
    assert.equal(state.localLockedClassId, null);
    assert.deepEqual(state.presence, {});
    assert.deepEqual(state.classLocks, {});
    assert.deepEqual(state.agentReservations, {});
  });

  it("gestiona reservas efímeras del agente con promoción, secuencia y liberación selectiva", () => {
    const store = setup();

    // 1. Snapshot inicial
    store.getState().setAgentReservations([
      {
        projectId: "p1",
        messageId: "m1",
        sequence: 1,
        componentType: "class",
        componentId: "c1",
        activityType: "query",
        attributeId: null,
      },
    ]);
    assert.equal(store.getState().isComponentReservedByAgent("c1", "class"), true);
    assert.equal(
      store.getState().getEffectiveComponentReservation("c1", "class").activityType,
      "query"
    );

    // 2. Promoción a edit
    store.getState().upsertAgentReservation({
      projectId: "p1",
      messageId: "m1",
      sequence: 2,
      componentType: "class",
      componentId: "c1",
      activityType: "edit",
      attributeId: "a1",
    });
    const eff = store.getState().getEffectiveComponentReservation("c1", "class");
    assert.equal(eff.activityType, "edit");
    assert.equal(eff.attributeId, "a1");

    // 3. Evento tardío / menor secuencia no sobreescribe
    store.getState().upsertAgentReservation({
      projectId: "p1",
      messageId: "m1",
      sequence: 1,
      componentType: "class",
      componentId: "c1",
      activityType: "query",
      attributeId: null,
    });
    assert.equal(
      store.getState().getEffectiveComponentReservation("c1", "class").activityType,
      "edit"
    );

    // 4. Segundo mensaje reserva c1
    store.getState().upsertAgentReservation({
      projectId: "p1",
      messageId: "m2",
      sequence: 1,
      componentType: "class",
      componentId: "c1",
      activityType: "query",
      attributeId: null,
    });
    // Liberar m1 deja a c1 reservada por m2
    store.getState().releaseAgentReservationsByMessage("m1");
    assert.equal(store.getState().isComponentReservedByAgent("c1", "class"), true);
    assert.equal(
      store.getState().getEffectiveComponentReservation("c1", "class").activityType,
      "query"
    );
  });

  it("evalúa canEditDiagramComponent combinando permisos, locks manuales y reservas", () => {
    const store = setup();

    // Sin permisos en el proyecto
    assert.equal(
      store.getState().canEditDiagramComponent("c1", "class", "u1", false).allowed,
      false
    );

    // Con permisos y sin bloqueos
    assert.equal(
      store.getState().canEditDiagramComponent("c1", "class", "u1", true).allowed,
      true
    );

    // Bloqueo manual por otro usuario
    store.getState().setClassLock({
      classId: "c1",
      userId: "u2",
      userName: "Carlos",
      lockedAt: 1000,
      expiresAt: 61000,
      color: "#a78bfa",
    });
    const lockedDecision = store
      .getState()
      .canEditDiagramComponent("c1", "class", "u1", true);
    assert.equal(lockedDecision.allowed, false);
    assert.match(lockedDecision.reason ?? "", /Bloqueado por Carlos/);

    // Bloqueado para el propio u2 está permitido
    assert.equal(
      store.getState().canEditDiagramComponent("c1", "class", "u2", true).allowed,
      true
    );

    // Reserva del asistente en modo edit
    store.getState().upsertAgentReservation({
      projectId: "p1",
      messageId: "m1",
      sequence: 1,
      componentType: "class",
      componentId: "c2",
      activityType: "edit",
      attributeId: null,
    });
    const agentDecision = store
      .getState()
      .canEditDiagramComponent("c2", "class", "u1", true);
    assert.equal(agentDecision.allowed, false);
    assert.match(agentDecision.reason ?? "", /El asistente está modificando/);
  });

  it("proporciona referencias estables de getEffectiveComponentReservation y canEditDiagramComponent para getSnapshot", () => {
    const store = setup();

    // 1. Componente sin reservas devuelve la misma referencia idéntica (Object.is)
    const ref1 = store.getState().getEffectiveComponentReservation("c1", "class");
    const ref2 = store.getState().getEffectiveComponentReservation("c1", "class");
    assert.equal(ref1, ref2);
    assert.equal(ref1.isReserved, false);

    // 2. Componente con reserva devuelve la misma referencia idéntica entre llamadas
    store.getState().upsertAgentReservation({
      projectId: "p1",
      messageId: "m1",
      sequence: 1,
      componentType: "class",
      componentId: "c1",
      activityType: "query",
      attributeId: null,
    });
    const reservedRef1 = store.getState().getEffectiveComponentReservation("c1", "class");
    const reservedRef2 = store.getState().getEffectiveComponentReservation("c1", "class");
    assert.equal(reservedRef1, reservedRef2);
    assert.equal(reservedRef1.isReserved, true);

    // 3. canEditDiagramComponent devuelve referencias estables congeladas
    const dec1 = store.getState().canEditDiagramComponent("c2", "class", "u1", true);
    const dec2 = store.getState().canEditDiagramComponent("c2", "class", "u1", true);
    assert.equal(dec1, dec2);
    assert.equal(dec1.allowed, true);
  });
});
