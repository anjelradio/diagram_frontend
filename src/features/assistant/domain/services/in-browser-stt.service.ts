import type { VoiceTranscriptionResult } from "../entities/stt-session.entity";

export type SttProgressInfo = {
  status: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

export type SttServiceOptions = {
  modelId?: string;
  language?: string;
  onProgress?: (info: SttProgressInfo) => void;
};

/**
 * Contrato de servicio para transcripción de audio en el navegador (local speech-to-text).
 */
export interface InBrowserSttService {
  /**
   * Comprueba si el modelo Whisper ya está almacenado en la caché del navegador.
   */
  isModelCached(modelId?: string): Promise<boolean>;

  /**
   * Descarga e inicializa el modelo Whisper ONNX.
   */
  loadModel(options?: SttServiceOptions): Promise<void>;

  /**
   * Transcribe un Blob de audio grabado en el navegador.
   */
  transcribeAudio(
    audioBlob: Blob,
    options?: { language?: string; modelId?: string }
  ): Promise<VoiceTranscriptionResult>;

  /**
   * Libera recursos y memoria GPU/WASM del modelo cargado.
   */
  dispose(): void;
}
