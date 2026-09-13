import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type { DiagramSnapshot } from "../../domain/entities/diagram-class.entity";
import type { DiagramRepository } from "../../domain/repositories/diagram.repository";
import { mapDiagramSnapshotToEntity } from "../mappers/diagram.mapper";
import { diagramReadSchema } from "../schemas/diagram.schemas";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export const diagramRepositoryImpl: DiagramRepository = {
  async getDiagram(projectId: string): Promise<ApiResult<DiagramSnapshot>> {
    return apiRequestData({
      url: `${apiBaseUrl}/projects/${projectId}/diagram`,
      method: "GET",
      withAuth: true,
      fallbackMessage: "No se pudo obtener el diagrama del proyecto.",
      responseSchema: diagramReadSchema,
      mapData: mapDiagramSnapshotToEntity,
    });
  },
};
