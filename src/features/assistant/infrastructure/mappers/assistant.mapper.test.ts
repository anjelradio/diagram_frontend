import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapAgentMessageToEntity,
  mapAgentMessagePageToEntity,
} from "./assistant.mapper.ts";
import { agentMessagePageWireSchema, agentMessageWireSchema } from "../schemas/assistant.schemas.ts";

describe("assistant.mapper - Mapeo de contratos del Asistente a Dominio", () => {
  it("mapea la respuesta de aceptación reducida del POST con defaults seguros", () => {
    const wire = agentMessageWireSchema.parse({
      message_id: "00000000-0000-4000-8000-000000000001",
      project_id: "00000000-0000-4000-8000-000000000002",
      user_id: "user-1",
      author_avatar_url: "https://cdn.example.test/ada.png",
      prompt: "Crea una clase",
      image_url: null,
      status: "running",
      created_at: "2026-11-04T12:00:00Z",
    });
    const message = mapAgentMessageToEntity(wire);
    assert.equal(message.id, wire.message_id);
    assert.equal(message.authorName, "user-1");
    assert.equal(message.authorAvatarUrl, "https://cdn.example.test/ada.png");
    assert.equal(message.cancelRequested, false);
    assert.equal(message.responseMarkdown, null);
  });

  it("mapea la paginación y conserva IDs de mensaje estables", () => {
    const wire = agentMessagePageWireSchema.parse({
      items: [{
        message_id: "00000000-0000-4000-8000-000000000001",
        project_id: "00000000-0000-4000-8000-000000000002",
        user_id: "user-1",
        author_name: "Ada",
        author_avatar_url: null,
        prompt: "Analiza Producto",
        image_url: null,
        status: "completed",
        cancel_requested: false,
        response_markdown: "Todo bien.",
        created_at: "2026-11-04T12:00:00Z",
      }],
      limit: 6,
      offset: 0,
      next_offset: 6,
      has_more: true,
      snapshot_at: "2026-11-04T12:01:00Z",
    });
    const page = mapAgentMessagePageToEntity(wire);
    assert.equal(page.items[0].id, "00000000-0000-4000-8000-000000000001");
    assert.equal(page.items[0].authorName, "Ada");
    assert.equal(page.items[0].authorAvatarUrl, null);
    assert.equal(page.nextOffset, 6);
    assert.equal(page.hasMore, true);
  });
});

