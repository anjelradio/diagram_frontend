import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  ImageCommandInput,
  ImageCommandResult,
  VoiceCommandInput,
  VoiceCommandResult,
} from "../entities/agent-activity.entity";

/**
 * Contrato de repositorio para operaciones con el Asistente IA.
 */
export interface AssistantRepository {
  sendVoiceCommand(input: VoiceCommandInput): Promise<ApiResult<VoiceCommandResult>>;
  sendImageCommand(input: ImageCommandInput): Promise<ApiResult<ImageCommandResult>>;
}
