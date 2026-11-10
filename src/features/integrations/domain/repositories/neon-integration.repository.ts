import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  ConfigureNeonIntegrationInput,
  NeonIntegrationStatus,
  NeonSyncResult,
} from "../entities/neon-integration.entity";

export interface NeonIntegrationRepository {
  getStatus(projectId: string): Promise<ApiResult<NeonIntegrationStatus>>;
  configureApiKey(
    projectId: string,
    input: ConfigureNeonIntegrationInput
  ): Promise<ApiResult<NeonIntegrationStatus>>;
  initializeProject(projectId: string): Promise<ApiResult<NeonIntegrationStatus>>;
  syncDatabase(projectId: string): Promise<ApiResult<NeonSyncResult>>;
}
