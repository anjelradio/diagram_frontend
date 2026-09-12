"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Pencil,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { Project } from "@/features/projects/domain/entities/project.entity";
import type { ProjectMember } from "@/features/projects/domain/entities/project-member.entity";
import {
  CanvasTool,
  ProjectCanvasBottomControls,
  ProjectFlowCanvas,
} from "./project-flow-canvas";
import { ProjectCanvasToolbar } from "./project-canvas-toolbar";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectCommandDialog } from "./project-command-dialog";
import { ProjectSharePopover } from "./project-share-popover";
import { ProjectMembersPopover } from "./project-members-popover";
import { ProjectInformationPopover } from "./project-information-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";

type ProjectCanvasViewProps = {
  project: Project;
  initialMembers?: ProjectMember[];
};

/**
 * Vista principal e integradora del lienzo de proyecto (Stitch Canvas).
 * Coordina React Flow, la barra vertical de herramientas, los controles de navegación,
 * atajos de teclado globales y las operaciones administrativas condicionadas al propietario.
 */
export function ProjectCanvasView({
  project,
  initialMembers = [],
}: ProjectCanvasViewProps) {
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [activeTool, setActiveTool] = useState<CanvasTool>("cursor");
  const [isTemporaryHand, setIsTemporaryHand] = useState(false);

  // Estados de modales y diálogos
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Listener de atajos de teclado globales con exclusión de campos editables y diálogos
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return true;
      if (
        el.closest('[role="dialog"]') ||
        el.closest('[data-slot="dialog-content"]') ||
        el.closest('[data-slot="popover-content"]')
      ) {
        return true;
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K o Ctrl+K para alternar el menú de comandos
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      // Si el foco está en un campo o diálogo, omitir los atajos de herramientas
      if (isEditable(e.target)) return;

      // Espacio mantenido: Paneo temporal (Mano)
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsTemporaryHand(true);
        return;
      }

      // V o B: Selección de herramienta Puntero
      if (e.key.toLowerCase() === "v" || e.key.toLowerCase() === "b") {
        setActiveTool("cursor");
        return;
      }

      // M: Selección de herramienta Marco de selección
      if (e.key.toLowerCase() === "m") {
        setActiveTool("select");
        return;
      }

      // H: Selección de herramienta Mano persistente
      if (e.key.toLowerCase() === "h") {
        setActiveTool("hand");
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        setIsTemporaryHand(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <ReactFlowProvider>
      <div className="relative w-screen h-screen overflow-hidden select-none bg-[#212224]">
      {/* Sombra / degradado superior traslúcido de Stitch */}
      <div className="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-[#121316]/90 via-[#121316]/40 to-transparent pointer-events-none z-20" />

      {/* Encabezado flotante minimalista */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between py-3 px-5 pointer-events-none">
        {/* Izquierda: Menú principal y título del proyecto */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <ProjectActionsMenu
            isOwner={currentProject.isOwner}
            onOpenCommands={() => setIsCommandOpen(true)}
            onOpenDelete={
              currentProject.isOwner ? () => setIsDeleteOpen(true) : undefined
            }
          />

          {currentProject.isOwner ? (
            <ProjectInformationPopover
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              projectId={currentProject.id}
              currentName={currentProject.name}
              currentDescription={currentProject.description}
              onSuccess={(updated) =>
                setCurrentProject((prev) => ({
                  ...prev,
                  name: updated.name,
                  description: updated.description,
                }))
              }
            >
              <button
                type="button"
                className="group flex items-center space-x-2 bg-[#191a1d] border border-white/10 text-white hover:bg-white/10 px-3.5 py-1.5 rounded-full shadow-lg transition active:scale-95 cursor-pointer select-none"
                title="Detalles del proyecto"
              >
                <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
                  {currentProject.name}
                </span>
                <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover:text-white transition ml-0.5" />
              </button>
            </ProjectInformationPopover>
          ) : (
            <div
              className="flex items-center space-x-2 bg-[#191a1d] border border-white/10 text-white px-3.5 py-1.5 rounded-full shadow-lg select-none"
              title={currentProject.name}
            >
              <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
                {currentProject.name}
              </span>
            </div>
          )}
        </div>

        {/* Derecha: Acciones, Compartir y Colaboradores */}
        <div className="flex items-center space-x-2.5 pointer-events-auto">
          {/* Botones de acción futura */}
          <button
            type="button"
            onClick={() =>
              appToast.info("La generación de Backend estará disponible próximamente.")
            }
            className="hidden sm:flex items-center space-x-1.5 bg-[#191a1d] border border-white/10 text-white hover:bg-white/10 px-3.5 py-2 rounded-full text-xs font-medium shadow-lg transition active:scale-95 cursor-pointer"
            title="Generar Backend"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generar Backend</span>
          </button>

          <button
            type="button"
            onClick={() =>
              appToast.info("La exportación de diagramas estará disponible próximamente.")
            }
            className="hidden sm:flex items-center space-x-1.5 bg-[#191a1d] border border-white/10 text-white hover:bg-white/10 px-3.5 py-2 rounded-full text-xs font-medium shadow-lg transition active:scale-95 cursor-pointer"
            title="Exportar"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
            <span>Exportar</span>
          </button>

          {/* Opciones exclusivas del propietario */}
          {currentProject.isOwner ? (
            <>
              <ProjectSharePopover projectId={currentProject.id} />
              <ProjectMembersPopover
                projectId={currentProject.id}
                initialMembers={initialMembers}
              />
            </>
          ) : (
            <div className="flex items-center bg-[#191a1d] border border-white/10 rounded-full px-3 py-1 shadow-lg">
              <span className="text-[10px] font-mono font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                Colaborador
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Barra vertical de herramientas (Derecha) */}
      <ProjectCanvasToolbar
        activeTool={activeTool}
        isTemporaryHand={isTemporaryHand}
        onSelectTool={setActiveTool}
      />

      {/* Lienzo interactivo React Flow */}
      <ProjectFlowCanvas
        activeTool={activeTool}
        isTemporaryHand={isTemporaryHand}
      />

      {/* Pie de controles flotantes */}
      <footer className="fixed bottom-6 left-0 right-0 z-30 px-5 flex items-center justify-between pointer-events-none">
        {/* Izquierda: Registro de agente */}
        <button
          type="button"
          onClick={() =>
            appToast.info("El registro de actividad estará disponible próximamente.")
          }
          className="pointer-events-auto flex items-center space-x-2 bg-[#191a1d] text-white border border-white/10 py-2 px-4 rounded-full shadow-xl hover:bg-white/10 transition text-xs font-medium active:scale-95 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Registro de agente</span>
        </button>

        {/* Derecha: Deshacer / Rehacer y Porcentaje de Zoom */}
        <ProjectCanvasBottomControls />
      </footer>

      {/* Diálogo de atajos de teclado (⌘K) */}
      <ProjectCommandDialog
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
      />

      {/* Diálogos exclusivos del propietario */}
      {currentProject.isOwner && (
        <DeleteProjectDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}
      </div>
    </ReactFlowProvider>
  );
}
