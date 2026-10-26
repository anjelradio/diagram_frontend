"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SttSessionState } from "../../domain/entities/stt-session.entity";
import { runonwebSttService } from "../../infrastructure/services/runonweb-stt.service";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

export interface UseInBrowserSttOptions {
  onTranscribeSuccess: (transcribedText: string) => void;
  modelId?: string;
  language?: string;
}

const DEFAULT_MODEL = "onnx-community/whisper-tiny";
const DEFAULT_LANGUAGE = "es";

export function useInBrowserStt({
  onTranscribeSuccess,
  modelId = DEFAULT_MODEL,
  language = DEFAULT_LANGUAGE,
}: UseInBrowserSttOptions) {
  const [state, setState] = useState<SttSessionState>({ status: "idle" });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const cancelSession = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar errores al detener si ya estaba cerrado
      }
    }
    cleanupStream();
    setState({ status: "idle" });
  }, [cleanupStream]);

  // Limpieza al desmontar el hook
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const startMediaRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else {
            mimeType = "";
          }
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setState({ status: "recording", durationMs: 0 });
    } catch (err) {
      cleanupStream();
      const message = "Permiso de micrófono denegado o dispositivo no disponible.";
      setState({ status: "error", message });
      appToast.error(message);
      console.warn("Fallo al iniciar captura de micrófono:", err);
    }
  }, [cleanupStream]);

  const handleRecordClick = useCallback(async () => {
    if (!isSupported) {
      appToast.error("Tu navegador no soporta grabación de audio.");
      return;
    }

    if (state.status === "recording" || state.status === "downloading" || state.status === "transcribing") {
      return;
    }

    setState({ status: "checking_cache" });

    try {
      const cached = await runonwebSttService.isModelCached(modelId);

      if (!cached) {
        setState({ status: "downloading", progress: 0 });
        await runonwebSttService.loadModel({
          modelId,
          language,
          onProgress: (info) => {
            if (info.progress !== undefined) {
              const rounded = Math.min(100, Math.max(0, Math.round(info.progress)));
              setState({ status: "downloading", progress: rounded });
            }
          },
        });
        appToast.success("Modelo listo para transcripción");
        setState({ status: "ready" });
      }

      await startMediaRecording();
    } catch (err) {
      cleanupStream();
      const msg = err instanceof Error ? err.message : "Error al inicializar el modelo.";
      setState({ status: "error", message: msg });
      appToast.error(msg);
      console.error("Error al preparar STT:", err);
    }
  }, [isSupported, state.status, modelId, language, startMediaRecording, cleanupStream]);

  const handlePauseClick = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setState({ status: "transcribing" });

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        cleanupStream();

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          appToast.info("No se detectó audio grabado.");
          setState({ status: "idle" });
          resolve();
          return;
        }

        try {
          const result = await runonwebSttService.transcribeAudio(audioBlob, {
            language,
            modelId,
          });

          if (result.text) {
            onTranscribeSuccess(result.text);
          }
          setState({ status: "idle" });
        } catch (err) {
          console.error("Error en transcripción local:", err);
          const message = "Error al transcribir el audio.";
          appToast.error(message);
          setState({ status: "error", message });
        } finally {
          resolve();
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn("Error al detener MediaRecorder:", err);
        cleanupStream();
        setState({ status: "idle" });
        resolve();
      }
    });
  }, [cleanupStream, language, modelId, onTranscribeSuccess]);

  return {
    state,
    isSupported,
    handleRecordClick,
    handlePauseClick,
    cancelSession,
  };
}
