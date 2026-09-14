import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  projectDetailResponseSchema,
  type ProjectDetailResponse,
} from "../schemas/project.schemas.ts";
import { mapProjectDetailToEntity } from "./project.mapper.ts";
import { ProjectAccessRole } from "../../domain/entities/project.entity.ts";

describe("project-detail.mapper and schema validation", () => {
  it("valida y mapea correctamente un detalle de proyecto con rol OWNER", () => {
    const raw: ProjectDetailResponse = {
      id: "b2d07521-cb86-4f40-8b17-768ad32b13c1",
      name: "Sistema de Pagos",
      description: "Módulo principal",
      thumbnail_url: "https://example.com/thumb.png",
      access_role: "OWNER",
    };

    const parsed = projectDetailResponseSchema.parse(raw);
    const entity = mapProjectDetailToEntity(parsed);

    assert.equal(entity.id, "b2d07521-cb86-4f40-8b17-768ad32b13c1");
    assert.equal(entity.name, "Sistema de Pagos");
    assert.equal(entity.description, "Módulo principal");
    assert.equal(entity.thumbnailUrl, "https://example.com/thumb.png");
    assert.equal(entity.accessRole, ProjectAccessRole.OWNER);
  });

  it("valida campos nulables description y thumbnail_url para EDITOR y READER", () => {
    const rawEditor = {
      id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      name: "Lienzo Colaborativo",
      description: null,
      thumbnail_url: null,
      access_role: "EDITOR",
    };

    const parsedEditor = projectDetailResponseSchema.parse(rawEditor);
    const entityEditor = mapProjectDetailToEntity(parsedEditor);
    assert.equal(entityEditor.accessRole, ProjectAccessRole.EDITOR);
    assert.equal(entityEditor.description, null);
    assert.equal(entityEditor.thumbnailUrl, null);

    const rawReader = {
      ...rawEditor,
      access_role: "READER",
    };
    const parsedReader = projectDetailResponseSchema.parse(rawReader);
    const entityReader = mapProjectDetailToEntity(parsedReader);
    assert.equal(entityReader.accessRole, ProjectAccessRole.READER);
  });

  it("rechaza roles no soportados o inventados", () => {
    const invalidRole = {
      id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      name: "Proyecto Inválido",
      description: null,
      thumbnail_url: null,
      access_role: "ADMINISTRATOR",
    };

    assert.throws(() => {
      projectDetailResponseSchema.parse(invalidRole);
    });
  });

  it("rechaza payload sin access_role o campos requeridos ausentes", () => {
    const missingRole = {
      id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      name: "Proyecto Incompleto",
      description: null,
      thumbnail_url: null,
    };

    assert.throws(() => {
      projectDetailResponseSchema.parse(missingRole);
    });
  });
});
