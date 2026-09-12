import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  ProjectCreated,
  ProjectList,
  ProjectUpdate,
} from "../../domain/entities/project.entity";
import type { ProjectRepository } from "../../domain/repositories/project.repository";
import {
  mapProjectCreatedToEntity,
  mapProjectListToEntity,
  mapProjectUpdateToRequest,
} from "../mappers/project.mapper";
import {
  projectCreatedResponseSchema,
  projectListResponseSchema,
} from "../schemas/project.schemas";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;
const PROJECTS_URL = `${apiBaseUrl}/projects`;

/**
 * Implementación de infraestructura de ProjectRepository usando apiRequestData, apiRequestStatus y JWT automático.
 */
export const projectRepositoryImpl: ProjectRepository = {
  async listProjects(): Promise<ApiResult<ProjectList>> {
    return apiRequestData({
      url: PROJECTS_URL,
      method: "GET",
      withAuth: true,
      fallbackMessage: "No se pudieron obtener los proyectos. Intenta de nuevo.",
      responseSchema: projectListResponseSchema,
      mapData: mapProjectListToEntity,
    });
  },

  async createProject(): Promise<ApiResult<ProjectCreated>> {
    return apiRequestData({
      url: PROJECTS_URL,
      method: "POST",
      withAuth: true,
      fallbackMessage: "No se pudo crear el proyecto. Intenta de nuevo.",
      responseSchema: projectCreatedResponseSchema,
      mapData: mapProjectCreatedToEntity,
    });
  },

  async updateProject(
    projectId: string,
    update: ProjectUpdate,
  ): Promise<ApiActionResult> {
    const payload = mapProjectUpdateToRequest(update);
    return apiRequestStatus({
      url: `${PROJECTS_URL}/${projectId}`,
      method: "PATCH",
      withAuth: true,
      body: payload,
      fallbackMessage: "No se pudo actualizar el proyecto. Intenta de nuevo.",
    });
  },

  async deleteProject(projectId: string): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${PROJECTS_URL}/${projectId}`,
      method: "DELETE",
      withAuth: true,
      fallbackMessage: "No se pudo eliminar el proyecto. Intenta de nuevo.",
    });
  },
};
