import type { ApiResult } from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestFormData,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  AgentActivity,
  ImageCommandInput,
  ImageCommandResult,
  VoiceCommandInput,
  VoiceCommandResult,
} from "../../domain/entities/agent-activity.entity";
import type { AssistantRepository } from "../../domain/repositories/assistant.repository";
import {
  mapAgentActivityListToEntities,
  mapImageCommandResultToEntity,
  mapVoiceCommandResultToEntity,
} from "../mappers/assistant.mapper";
import {
  agentActivityListResponseSchema,
  imageCommandResultWireSchema,
  voiceCommandResultWireSchema,
} from "../schemas/assistant.schemas";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

const ASSISTANT_URL = `${apiBaseUrl}/assistant`;
const PROJECTS_URL = `${apiBaseUrl}/projects`;

export function createAssistantRepository(): AssistantRepository {
  return {
    async listActivities(projectId: string): Promise<ApiResult<AgentActivity[]>> {
      return apiRequestData({
        url: `${PROJECTS_URL}/${projectId}/assistant/activities`,
        method: "GET",
        withAuth: true,
        fallbackMessage:
          "No se pudo cargar el historial de actividades del asistente.",
        responseSchema: agentActivityListResponseSchema,
        mapData: mapAgentActivityListToEntities,
      });
    },

    async sendVoiceCommand(
      input: VoiceCommandInput
    ): Promise<ApiResult<VoiceCommandResult>> {
      const formData = new FormData();
      formData.append("project_id", input.projectId);

      const mimeType = input.mimeType || "audio/webm";
      const extension = mimeType.includes("wav")
        ? "wav"
        : mimeType.includes("mp3")
        ? "mp3"
        : "webm";
      const filename = `command.${extension}`;

      const audioFile = new File([input.audioBlob], filename, {
        type: mimeType,
      });
      formData.append("audio", audioFile);

      return apiRequestFormData({
        url: `${ASSISTANT_URL}/voice`,
        method: "POST",
        withAuth: true,
        body: formData,
        fallbackMessage: "No se pudo procesar la orden de voz.",
        responseSchema: voiceCommandResultWireSchema,
        mapData: mapVoiceCommandResultToEntity,
      });
    },

    async sendImageCommand(
      input: ImageCommandInput
    ): Promise<ApiResult<ImageCommandResult>> {
      const formData = new FormData();
      formData.append("project_id", input.projectId);
      if (input.prompt) {
        formData.append("prompt", input.prompt);
      }

      const mimeType = input.mimeType || "image/png";
      const extension = mimeType.includes("webp")
        ? "webp"
        : mimeType.includes("jpeg") || mimeType.includes("jpg")
        ? "jpg"
        : "png";
      const filename = `diagram.${extension}`;

      const imageFile = new File([input.imageBlob], filename, {
        type: mimeType,
      });
      formData.append("image", imageFile);

      return apiRequestFormData({
        url: `${ASSISTANT_URL}/image`,
        method: "POST",
        withAuth: true,
        body: formData,
        fallbackMessage: "No se pudo procesar la imagen del diagrama.",
        responseSchema: imageCommandResultWireSchema,
        mapData: mapImageCommandResultToEntity,
      });
    },
  };
}

export const assistantRepositoryImpl: AssistantRepository =
  createAssistantRepository();
