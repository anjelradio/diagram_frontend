import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  ConfigureNotionIntegrationInput,
  InitializeNotionProjectInput,
  NotionIntegrationStatus,
} from "../entities/notion-integration.entity";

/**
 * Contrato del repositorio para la integración de Notion (sin prefijo I).
 */
export interface NotionIntegrationRepository {
  /**
   * Consulta el estado actual de la integración de Notion para un proyecto.
   */
  getStatus(projectId: string): Promise<ApiResult<NotionIntegrationStatus>>;

  /**
   * Guarda o actualiza la API Key de Notion para el proyecto.
   */
  configureApiKey(
    projectId: string,
    input: ConfigureNotionIntegrationInput
  ): Promise<ApiResult<NotionIntegrationStatus>>;

  /**
   * Inicializa por única vez la página de bienvenida y la base de datos de tareas en Notion.
   */
  initializeProject(
    projectId: string,
    input: InitializeNotionProjectInput
  ): Promise<ApiResult<NotionIntegrationStatus>>;
}
