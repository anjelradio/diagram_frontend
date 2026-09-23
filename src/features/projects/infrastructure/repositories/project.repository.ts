import type {
  ApiActionResult,
  ApiFileResult,
  ApiResult,
} from "../../../shared/domain/types/api-results.ts";
import type { ZodType } from "zod";
import type {
  ProjectCreated,
  ProjectDetail,
  ProjectList,
  ProjectUpdate,
} from "../../domain/entities/project.entity.ts";
import type { ProjectRepository } from "../../domain/repositories/project.repository.ts";
import {
  mapProjectCreatedToEntity,
  mapProjectDetailToEntity,
  mapProjectListToEntity,
  mapProjectUpdateToRequest,
} from "../mappers/project.mapper.ts";
import {
  projectCreatedResponseSchema,
  projectDetailResponseSchema,
  projectListResponseSchema,
} from "../schemas/project.schemas.ts";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;
const PROJECTS_URL = `${apiBaseUrl}/projects`;

export type ProjectDataRequester = <TParsed, TResult>(config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  fallbackMessage: string;
  responseSchema: ZodType<TParsed>;
  mapData: (data: TParsed) => TResult;
}) => Promise<ApiResult<TResult>>;

export type ProjectStatusRequester = (config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  body?: unknown;
  fallbackMessage: string;
}) => Promise<ApiActionResult>;

export type ProjectFormDataRequester = <TParsed, TResult>(config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  body: FormData;
  fallbackMessage: string;
  responseSchema: ZodType<TParsed>;
  mapData: (data: TParsed) => TResult;
}) => Promise<ApiResult<TResult>>;

export type ProjectFileRequester = (config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  defaultFileName: string;
  defaultContentType?: string;
  fallbackMessage: string;
}) => Promise<ApiFileResult>;

/**
 * Crea una instancia de ProjectRepository permitiendo inyectar clientes HTTP para pruebas.
 */
export function createProjectRepository(
  customDataRequester?: ProjectDataRequester,
  customStatusRequester?: ProjectStatusRequester,
  customFormDataRequester?: ProjectFormDataRequester,
  customFileRequester?: ProjectFileRequester
): ProjectRepository {
  let defaultDataRequester = customDataRequester || null;
  let defaultStatusRequester = customStatusRequester || null;
  let defaultFormDataRequester = customFormDataRequester || null;
  let defaultFileRequester = customFileRequester || null;

  async function getDataRequester(): Promise<ProjectDataRequester> {
    if (defaultDataRequester) return defaultDataRequester;
    const mod = await import("../../../shared/infrastructure/http/api-client");
    defaultDataRequester = mod.apiRequestData;
    return mod.apiRequestData;
  }

  async function getStatusRequester(): Promise<ProjectStatusRequester> {
    if (defaultStatusRequester) return defaultStatusRequester;
    const mod = await import("../../../shared/infrastructure/http/api-client");
    defaultStatusRequester = mod.apiRequestStatus;
    return mod.apiRequestStatus;
  }

  async function getFormDataRequester(): Promise<ProjectFormDataRequester> {
    if (defaultFormDataRequester) return defaultFormDataRequester;
    const mod = await import("../../../shared/infrastructure/http/api-client");
    defaultFormDataRequester = mod.apiRequestFormData;
    return mod.apiRequestFormData;
  }

  async function getFileRequester(): Promise<ProjectFileRequester> {
    if (defaultFileRequester) return defaultFileRequester;
    const mod = await import("../../../shared/infrastructure/http/api-client");
    defaultFileRequester = mod.apiRequestFile;
    return mod.apiRequestFile;
  }

  return {
    async listProjects(): Promise<ApiResult<ProjectList>> {
      const sendData = await getDataRequester();
      return sendData({
        url: PROJECTS_URL,
        method: "GET",
        withAuth: true,
        fallbackMessage: "No se pudieron obtener los proyectos. Intenta de nuevo.",
        responseSchema: projectListResponseSchema,
        mapData: mapProjectListToEntity,
      });
    },

    async getProject(projectId: string): Promise<ApiResult<ProjectDetail>> {
      const sendData = await getDataRequester();
      return sendData({
        url: `${PROJECTS_URL}/${projectId}`,
        method: "GET",
        withAuth: true,
        fallbackMessage: "No se pudo obtener el proyecto. Intenta de nuevo.",
        responseSchema: projectDetailResponseSchema,
        mapData: mapProjectDetailToEntity,
      });
    },

    async createProject(): Promise<ApiResult<ProjectCreated>> {
      const sendData = await getDataRequester();
      return sendData({
        url: PROJECTS_URL,
        method: "POST",
        withAuth: true,
        fallbackMessage: "No se pudo crear el proyecto. Intenta de nuevo.",
        responseSchema: projectCreatedResponseSchema,
        mapData: mapProjectCreatedToEntity,
      });
    },

    async importProject(file: File): Promise<ApiResult<ProjectCreated>> {
      const formData = new FormData();
      formData.append("file", file);
      const sendFormData = await getFormDataRequester();
      return sendFormData({
        url: `${PROJECTS_URL}/import`,
        method: "POST",
        withAuth: true,
        body: formData,
        fallbackMessage: "No se pudo importar el proyecto. Verifica que el archivo sea compatible.",
        responseSchema: projectCreatedResponseSchema,
        mapData: mapProjectCreatedToEntity,
      });
    },

    async exportProject(projectId: string): Promise<ApiFileResult> {
      const sendFile = await getFileRequester();
      return sendFile({
        url: `${PROJECTS_URL}/${projectId}/export`,
        method: "GET",
        withAuth: true,
        defaultFileName: "diagram.xmi",
        defaultContentType: "application/xml",
        fallbackMessage: "No se pudo exportar el proyecto.",
      });
    },

    async updateProject(
      projectId: string,
      update: ProjectUpdate,
    ): Promise<ApiActionResult> {
      const sendStatus = await getStatusRequester();
      const payload = mapProjectUpdateToRequest(update);
      return sendStatus({
        url: `${PROJECTS_URL}/${projectId}`,
        method: "PATCH",
        withAuth: true,
        body: payload,
        fallbackMessage: "No se pudo actualizar el proyecto. Intenta de nuevo.",
      });
    },

    async deleteProject(projectId: string): Promise<ApiActionResult> {
      const sendStatus = await getStatusRequester();
      return sendStatus({
        url: `${PROJECTS_URL}/${projectId}`,
        method: "DELETE",
        withAuth: true,
        fallbackMessage: "No se pudo eliminar el proyecto. Intenta de nuevo.",
      });
    },
  };
}

/**
 * Implementación de infraestructura de ProjectRepository usando apiRequestData, apiRequestStatus y JWT automático.
 */
export const projectRepositoryImpl: ProjectRepository = createProjectRepository();

export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
