import type { ApiActionResult } from "../../../shared/domain/types/api-results.ts";
import type {
  CreateRelationPayload,
  RenameRelationPayload,
} from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramRelationRepository } from "../../domain/repositories/diagram-relation.repository.ts";
import {
  mapCreateRelationPayloadToRequest,
  mapRenameRelationPayloadToRequest,
} from "../mappers/diagram-relation.mapper.ts";

export type StatusRequester = (config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  body?: unknown;
  fallbackMessage: string;
}) => Promise<ApiActionResult>;

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export function createDiagramRelationRepository(
  requester?: StatusRequester
): DiagramRelationRepository {
  let defaultRequester: StatusRequester | null = requester || null;

  async function getRequester(): Promise<StatusRequester> {
    if (defaultRequester) {
      return defaultRequester;
    }
    const clientModule = await import(
      "../../../shared/infrastructure/http/api-client"
    );
    const resolved = clientModule.apiRequestStatus;
    defaultRequester = resolved;
    return resolved;
  }


  return {
    async createRelation(
      projectId: string,
      payload: CreateRelationPayload
    ): Promise<ApiActionResult> {
      const send = await getRequester();
      return send({
        url: `${apiBaseUrl}/projects/${projectId}/diagram/relations`,
        method: "POST",
        withAuth: true,
        body: mapCreateRelationPayloadToRequest(payload),
        fallbackMessage: "No se pudo crear la relación en el servidor.",
      });
    },

    async renameRelation(
      relationId: string,
      payload: RenameRelationPayload
    ): Promise<ApiActionResult> {
      const send = await getRequester();
      return send({
        url: `${apiBaseUrl}/diagram/relations/${relationId}/name`,
        method: "PATCH",
        withAuth: true,
        body: mapRenameRelationPayloadToRequest(payload),
        fallbackMessage: "No se pudo renombrar la relación.",
      });
    },

    async deleteRelation(relationId: string): Promise<ApiActionResult> {
      const send = await getRequester();
      return send({
        url: `${apiBaseUrl}/diagram/relations/${relationId}`,
        method: "DELETE",
        withAuth: true,
        fallbackMessage: "No se pudo eliminar la relación.",
      });
    },
  };
}

export const diagramRelationRepositoryImpl: DiagramRelationRepository =
  createDiagramRelationRepository();

