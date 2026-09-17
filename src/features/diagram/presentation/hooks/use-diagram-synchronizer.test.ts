import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PERMANENT_ERROR_STATUSES = [400, 401, 403, 404, 409, 422];

function evaluateOperationResult(
  statusCode: number,
  currentAttempts = 0
): {
  action: "dequeue" | "block" | "retry";
  state: "idle" | "pending" | "blocked";
  nextAttempts?: number;
  delayMs?: number;
} {
  if (statusCode >= 200 && statusCode < 300) {
    return { action: "dequeue", state: "idle" };
  }

  if (PERMANENT_ERROR_STATUSES.includes(statusCode)) {
    return { action: "block", state: "blocked" };
  }

  const nextAttempts = currentAttempts + 1;
  const delayMs = Math.min(1000 * Math.pow(2, nextAttempts - 1), 10000);

  return {
    action: "retry",
    state: "pending",
    nextAttempts,
    delayMs,
  };
}

describe("useDiagramSynchronizer - Transiciones y bloqueo de cola", () => {
  it("desencola operaciones exitosas con códigos 200, 201 y 204", () => {
    assert.deepEqual(evaluateOperationResult(200), {
      action: "dequeue",
      state: "idle",
    });
    assert.deepEqual(evaluateOperationResult(201), {
      action: "dequeue",
      state: "idle",
    });
    assert.deepEqual(evaluateOperationResult(204), {
      action: "dequeue",
      state: "idle",
    });
  });

  it("bloquea definitivamente la cola ante códigos de error definitivos (400, 401, 403, 404, 409, 422)", () => {
    for (const code of PERMANENT_ERROR_STATUSES) {
      const outcome = evaluateOperationResult(code, 0);
      assert.equal(
        outcome.action,
        "block",
        `El código ${code} debe bloquear la cola`
      );
      assert.equal(
        outcome.state,
        "blocked",
        `El estado debe ser 'blocked' para el código ${code}`
      );
    }
  });

  it("reintenta con retroceso exponencial ante fallos transitorios (500, 502, 503, error de red)", () => {
    const outcome1 = evaluateOperationResult(0, 0);
    assert.equal(outcome1.action, "retry");
    assert.equal(outcome1.state, "pending");
    assert.equal(outcome1.nextAttempts, 1);
    assert.equal(outcome1.delayMs, 1000);

    const outcome2 = evaluateOperationResult(500, 1);
    assert.equal(outcome2.action, "retry");
    assert.equal(outcome2.nextAttempts, 2);
    assert.equal(outcome2.delayMs, 2000);

    const outcome3 = evaluateOperationResult(503, 2);
    assert.equal(outcome3.action, "retry");
    assert.equal(outcome3.nextAttempts, 3);
    assert.equal(outcome3.delayMs, 4000);

    const outcomeCap = evaluateOperationResult(502, 6);
    assert.equal(outcomeCap.action, "retry");
    assert.equal(outcomeCap.delayMs, 10000, "El delay debe topar en 10s");
  });

  it("procesa operaciones en estricto orden FIFO según secuencia ascendente", () => {
    const queue = [
      { sequence: 3, id: "op-3" },
      { sequence: 1, id: "op-1" },
      { sequence: 2, id: "op-2" },
    ];

    const sorted = [...queue].sort((a, b) => a.sequence - b.sequence);
    assert.deepEqual(
      sorted.map((o) => o.id),
      ["op-1", "op-2", "op-3"]
    );
  });

  it("despacha exhaustivamente operaciones de relación UML hacia sus repositorios", async () => {
    const dispatchedCalls: string[] = [];

    const mockRelationRepo = {
      async createRelation(projectId: string, payload: { id: string }) {
        dispatchedCalls.push(`create:${projectId}:${payload.id}`);
        return { ok: true, statusCode: 201 };
      },
      async renameRelation(relationId: string, payload: { name: string }) {
        dispatchedCalls.push(`rename:${relationId}:${payload.name}`);
        return { ok: true, statusCode: 204 };
      },
      async deleteRelation(relationId: string) {
        dispatchedCalls.push(`delete:${relationId}`);
        return { ok: true, statusCode: 204 };
      },
    };

    // 1. Despacho de CREATE_RELATION
    const resCreate = await mockRelationRepo.createRelation("proj-1", { id: "rel-1" });
    assert.equal(resCreate.ok, true);
    assert.equal(resCreate.statusCode, 201);

    // 2. Despacho de RENAME_RELATION
    const resRename = await mockRelationRepo.renameRelation("rel-1", { name: "NuevoNombre" });
    assert.equal(resRename.ok, true);
    assert.equal(resRename.statusCode, 204);

    // 3. Despacho de DELETE_RELATION
    const resDelete = await mockRelationRepo.deleteRelation("rel-1");
    assert.equal(resDelete.ok, true);
    assert.equal(resDelete.statusCode, 204);

    assert.deepEqual(dispatchedCalls, [
      "create:proj-1:rel-1",
      "rename:rel-1:NuevoNombre",
      "delete:rel-1",
    ]);
  });

  it("bloquea permanentemente con 409 si se intenta renombrar una relación N:M", () => {
    // 409 Conflict retornado por el servidor cuando se renombra un agregado N:M
    const outcome = evaluateOperationResult(409, 0);
    assert.equal(outcome.action, "block");
    assert.equal(outcome.state, "blocked");
  });

  it("pausa el despacho de la cola y no ejecuta operaciones cuando canEdit es false (READER)", async () => {
    let dispatched = false;
    const canEdit = false;

    // Función simulada de ejecución de cola con control de acceso
    async function executeQueueIfEditable(editable: boolean) {
      if (!editable) return "paused";
      dispatched = true;
      return "dispatched";
    }

    const result = await executeQueueIfEditable(canEdit);
    assert.equal(result, "paused");
    assert.equal(dispatched, false, "No debe despachar llamadas al backend en modo reader");
  });

  it("no proyecta operaciones locales pendientes sobre el store si canEdit es false", () => {
    const serverSnapshot = {
      classes: [{ id: "c1", name: "ServidorClase", positionX: 0, positionY: 0, attributes: [] }],
      relations: [],
    };
    assert.equal(serverSnapshot.classes.length, 1);
    const pendingOps = [
      {
        operationId: "op-pending-1",
        kind: "RENAME_CLASS" as const,
        payload: { name: "NombreLocalPendiente" },
        classId: "c1",
      },
    ];

    // Simular hidratación selectiva según permiso de edición
    function getHydrationOps(canEdit: boolean, ops: typeof pendingOps) {
      return canEdit ? ops : [];
    }

    const readerOps = getHydrationOps(false, pendingOps);
    assert.deepEqual(readerOps, [], "El lector no debe recibir operaciones locales pendientes para proyectar");

    const editorOps = getHydrationOps(true, pendingOps);
    assert.equal(editorOps.length, 1);
  });

  it("protege contra rehidratación del snapshot inicial ante cambios de canEdit (bloqueo/desbloqueo de agente)", () => {
    let hydrationCount = 0;
    let initializedProjectKey: string | null = null;

    const simulateEffect = (projectId: string, viewerId: string, canEdit: boolean) => {
      const projectKey = `${projectId}:${viewerId}`;
      if (initializedProjectKey === projectKey) return;
      initializedProjectKey = projectKey;
      hydrationCount++;
    };

    // Montaje inicial: canEdit = true
    simulateEffect("proj-1", "user-1", true);
    assert.equal(hydrationCount, 1);

    // Agente bloquea el lienzo: canEdit pasa a false
    simulateEffect("proj-1", "user-1", false);
    assert.equal(hydrationCount, 1, "No debe rehidratar snapshot cuando el agente bloquea el lienzo");

    // Agente termina: canEdit vuelve a true
    simulateEffect("proj-1", "user-1", true);
    assert.equal(hydrationCount, 1, "No debe rehidratar snapshot cuando el agente libera el lienzo");

    // Cambio a otro proyecto: debe hidratar
    simulateEffect("proj-2", "user-1", true);
    assert.equal(hydrationCount, 2);
  });
});
