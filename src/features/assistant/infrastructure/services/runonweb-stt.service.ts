import type {
  InBrowserSttService,
  SttProgressInfo,
  SttServiceOptions,
} from "../../domain/services/in-browser-stt.service";
import type { VoiceTranscriptionResult } from "../../domain/entities/stt-session.entity";

const DEFAULT_MODEL = "onnx-community/whisper-tiny";
const DEFAULT_LANGUAGE = "es";
const SAMPLE_RATE = 16_000;

type SpeechToTextInstance = {
  load(): Promise<void>;
  transcribe(
    audio: Blob | File | Float32Array,
    options?: { language?: string; task?: "transcribe" | "translate" }
  ): Promise<{ text: string }>;
  dispose(): void;
};

function mixMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  if (channels === 1) return buffer.getChannelData(0);
  const len = buffer.length;
  const out = new Float32Array(len);
  if (channels === 2) {
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    for (let i = 0; i < len; i++) {
      out[i] = (ch0[i] + ch1[i]) * Math.SQRT1_2;
    }
    return out;
  }
  const scale = 1 / channels;
  for (let c = 0; c < channels; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += channel[i] * scale;
  }
  return out;
}

function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.round(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio;
    const i0 = Math.min(Math.floor(x), input.length - 1);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = x - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

async function prepareAudioPcm(audioBlob: Blob): Promise<Float32Array> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("AudioContext no está disponible en este navegador.");
  }
  let ctx: AudioContext;
  try {
    ctx = new AudioCtx({ sampleRate: SAMPLE_RATE });
  } catch {
    ctx = new AudioCtx();
  }
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const mono = mixMono(decoded);
    return resample(mono, decoded.sampleRate, SAMPLE_RATE);
  } finally {
    await ctx.close();
  }
}

class RunonwebSttServiceImpl implements InBrowserSttService {
  private worker: Worker | null = null;
  private instance: SpeechToTextInstance | null = null;
  private currentModel: string = DEFAULT_MODEL;
  private isWorkerSupported: boolean =
    typeof window !== "undefined" && typeof Worker !== "undefined";

  private getOrCreateWorker(): Worker | null {
    if (!this.isWorkerSupported) return null;
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(new URL("../workers/stt.worker.ts", import.meta.url), {
        type: "module",
      });
      return this.worker;
    } catch (err) {
      console.warn(
        "Fallo al instanciar Web Worker para STT, usando ejecución en hilo principal:",
        err
      );
      this.isWorkerSupported = false;
      return null;
    }
  }

  async isModelCached(modelId: string = DEFAULT_MODEL): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const { listCachedModels } = await import("runonweb/core");
      const cached = await listCachedModels();
      return cached.some((m) => m.id === modelId);
    } catch (err) {
      console.warn("Error al consultar caché de modelos runonweb:", err);
      return false;
    }
  }

  async loadModel(options?: SttServiceOptions): Promise<void> {
    if (typeof window === "undefined") return;

    const targetModel = options?.modelId ?? DEFAULT_MODEL;
    const targetLanguage = options?.language ?? DEFAULT_LANGUAGE;
    this.currentModel = targetModel;

    const worker = this.getOrCreateWorker();
    if (worker) {
      return new Promise<void>((resolve, reject) => {
        const id = Math.random().toString(36).slice(2);

        const handleMessage = (e: MessageEvent) => {
          if (e.data?.id !== id) return;
          if (e.data.type === "progress") {
            options?.onProgress?.(e.data.payload);
          } else if (e.data.type === "load_success") {
            worker.removeEventListener("message", handleMessage);
            resolve();
          } else if (e.data.type === "error") {
            worker.removeEventListener("message", handleMessage);
            reject(
              new Error(
                e.data.payload?.message || "Error al cargar modelo en worker."
              )
            );
          }
        };

        worker.addEventListener("message", handleMessage);
        worker.postMessage({
          type: "load",
          id,
          payload: { modelId: targetModel, language: targetLanguage },
        });
      });
    }

    // Fallback: Si los Web Workers no están disponibles en el entorno
    if (this.instance && this.currentModel === targetModel) {
      await this.instance.load();
      return;
    }

    if (this.instance) {
      this.instance.dispose();
      this.instance = null;
    }

    const { SpeechToText } = await import("runonweb/stt");

    this.instance = new SpeechToText({
      model: targetModel,
      language: targetLanguage,
      device: "auto",
      onProgress: (info: SttProgressInfo) => {
        options?.onProgress?.(info);
      },
    }) as SpeechToTextInstance;

    await this.instance.load();
  }

  async transcribeAudio(
    audioBlob: Blob,
    options?: { language?: string; modelId?: string }
  ): Promise<VoiceTranscriptionResult> {
    const startTime = performance.now();
    const targetLanguage = options?.language ?? DEFAULT_LANGUAGE;
    const targetModel = options?.modelId ?? this.currentModel;

    const worker = this.getOrCreateWorker();
    if (worker) {
      // 1. Decodificar audio a PCM mono Float32Array 16kHz en el navegador (<15ms)
      const pcm = await prepareAudioPcm(audioBlob);

      // 2. Transferir el buffer al Web Worker para inferencia sin congelar la interfaz de usuario
      return new Promise<VoiceTranscriptionResult>((resolve, reject) => {
        const id = Math.random().toString(36).slice(2);

        const handleMessage = (e: MessageEvent) => {
          if (e.data?.id !== id) return;
          if (e.data.type === "transcribe_success") {
            worker.removeEventListener("message", handleMessage);
            const sanitizedText = (e.data.payload?.text || "")
              .replace(/\s+/g, " ")
              .trim();
            resolve({
              text: sanitizedText,
              durationSeconds:
                e.data.payload?.durationSeconds ??
                (performance.now() - startTime) / 1000,
            });
          } else if (e.data.type === "error") {
            worker.removeEventListener("message", handleMessage);
            reject(
              new Error(
                e.data.payload?.message || "Error al transcribir en worker."
              )
            );
          }
        };

        worker.addEventListener("message", handleMessage);
        worker.postMessage(
          {
            type: "transcribe",
            id,
            payload: {
              pcm,
              language: targetLanguage,
              modelId: targetModel,
            },
          },
          [pcm.buffer]
        );
      });
    }

    // Fallback: Ejecución en hilo principal
    if (!this.instance) {
      await this.loadModel({
        modelId: targetModel,
        language: targetLanguage,
      });
    }

    if (!this.instance) {
      throw new Error("No se pudo inicializar el modelo de transcripción local.");
    }

    const result = await this.instance.transcribe(audioBlob, {
      language: targetLanguage,
      task: "transcribe",
    });

    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const sanitizedText = (result.text || "").replace(/\s+/g, " ").trim();

    return {
      text: sanitizedText,
      durationSeconds: elapsedSeconds,
    };
  }

  dispose(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ type: "dispose" });
        this.worker.terminate();
      } catch (err) {
        console.warn("Error al terminar Web Worker:", err);
      }
      this.worker = null;
    }
    if (this.instance) {
      try {
        this.instance.dispose();
      } catch (err) {
        console.warn("Error al liberar instancia de SpeechToText:", err);
      }
      this.instance = null;
    }
  }
}

export const runonwebSttService: InBrowserSttService = new RunonwebSttServiceImpl();
