import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { ZodType } from "zod";
import type {
  ConfigureNotionIntegrationInput,
  InitializeNotionProjectInput,
  NotionIntegrationStatus,
} from "../../domain/entities/notion-integration.entity";
import type { NotionIntegrationRepository } from "../../domain/repositories/notion-integration.repository";
import {
  mapConfigureNotionIntegrationToRequest,
  mapInitializeNotionProjectToRequest,
  mapNotionIntegrationStatusToEntity,
} from "../mappers/notion-integration.mapper.ts";
import {
  notionIntegrationStatusResponseSchema,
  type NotionIntegrationStatusResponse,
} from "../schemas/notion-integration.schemas.ts";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export type NotionDataRequester = <TParsed, TResult>(config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  body?: unknown;
  fallbackMessage: string;
  responseSchema: ZodType<TParsed>;
  mapData: (data: TParsed) => TResult;
}) => Promise<ApiResult<TResult>>;

/**
 * Fábrica para instanciar NotionIntegrationRepository con soporte de inyección para pruebas.
 */
export function createNotionIntegrationRepository(
  customDataRequester?: NotionDataRequester
): NotionIntegrationRepository {
  let defaultDataRequester = customDataRequester || null;

  async function getDataRequester(): Promise<NotionDataRequester> {
    if (defaultDataRequester) return defaultDataRequester;
    const mod = await import(
      "../../../shared/infrastructure/http/api-client"
    );
    defaultDataRequester = mod.apiRequestData;
    return mod.apiRequestData;
  }

  return {
    async getStatus(projectId: string): Promise<ApiResult<NotionIntegrationStatus>> {
      const sendData = await getDataRequester();
      return sendData<NotionIntegrationStatusResponse, NotionIntegrationStatus>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/notion`,
        method: "GET",
        withAuth: true,
        fallbackMessage:
          "No se pudo consultar el estado de la integración de Notion.",
        responseSchema: notionIntegrationStatusResponseSchema,
        mapData: mapNotionIntegrationStatusToEntity,
      });
    },

    async configureApiKey(
      projectId: string,
      input: ConfigureNotionIntegrationInput
    ): Promise<ApiResult<NotionIntegrationStatus>> {
      const sendData = await getDataRequester();
      return sendData<NotionIntegrationStatusResponse, NotionIntegrationStatus>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/notion/config`,
        method: "PUT",
        withAuth: true,
        body: mapConfigureNotionIntegrationToRequest(input),
        fallbackMessage:
          "No se pudo guardar la clave de API de Notion. Verifica las credenciales.",
        responseSchema: notionIntegrationStatusResponseSchema,
        mapData: mapNotionIntegrationStatusToEntity,
      });
    },

    async initializeProject(
      projectId: string,
      input: InitializeNotionProjectInput
    ): Promise<ApiResult<NotionIntegrationStatus>> {
      const sendData = await getDataRequester();
      return sendData<NotionIntegrationStatusResponse, NotionIntegrationStatus>({
        url: `${apiBaseUrl}/projects/${projectId}/integrations/notion/initialize`,
        method: "POST",
        withAuth: true,
        body: mapInitializeNotionProjectToRequest(input),
        fallbackMessage:
          "No se pudo inicializar el proyecto en Notion. Intenta nuevamente.",
        responseSchema: notionIntegrationStatusResponseSchema,
        mapData: mapNotionIntegrationStatusToEntity,
      });
    },
  };
}

export const defaultNotionIntegrationRepository =
  createNotionIntegrationRepository();
