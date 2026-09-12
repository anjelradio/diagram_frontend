"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { createProjectAction } from "../../../actions/project.action";

/**
 * Botón para crear un nuevo proyecto en blanco.
 * Muestra retroalimentación visual de carga, previene dobles envíos,
 * maneja notificaciones de error con appToast y redirige a /projects/[id] al éxito.
 */
export function CreateProjectButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    if (isPending) return;
    setIsPending(true);

    try {
      const result = await createProjectAction();
      if (!result.ok) {
        const errorMsg =
          result.errors?.[0] || "No se pudo crear el proyecto. Intenta nuevamente.";
        appToast.error("Error al crear proyecto", errorMsg);
        setIsPending(false);
        return;
      }

      // Navegación inmediata al espacio del proyecto recién creado
      router.push(`/projects/${result.data.id}`);
    } catch {
      appToast.error(
        "Error inesperado",
        "Ocurrió un fallo de conexión al crear el proyecto.",
      );
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={isPending}
      className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-[0.98] border border-indigo-400/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : (
        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
      )}
      <span>{isPending ? "Creando..." : "Nuevo Proyecto"}</span>
    </button>
  );
}
