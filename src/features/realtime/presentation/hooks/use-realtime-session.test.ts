import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import { createRealtimeSlice, type RealtimeSlice } from "../store/realtime-slice.ts";
import type { RealtimeServerMessage } from "../../domain/entities/realtime.entity.ts";

describe("useRealtimeSession - Manejo de mensajes de ciclo de vida", () => {
  const setup = () => {
    return createStore<RealtimeSlice>((...args) =>
      createRealtimeSlice(...args)
    );
  };

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
});
