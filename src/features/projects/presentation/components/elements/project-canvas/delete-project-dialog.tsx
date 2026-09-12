"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextFormField } from "@/features/shared/presentation/components/forms/text-form-field";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { deleteProjectAction } from "@/features/projects/presentation/actions/project.action";

type DeleteProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
};

/**
 * Diálogo destructivo autocontenido para eliminar un proyecto.
 * Requiere escribir el nombre exacto del proyecto para habilitar la eliminación.
 * Tras el éxito, notifica y redirige a /projects.
 */
export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isMatch = confirmInput === projectName;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch || isPending) return;

    setIsPending(true);
    try {
      const result = await deleteProjectAction(projectId);
      if (result.ok) {
        appToast.success("El proyecto ha sido eliminado exitosamente.");
        onOpenChange(false);
        router.push("/projects");
      } else {
        appToast.error(
          result.errors?.[0] || "No fue posible eliminar el proyecto."
        );
      }
    } catch {
      appToast.error("Ocurrió un error inesperado al eliminar el proyecto.");
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    if (isPending) return;
    setConfirmInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && (val ? onOpenChange(true) : handleClose())}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[440px] bg-[#191a1d] border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-5 text-slate-200"
      >
        <DialogHeader className="p-0 text-left space-y-2">
          <div className="flex items-center gap-2.5 text-red-400">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <DialogTitle className="text-sm font-semibold text-white tracking-tight">
              ¿Eliminar proyecto permanentemente?
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta acción es destructiva e irreversible. Todos los datos asociados
            y accesos de colaboradores se revocarán inmediatamente.
          </p>
        </DialogHeader>

        <form onSubmit={handleDelete} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-slate-300">
              Para confirmar, escribe el nombre del proyecto:{" "}
              <strong className="text-white font-mono select-all font-semibold">
                {projectName}
              </strong>
            </p>
            <TextFormField
              id="confirm-project-delete"
              name="confirmProjectName"
              label="Confirmar nombre"
              hideLabel
              placeholder={projectName}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={isPending}
              required
              className="rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isPending}
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isMatch || isPending}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-white bg-red-600 hover:bg-red-500 active:scale-95 transition shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar este proyecto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
