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
}

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  content: string;
  timestamp: string;
  formattedTime: string;
  attachments?: ChatMessageAttachment[];
}
