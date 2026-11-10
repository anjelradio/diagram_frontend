import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createNeonIntegrationRepository,
  type NeonDataRequester,
} from "./neon-integration.repository.ts";

describe("neon-integration.repository", () => {
  it("getStatus envía GET a la ruta de integración de Neon del proyecto", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NeonDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          projectId: "p-1",
          provider: "NEON",
          hasApiKey: true,
          isInitialized: false,
          neonProjectId: null,
          neonDatabaseName: null,
          neonConsoleUrl: null,
          neonBranchId: null,
          lastSyncedAt: null,
        },
      };
    }) as unknown as NeonDataRequester;

    const repository = createNeonIntegrationRepository(mockRequester);
    const result = await repository.getStatus("p-1");

    assert.equal(result.ok, true);
    const cfg = capturedConfig as { url: string; method: string; withAuth: boolean };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/neon"));
    assert.equal(cfg.method, "GET");
    assert.equal(cfg.withAuth, true);
  });

  it("configureApiKey envía PUT /config con el payload de API Key", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NeonDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          projectId: "p-1",
          provider: "NEON",
          hasApiKey: true,
          isInitialized: false,
          neonProjectId: null,
          neonDatabaseName: null,
          neonConsoleUrl: null,
          neonBranchId: null,
          lastSyncedAt: null,
        },
      };
    }) as unknown as NeonDataRequester;

    const repository = createNeonIntegrationRepository(mockRequester);
    const result = await repository.configureApiKey("p-1", {
      apiKey: "napi_test_123",
    });

    assert.equal(result.ok, true);
    const cfg = capturedConfig as { url: string; method: string; body: unknown };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/neon/config"));
    assert.equal(cfg.method, "PUT");
    assert.deepEqual(cfg.body, { api_key: "napi_test_123" });
  });

  it("initializeProject envía POST /initialize", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NeonDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          projectId: "p-1",
          provider: "NEON",
          hasApiKey: true,
          isInitialized: true,
          neonProjectId: "neon-p1",
          neonDatabaseName: "neondb",
          neonConsoleUrl: "https://console.neon.tech/app/projects/neon-p1",
          neonBranchId: "br-main",
          lastSyncedAt: "2026-11-10T12:00:00Z",
        },
      };
    }) as unknown as NeonDataRequester;

    const repository = createNeonIntegrationRepository(mockRequester);
    const result = await repository.initializeProject("p-1");

    assert.equal(result.ok, true);
    const cfg = capturedConfig as { url: string; method: string };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/neon/initialize"));
    assert.equal(cfg.method, "POST");
  });

  it("syncDatabase envía POST /sync", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NeonDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          hasChanges: true,
          createdTables: ["users"],
          droppedTables: [],
          addedColumns: {},
          droppedColumns: {},
          alteredColumns: {},
          addedForeignKeys: [],
          droppedForeignKeys: [],
        },
      };
    }) as unknown as NeonDataRequester;

    const repository = createNeonIntegrationRepository(mockRequester);
    const result = await repository.syncDatabase("p-1");

    assert.equal(result.ok, true);
    const cfg = capturedConfig as { url: string; method: string };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/neon/sync"));
    assert.equal(cfg.method, "POST");
  });
});
