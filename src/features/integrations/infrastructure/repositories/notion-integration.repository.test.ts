import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createNotionIntegrationRepository,
  type NotionDataRequester,
} from "./notion-integration.repository.ts";

describe("notion-integration.repository", () => {
  it("getStatus envía GET a la ruta de integración del proyecto", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NotionDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          projectId: "p-1",
          provider: "NOTION",
          hasApiKey: true,
          isInitialized: false,
          notionPageId: null,
          notionTasksDatabaseId: null,
          notionPageUrl: null,
        },
      };
    }) as unknown as NotionDataRequester;

    const repository = createNotionIntegrationRepository(mockRequester);
    const result = await repository.getStatus("p-1");

    assert.equal(result.ok, true);
    const cfg = capturedConfig as { url: string; method: string; withAuth: boolean };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/notion"));
    assert.equal(cfg.method, "GET");
    assert.equal(cfg.withAuth, true);
  });

  it("configureApiKey envía PUT /config con el payload mapeado", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NotionDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          projectId: "p-1",
          provider: "NOTION",
          hasApiKey: true,
          isInitialized: false,
          notionPageId: null,
          notionTasksDatabaseId: null,
          notionPageUrl: null,
        },
      };
    }) as unknown as NotionDataRequester;

    const repository = createNotionIntegrationRepository(mockRequester);
    const result = await repository.configureApiKey("p-1", {
      apiKey: "ntn_test_123",
    });

    assert.equal(result.ok, true);
    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
      body: { api_key: string; parent_page_id: string | null };
    };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/notion/config"));
    assert.equal(cfg.method, "PUT");
    assert.equal(cfg.withAuth, true);
    assert.deepEqual(cfg.body, { api_key: "ntn_test_123", parent_page_id: null });
  });

  it("initializeProject envía POST /initialize con la descripción", async () => {
    let capturedConfig: unknown = null;
    const mockRequester: NotionDataRequester = (async (cfg: unknown) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          projectId: "p-1",
          provider: "NOTION",
          hasApiKey: true,
          isInitialized: true,
          notionPageId: "page-123",
          notionTasksDatabaseId: "db-123",
          notionPageUrl: "https://notion.so/test",
        },
      };
    }) as unknown as NotionDataRequester;

    const repository = createNotionIntegrationRepository(mockRequester);
    const result = await repository.initializeProject("p-1", {
      description: "Descripción del sistema",
    });

    assert.equal(result.ok, true);
    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
      body: { description: string };
    };
    assert.ok(cfg.url.includes("/projects/p-1/integrations/notion/initialize"));
    assert.equal(cfg.method, "POST");
    assert.equal(cfg.withAuth, true);
    assert.deepEqual(cfg.body, { description: "Descripción del sistema" });
  });
});
