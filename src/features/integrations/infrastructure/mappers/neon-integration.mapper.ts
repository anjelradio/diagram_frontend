import type {
  ConfigureNeonIntegrationInput,
  NeonIntegrationStatus,
  NeonSyncResult,
} from "../../domain/entities/neon-integration.entity";
import type {
  NeonIntegrationStatusResponse,
  NeonSyncResultResponse,
} from "../schemas/neon-integration.schemas";

/**
 * Mapea la respuesta del backend en snake_case a la entidad de dominio en camelCase.
 */
export function mapNeonIntegrationStatusToEntity(
  response: NeonIntegrationStatusResponse
): NeonIntegrationStatus {
  return {
    projectId: response.project_id,
    provider: response.provider,
    hasApiKey: response.has_api_key,
    isInitialized: response.is_initialized,
    neonProjectId: response.neon_project_id ?? null,
    neonDatabaseName: response.neon_database_name ?? null,
    neonConsoleUrl: response.neon_console_url ?? null,
    neonBranchId: response.neon_branch_id ?? null,
    lastSyncedAt: response.last_synced_at ?? null,
  };
}

/**
 * Mapea el resultado de sincronización de Neon a la entidad de dominio.
 */
export function mapNeonSyncResultToEntity(
  response: NeonSyncResultResponse
): NeonSyncResult {
  return {
    hasChanges: response.has_changes,
    createdTables: response.created_tables,
    droppedTables: response.dropped_tables,
    addedColumns: response.added_columns,
    droppedColumns: response.dropped_columns,
    alteredColumns: response.altered_columns,
    addedForeignKeys: response.added_foreign_keys,
    droppedForeignKeys: response.dropped_foreign_keys,
  };
}

/**
 * Mapea la entrada de configuración de API Key al payload snake_case esperado por el backend.
 */
export function mapConfigureNeonIntegrationToRequest(
  input: ConfigureNeonIntegrationInput
): { api_key: string } {
  return {
    api_key: input.apiKey.trim(),
  };
}
