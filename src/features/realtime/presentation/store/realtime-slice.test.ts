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
    store.getState().setAgentLock(true, "act-123");
    store.getState().resetRealtime();

    const state = store.getState();
    assert.equal(state.realtimeStatus, "disconnected");
    assert.equal(state.localLockedClassId, null);
    assert.equal(state.isAgentLocked, false);
    assert.equal(state.agentActivityId, null);
    assert.deepEqual(state.presence, {});
    assert.deepEqual(state.classLocks, {});
  });

  it("gestiona el bloqueo global del asistente IA (setAgentLock)", () => {
    const store = setup();
    assert.equal(store.getState().isAgentLocked, false);
    assert.equal(store.getState().agentActivityId, null);

    store.getState().setAgentLock(true, "activity-999");
    assert.equal(store.getState().isAgentLocked, true);
    assert.equal(store.getState().agentActivityId, "activity-999");

    store.getState().setAgentLock(false);
    assert.equal(store.getState().isAgentLocked, false);
    assert.equal(store.getState().agentActivityId, null);
  });

  it("libera únicamente el lock cuyo activityId coincide", () => {
    const store = setup();
    store.getState().acquireAgentLock({ activityId: "act-current", userId: "agent-1" });
    store.getState().releaseAgentLock("act-old");
    assert.equal(store.getState().agentActivityId, "act-current");
    store.getState().releaseAgentLock("act-current");
    assert.equal(store.getState().agentActivityId, null);
  });
});
