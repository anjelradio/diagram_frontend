import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createProjectRepository,
  type ProjectDataRequester,
} from "./project.repository.ts";
import { ProjectAccessRole } from "../../domain/entities/project.entity.ts";

describe("ProjectRepository - getProject", () => {
  it("obtiene el detalle del proyecto con 200 OK y mapea accessRole", async () => {
    let capturedConfig: unknown = null;
    const mockDataRequester: ProjectDataRequester = async <TParsed, TResult>(cfg: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      withAuth?: boolean;
      fallbackMessage: string;
      responseSchema: { parse: (val: unknown) => TParsed };
      mapData: (data: TParsed) => TResult;
    }) => {
      capturedConfig = cfg;
      const rawData = {
        id: "proj-123",
        name: "Proyecto Alpha",
        description: "Descripción Alpha",
        thumbnail_url: "https://example.com/thumb.png",
        access_role: "EDITOR",
      };
      const parsed = cfg.responseSchema.parse(rawData);
      const mapped = cfg.mapData(parsed);
      return { ok: true, data: mapped };
    };

    const repo = createProjectRepository(mockDataRequester);
    const result = await repo.getProject("proj-123");

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.id, "proj-123");
      assert.equal(result.data.name, "Proyecto Alpha");
      assert.equal(result.data.accessRole, ProjectAccessRole.EDITOR);
    }

    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
    };
    assert.ok(cfg.url.includes("/projects/proj-123"));
    assert.equal(cfg.method, "GET");
    assert.equal(cfg.withAuth, true);
  });

  it("retorna error HTTP 404 cuando el proyecto no existe o es inaccesible", async () => {
    const mockDataRequester: ProjectDataRequester = async () => {
      return {
        ok: false,
        statusCode: 404,
        errors: ["Recurso no encontrado"],
      };
    };

    const repo = createProjectRepository(mockDataRequester);
    const result = await repo.getProject("non-existent");

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.statusCode, 404);
      assert.deepEqual(result.errors, ["Recurso no encontrado"]);
    }
  });

  it("retorna error de red ante fallo de conexión", async () => {
    const mockDataRequester: ProjectDataRequester = async () => {
      return {
        ok: false,
        statusCode: 0,
        errors: ["Error de red al conectar con el servidor"],
      };
    };

    const repo = createProjectRepository(mockDataRequester);
    const result = await repo.getProject("proj-offline");

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.statusCode, 0);
      assert.deepEqual(result.errors, ["Error de red al conectar con el servidor"]);
    }
  });
});

describe("ProjectRepository - importProject and exportProject", () => {
  it("expone los métodos importProject y exportProject en el contrato", () => {
    const repo = createProjectRepository();
    assert.equal(typeof repo.importProject, "function");
    assert.equal(typeof repo.exportProject, "function");
  });

  it("importProject envía FormData al endpoint /projects/import y retorna el proyecto creado", async () => {
    let capturedConfig: unknown = null;
    const fakeFile = new File(["<xmi></xmi>"], "test.xmi", { type: "application/xml" });

    const repo = createProjectRepository(
      undefined,
      undefined,
      async (cfg) => {
        capturedConfig = cfg;
        const rawData = { id: "proj-imported-1", name: "Imported" };
        const parsed = cfg.responseSchema.parse(rawData);
        const mapped = cfg.mapData(parsed);
        return { ok: true, data: mapped };
      },
    );

    const res = await repo.importProject(fakeFile);
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.data.id, "proj-imported-1");
    }

    const cfg = capturedConfig as { url: string; method: string; withAuth: boolean; body: FormData };
    assert.ok(cfg.url.includes("/projects/import"));
    assert.equal(cfg.method, "POST");
    assert.equal(cfg.withAuth, true);
    assert.ok(cfg.body.has("file"));
  });

  it("exportProject invoca apiRequestFile con GET a /projects/{id}/export y devuelve el archivo", async () => {
    let capturedConfig: unknown = null;
    const fakeBlob = new Blob(["<xml></xml>"], { type: "application/xml" });

    const repo = createProjectRepository(
      undefined,
      undefined,
      undefined,
      async (cfg) => {
        capturedConfig = cfg;
        return {
          ok: true,
          data: {
            fileName: "mi-proyecto.xmi",
            contentType: "application/xml",
            blob: fakeBlob,
          },
        };
      },
    );

    const res = await repo.exportProject("proj-999");
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.data.fileName, "mi-proyecto.xmi");
      assert.equal(res.data.blob, fakeBlob);
    }

    const cfg = capturedConfig as { url: string; method: string; withAuth: boolean };
    assert.ok(cfg.url.includes("/projects/proj-999/export"));
    assert.equal(cfg.method, "GET");
    assert.equal(cfg.withAuth, true);
  });
});

describe("ProjectRepository - uploadThumbnail", () => {
  it("envía FormData a /projects/{id}/thumbnail y mapea la respuesta", async () => {
    let capturedConfig: unknown = null;
    const fakeBlob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });

    const repo = createProjectRepository(
      undefined,
      undefined,
      async <TParsed, TResult>(cfg: {
        url: string;
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        body: FormData;
        withAuth?: boolean;
        responseSchema: { parse: (val: unknown) => TParsed };
        mapData: (data: TParsed) => TResult;
      }) => {
        capturedConfig = cfg;
        const rawData = {
          project_id: "proj-123",
          thumbnail_url: "https://res.cloudinary.com/demo/image/upload/diagrama/test.jpg",
          thumbnail_updated_at: "2026-11-10T12:00:00Z",
          updated: true,
        };
        const parsed = cfg.responseSchema.parse(rawData);
        const mapped = cfg.mapData(parsed);
        return { ok: true, data: mapped };
      }
    );

    const res = await repo.uploadThumbnail("proj-123", fakeBlob);
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.data.projectId, "proj-123");
      assert.equal(res.data.thumbnailUrl, "https://res.cloudinary.com/demo/image/upload/diagrama/test.jpg");
      assert.equal(res.data.updated, true);
    }

    const cfg = capturedConfig as {
      url: string;
      method: string;
      withAuth: boolean;
      body: FormData;
    };
    assert.ok(cfg.url.includes("/projects/proj-123/thumbnail"));
    assert.equal(cfg.method, "POST");
    assert.equal(cfg.withAuth, true);
    assert.ok(cfg.body.get("file") instanceof Blob);
  });
});
