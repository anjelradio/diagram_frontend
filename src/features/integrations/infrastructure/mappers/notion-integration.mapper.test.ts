import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapConfigureNotionIntegrationToRequest,
  mapInitializeNotionProjectToRequest,
  mapNotionIntegrationStatusToEntity,
} from "./notion-integration.mapper.ts";

describe("notion-integration.mapper", () => {
  it("mapea NotionIntegrationStatusResponse a la entidad NotionIntegrationStatus", () => {
    const rawResponse = {
      project_id: "proj-123",
      provider: "NOTION",
      has_api_key: true,
      is_initialized: true,
      notion_page_id: "page-abc",
      notion_tasks_database_id: "db-xyz",
      notion_page_url: "https://notion.so/my-page",
    };

    const entity = mapNotionIntegrationStatusToEntity(rawResponse);

    assert.deepEqual(entity, {
      projectId: "proj-123",
      provider: "NOTION",
      hasApiKey: true,
      isInitialized: true,
      notionPageId: "page-abc",
      notionTasksDatabaseId: "db-xyz",
      notionPageUrl: "https://notion.so/my-page",
    });
  });

  it("mapea ConfigureNotionIntegrationInput al payload de backend con trim", () => {
    const input = {
      apiKey: "  ntn_secret_token  ",
      parentPageId: "  page-parent-1  ",
    };

    const payload = mapConfigureNotionIntegrationToRequest(input);

    assert.deepEqual(payload, {
      api_key: "ntn_secret_token",
      parent_page_id: "page-parent-1",
    });
  });

  it("mapea ConfigureNotionIntegrationInput omitiendo parentPageId si es nulo o vacío", () => {
    const input = {
      apiKey: "ntn_secret_token",
      parentPageId: "   ",
    };

    const payload = mapConfigureNotionIntegrationToRequest(input);

    assert.equal(payload.parent_page_id, null);
  });

  it("mapea InitializeNotionProjectInput al payload de backend", () => {
    const input = {
      description: "  Breve descripción del kiosco.  ",
    };

    const payload = mapInitializeNotionProjectToRequest(input);

    assert.deepEqual(payload, {
      description: "Breve descripción del kiosco.",
    });
  });
});
