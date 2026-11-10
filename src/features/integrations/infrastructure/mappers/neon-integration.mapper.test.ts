import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapConfigureNeonIntegrationToRequest,
  mapNeonIntegrationStatusToEntity,
  mapNeonSyncResultToEntity,
} from "./neon-integration.mapper.ts";

describe("neon-integration.mapper", () => {
  it("mapea NeonIntegrationStatusResponse a la entidad NeonIntegrationStatus", () => {
    const rawResponse = {
      project_id: "proj-123",
      provider: "NEON",
      has_api_key: true,
      is_initialized: true,
      neon_project_id: "neon-proj-abc",
      neon_database_name: "neondb",
      neon_console_url: "https://console.neon.tech/app/projects/neon-proj-abc",
      neon_branch_id: "br-main-1",
      last_synced_at: "2026-11-10T12:00:00Z",
    };

    const entity = mapNeonIntegrationStatusToEntity(rawResponse);

    assert.deepEqual(entity, {
      projectId: "proj-123",
      provider: "NEON",
      hasApiKey: true,
      isInitialized: true,
      neonProjectId: "neon-proj-abc",
      neonDatabaseName: "neondb",
      neonConsoleUrl: "https://console.neon.tech/app/projects/neon-proj-abc",
      neonBranchId: "br-main-1",
      lastSyncedAt: "2026-11-10T12:00:00Z",
    });
  });

  it("mapea ConfigureNeonIntegrationInput al payload de backend con trim", () => {
    const input = {
      apiKey: "  napi_secret_key_123  ",
    };

    const payload = mapConfigureNeonIntegrationToRequest(input);

    assert.deepEqual(payload, {
      api_key: "napi_secret_key_123",
    });
  });

  it("mapea NeonSyncResultResponse a la entidad NeonSyncResult", () => {
    const rawResponse = {
      has_changes: true,
      created_tables: ["users", "orders"],
      dropped_tables: ["legacy"],
      added_columns: { users: ["email"] },
      dropped_columns: {},
      altered_columns: {},
      added_foreign_keys: ["fk_orders_users"],
      dropped_foreign_keys: [],
    };

    const entity = mapNeonSyncResultToEntity(rawResponse);

    assert.deepEqual(entity, {
      hasChanges: true,
      createdTables: ["users", "orders"],
      droppedTables: ["legacy"],
      addedColumns: { users: ["email"] },
      droppedColumns: {},
      alteredColumns: {},
      addedForeignKeys: ["fk_orders_users"],
      droppedForeignKeys: [],
    });
  });
});
