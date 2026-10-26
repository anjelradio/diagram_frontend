import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapVoiceCommandResultToEntity,
  mapImageCommandResultToEntity,
} from "./assistant.mapper.ts";
import type {
  VoiceCommandResultWire,
  ImageCommandResultWire,
} from "../schemas/assistant.schemas.ts";

describe("assistant.mapper - Mapeo de contratos del Asistente a Dominio", () => {
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

  it("mapea el resultado de un comando de imagen", () => {
    const wire: ImageCommandResultWire = {
      activity_id: "act-img-1",
      state: "FINISHED",
      transcription: "Diagrama con 2 clases",
      resume: "Se importaron las clases",
      image_url: "https://example.com/diagram.png",
      actions_count: 2,
      actions: [
        {
          type: "CREATE_CLASS",
          status: "executed",
          summary: "Clase Cliente creada",
        },
      ],
    };

    const entity = mapImageCommandResultToEntity(wire);

    assert.equal(entity.activityId, "act-img-1");
    assert.equal(entity.imageUrl, "https://example.com/diagram.png");
    assert.equal(entity.actionsCount, 2);
    assert.equal(entity.actions[0].summary, "Clase Cliente creada");
  });
});

