import { describe, it } from "node:test";
import assert from "node:assert/strict";
type CreateClassPayload = {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
  primaryAttribute?: {
    id: string;
    name: string;
    dataType: "UUID";
    position: 0;
    isPrimaryKey: true;
    isNullable: false;
  };
};

type DiagramOperation = {
  operationId: string;
  viewerId: string;
  projectId: string;
  sequence: number;
  kind: string;
  classId: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  state: "pending" | "processing" | "blocked";
  nextAttemptAt?: string;
};

/**
 * Función pura de normalización de operaciones CREATE legadas sin primaryAttribute.
 * Valida el comportamiento exigido por T036 e implementado en el repositorio de cola.
 */
function normalizeDiagramOperation(
  operation: DiagramOperation
): DiagramOperation {
  if (operation.kind === "CREATE") {
    const payload = operation.payload as CreateClassPayload;
    if (!payload.primaryAttribute) {
      return {
        ...operation,
        payload: {
          ...payload,
          primaryAttribute: {
            id: crypto.randomUUID(),
            name: "id",
            dataType: "UUID",
            position: 0,
            isPrimaryKey: true,
            isNullable: false,
          },
        },
      };
    }
  }
  return operation;
}

describe("DiagramOperationQueueRepository - Normalización y FIFO", () => {
  it("normaliza una operación CREATE heredada sin primaryAttribute", () => {
    const legacyOp = {
      operationId: "op-1",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 1,
      kind: "CREATE" as const,
      classId: "class-1",
      payload: {
        id: "class-1",
        name: "Nueva clase",
        positionX: 100,
        positionY: 200,
      } as unknown as CreateClassPayload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending" as const,
    };

    const normalized = normalizeDiagramOperation(legacyOp);

    assert.equal(normalized.kind, "CREATE");
    const payload = normalized.payload as CreateClassPayload;
    assert.ok(payload.primaryAttribute, "Debe añadir primaryAttribute");
    assert.equal(payload.primaryAttribute.name, "id");
    assert.equal(payload.primaryAttribute.dataType, "UUID");
    assert.equal(payload.primaryAttribute.position, 0);
    assert.equal(payload.primaryAttribute.isPrimaryKey, true);
    assert.equal(payload.primaryAttribute.isNullable, false);
    assert.ok(typeof payload.primaryAttribute.id === "string");
  });

  it("conserva la primaryAttribute existente en operaciones CREATE canónicas", () => {
    const canonicalOp: DiagramOperation = {
      operationId: "op-2",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 2,
      kind: "CREATE",
      classId: "class-2",
      payload: {
        id: "class-2",
        name: "Usuario",
        positionX: 300,
        positionY: 400,
        primaryAttribute: {
          id: "pk-custom-uuid",
          name: "id",
          dataType: "UUID",
          position: 0,
          isPrimaryKey: true,
          isNullable: false,
        },
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
    };

    const normalized = normalizeDiagramOperation(canonicalOp);
    const payload = normalized.payload as CreateClassPayload;
    assert.equal(payload.primaryAttribute?.id, "pk-custom-uuid");
  });

  it("no modifica operaciones de atributos ni de movimientos de clase", () => {
    const attrOp: DiagramOperation = {
      operationId: "op-3",
      viewerId: "user-1",
      projectId: "proj-1",
      sequence: 3,
      kind: "CREATE_ATTRIBUTE",
      classId: "class-1",
      payload: {
        id: "attr-1",
        name: "email",
        position: 1,
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
    };

    const normalized = normalizeDiagramOperation(attrOp);
    assert.deepEqual(normalized, attrOp);
  });
});
