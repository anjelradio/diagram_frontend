"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { ProjectMember } from "@/features/projects/domain/entities/project-member.entity";

export type MemberActionType = "promote" | "demote" | "remove";

type ProjectMemberConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ProjectMember | null;
  actionType: MemberActionType | null;
  isPending: boolean;
  onConfirm: () => Promise<void>;
};

/**
 * Diálogo de confirmación accesible para cambios de rol (promover, degradar)
 * y remoción de colaboradores del proyecto.
 */
export function ProjectMemberConfirmationDialog({
  open,
  onOpenChange,
  member,
  actionType,
  isPending,
  onConfirm,
}: ProjectMemberConfirmationDialogProps) {
  if (!member || !actionType) return null;

  const memberName = member.name || member.email;

  const configMap: Record<
    MemberActionType,
    { title: string; description: string; confirmText: string; isDestructive: boolean }
  > = {
    promote: {
      title: "¿Promover a Editor?",
      description: `¿Estás seguro de otorgar rol de Editor a ${memberName}? Tendrá permisos de edición en el proyecto.`,
      confirmText: "Promover a Editor",
      isDestructive: false,
    },
    demote: {
      title: "¿Degradar a Lector?",
      description: `¿Estás seguro de cambiar el rol de ${memberName} a Lector? Solo podrá ver el proyecto.`,
      confirmText: "Degradar a Lector",
      isDestructive: false,
    },
    remove: {
      title: "¿Eliminar del proyecto?",
      description: `¿Estás seguro de remover a ${memberName}? Perderá el acceso al proyecto inmediatamente.`,
      confirmText: "Eliminar miembro",
      isDestructive: true,
    },
  };

  const config = configMap[actionType];

  return (
    <AlertDialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <AlertDialogContent className="rounded-2xl bg-[#1a1b1e] border border-white/10 text-slate-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-white tracking-tight">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-400">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            disabled={isPending}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl text-xs"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            className={
              config.isDestructive
                ? "bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium cursor-pointer"
                : "bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium cursor-pointer"
            }
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Procesando...</span>
              </span>
            ) : (
              config.confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
