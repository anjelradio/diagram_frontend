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

  it("valida proyección terminal persistida del chat del agente", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "agent_message_finished",
      project_id: "00000000-0000-4000-8000-000000000001",
      message_id: "00000000-0000-4000-8000-000000000002",
      user_id: "user-1",
      author_name: "Ada",
      author_avatar_url: "https://cdn.example.test/ada.png",
      prompt: "Crea una clase",
      image_url: null,
      created_at: "2026-11-04T12:00:00Z",
      status: "completed",
      response_markdown: "Clase creada.",
    });
    assert.equal(parsed.success, true);
  });

  it("valida aceptación persistida con avatar nullable", () => {
    const base = {
      type: "agent_message_accepted",
      project_id: "00000000-0000-4000-8000-000000000001",
      message_id: "00000000-0000-4000-8000-000000000002",
      user_id: "user-1",
      author_name: "Ada",
      prompt: "Crea una clase",
      image_url: null,
      created_at: "2026-11-04T12:00:00Z",
      status: "running",
    };
    assert.equal(RealtimeMessageSchema.safeParse(base).success, true);
    const parsed = RealtimeMessageSchema.parse(base);
    assert.equal(parsed.type, "agent_message_accepted");
    assert.equal(
      RealtimeMessageSchema.safeParse({ ...base, author_avatar_url: null }).success,
      true
    );
    assert.equal(RealtimeMessageSchema.safeParse({ ...base, status: "completed" }).success, false);
  });

  it("valida eventos de actividad tipados y rechaza códigos desconocidos", () => {
    const event = {
      type: "agent_message_activity",
      project_id: "00000000-0000-4000-8000-000000000001",
      message_id: "00000000-0000-4000-8000-000000000002",
      attempt_id: "00000000-0000-4000-8000-000000000003",
      sequence: 1,
      activity_code: "planning",
      activity_type: "planning",
      occurred_at: "2026-11-05T12:00:00Z",
    };
    assert.equal(RealtimeMessageSchema.safeParse(event).success, true);
    assert.equal(
      RealtimeMessageSchema.safeParse({
        ...event,
        activity_code: "recalling_conversation",
        activity_type: "query",
      }).success,
      true
    );
    assert.equal(
      RealtimeMessageSchema.safeParse({ ...event, activity_type: "query" }).success,
      true
    );
    assert.equal(
      RealtimeMessageSchema.safeParse({ ...event, activity_type: "unknown_type" }).success,
      false
    );
    assert.equal(
      RealtimeMessageSchema.safeParse({ ...event, activity_code: "private_reasoning" }).success,
      false
    );
  });

  it("valida mensaje agent_component_reserved con y sin attribute_id", () => {
    const parsedWithAttr = RealtimeMessageSchema.safeParse({
      type: "agent_component_reserved",
      project_id: "11111111-1111-4111-8111-111111111111",
      message_id: "22222222-2222-4222-8222-222222222222",
      sequence: 1,
      component_type: "class",
      component_id: "33333333-3333-4333-8333-333333333333",
      activity_type: "edit",
      attribute_id: "44444444-4444-4444-8444-444444444444",
    });
    assert.equal(parsedWithAttr.success, true);

    const parsedWithoutAttr = RealtimeMessageSchema.safeParse({
      type: "agent_component_reserved",
      project_id: "11111111-1111-4111-8111-111111111111",
      message_id: "22222222-2222-4222-8222-222222222222",
      sequence: 2,
      component_type: "relation",
      component_id: "55555555-5555-4555-8555-555555555555",
      activity_type: "query",
    });
    assert.equal(parsedWithoutAttr.success, true);
  });

  it("valida mensaje agent_component_reservations_released", () => {
    const parsed = RealtimeMessageSchema.safeParse({
      type: "agent_component_reservations_released",
      project_id: "11111111-1111-4111-8111-111111111111",
      message_id: "22222222-2222-4222-8222-222222222222",
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
