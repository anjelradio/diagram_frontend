"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { projectRepositoryImpl } from "../../infrastructure/repositories/project.repository";

export type UseProjectThumbnailCaptureOptions = {
  projectId: string;
  hasClasses?: boolean;
  timeoutMs?: number;
};

/**
 * Hook para capturar automáticamente el lienzo del diagrama al salir del proyecto
 * hacia la lista general, enviando la miniatura al backend para alojarla en Cloudinary.
 *
 * Implementa un mecanismo de timeout (< 1000ms) para garantizar que la navegación
 * del usuario nunca se bloquee o se interrumpa por lentitud de captura o red.
 * Si el lienzo está vacío (hasClasses === false), se omite la captura y subida.
 */
export function useProjectThumbnailCapture({
  projectId,
  hasClasses,
  timeoutMs = 900,
}: UseProjectThumbnailCaptureOptions) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const captureCanvasBlob = async (): Promise<Blob | null> => {
    try {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return null;
      }

      // Localizar el viewport o contenedor directo de React Flow que contiene exclusivamente los nodos y aristas
      const viewportEl =
        document.querySelector<HTMLElement>(".react-flow__viewport") ||
        document.querySelector<HTMLElement>(".react-flow");

      if (!viewportEl) {
        return null;
      }

      const { toBlob } = await import("html-to-image");

      const blob = await toBlob(viewportEl, {
        type: "image/jpeg",
        quality: 0.75,
        backgroundColor: "#212224",
        filter: (domNode: HTMLElement) => {
          if (!domNode.classList) return true;
          // Excluir controles o paneles auxiliares si estuvieran dentro del contenedor
          return (
            !domNode.classList.contains("react-flow__panel") &&
            !domNode.classList.contains("react-flow__controls") &&
            !domNode.classList.contains("react-flow__attribution")
          );
        },
      });

      return blob;
    } catch {
      return null;
    }
  };

  const captureAndNavigate = useCallback(
    async (targetUrl: string = "/projects") => {
      if (isNavigating) return;
      setIsNavigating(true);

      // Si no existe ninguna clase en el lienzo, salir inmediatamente sin capturar ni disparar subida
      if (hasClasses === false) {
        router.push(targetUrl);
        return;
      }

      const runCaptureAndUpload = async () => {
        const blob = await captureCanvasBlob();
        if (blob && blob.size > 0) {
          await projectRepositoryImpl.uploadThumbnail(projectId, blob);
        }
      };

      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, timeoutMs);
      });

      try {
        // Ejecutar con límite de tiempo estricto para no demorar la salida del usuario
        await Promise.race([runCaptureAndUpload(), timeoutPromise]);
      } catch {
        // En caso de cualquier error, no bloquear la redirección
      } finally {
        router.push(targetUrl);
      }
    },
    [projectId, hasClasses, isNavigating, router, timeoutMs]
  );

  return {
    captureAndNavigate,
    isNavigating,
  };
}
