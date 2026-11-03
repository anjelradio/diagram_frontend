/**
 * Entidad de dominio para el borrador de adjunto multimodal en el asistente IA.
 * TypeScript puro conforme al Principio 1 de la Constitución de Frontend.
 */

export interface MultimodalDraftAttachment {
  /** Identificador único temporal del borrador */
  readonly id: string;
  /** Archivo binario original en memoria del navegador */
  readonly file: File;
  /** URL temporal de objeto generada con URL.createObjectURL para previsualización */
  readonly previewUrl: string;
  /** Nombre del archivo original */
  readonly name: string;
  /** Tipo MIME validado (image/png, image/jpeg, image/webp) */
  readonly mimeType: string;
  /** Tamaño del archivo en bytes (máximo 10 MB = 10 * 1024 * 1024) */
  readonly sizeBytes: number;
}
