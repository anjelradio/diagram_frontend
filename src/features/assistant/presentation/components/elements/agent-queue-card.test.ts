import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./agent-queue-card.tsx", import.meta.url), "utf8");

test("AgentQueueCard stays above the animated composer without shrinking", () => {
  assert.match(source, /relative z-10 w-full shrink-0/);
});
