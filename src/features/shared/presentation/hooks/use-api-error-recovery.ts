"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  classifyApiError,
  type ApiErrorLike,
} from "@/features/shared/domain/errors/api-error-classification";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

/**
 * Resuelve errores de autenticacion desde componentes cliente. Mantiene la
 * navegacion fuera de api-client para que ese modulo siga siendo isomorfo.
 */
export function useApiErrorRecovery() {
  const router = useRouter();

  return async (error: ApiErrorLike): Promise<boolean> => {
    switch (classifyApiError(error)) {
      case "unauthenticated": {
        clearJWT();

        const { error: signOutError } = await authClient.signOut();
        if (signOutError) {
          appToast.error(
            "Sesión no válida",
            "No pudimos cerrar tu sesión. Intenta nuevamente.",
          );
          return true;
        }

        startTransition(() => {
          router.replace("/auth/login?reason=session-expired");
        });
        return true;
      }

      case "forbidden":
        // El backend ya rechazó la acción. No renovamos ni cerramos la sesión,
        // y la política actual de la app evita revelar detalles de permisos.
        return true;

      case "auth-provider-unavailable":
        appToast.error(
          "No podemos verificar tu sesión",
          "Intenta nuevamente en unos segundos.",
        );
        return true;

      case "connection":
        appToast.error(
          "Error de conexión",
          "Revisa tu conexión e intenta nuevamente.",
        );
        return true;

      case "other":
        return false;
    }
  };
}
