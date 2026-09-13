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
});
