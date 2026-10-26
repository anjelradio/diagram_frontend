/**
 * Estados del ciclo de vida de la sesión de transcripción de voz a texto en el navegador.
 */
export type SttStatus =
  | "idle"
  | "checking_cache"
  | "downloading"
  | "ready"
  | "recording"
  | "transcribing"
  | "error";

export type SttSessionState =
  | { status: "idle" }
  | { status: "checking_cache" }
  | { status: "downloading"; progress: number }
  | { status: "ready" }
  | { status: "recording"; durationMs: number }
  | { status: "transcribing" }
  | { status: "error"; message: string };

/**
 * Metadatos sobre el modelo local y su estado en el almacenamiento del navegador.
 */
export type SttModelMetadata = {
  modelId: string;
  language: string;
  isCached: boolean;
  sizeBytes: number | null;
  resolvedDevice: "webgpu" | "wasm" | null;
};

/**
 * Resultado devuelto por el servicio de transcripción de audio.
 */
export type VoiceTranscriptionResult = {
  text: string;
  durationSeconds: number;
  confidence?: number;
};
