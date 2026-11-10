import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { AgentMessage, AgentMessagePage } from "../entities/agent-message.entity";

export interface SubmitAgentMessageInput {
  projectId: string;
  messageId: string;
  prompt: string;
  image?: File | null;
}

export interface ListAgentMessagesInput {
  projectId: string;
  limit?: number;
  offset?: number;
  snapshotAt?: string | null;
}

export interface AssistantRepository {
  submitMessage(input: SubmitAgentMessageInput): Promise<ApiResult<AgentMessage>>;
  listMessages(input: ListAgentMessagesInput): Promise<ApiResult<AgentMessagePage>>;
  getActiveMessage(projectId: string): Promise<ApiResult<AgentMessage | null>>;
  getMessage(projectId: string, messageId: string): Promise<ApiResult<AgentMessage>>;
  cancelMessage(projectId: string, messageId: string): Promise<ApiResult<AgentMessage>>;
}
