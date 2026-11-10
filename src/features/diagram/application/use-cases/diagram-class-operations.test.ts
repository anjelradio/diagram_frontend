import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCreateDiagramClass } from "./create-diagram-class.ts";
import { createRenameDiagramClass } from "./rename-diagram-class.ts";
import { createMoveDiagramClass } from "./move-diagram-class.ts";
import { createDeleteDiagramClass } from "./delete-diagram-class.ts";

describe("diagram class operations", () => {
  it("keeps client class/PK identity and dispatches canonical class commands", async () => {
    const calls: unknown[] = [];
    const dispatcher = { dispatch: async (operation: unknown) => { calls.push(operation); return operation as never; } };
    const pk = { id: "client-pk", name: "id" as const, dataType: "UUID" as const, position: 0 as const, isPrimaryKey: true as const, isNullable: false as const };

    await createCreateDiagramClass(dispatcher)("viewer", "project", {
      id: "class-1", name: "Nueva clase", positionX: 10, positionY: 20, primaryAttribute: pk,
    });
    await createRenameDiagramClass(dispatcher)("viewer", "project", "class-1", "Customer");
    await createMoveDiagramClass(dispatcher)("viewer", "project", "class-1", 30, 40);
    await createDeleteDiagramClass(dispatcher)("viewer", "project", "class-1");

    assert.equal((calls[0] as { payload: { primaryAttribute: { id: string } } }).payload.primaryAttribute.id, "client-pk");
    assert.deepEqual(calls.map((call) => (call as { kind: string }).kind), [
      "CREATE_CLASS", "RENAME_CLASS", "MOVE_CLASS", "DELETE_CLASS",
    ]);
  });
});
