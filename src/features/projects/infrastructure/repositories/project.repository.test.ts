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
