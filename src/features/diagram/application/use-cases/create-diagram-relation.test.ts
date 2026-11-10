import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCreateDiagramRelation } from "./create-diagram-relation.ts";

describe("create diagram relation", () => {
  it("plans the relation and dispatches the complete materialized aggregate", async () => {
    let dispatched: unknown;
    let id = 0;
    const execute = createCreateDiagramRelation({
      async dispatch(operation) {
        dispatched = operation;
        return {
          ...operation,
          sequence: 1,
        } as never;
      },
    });

    const aggregate = await execute({
      viewerId: "viewer-1",
      projectId: "project-1",
      relationType: "ASSOCIATION",
      sourceClass: {
        id: "class-a",
        name: "A",
        positionX: 0,
        positionY: 0,
        attributes: [{ id: "pk-a", name: "id", dataType: "UUID", position: 0, isPrimaryKey: true, isNullable: false }],
      },
      targetClass: {
        id: "class-b",
        name: "B",
        positionX: 200,
        positionY: 0,
        attributes: [{ id: "pk-b", name: "id", dataType: "UUID", position: 0, isPrimaryKey: true, isNullable: false }],
      },
      sourceHandle: "RIGHT_CENTER",
      targetHandle: "LEFT_CENTER",
      sourceCardinality: "1",
      targetCardinality: "0..*",
      idGenerator: () => `id-${++id}`,
    });

    assert.equal(aggregate.materialization.strategy, "FOREIGN_KEY");
    assert.equal(aggregate.materialization.foreignAttributes[0].classId, "class-b");
    assert.deepEqual(dispatched, {
      viewerId: "viewer-1",
      projectId: "project-1",
      kind: "CREATE_RELATION",
      classId: "class-a",
      relationId: aggregate.relation.id,
      payload: aggregate.createRelationPayload,
    });
  });
});
