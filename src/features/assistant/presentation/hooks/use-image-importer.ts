"use client";

import { useCallback, useRef, useState } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { assistantRepositoryImpl } from "../../infrastructure/repositories/http-assistant.repository";

const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

interface UseImageImporterOptions {
  projectId: string;
  onSuccess?: () => void;
}

export function useImageImporter({
  projectId,
  onSuccess,
}: UseImageImporterOptions) {
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!file) return;

      const mimeType = file.type.toLowerCase();
      if (
        !SUPPORTED_IMAGE_TYPES.includes(mimeType) &&
        !mimeType.startsWith("image/")
      ) {
        appToast.error("Formato no compatible. Usa PNG, JPEG o WEBP.");
        return;
      }

      if (file.size === 0) {
        appToast.error("El archivo seleccionado está vacío.");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        appToast.error("La imagen excede el tamaño máximo permitido (10 MB).");
        return;
      }

      try {
        setIsSending(true);
        const result = await assistantRepositoryImpl.sendImageCommand({
          projectId,
          imageBlob: file,
          mimeType: file.type || "image/png",
        });

        if (result.ok) {
          appToast.success("¡Diagrama recreado exitosamente!");
          onSuccess?.();
        } else {
          appToast.error(
            result.errors?.[0] ||
              "No se pudo procesar la imagen del diagrama."
          );
        }
      } catch (error) {
        console.error("Error al importar imagen del diagrama:", error);
        appToast.error("Ocurrió un error inesperado al enviar la imagen.");
      } finally {
        setIsSending(false);
      }
    },
    [projectId, onSuccess]
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleFileSelected(file);
      }
    },
    [handleFileSelected]
  );

  return {
    isSending,
    fileInputRef,
    openFilePicker,
    onFileInputChange,
    handleFileSelected,
  };
}
