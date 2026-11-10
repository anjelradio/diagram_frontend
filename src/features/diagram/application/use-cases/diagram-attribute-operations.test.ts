import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCreateDiagramAttribute } from "./create-diagram-attribute.ts";
import { createUpdateDiagramAttribute } from "./update-diagram-attribute.ts";
import { createRepositionDiagramAttribute } from "./reposition-diagram-attribute.ts";
import { createDeleteDiagramAttribute } from "./delete-diagram-attribute.ts";

describe("diagram attribute operations", () => {
  it("dispatches CRUD and ordering commands with attribute identity and nullable patch", async () => {
    const calls: unknown[] = [];
    const dispatcher = { dispatch: async (operation: unknown) => { calls.push(operation); return operation as never; } };

    await createCreateDiagramAttribute(dispatcher)("viewer", "project", "class-1", {
      id: "attribute-1", name: "age", position: 1,
    });
    await createUpdateDiagramAttribute(dispatcher)("viewer", "project", "class-1", {
      attributeId: "attribute-1", dataType: "INTEGER", isNullable: false,
    });
    await createRepositionDiagramAttribute(dispatcher)("viewer", "project", "class-1", {
      attributeId: "attribute-1", position: 2,
    });
    await createDeleteDiagramAttribute(dispatcher)("viewer", "project", "class-1", {
      attributeId: "attribute-1",
    });

    assert.deepEqual(calls.map((call) => (call as { kind: string }).kind), [
      "CREATE_ATTRIBUTE", "UPDATE_ATTRIBUTE", "REPOSITION_ATTRIBUTE", "DELETE_ATTRIBUTE",
    ]);
    assert.deepEqual((calls[1] as { payload: unknown }).payload, {
      attributeId: "attribute-1", dataType: "INTEGER", isNullable: false,
    });
  });
});
