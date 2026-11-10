import type { ApiResult } from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestFormData,
} from "@/features/shared/infrastructure/http/api-client";
import type { AgentMessage, AgentMessagePage } from "../../domain/entities/agent-message.entity";
import type {
  ListAgentMessagesInput,
  SubmitAgentMessageInput,
  AssistantRepository,
} from "../../domain/repositories/assistant.repository";
import {
  mapActiveAgentMessageToEntity,
  mapAgentMessagePageToEntity,
  mapAgentMessageToEntity,
} from "../mappers/assistant.mapper";
import {
  agentMessageActiveWireSchema,
  agentMessagePageWireSchema,
  agentMessageWireSchema,
} from "../schemas/assistant.schemas";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

function messagesUrl(projectId: string): string {
  return `${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/assistant/messages`;
}

export function createAssistantRepository(): AssistantRepository {
  return {
    async submitMessage(input: SubmitAgentMessageInput): Promise<ApiResult<AgentMessage>> {
      const formData = new FormData();
      formData.append("message_id", input.messageId);
      formData.append("prompt", input.prompt);
      if (input.image) formData.append("image", input.image, input.image.name || "diagram.png");

      return apiRequestFormData({
        url: messagesUrl(input.projectId),
        method: "POST",
        withAuth: true,
        body: formData,
        fallbackMessage: "No se pudo enviar el mensaje al asistente.",
        responseSchema: agentMessageWireSchema,
        mapData: mapAgentMessageToEntity,
      });
    },

    async listMessages(input: ListAgentMessagesInput): Promise<ApiResult<AgentMessagePage>> {
      const query = new URLSearchParams({
        limit: String(input.limit ?? 6),
        offset: String(input.offset ?? 0),
      });
      if (input.snapshotAt) query.set("snapshot_at", input.snapshotAt);
      return apiRequestData({
        url: `${messagesUrl(input.projectId)}?${query.toString()}`,
        method: "GET",
        withAuth: true,
        fallbackMessage: "No se pudo cargar el historial del asistente.",
        responseSchema: agentMessagePageWireSchema,
        mapData: mapAgentMessagePageToEntity,
      });
    },

    async getActiveMessage(projectId: string): Promise<ApiResult<AgentMessage | null>> {
      return apiRequestData({
        url: `${messagesUrl(projectId)}/active`,
        method: "GET",
        withAuth: true,
        fallbackMessage: "No se pudo recuperar la ejecución activa.",
        responseSchema: agentMessageActiveWireSchema,
        mapData: mapActiveAgentMessageToEntity,
      });
    },

    async getMessage(projectId: string, messageId: string): Promise<ApiResult<AgentMessage>> {
      return apiRequestData({
        url: `${messagesUrl(projectId)}/${encodeURIComponent(messageId)}`,
        method: "GET",
        withAuth: true,
        fallbackMessage: "No se pudo reconciliar el mensaje del asistente.",
        responseSchema: agentMessageWireSchema,
        mapData: mapAgentMessageToEntity,
      });
    },

    async cancelMessage(projectId: string, messageId: string): Promise<ApiResult<AgentMessage>> {
      return apiRequestData({
        url: `${messagesUrl(projectId)}/${encodeURIComponent(messageId)}/cancel`,
        method: "POST",
        withAuth: true,
        fallbackMessage: "No se pudo solicitar la cancelación.",
        responseSchema: agentMessageWireSchema,
        mapData: mapAgentMessageToEntity,
      });
    },
  };
}

export const assistantRepositoryImpl: AssistantRepository = createAssistantRepository();
