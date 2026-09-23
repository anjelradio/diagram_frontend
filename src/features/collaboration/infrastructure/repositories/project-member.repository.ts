import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type { ProjectMemberList } from "../../domain/entities/project-member.entity";
import type { ProjectMemberRepository } from "../../domain/repositories/project-member.repository";
import { mapProjectMemberListToEntity } from "../mappers/project-member.mapper";
import { projectMemberListResponseSchema } from "../schemas/project-member.schemas";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;
const PROJECTS_URL = `${apiBaseUrl}/projects`;

/**
 * Implementación de infraestructura para ProjectMemberRepository.
 */
export const projectMemberRepositoryImpl: ProjectMemberRepository = {
  async listActiveMembers(projectId: string): Promise<ApiResult<ProjectMemberList>> {
    return apiRequestData({
      url: `${PROJECTS_URL}/${projectId}/members?status_filter=ACTIVE`,
      method: "GET",
      withAuth: true,
      fallbackMessage: "No se pudieron obtener los colaboradores del proyecto.",
      responseSchema: projectMemberListResponseSchema,
      mapData: mapProjectMemberListToEntity,
    });
  },

  async promoteMember(
    projectId: string,
    memberId: string,
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${PROJECTS_URL}/${projectId}/members/${memberId}/promote`,
      method: "POST",
      withAuth: true,
      fallbackMessage: "No se pudo cambiar el rol del colaborador a editor.",
    });
  },

  async demoteMember(
    projectId: string,
    memberId: string,
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${PROJECTS_URL}/${projectId}/members/${memberId}/demote`,
      method: "POST",
      withAuth: true,
      fallbackMessage: "No se pudo cambiar el rol del colaborador a lector.",
    });
  },

  async removeMember(
    projectId: string,
    memberId: string,
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${PROJECTS_URL}/${projectId}/members/${memberId}/remove`,
      method: "POST",
      withAuth: true,
      fallbackMessage: "No se pudo remover al colaborador del proyecto.",
    });
  },
};
