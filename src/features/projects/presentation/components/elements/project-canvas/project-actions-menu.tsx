"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Menu,
  Terminal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ProjectCanvasCapabilities,
} from "@/features/projects/domain/entities/project.entity";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

type ProjectActionsMenuProps = {
  isOwner?: boolean;
  capabilities?: ProjectCanvasCapabilities;
  onOpenCommands: () => void;
  onOpenDelete?: () => void;
};

/**
 * Menú desplegable principal de opciones del proyecto (Trigger hamburguesa).
 * Proporciona navegación de retorno al listado de proyectos, apertura de comandos (⌘K),
 * accesos a funcionalidades futuras y eliminación protegida para propietarios.
 */
export function ProjectActionsMenu({
  isOwner = false,
  capabilities,
  onOpenCommands,
  onOpenDelete,
}: ProjectActionsMenuProps) {
  const canExport = capabilities ? capabilities.canExportOrGenerate : true;
  const canDuplicateOrDelete = capabilities
    ? capabilities.canDuplicateOrDeleteProject
    : isOwner;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-[#191a1d] border border-white/10 text-white hover:bg-white/10 shadow-lg flex items-center justify-center transition active:scale-95 cursor-pointer select-none"
          title="Menú del proyecto"
          aria-label="Abrir menú del proyecto"
        >
          <Menu className="w-4 h-4 text-white" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-72 bg-[#191a1d] border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-2 z-50 text-slate-200"
      >
        <div className="px-2 py-1 pb-1.5">
          <h4 className="text-xs font-semibold text-white tracking-tight">
            Opciones del proyecto
          </h4>
        </div>

        {/* Volver a proyectos */}
        <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5 transition cursor-pointer text-slate-200 hover:text-white focus:text-white data-[highlighted]:text-white outline-none">
          <Link
            href="/projects"
            className="flex items-center justify-between py-2 px-2.5 rounded-xl group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-white/30 group-focus:border-white/30 group-data-[highlighted]:border-white/30 transition">
                <ArrowLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-white group-focus:text-white group-data-[highlighted]:text-white transition" />
              </div>
              <span className="text-xs font-medium truncate">
                Volver a todos los proyectos
              </span>
            </div>
          </Link>
        </DropdownMenuItem>

        {/* Menú de comandos */}
        <DropdownMenuItem
          onClick={onOpenCommands}
          className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5 transition cursor-pointer group text-slate-200 hover:text-white focus:text-white data-[highlighted]:text-white outline-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-500/40 group-focus:border-indigo-500/40 group-data-[highlighted]:border-indigo-500/40 transition">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-xs font-medium truncate">
              Menú de comandos
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
            ⌘K
          </span>
        </DropdownMenuItem>

        {(canExport || canDuplicateOrDelete) && (
          <DropdownMenuSeparator className="bg-white/10 my-1" />
        )}

        {/* Exportar (Próximamente) */}
        {canExport && (
          <DropdownMenuItem
            onClick={() =>
              appToast.info("La exportación de proyectos estará disponible próximamente.")
            }
            className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5 transition cursor-pointer group text-slate-200 hover:text-white focus:text-white data-[highlighted]:text-white outline-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/40 group-focus:border-blue-500/40 group-data-[highlighted]:border-blue-500/40 transition">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-medium truncate">
                Exportar proyecto...
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
              ⌘E
            </span>
          </DropdownMenuItem>
        )}

        {/* Duplicar (Próximamente) */}
        {canDuplicateOrDelete && (
          <DropdownMenuItem
            onClick={() =>
              appToast.info("La duplicación de proyectos estará disponible próximamente.")
            }
            className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5 transition cursor-pointer group text-slate-200 hover:text-white focus:text-white data-[highlighted]:text-white outline-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/40 group-focus:border-cyan-500/40 group-data-[highlighted]:border-cyan-500/40 transition">
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-xs font-medium truncate">
                Duplicar proyecto
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 rounded-full flex-shrink-0">
              ⌘D
            </span>
          </DropdownMenuItem>
        )}

        {/* Acciones de Propietario / Administración */}
        {canDuplicateOrDelete && onOpenDelete && (
          <>
            <DropdownMenuSeparator className="bg-white/10 my-1" />

            {/* Eliminar Proyecto */}
            <DropdownMenuItem
              variant="destructive"
              onClick={onOpenDelete}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-red-400 hover:bg-red-500/15 hover:text-red-300 focus:bg-red-500/15 focus:text-red-300 data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-300 transition cursor-pointer group outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0 transition group-hover:border-red-500/50 group-focus:border-red-500/50 group-data-[highlighted]:border-red-500/50">
                  <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 group-focus:text-red-300 group-data-[highlighted]:text-red-300 transition" />
                </div>
                <span className="text-xs font-medium truncate">
                  Eliminar proyecto
                </span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
