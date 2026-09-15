import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./use-agent-activities.ts", import.meta.url), "utf8");

test("el historial se recarga una sola vez por activityId terminal", () => {
  assert.match(source, /lastAgentFinishedActivityId/);
  assert.match(source, /refreshedActivityRef/);
  assert.match(source, /refreshedActivityRef\.current !== lastFinishedActivityId/);
  assert.match(source, /void reloadActivities\(\)/);
});
