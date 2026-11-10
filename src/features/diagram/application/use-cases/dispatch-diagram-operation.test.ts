import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity.ts";
import { createDispatchDiagramOperation } from "./dispatch-diagram-operation.ts";

const operation = {
  operationId: "generated-id",
  viewerId: "viewer-1",
  projectId: "project-1",
  sequence: 1,
  kind: "RENAME_CLASS",
  classId: "class-1",
  payload: { name: "Renamed" },
  createdAt: "2026-11-03T12:00:00.000Z",
  attempts: 0,
  state: "pending",
} satisfies DiagramOperation;

describe("dispatch diagram operation", () => {
  it("persists before projecting and signaling the synchronizer", async () => {
    const calls: string[] = [];
    const dispatch = createDispatchDiagramOperation({
      queue: {
        async enqueue(input) {
          calls.push("enqueue");
          assert.equal(input.operationId, "generated-id");
          assert.equal(input.createdAt, operation.createdAt);
          return operation;
        },
      },
      projection: { apply: (saved) => { calls.push("project"); assert.equal(saved, operation); } },
      runtime: {
        createId: () => "generated-id",
        now: () => operation.createdAt,
        requestSync: () => calls.push("signal"),
      },
    });

    await dispatch.dispatch({
      viewerId: "viewer-1",
      projectId: "project-1",
      kind: "RENAME_CLASS",
      classId: "class-1",
      payload: { name: "Renamed" },
    });

    assert.deepEqual(calls, ["enqueue", "project", "signal"]);
  });

  it("does not project or signal when durable enqueue fails", async () => {
    const calls: string[] = [];
    const dispatch = createDispatchDiagramOperation({
      queue: { enqueue: async () => { calls.push("enqueue"); throw new Error("quota"); } },
      projection: { apply: () => calls.push("project") },
      runtime: {
        createId: () => "generated-id",
        now: () => operation.createdAt,
        requestSync: () => calls.push("signal"),
      },
    });

    await assert.rejects(
      dispatch.dispatch({
        viewerId: "viewer-1",
        projectId: "project-1",
        kind: "RENAME_CLASS",
        classId: "class-1",
        payload: { name: "Renamed" },
      }),
      /quota/
    );
    assert.deepEqual(calls, ["enqueue"]);
  });
});
