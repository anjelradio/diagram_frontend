import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HttpCodeGenerationRepository,
  triggerBrowserDownload,
  type FileRequester,
} from "./http-code-generation.repository.ts";

describe("HttpCodeGenerationRepository", () => {
  it("construye la petición al endpoint de generación con los parámetros correctos", async () => {
    let capturedConfig: any = null;

    const mockRequester: FileRequester = async (cfg) => {
      capturedConfig = cfg;
      return {
        ok: true,
        data: {
          fileName: "backend-test.zip",
          contentType: "application/zip",
          blob: new Blob(["dummy"]),
        },
      };
    };

    const repo = new HttpCodeGenerationRepository(mockRequester);
    const result = await repo.generateSpringBootBackend("proj-123", {
      packageName: "com.test.app",
      artifactId: "test-app",
      databaseName: "test_db",
    });

    assert.equal(result.ok, true);
    assert.ok(capturedConfig.url.includes("/code-generation/projects/proj-123/spring-boot"));
    assert.equal(capturedConfig.method, "POST");
    assert.equal(capturedConfig.withAuth, true);
    assert.deepEqual(capturedConfig.body, {
      package_name: "com.test.app",
      artifact_id: "test-app",
      database_name: "test_db",
    });
  });

  it("triggerBrowserDownload no arroja errores y activa el clic del enlace", () => {
    const origWindow = globalThis.window;
    let clicked = false;
    let createdUrl = "";

    (globalThis as any).window = {
      URL: {
        createObjectURL: () => {
          createdUrl = "blob:mock-url";
          return createdUrl;
        },
        revokeObjectURL: () => {},
      },
    };

    const origDocument = globalThis.document;
    (globalThis as any).document = {
      createElement: () => ({
        style: {},
        click: () => {
          clicked = true;
        },
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };

    try {
      const mockBlob = new Blob(["test"], { type: "application/zip" });
      triggerBrowserDownload(mockBlob, "backend.zip");
      assert.equal(clicked, true);
      assert.equal(createdUrl, "blob:mock-url");
    } finally {
      (globalThis as any).window = origWindow;
      (globalThis as any).document = origDocument;
    }
  });

  it("CODE_GENERATION_MESSAGES contiene los mensajes requeridos para todos los estados", async () => {
    const { CODE_GENERATION_MESSAGES } = await import(
      "../../presentation/constants/code-generation.messages.ts"
    );

    assert.ok(CODE_GENERATION_MESSAGES.loading.generating.length > 0);
    assert.ok(CODE_GENERATION_MESSAGES.loading.buttonGenerating.length > 0);
    assert.ok(CODE_GENERATION_MESSAGES.success.downloadComplete.length > 0);
    assert.ok(CODE_GENERATION_MESSAGES.error.defaultTitle.length > 0);
    assert.ok(CODE_GENERATION_MESSAGES.error.unexpectedTitle.length > 0);
    assert.ok(CODE_GENERATION_MESSAGES.actions.generateBackend.length > 0);
  });
});
