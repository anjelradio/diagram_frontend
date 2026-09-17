/**
 * Entidades y tipos de dominio para el Asistente IA y su historial de actividades.
 * TypeScript puro conforme al Principio 1 de la Constitución de Frontend.
 */

export type AgentActivityState =
  | "IN_PROGRESS"
  | "FINISHED"
  | "FAILED"
  | "CANCELLED";

export interface AgentActivity {
  id: string;
  projectId: string;
  transcription: string | null;
  resume: string | null;
  imageUrl: string | null;
  state: AgentActivityState;
  createdDate: string;
}

export type AssistantVisualState =
  | "idle"
  | "options_open"
  | "recording"
  | "thinking";

export type AssistantInputMode = "voice" | "image";

export interface VoiceCommandInput {
  projectId: string;
  audioBlob: Blob;
  mimeType?: string;
}

export interface VoiceCommandActionResult {
  type: string;
  status: string;
  summary: string;
}

export interface VoiceCommandResult {
  activityId: string;
  state: AgentActivityState;
  transcription: string | null;
  resume: string | null;
  actionsCount: number;
  actions: VoiceCommandActionResult[];
}

export interface ImageCommandInput {
  projectId: string;
  imageBlob: Blob;
  mimeType?: string;
  prompt?: string;
}

export interface ImageCommandResult {
  activityId: string;
  state: AgentActivityState;
  transcription: string | null;
  resume: string | null;
  imageUrl: string | null;
  actionsCount: number;
  actions: VoiceCommandActionResult[];
}
