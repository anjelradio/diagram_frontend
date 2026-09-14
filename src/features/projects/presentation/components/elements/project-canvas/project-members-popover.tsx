"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, Pen, Trash2, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ActionButton } from "@/features/shared/presentation/components/custom-buttons/action-button";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { authClient } from "@/lib/auth-client";
import type {
  ProjectCanvasCapabilities,
} from "@/features/projects/domain/entities/project.entity";
import type { ProjectMember } from "@/features/projects/domain/entities/project-member.entity";
import {
  demoteMemberAction,
  promoteMemberAction,
  removeMemberAction,
} from "@/features/projects/presentation/actions/project-member.action";
import {
  MemberActionType,
  ProjectMemberConfirmationDialog,
} from "./project-member-confirmation-dialog";

type ProjectMembersPopoverProps = {
  projectId: string;
  initialMembers?: ProjectMember[];
  capabilities?: ProjectCanvasCapabilities;
};

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Popover de colaboradores activos para el propietario del proyecto.
 * Permite visualizar miembros, alternar roles (Lector / Editor) y remover miembros
 * con confirmaciones explícitas y actualización de estado inmediata.
 */
export function ProjectMembersPopover({
  projectId,
  initialMembers = [],
  capabilities,
}: ProjectMembersPopoverProps) {
  const canManage = capabilities?.canManageMembers ?? false;
  const { data: session } = authClient.useSession();
  const [members, setMembers] = useState<ProjectMember[]>(initialMembers);
  const [open, setOpen] = useState(false);

  const currentUser = session?.user;
  const userAvatar = currentUser?.image;
  const userName = currentUser?.name || currentUser?.email || "Tú";
  const userInitials = getInitials(userName);

  // Estado del diálogo de confirmación
  const [confirmMember, setConfirmMember] = useState<ProjectMember | null>(null);
  const [actionType, setActionType] = useState<MemberActionType | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleOpenConfirm = (
    member: ProjectMember,
    type: MemberActionType
  ) => {
    setConfirmMember(member);
    setActionType(type);
  };

  const handleCloseConfirm = () => {
    if (isPending) return;
    setConfirmMember(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmMember || !actionType) return;
    setIsPending(true);

    try {
      if (actionType === "promote") {
        const result = await promoteMemberAction(projectId, confirmMember.id);
        if (result.ok) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === confirmMember.id ? { ...m, role: "EDITOR" as const } : m
            )
          );
          appToast.success(`${confirmMember.name || confirmMember.email} promovido a Editor.`);
          handleCloseConfirm();
        } else {
          appToast.error(result.errors?.[0] || "No se pudo promover al miembro.");
        }
      } else if (actionType === "demote") {
        const result = await demoteMemberAction(projectId, confirmMember.id);
        if (result.ok) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === confirmMember.id ? { ...m, role: "READER" as const } : m
            )
          );
          appToast.success(`${confirmMember.name || confirmMember.email} degradado a Lector.`);
          handleCloseConfirm();
        } else {
          appToast.error(result.errors?.[0] || "No se pudo degradar al miembro.");
        }
      } else if (actionType === "remove") {
        const result = await removeMemberAction(projectId, confirmMember.id);
        if (result.ok) {
          setMembers((prev) => prev.filter((m) => m.id !== confirmMember.id));
          appToast.success(`${confirmMember.name || confirmMember.email} ha sido removido.`);
          handleCloseConfirm();
        } else {
          appToast.error(result.errors?.[0] || "No se pudo remover al miembro.");
        }
      }
    } catch {
      appToast.error("Error inesperado al procesar la acción.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-label="Ver miembros del proyecto"
            className="flex items-center bg-[#191a1d] border border-white/10 rounded-full p-1 shadow-lg backdrop-blur-md gap-2 cursor-pointer select-none transition hover:bg-white/5 active:scale-95"
          >
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono text-slate-300">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-300">
                {members.length}
              </span>
            </div>
            <div
              className="relative z-10 flex-shrink-0"
              title={`${userName} (Tú)`}
            >
              {userAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#191a1d] shadow-md"
                />
              ) : (
                <div className="w-7 h-7 rounded-full ring-2 ring-[#191a1d] shadow-md bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold uppercase">
                  {userInitials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#191a1d]" />
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[380px] sm:w-[430px] bg-[#191a1d] border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-3 z-50 select-none flex flex-col gap-2 text-slate-200"
        >
          {/* Cabecera */}
          <div className="px-1 pb-1 flex items-center justify-between border-b border-white/10">
            <h4 className="text-xs font-semibold text-white tracking-tight">
              Miembros del proyecto
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              {members.length} {members.length === 1 ? "colaborador" : "colaboradores"}
            </span>
          </div>

          {/* Lista de colaboradores */}
          <div className="max-h-56 overflow-y-auto flex flex-col space-y-1 pr-0.5">
            {members.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Aún no hay colaboradores en este proyecto.
              </div>
            ) : (
              members.map((member) => {
                const isEditor = member.role === "EDITOR";
                const initials = getInitials(member.name || member.email);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/5 transition group"
                  >
                    {/* Avatar y Datos del usuario */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={member.name || member.email}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className={
                              isEditor
                                ? "w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                                : "w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold"
                            }
                          >
                            {initials}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[#191a1d]" />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {member.name || member.email}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    {/* Rol y Acciones */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={
                          isEditor
                            ? "text-[10px] font-mono font-medium text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full"
                            : "text-[10px] font-mono font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full"
                        }
                      >
                        {isEditor ? "Editor" : "Lector"}
                      </span>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          {isEditor ? (
                            <ActionButton
                              ariaLabel="Cambiar a Lector"
                              title="Cambiar a Lector"
                              onClick={() => handleOpenConfirm(member, "demote")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </ActionButton>
                          ) : (
                            <ActionButton
                              ariaLabel="Cambiar a Editor"
                              title="Cambiar a Editor"
                              onClick={() => handleOpenConfirm(member, "promote")}
                            >
                              <Pen className="w-3 h-3" />
                            </ActionButton>
                          )}

                          <ActionButton
                            ariaLabel="Eliminar del proyecto"
                            title="Eliminar del proyecto"
                            variant="destructive"
                            onClick={() => handleOpenConfirm(member, "remove")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </ActionButton>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Diálogo de confirmación para promover, degradar o remover (solo para quien puede administrar) */}
      {canManage && (
        <ProjectMemberConfirmationDialog
          open={confirmMember !== null && actionType !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCloseConfirm();
          }}
          member={confirmMember}
          actionType={actionType}
          isPending={isPending}
          onConfirm={handleConfirmAction}
        />
      )}
    </>
  );
}
