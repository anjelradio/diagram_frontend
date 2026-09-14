import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDiagramOperation,
  VALID_OPERATION_KINDS,
} from "./diagram-operation-queue.repository.ts";
import type { CreateClassPayload } from "../../domain/entities/diagram-operation.entity.ts";

describe("DiagramOperationQueueRepository - Normalización, Migración Durable y Validación de Kinds (T060)", () => {
  it("normaliza una operación CREATE heredada a CREATE_CLASS añadiendo primaryAttribute canónica y conservando metadatos", () => {
    const legacyOp = {
      operationId: "op-create-legacy",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 10,
      kind: "CREATE",
      classId: "class-1",
      payload: {
        id: "class-1",
        name: "Nueva clase",
        positionX: 100,
        positionY: 200,
      },
      createdAt: "2026-09-13T10:00:00.000Z",
      attempts: 2,
      nextAttemptAt: "2026-09-13T10:01:00.000Z",
      state: "pending",
    };

    const normalized = normalizeDiagramOperation(legacyOp);

    assert.equal(normalized.kind, "CREATE_CLASS");
    assert.equal(normalized.operationId, "op-create-legacy");
    assert.equal(normalized.viewerId, "user-1");
    assert.equal(normalized.projectId, "proj-1");
    assert.equal(normalized.sequence, 10);
    assert.equal(normalized.attempts, 2);
    assert.equal(normalized.nextAttemptAt, "2026-09-13T10:01:00.000Z");
    assert.equal(normalized.state, "pending");
    assert.equal(normalized.createdAt, "2026-09-13T10:00:00.000Z");

    const payload = normalized.payload as CreateClassPayload;
    assert.ok(payload.primaryAttribute, "Debe añadir primaryAttribute");
    assert.equal(payload.primaryAttribute.name, "id");
    assert.equal(payload.primaryAttribute.dataType, "UUID");
    assert.equal(payload.primaryAttribute.position, 0);
    assert.equal(payload.primaryAttribute.isPrimaryKey, true);
    assert.equal(payload.primaryAttribute.isNullable, false);
    assert.ok(typeof payload.primaryAttribute.id === "string");
  });

  it("migra RENAME a RENAME_CLASS conservando identidad, secuencia y reintentos", () => {
    const legacyRename = {
      operationId: "op-rename-legacy",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 15,
      kind: "RENAME",
      classId: "class-1",
      payload: { name: "ClienteRenombrado" },
      createdAt: "2026-09-13T10:05:00.000Z",
      attempts: 1,
      state: "pending",
    };

    const normalized = normalizeDiagramOperation(legacyRename);
    assert.equal(normalized.kind, "RENAME_CLASS");
    assert.equal(normalized.operationId, "op-rename-legacy");
    assert.equal(normalized.sequence, 15);
    assert.equal(normalized.attempts, 1);
    assert.deepEqual(normalized.payload, { name: "ClienteRenombrado" });
  });

  it("migra MOVE a MOVE_CLASS conservando identidad, secuencia y reintentos", () => {
    const legacyMove = {
      operationId: "op-move-legacy",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 20,
      kind: "MOVE",
      classId: "class-1",
      payload: { positionX: 450, positionY: 320 },
      createdAt: "2026-09-13T10:10:00.000Z",
      attempts: 3,
      state: "pending",
    };

    const normalized = normalizeDiagramOperation(legacyMove);
    assert.equal(normalized.kind, "MOVE_CLASS");
    assert.equal(normalized.operationId, "op-move-legacy");
    assert.equal(normalized.sequence, 20);
    assert.equal(normalized.attempts, 3);
    assert.deepEqual(normalized.payload, { positionX: 450, positionY: 320 });
  });

  it("migra DELETE a DELETE_CLASS conservando identidad, secuencia y reintentos", () => {
    const legacyDelete = {
      operationId: "op-delete-legacy",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 25,
      kind: "DELETE",
      classId: "class-1",
      payload: {},
      createdAt: "2026-09-13T10:15:00.000Z",
      attempts: 0,
      state: "pending",
    };

    const normalized = normalizeDiagramOperation(legacyDelete);
    assert.equal(normalized.kind, "DELETE_CLASS");
    assert.equal(normalized.operationId, "op-delete-legacy");
    assert.equal(normalized.sequence, 25);
    assert.equal(normalized.attempts, 0);
  });

  it("rechaza de manera estricta kinds desconocidos o datos corruptos", () => {
    assert.throws(() => normalizeDiagramOperation(null), /corrupta o inválida/);
    assert.throws(() => normalizeDiagramOperation({}), /corrupta o inválida/);
    assert.throws(
      () => normalizeDiagramOperation({ kind: "UNKNOWN_KIND" }),
      /Kind de operación desconocido o no soportado: UNKNOWN_KIND/
    );
    assert.throws(
      () => normalizeDiagramOperation({ kind: "DROP_DATABASE" }),
      /Kind de operación desconocido o no soportado: DROP_DATABASE/
    );
  });

  it("preserva sin alteraciones las operaciones de relación UML", () => {
    const relOps = [
      {
        operationId: "op-cr",
        viewerId: "u1",
        projectId: "p1",
        sequence: 1,
        kind: "CREATE_RELATION",
        payload: { id: "rel-1" },
        createdAt: "2026-09-13",
        attempts: 0,
        state: "pending",
      },
      {
        operationId: "op-rr",
        viewerId: "u1",
        projectId: "p1",
        sequence: 2,
        kind: "RENAME_RELATION",
        relationId: "rel-1",
        payload: { relationId: "rel-1", name: "nuevo_nombre" },
        createdAt: "2026-09-13",
        attempts: 0,
        state: "pending",
      },
      {
        operationId: "op-dr",
        viewerId: "u1",
        projectId: "p1",
        sequence: 3,
        kind: "DELETE_RELATION",
        relationId: "rel-1",
        payload: { relationId: "rel-1" },
        createdAt: "2026-09-13",
        attempts: 0,
        state: "pending",
      },
    ];

    for (const op of relOps) {
      assert.ok(VALID_OPERATION_KINDS.has(op.kind));
      const normalized = normalizeDiagramOperation(op);
      assert.deepEqual(normalized, op);
    }
  });
});
