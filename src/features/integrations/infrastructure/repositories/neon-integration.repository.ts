import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { ZodType } from "zod";
import type {
  ConfigureNeonIntegrationInput,
  NeonIntegrationStatus,
  NeonSyncResult,
} from "../../domain/entities/neon-integration.entity";
import type { NeonIntegrationRepository } from "../../domain/repositories/neon-integration.repository";
import {
  mapConfigureNeonIntegrationToRequest,
  mapNeonIntegrationStatusToEntity,
  mapNeonSyncResultToEntity,
} from "../mappers/neon-integration.mapper.ts";
import {
  neonIntegrationStatusResponseSchema,
  neonSyncResultResponseSchema,
  type NeonIntegrationStatusResponse,
  type NeonSyncResultResponse,
} from "../schemas/neon-integration.schemas.ts";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export type NeonDataRequester = <TParsed, TResult>(config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  body?: unknown;
  fallbackMessage: string;
  responseSchema: ZodType<TParsed>;
  mapData: (data: TParsed) => TResult;
}) => Promise<ApiResult<TResult>>;

/**
 * Fábrica para instanciar NeonIntegrationRepository con soporte de inyección para pruebas.
 */
export function createNeonIntegrationRepository(
  customDataRequester?: NeonDataRequester
): NeonIntegrationRepository {
  let defaultDataRequester = customDataRequester || null;

  async function getDataRequester(): Promise<NeonDataRequester> {
    if (defaultDataRequester) return defaultDataRequester;
    const mod = await import(
      "../../../shared/infrastructure/http/api-client"
    );
    defaultDataRequester = mod.apiRequestData;
    return mod.apiRequestData;
  }

  return {
    async getStatus(projectId: string): Promise<ApiResult<NeonIntegrationStatus>> {
      const sendData = await getDataRequester();
      return sendData<NeonIntegrationStatusResponse, NeonIntegrationStatus>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/neon`,
        method: "GET",
        withAuth: true,
        fallbackMessage:
          "No se pudo consultar el estado de la integración de Neon.",
        responseSchema: neonIntegrationStatusResponseSchema,
        mapData: mapNeonIntegrationStatusToEntity,
      });
    },

    async configureApiKey(
      projectId: string,
      input: ConfigureNeonIntegrationInput
    ): Promise<ApiResult<NeonIntegrationStatus>> {
      const sendData = await getDataRequester();
      return sendData<NeonIntegrationStatusResponse, NeonIntegrationStatus>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/neon/config`,
        method: "PUT",
        withAuth: true,
        body: mapConfigureNeonIntegrationToRequest(input),
        fallbackMessage:
          "No se pudo guardar la clave de API de Neon. Verifica las credenciales.",
        responseSchema: neonIntegrationStatusResponseSchema,
        mapData: mapNeonIntegrationStatusToEntity,
      });
    },

    async initializeProject(
      projectId: string
    ): Promise<ApiResult<NeonIntegrationStatus>> {
      const sendData = await getDataRequester();
      return sendData<NeonIntegrationStatusResponse, NeonIntegrationStatus>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/neon/initialize`,
        method: "POST",
        withAuth: true,
        fallbackMessage:
          "No se pudo inicializar el proyecto en Neon. Intenta nuevamente.",
        responseSchema: neonIntegrationStatusResponseSchema,
        mapData: mapNeonIntegrationStatusToEntity,
      });
    },

    async syncDatabase(
      projectId: string
    ): Promise<ApiResult<NeonSyncResult>> {
      const sendData = await getDataRequester();
      return sendData<NeonSyncResultResponse, NeonSyncResult>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/neon/sync`,
        method: "POST",
        withAuth: true,
        fallbackMessage:
          "No se pudo sincronizar la base de datos en Neon. Intenta nuevamente.",
        responseSchema: neonSyncResultResponseSchema,
        mapData: mapNeonSyncResultToEntity,
      });
    },
  };
}

export const defaultNeonIntegrationRepository =
  createNeonIntegrationRepository();
