"use client";

import { useSyncExternalStore } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { cn } from "@/lib/utils";

type DiagramSyncBadgeProps = {
  className?: string;
};

function subscribeOnline(callback: () => void) {
  const handleOnline = () => {
    callback();
    window.dispatchEvent(new CustomEvent("diagram:process-queue"));
  };
  const handleOffline = () => {
    callback();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

/**
 * Badge de estado de sincronización para la barra superior del lienzo de proyecto.
 * Muestra el estado en vivo:
 * - Verde: "Guardado" (cola vacía e inactiva)
 * - Naranja: "Guardando..." (operaciones pendientes o en proceso de sincronización)
 * - Rojo: "Sin conexión" (desconectado de la red) o "Error al guardar" (bloqueo por error)
 */
export function DiagramSyncBadge({ className }: DiagramSyncBadgeProps) {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncError = useAppStore((s) => s.syncError);

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

  const handleRetry = () => {
    if (syncStatus === "blocked" && isOnline) {
      window.dispatchEvent(
        new CustomEvent("diagram:process-queue", {
          detail: { retryBlocked: true },
        })
      );
    }
  };

  // Configuración de visualización según el estado
  let dotClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]";
  let label = "Guardado";
  let isPulsing = false;
  let title = "Todos los cambios están guardados.";
  const isInteractive = syncStatus === "blocked" && isOnline;

  if (!isOnline) {
    dotClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]";
    label = "Sin conexión";
    title = "Sin conexión a internet. Los cambios se sincronizarán al reconectar.";
  } else if (syncStatus === "blocked") {
    dotClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]";
    label = "Error al guardar";
    title = syncError
      ? `${syncError} (Haz clic para reintentar)`
      : "Error al sincronizar con el servidor. Haz clic para reintentar.";
  } else if (syncStatus === "pending") {
    dotClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]";
    isPulsing = true;
    if (syncError && syncError.toLowerCase().includes("reintent")) {
      label = "Reintentando...";
      title = `${syncError} Los cambios se conservan localmente.`;
    } else {
      label = "Guardando...";
      title = "Guardando cambios en el servidor...";
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      title={title}
      onClick={isInteractive ? handleRetry : undefined}
      className={cn(
        "flex items-center space-x-2 bg-[#191a1d] border border-white/10 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg select-none transition",
        isInteractive &&
          "cursor-pointer hover:bg-white/10 hover:border-rose-500/40 active:scale-95",
        className
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300",
          dotClass,
          isPulsing && "animate-pulse"
        )}
      />
      <span className="tracking-tight text-white/90">{label}</span>
    </div>
  );
}
