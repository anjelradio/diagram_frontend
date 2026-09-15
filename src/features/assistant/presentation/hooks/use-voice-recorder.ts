"use client";

import { useCallback, useRef, useState } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { assistantRepositoryImpl } from "../../infrastructure/repositories/http-assistant.repository";

interface UseVoiceRecorderOptions {
  projectId: string;
  onSuccess?: () => void;
}

export function useVoiceRecorder({
  projectId,
  onSuccess,
}: UseVoiceRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      appToast.error("Tu navegador no soporta grabación de audio.");
      return;
    }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Intentar tipos MIME compatibles comunes
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "";
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      cleanupStream();
      setIsRecording(false);
      appToast.error(
        "Permiso de micrófono denegado o dispositivo no disponible."
      );
      console.error("Error al acceder al micrófono:", error);
    }
  }, [cleanupStream]);

  const stopAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setIsRecording(false);

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        cleanupStream();

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          appToast.info("No se detectó audio grabado.");
          resolve();
          return;
        }

        setIsSending(true);

        try {
          const result = await assistantRepositoryImpl.sendVoiceCommand({
            projectId,
            audioBlob,
            mimeType,
          });

          if (result.ok) {
            // El resumen detallado vive en el registro; el toast es breve y estable.
            appToast.success("¡Tarea terminada!");
            onSuccess?.();
          } else {
            appToast.error(result.errors.join(". ") || "Error al procesar la orden.");
          }
        } catch (err) {
          appToast.error("Error de conexión al enviar el audio.");
          console.error("Error enviando comando de voz:", err);
        } finally {
          setIsSending(false);
          resolve();
        }
      };

      recorder.stop();
    });
  }, [cleanupStream, onSuccess, projectId]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.onstop = null;
    recorder.stop();
    cleanupStream();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    appToast.info("Grabación descartada.");
  }, [cleanupStream]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopAndSend();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopAndSend]);

  return {
    isRecording,
    isSending,
    startRecording,
    stopAndSend,
    cancelRecording,
    toggleRecording,
  };
}
