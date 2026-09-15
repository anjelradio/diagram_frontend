import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapAgentActivityListItemToEntity,
  mapAgentActivityListToEntities,
  mapVoiceCommandResultToEntity,
} from "./assistant.mapper.ts";
import type {
  AgentActivityListItemWire,
  VoiceCommandResultWire,
} from "../schemas/assistant.schemas.ts";

describe("assistant.mapper - Mapeo de contratos del Asistente a Dominio", () => {
  it("mapea un item de actividad individual de snake_case a camelCase", () => {
    const wire: AgentActivityListItemWire = {
      id: "7fa8b9c0-1234-5678-9abc-def012345678",
      project_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      transcription: "Crear clase Usuario",
      resume: "Se creó la clase Usuario",
      image_url: null,
      state: "FINISHED",
      created_date: "2026-09-14T15:00:00Z",
    };

    const entity = mapAgentActivityListItemToEntity(wire);

    assert.equal(entity.id, wire.id);
    assert.equal(entity.projectId, wire.project_id);
    assert.equal(entity.transcription, "Crear clase Usuario");
    assert.equal(entity.resume, "Se creó la clase Usuario");
    assert.equal(entity.imageUrl, null);
    assert.equal(entity.state, "FINISHED");
    assert.equal(entity.createdDate, "2026-09-14T15:00:00Z");
  });

  it("mapea una lista de items de actividades", () => {
    const wires: AgentActivityListItemWire[] = [
      {
        id: "id-1",
        project_id: "proj-1",
        transcription: "orden 1",
        resume: "resumen 1",
        image_url: "https://example.com/img.png",
        state: "FINISHED",
        created_date: "2026-09-14T15:00:00Z",
      },
      {
        id: "id-2",
        project_id: "proj-1",
        transcription: null,
        resume: null,
        image_url: null,
        state: "IN_PROGRESS",
        created_date: "2026-09-14T15:05:00Z",
      },
    ];

    const entities = mapAgentActivityListToEntities(wires);

    assert.equal(entities.length, 2);
    assert.equal(entities[0].imageUrl, "https://example.com/img.png");
    assert.equal(entities[1].state, "IN_PROGRESS");
    assert.equal(entities[1].transcription, null);
  });

  it("mapea el resultado de un comando de voz", () => {
    const wire: VoiceCommandResultWire = {
      activity_id: "act-1",
      state: "FINISHED",
      transcription: "Crear clase Factura",
      resume: "Se creó la clase Factura con id y total",
      actions_count: 1,
      actions: [
        {
          type: "CREATE_CLASS",
          status: "executed",
          summary: "Clase Factura creada",
        },
      ],
    };

    const entity = mapVoiceCommandResultToEntity(wire);

    assert.equal(entity.activityId, "act-1");
    assert.equal(entity.state, "FINISHED");
    assert.equal(entity.actionsCount, 1);
    assert.equal(entity.actions[0].type, "CREATE_CLASS");
    assert.equal(entity.actions[0].summary, "Clase Factura creada");
  });
});
