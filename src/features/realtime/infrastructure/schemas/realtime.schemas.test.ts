import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RealtimeMessageSchema } from "./realtime.schemas.ts";

describe("RealtimeMessageSchema - Validación de contrato canónico", () => {
  it("valida mensaje pong", () => {
    const parsed = RealtimeMessageSchema.safeParse({ type: "pong" });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje presence_snapshot", () => {
    const parsed = RealtimeMessageSchema.safeParse({
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
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje user_joined", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "user_joined",
      user_id: "u2",
      user_name: "Carlos",
      role: "EDITOR",
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje user_left", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "user_left",
      user_id: "u2",
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje cursor_moved", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "cursor_moved",
      user_id: "u1",
      user_name: "Ana",
      x: 150.5,
      y: 280.0,
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje class_dragged con user_name", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "class_dragged",
      class_id: "c1",
      user_id: "u1",
      user_name: "Ana",
      x: 200,
      y: 350,
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje class_locked con metadatos completos", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "class_locked",
      class_id: "c1",
      user_id: "u1",
      user_name: "Ana",
      locked_at: 1000,
      expires_at: 1060,
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje class_lock_denied con campos opcionales", () => {
    const parsedWithoutOwner = RealtimeMessageSchema.safeParse({
      type: "class_lock_denied",
      class_id: "c1",
    });
    assert.equal(parsedWithoutOwner.success, true);

    const parsedWithOwner = RealtimeMessageSchema.safeParse({
      type: "class_lock_denied",
      class_id: "c1",
      user_id: "u2",
      user_name: "Carlos",
    });
    assert.equal(parsedWithOwner.success, true);
  });

  it("valida mensaje class_unlocked", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "class_unlocked",
      class_id: "c1",
      user_id: "u1",
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje diagram_mutation", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "diagram_mutation",
      operation_type: "RENAME_CLASS",
      data: { class_id: "c1", name: "Pedido" },
      sender_id: "u1",
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje role_changed", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "role_changed",
      role: "READER",
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje agent_lock", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "agent_lock",
      user_id: "agent-1",
      activity_id: "act-123",
    });
    assert.equal(parsed.success, true);
  });

  it("valida mensaje agent_finished", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "agent_finished",
      user_id: "agent-1",
      activity_id: "act-123",
      state: "FINISHED",
    });
    assert.equal(parsed.success, true);
  });

  it("valida el lock activo opcional de presence_snapshot", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "presence_snapshot",
      peers: [],
      class_locks: [],
      agent_lock: { user_id: "agent-1", activity_id: "act-1" },
    });
    assert.equal(parsed.success, true);
  });

  it("rechaza mensajes con tipo desconocido o estructura inválida", () => {
    const invalidType = RealtimeMessageSchema.safeParse({ type: "unknown_event" });
    assert.equal(invalidType.success, false);

    const missingField = RealtimeMessageSchema.safeParse({
      type: "cursor_moved",
      user_id: "u1",
      x: 10,
    });
    assert.equal(missingField.success, false);
  });
});
