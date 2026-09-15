import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { realtimeColor, realtimeMapper } from "./realtime.mapper.ts";
import type { RealtimeMessageWire } from "../schemas/realtime.schemas.ts";

describe("realtimeMapper - Mapeo de contrato canónico a dominio", () => {
  it("asigna un color estable para un userId", () => {
    const color1 = realtimeColor("user_123");
    const color2 = realtimeColor("user_123");
    assert.equal(color1, color2);
    assert.match(color1, /^#[0-9a-f]{6}$/i);
  });

  it("mapea mensaje pong", () => {
    const wire: RealtimeMessageWire = { type: "pong" };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, { type: "pong" });
  });

  it("mapea mensaje presence_snapshot", () => {
    const wire: RealtimeMessageWire = {
      type: "presence_snapshot",
      peers: [{ user_id: "u1", user_name: "Ana", role: "OWNER" }],
      class_locks: [
        {
          class_id: "c1",
          user_id: "u1",
          user_name: "Ana",
          locked_at: 1000,
          expires_at: 1060,
        },
      ],
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.equal(domain.type, "presenceSnapshot");
    if (domain.type === "presenceSnapshot") {
      assert.equal(domain.peers.length, 1);
      assert.equal(domain.peers[0].userId, "u1");
      assert.equal(domain.peers[0].userName, "Ana");
      assert.equal(domain.peers[0].role, "OWNER");
      assert.equal(domain.classLocks.length, 1);
      assert.equal(domain.classLocks[0].classId, "c1");
      assert.equal(domain.classLocks[0].lockedAt, 1000);
      assert.equal(domain.classLocks[0].expiresAt, 1060);
    }
  });

  it("mapea mensaje user_joined", () => {
    const wire: RealtimeMessageWire = {
      type: "user_joined",
      user_id: "u2",
      user_name: "Carlos",
      role: "EDITOR",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.equal(domain.type, "userJoined");
    if (domain.type === "userJoined") {
      assert.equal(domain.user.userId, "u2");
      assert.equal(domain.user.userName, "Carlos");
      assert.equal(domain.user.role, "EDITOR");
      assert.ok(domain.user.color);
    }
  });

  it("mapea mensaje user_left", () => {
    const wire: RealtimeMessageWire = { type: "user_left", user_id: "u2" };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, { type: "userLeft", userId: "u2" });
  });

  it("mapea mensaje cursor_moved", () => {
    const wire: RealtimeMessageWire = {
      type: "cursor_moved",
      user_id: "u1",
      user_name: "Ana",
      x: 100,
      y: 200,
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.equal(domain.type, "cursorMoved");
    if (domain.type === "cursorMoved") {
      assert.equal(domain.cursor.userId, "u1");
      assert.equal(domain.cursor.userName, "Ana");
      assert.equal(domain.cursor.x, 100);
      assert.equal(domain.cursor.y, 200);
      assert.ok(domain.cursor.updatedAt > 0);
    }
  });

  it("mapea mensaje class_dragged", () => {
    const wire: RealtimeMessageWire = {
      type: "class_dragged",
      class_id: "c1",
      user_id: "u1",
      user_name: "Ana",
      x: 300,
      y: 400,
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "classDragged",
      classId: "c1",
      userId: "u1",
      userName: "Ana",
      x: 300,
      y: 400,
    });
  });

  it("mapea mensaje class_locked", () => {
    const wire: RealtimeMessageWire = {
      type: "class_locked",
      class_id: "c1",
      user_id: "u1",
      user_name: "Ana",
      locked_at: 1000,
      expires_at: 1060,
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.equal(domain.type, "classLocked");
    if (domain.type === "classLocked") {
      assert.equal(domain.lock.classId, "c1");
      assert.equal(domain.lock.userId, "u1");
      assert.equal(domain.lock.userName, "Ana");
      assert.equal(domain.lock.lockedAt, 1000);
      assert.equal(domain.lock.expiresAt, 1060);
      assert.ok(domain.lock.color);
    }
  });

  it("mapea mensaje class_lock_denied", () => {
    const wire: RealtimeMessageWire = {
      type: "class_lock_denied",
      class_id: "c1",
      user_id: "u2",
      user_name: "Carlos",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "classLockDenied",
      classId: "c1",
      userId: "u2",
      ownerName: "Carlos",
    });
  });

  it("mapea mensaje class_unlocked", () => {
    const wire: RealtimeMessageWire = {
      type: "class_unlocked",
      class_id: "c1",
      user_id: "u1",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "classUnlocked",
      classId: "c1",
      userId: "u1",
    });
  });

  it("mapea mensaje diagram_mutation", () => {
    const wire: RealtimeMessageWire = {
      type: "diagram_mutation",
      operation_type: "MOVE_CLASS",
      data: { id: "c1", positionX: 50, positionY: 80 },
      sender_id: "u1",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "diagramMutation",
      mutation: {
        operationType: "MOVE_CLASS",
        data: { id: "c1", positionX: 50, positionY: 80 },
        senderId: "u1",
      },
    });
  });

  it("mapea mensaje role_changed", () => {
    const wire: RealtimeMessageWire = {
      type: "role_changed",
      role: "READER",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "roleChanged",
      role: "READER",
    });
  });

  it("mapea mensaje agent_lock", () => {
    const wire: RealtimeMessageWire = {
      type: "agent_lock",
      user_id: "agent-1",
      activity_id: "act-456",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "agentLock",
      userId: "agent-1",
      activityId: "act-456",
    });
  });

  it("mapea mensaje agent_finished", () => {
    const wire: RealtimeMessageWire = {
      type: "agent_finished",
      user_id: "agent-1",
      activity_id: "act-456",
      state: "FINISHED",
    };
    const domain = realtimeMapper.toDomain(wire);
    assert.deepEqual(domain, {
      type: "agentFinished",
      userId: "agent-1",
      activityId: "act-456",
      state: "FINISHED",
    });
  });

  it("mapea el lock activo incluido en presence_snapshot", () => {
    const domain = realtimeMapper.toDomain({
      type: "presence_snapshot",
      peers: [],
      class_locks: [],
      agent_lock: { user_id: "agent-1", activity_id: "act-1" },
    });
    assert.deepEqual(domain, {
      type: "presenceSnapshot",
      peers: [],
      classLocks: [],
      agentLock: { userId: "agent-1", activityId: "act-1" },
    });
  });
});
