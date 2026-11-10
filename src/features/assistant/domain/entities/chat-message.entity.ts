import type { AgentActivityCode, AgentActivityType } from "./agent-activity.entity.ts";
import type { AgentMessageStatus } from "./agent-message.entity.ts";

/**
 * Entidades y tipos de dominio para la conversación y mensajes del Asistente IA.
 * TypeScript puro conforme al Principio 1 de la Constitución de Frontend.
 */

export type ChatMessageSenderRole = "user" | "peer" | "assistant";

export interface ChatMessageSender {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: ChatMessageSenderRole;
}

export interface ChatMessageAttachment {
  id: string;
  type: "image" | "audio";
  url: string;
  name: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: string;
  /** ID correlacionado con agent_messages cuando el mensaje proviene del backend. */
  serverMessageId?: string;
  sender: ChatMessageSender;
  content: string;
  timestamp: string;
  formattedTime: string;
  attachments?: ChatMessageAttachment[];
  status?: AgentMessageStatus | "uncertain";
  cancelRequested?: boolean;
  responseMarkdown?: string | null;
  activityCode?: AgentActivityCode | null;
  activityType?: AgentActivityType | null;
  activityAttemptId?: string | null;
  activitySequence?: number | null;
  activityOccurredAt?: string | null;
  activityStale?: boolean;
  animateResponse?: boolean;
}
