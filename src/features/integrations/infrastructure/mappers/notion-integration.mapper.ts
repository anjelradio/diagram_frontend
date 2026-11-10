import type {
  ConfigureNotionIntegrationInput,
  InitializeNotionProjectInput,
  NotionIntegrationStatus,
} from "../../domain/entities/notion-integration.entity";
import type { NotionIntegrationStatusResponse } from "../schemas/notion-integration.schemas";

/**
 * Mapea la respuesta del backend en snake_case a la entidad de dominio en camelCase.
 */
export function mapNotionIntegrationStatusToEntity(
  response: NotionIntegrationStatusResponse
): NotionIntegrationStatus {
  return {
    projectId: response.project_id,
    provider: response.provider,
    hasApiKey: response.has_api_key,
    isInitialized: response.is_initialized,
    notionPageId: response.notion_page_id,
    notionTasksDatabaseId: response.notion_tasks_database_id,
    notionPageUrl: response.notion_page_url,
  };
}

/**
 * Mapea la entrada de configuración de API Key al payload snake_case esperado por el backend.
 */
export function mapConfigureNotionIntegrationToRequest(
  input: ConfigureNotionIntegrationInput
): { api_key: string; parent_page_id: string | null } {
  return {
    api_key: input.apiKey.trim(),
    parent_page_id: input.parentPageId?.trim() || null,
  };
}

/**
 * Mapea la entrada de inicialización de proyecto al payload snake_case esperado por el backend.
 */
export function mapInitializeNotionProjectToRequest(
  input: InitializeNotionProjectInput
): { description: string } {
  return {
    description: input.description.trim(),
  };
}
