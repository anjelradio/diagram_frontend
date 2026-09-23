import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  Invitation,
  JoinProjectResult,
} from "../../domain/entities/invitation.entity";
import type { InvitationRepository } from "../../domain/repositories/invitation.repository";
import {
  mapInvitationToEntity,
  mapJoinProjectToEntity,
} from "../mappers/invitation.mapper";
import {
  invitationResponseSchema,
  joinProjectResponseSchema,
} from "../schemas/invitation.schemas";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;
const PROJECTS_URL = `${apiBaseUrl}/projects`;

/**
 * Implementación de infraestructura para InvitationRepository.
 */
export const invitationRepositoryImpl: InvitationRepository = {
  async createInvitation(projectId: string): Promise<ApiResult<Invitation>> {
    return apiRequestData({
      url: `${PROJECTS_URL}/${projectId}/invitations`,
      method: "POST",
      withAuth: true,
      fallbackMessage: "No se pudo generar la invitación del proyecto.",
      responseSchema: invitationResponseSchema,
      mapData: mapInvitationToEntity,
    });
  },

  async join(code: string): Promise<ApiResult<JoinProjectResult>> {
    return apiRequestData({
      url: `${PROJECTS_URL}/join`,
      method: "POST",
      body: { code },
      withAuth: true,
      fallbackMessage:
        "No se pudo procesar el código de invitación al proyecto.",
      responseSchema: joinProjectResponseSchema,
      mapData: mapJoinProjectToEntity,
    });
  },
};
