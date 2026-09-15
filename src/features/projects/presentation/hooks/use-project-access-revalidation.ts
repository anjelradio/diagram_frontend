"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { projectRepositoryImpl } from "../../infrastructure/repositories/project.repository";
import {
  ProjectAccessRole,
  type ProjectDetail,
} from "../../domain/entities/project.entity";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

export type UseProjectAccessRevalidationOptions = {
  projectId: string;
  viewerId: string;
  currentRole: ProjectAccessRole;
  onAccessUpdated: (updatedProject: ProjectDetail) => void;
  onAccessRevoked?: () => void;
};

/**
 * Hook que revalida el rol y acceso efectivo del usuario sobre el proyecto.
 *
 * Se ejecuta al:
 * 1. Recuperar foco de la ventana (`focus`) o visibilidad de la pestaña (`visibilitychange`).
 * 2. Recibir eventos del sistema ante respuestas HTTP 403 o 404 (`diagram:access-revoked`).
 *
 * Ante downgrade a READER:
 * - Cancela drafts de relación activos y cierra herramientas de mutación.
 * - Actualiza el contexto del diagrama (`canEdit: false`).
 * - Emite notificación informativa.
 *
 * Ante 403 o 404 (expulsión, baneo o eliminación):
 * - Cierra el acceso redirigiendo al listado de proyectos o ejecutando el callback provisto.
 */
export function useProjectAccessRevalidation({
  projectId,
  viewerId,
  currentRole,
  onAccessUpdated,
  onAccessRevoked,
}: UseProjectAccessRevalidationOptions) {
  const router = useRouter();
  const isCheckingRef = useRef(false);
  const lastCheckedAtRef = useRef(0);
  const currentRoleRef = useRef(currentRole);

  const REVALIDATION_COOLDOWN_MS = 15_000;

  useEffect(() => {
    currentRoleRef.current = currentRole;
  }, [currentRole]);

  const handleRevalidate = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const now = Date.now();

      if (!force && now - lastCheckedAtRef.current < REVALIDATION_COOLDOWN_MS) {
        return;
      }
      if (isCheckingRef.current) return;
      if (!projectId) return;

      isCheckingRef.current = true;
      lastCheckedAtRef.current = now;

      try {
        const result = await projectRepositoryImpl.getProject(projectId);

        if (!result.ok) {
          if (result.statusCode === 404 || result.statusCode === 403) {
            appToast.error(
              "Acceso revocado",
              "El proyecto no existe o ya no tienes acceso a él."
            );
            if (onAccessRevoked) {
              onAccessRevoked();
            } else {
              router.replace("/projects");
            }
          }
          return;
        }

        const updated = result.data;
        const prevRole = currentRoleRef.current;
        const newRole = updated.accessRole;

        if (newRole !== prevRole) {
          // Si bajó de nivel a READER (downgrade)
          if (newRole === ProjectAccessRole.READER) {
            const store = useAppStore.getState();
            store.cancelRelationCreation();
            store.setActiveTool("hand");
            store.setDiagramContext(projectId, viewerId, false);
            appToast.info("Permisos actualizados: modo solo lectura activado.");
          } else {
            // Si subió a EDITOR u OWNER
            const store = useAppStore.getState();
            store.setDiagramContext(projectId, viewerId, true);
            appToast.info("Permisos de edición habilitados.");
          }

          onAccessUpdated(updated);
        }
      } catch (err) {
        console.error("Error al revalidar acceso al proyecto:", err);
      } finally {
        isCheckingRef.current = false;
      }
    },
    [projectId, viewerId, onAccessUpdated, onAccessRevoked, router]
  );

  useEffect(() => {
    const handleFocus = () => {
      handleRevalidate();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleRevalidate();
      }
    };

    const handleAccessRevokedEvent = () => {
      handleRevalidate({ force: true });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("diagram:access-revoked", handleAccessRevokedEvent);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        "diagram:access-revoked",
        handleAccessRevokedEvent
      );
    };
  }, [handleRevalidate]);

  return { revalidateAccess: handleRevalidate };
}
