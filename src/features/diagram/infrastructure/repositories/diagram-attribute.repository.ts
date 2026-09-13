import type { ApiActionResult } from "@/features/shared/domain/types/api-results";
import { apiRequestStatus } from "@/features/shared/infrastructure/http/api-client";
import type {
  CreateDiagramAttributeInput,
  DiagramAttributeRepository,
  RepositionDiagramAttributeInput,
  UpdateDiagramAttributeInput,
} from "../../domain/repositories/diagram-attribute.repository";
import {
  mapCreateDiagramAttributeInputToRequest,
  mapRepositionDiagramAttributeInputToRequest,
  mapUpdateDiagramAttributeInputToRequest,
} from "../mappers/diagram-attribute.mapper";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export const diagramAttributeRepositoryImpl: DiagramAttributeRepository = {
  async createAttribute(
    classId: string,
    input: CreateDiagramAttributeInput
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/classes/${classId}/attributes`,
      method: "POST",
      withAuth: true,
      body: mapCreateDiagramAttributeInputToRequest(input),
      fallbackMessage: "No se pudo crear el atributo en el servidor.",
    });
  },

  async updateAttribute(
    attributeId: string,
    input: UpdateDiagramAttributeInput
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/attributes/${attributeId}`,
      method: "PATCH",
      withAuth: true,
      body: mapUpdateDiagramAttributeInputToRequest(input),
      fallbackMessage: "No se pudo actualizar el atributo.",
    });
  },

  async repositionAttribute(
    attributeId: string,
    input: RepositionDiagramAttributeInput
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/attributes/${attributeId}/position`,
      method: "PATCH",
      withAuth: true,
      body: mapRepositionDiagramAttributeInputToRequest(input),
      fallbackMessage: "No se pudo reposicionar el atributo.",
    });
  },

  async deleteAttribute(attributeId: string): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${apiBaseUrl}/diagram/attributes/${attributeId}`,
      method: "DELETE",
      withAuth: true,
      fallbackMessage: "No se pudo eliminar el atributo.",
    });
  },
};



