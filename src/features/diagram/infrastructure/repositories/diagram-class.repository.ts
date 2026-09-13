import type { ApiActionResult } from "@/features/shared/domain/types/api-results";
import { apiRequestStatus } from "@/features/shared/infrastructure/http/api-client";
import type {
  CreateClassPayload,
  MoveClassPayload,
  RenameClassPayload,
} from "../../domain/entities/diagram-operation.entity";
import type { DiagramClassRepository } from "../../domain/repositories/diagram-class.repository";
import {
  mapCreateClassPayloadToRequest,
  mapMoveClassPayloadToRequest,
  mapRenameClassPayloadToRequest,
} from "../mappers/diagram-class.mapper";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export const diagramClassRepositoryImpl: DiagramClassRepository = {
  async createClass(
    projectId: string,
    payload: CreateClassPayload
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/projects/${projectId}/diagram/classes`,
      method: "POST",
      withAuth: true,
      body: mapCreateClassPayloadToRequest(payload),
      fallbackMessage: "No se pudo crear la clase en el servidor.",
    });
  },

  async renameClass(
    classId: string,
    payload: RenameClassPayload
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/classes/${classId}/name`,
      method: "PATCH",
      withAuth: true,
      body: mapRenameClassPayloadToRequest(payload),
      fallbackMessage: "No se pudo renombrar la clase.",
    });
  },

  async moveClass(
    classId: string,
    payload: MoveClassPayload
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/classes/${classId}/position`,
      method: "PATCH",
      withAuth: true,
      body: mapMoveClassPayloadToRequest(payload),
      fallbackMessage: "No se pudo actualizar la posición de la clase.",
    });
  },

  async deleteClass(classId: string): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/classes/${classId}`,
      method: "DELETE",
      withAuth: true,
      fallbackMessage: "No se pudo eliminar la clase.",
    });
  },
};
