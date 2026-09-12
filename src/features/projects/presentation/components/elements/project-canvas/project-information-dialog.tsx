"use client";

import { useState, type ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileEdit, X } from "lucide-react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { updateProjectAction } from "@/features/projects/presentation/actions/project.action";
import { ProjectInformationForm } from "@/features/projects/presentation/components/forms/project-canvas/project-information-form";

type ProjectInformationPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentName: string;
  currentDescription: string | null;
  onSuccess: (updated: { name: string; description: string | null }) => void;
  children?: ReactNode;
};

/**
 * Dropdown anclado para editar los detalles del proyecto (Stitch SCREEN_3).
 * Se despliega directamente bajo la píldora del título del proyecto sin oscurecer
 * el lienzo con un fondo modal centrado.
 */
export function ProjectInformationPopover({
  open,
  onOpenChange,
  projectId,
  currentName,
  currentDescription,
  onSuccess,
  children,
}: ProjectInformationPopoverProps) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    description: string | null;
  }) => {
    setIsPending(true);
    try {
      const result = await updateProjectAction(projectId, data);
      if (result.ok) {
        appToast.success("Información del proyecto actualizada exitosamente.");
        onSuccess(data);
        onOpenChange(false);
      } else {
        appToast.error(
          result.errors?.[0] ||
            "No fue posible actualizar la información del proyecto."
        );
      }
    } catch {
      appToast.error("Ocurrió un error inesperado al actualizar el proyecto.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      {children && <PopoverTrigger asChild>{children}</PopoverTrigger>}

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-80 sm:w-96 bg-[#191a1d] border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 z-50 text-slate-200 flex flex-col gap-3.5 select-none"
      >
        {/* Encabezado del Dropdown */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileEdit className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              Detalles del proyecto
            </span>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="w-6 h-6 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Cerrar"
            aria-label="Cerrar ventana de detalles"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Formulario */}
        <ProjectInformationForm
          key={`${projectId}-${currentName}-${currentDescription ?? ""}`}
          initialName={currentName}
          initialDescription={currentDescription}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </PopoverContent>
    </Popover>
  );
}

// Alias para mantener compatibilidad con cualquier importación previa
export { ProjectInformationPopover as ProjectInformationDialog };
