import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  CreateRelationPayload,
  RenameRelationPayload,
} from "../../domain/entities/diagram-operation.entity.ts";
import {
  mapCreateRelationPayloadToRequest,
  mapRenameRelationPayloadToRequest,
} from "../mappers/diagram-relation.mapper.ts";
import {
  createRelationRequestSchema,
  renameRelationRequestSchema,
} from "../schemas/diagram-relation.schemas.ts";
import {
  createDiagramRelationRepository,
  type StatusRequester,
} from "./diagram-relation.repository.ts";

describe("DiagramRelationRepository & Mappers", () => {
  const validPayload: CreateRelationPayload = {
    id: "33333333-3333-4333-8333-333333333333",
    name: "RelacionAB",
    relationType: "ASSOCIATION",
    source: {
      classId: "11111111-1111-4111-8111-111111111111",
      handle: "RIGHT_CENTER",
      cardinality: "1",
    },
    target: {
      classId: "22222222-2222-4222-8222-222222222222",
      handle: "LEFT_CENTER",
      cardinality: "0..*",
    },
    materialization: {
      strategy: "FOREIGN_KEY",
      foreignAttributes: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          classId: "22222222-2222-4222-8222-222222222222",
          name: "class_a_id",
          dataType: "UUID",
          position: 1,
          isPrimaryKey: false,
          isNullable: false,
          isForeignKey: true,
          referencedClassId: "11111111-1111-4111-8111-111111111111",
          relationId: "33333333-3333-4333-8333-333333333333",
        },
      ],
      sharedPrimaryKey: null,
      bridgeClass: null,
    },
  };

  it("mapea CreateRelationPayload a un DTO validado por createRelationRequestSchema", () => {
    const dto = mapCreateRelationPayloadToRequest(validPayload);
    const parsed = createRelationRequestSchema.parse(dto);

    assert.equal(parsed.id, validPayload.id);
    assert.equal(parsed.name, validPayload.name);
    assert.equal(parsed.relation_type, "ASSOCIATION");
    assert.equal(parsed.source.class_id, validPayload.source.classId);
    assert.equal(parsed.target.class_id, validPayload.target.classId);
    assert.equal(parsed.materialization.strategy, "FOREIGN_KEY");
    assert.equal(parsed.materialization.foreign_attributes.length, 1);
    assert.equal(
      parsed.materialization.foreign_attributes[0].name,
      "class_a_id"
    );
  });

  it("normaliza name a vacío para tipos no asociativos al mapear a DTO", () => {
    const nonAssocPayload: CreateRelationPayload = {
      ...validPayload,
      name: "IntentoDeNombre",
      relationType: "AGGREGATION",
    };
    const dto = mapCreateRelationPayloadToRequest(nonAssocPayload);
    assert.equal(dto.name, "");
    const parsed = createRelationRequestSchema.parse(dto);
    assert.equal(parsed.name, "");
  });

  it("createRelationRequestSchema rechaza nombre no vacío en tipos no asociativos", () => {
    const invalidDto = {
      ...mapCreateRelationPayloadToRequest(validPayload),
      relation_type: "COMPOSITION" as const,
      name: "NombreProhibido",
    };
    assert.throws(() => {
      createRelationRequestSchema.parse(invalidDto);
    });
  });

  it("mapea RenameRelationPayload a un DTO validado por renameRelationRequestSchema", () => {
    const payload: RenameRelationPayload = {
      relationId: "33333333-3333-4333-8333-333333333333",
      name: "NuevoNombre",
    };
    const dto = mapRenameRelationPayloadToRequest(payload);
    const parsed = renameRelationRequestSchema.parse(dto);
    assert.equal(parsed.name, "NuevoNombre");
  });

  it("createRelation llama a POST /projects/:projectId/diagram/relations con status-only", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: StatusRequester = async (cfg) => {
      capturedConfig = cfg;
      return { ok: true };
    };

    const repo = createDiagramRelationRepository(mockRequester);
    const res = await repo.createRelation("proj-123", validPayload);

    assert.equal(res.ok, true);
    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
      body: unknown;
    };
    assert.ok(cfg.url.includes("/projects/proj-123/diagram/relations"));
    assert.equal(cfg.method, "POST");
    assert.equal(cfg.withAuth, true);
    assert.ok(cfg.body);
  });

  it("renameRelation llama a PATCH /diagram/relations/:relationId/name con status-only", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: StatusRequester = async (cfg) => {
      capturedConfig = cfg;
      return { ok: true };
    };

    const repo = createDiagramRelationRepository(mockRequester);
    const res = await repo.renameRelation("rel-123", {
      relationId: "rel-123",
      name: "NombreActualizado",
    });

    assert.equal(res.ok, true);
    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
      body: unknown;
    };
    assert.ok(cfg.url.includes("/diagram/relations/rel-123/name"));
    assert.equal(cfg.method, "PATCH");
    assert.equal(cfg.withAuth, true);
  });

  it("deleteRelation llama a DELETE /diagram/relations/:relationId con status-only", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: StatusRequester = async (cfg) => {
      capturedConfig = cfg;
      return { ok: true };
    };

    const repo = createDiagramRelationRepository(mockRequester);
    const res = await repo.deleteRelation("rel-123");

    assert.equal(res.ok, true);
    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
    };
    assert.ok(cfg.url.includes("/diagram/relations/rel-123"));
    assert.equal(cfg.method, "DELETE");
    assert.equal(cfg.withAuth, true);
  });
});

