import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  AgentActivity,
  VoiceCommandInput,
  VoiceCommandResult,
} from "../entities/agent-activity.entity";

/**
 * Contrato de repositorio para operaciones con el Asistente IA y su historial.
 */
export interface AssistantRepository {
  listActivities(projectId: string): Promise<ApiResult<AgentActivity[]>>;
  sendVoiceCommand(input: VoiceCommandInput): Promise<ApiResult<VoiceCommandResult>>;
}
