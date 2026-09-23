"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { useGenerateBackend } from "@/features/code-generation/presentation/hooks/use-generate-backend";
import { useExportProject } from "@/features/projects/presentation/hooks/use-export-project";
import { CODE_GENERATION_MESSAGES } from "@/features/code-generation/presentation/constants/code-generation.messages";
import {
  ProjectAccessRole,
  type ProjectDetail,
} from "@/features/projects/domain/entities/project.entity";
import { deriveProjectCanvasCapabilities } from "@/features/projects/domain/services/project-canvas-capabilities";
import type { ProjectMember } from "@/features/collaboration/domain/entities/project-member.entity";
import type { DiagramSnapshot } from "@/features/diagram/domain/entities/diagram-class.entity";
import {
  ProjectCanvasBottomControls,
} from "./project-flow-canvas";
import {
  ProjectCanvasToolbar,
  type CanvasTool,
} from "./project-canvas-toolbar";
import { DiagramCanvasView } from "@/features/diagram/presentation/components/elements/diagram-canvas/diagram-canvas-view";
import { DiagramSyncBadge } from "@/features/diagram/presentation/components/elements/diagram-canvas/diagram-sync-badge";
import { RelationGuidancePill } from "@/features/diagram/presentation/components/elements/diagram-canvas/relations/relation-guidance-pill";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectCommandDialog } from "./project-command-dialog";
import { ProjectSharePopover } from "@/features/collaboration/presentation/components/elements/project-canvas/project-share-popover";
import { ProjectMembersPopover } from "@/features/collaboration/presentation/components/elements/project-canvas/project-members-popover";
import { ProjectInformationPopover } from "./project-information-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { useProjectAccessRevalidation } from "@/features/projects/presentation/hooks/use-project-access-revalidation";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { useDiagramRealtimeBridge } from "@/features/diagram/presentation/hooks/use-diagram-realtime-bridge";
import type {
  AgentActivity,
  AssistantVisualState,
} from "@/features/assistant/domain/entities/agent-activity.entity";
import { AgentActivityTrigger } from "@/features/assistant/presentation/components/elements/agent-activity-trigger";
import { AgentTriggerButton } from "@/features/assistant/presentation/components/elements/agent-trigger-button";
import { AgentOptionsDropdown } from "@/features/assistant/presentation/components/elements/agent-options-dropdown";
import { AgentAuroraOverlay } from "@/features/assistant/presentation/components/elements/agent-aurora-overlay";
import { VoiceRecorderBar } from "@/features/assistant/presentation/components/elements/voice-recorder-bar";
import { useVoiceRecorder } from "@/features/assistant/presentation/hooks/use-voice-recorder";
import { useImageImporter } from "@/features/assistant/presentation/hooks/use-image-importer";

type ProjectCanvasViewProps = {
  project: ProjectDetail;
  initialMembers?: ProjectMember[];
  initialSnapshot?: DiagramSnapshot;
  initialActivities?: AgentActivity[];
  viewerId: string;
};

/**
 * Vista principal e integradora del lienzo de proyecto (Stitch Canvas).
 * Coordina React Flow, la barra vertical de herramientas, los controles de navegación,
 * atajos de teclado globales y las operaciones administrativas condicionadas por la matriz de capacidades.
 */
export function ProjectCanvasView({
  project,
  initialMembers = [],
  initialSnapshot,
  initialActivities = [],
  viewerId,
}: ProjectCanvasViewProps) {
  const [currentProject, setCurrentProject] = useState<ProjectDetail>(project);
  const [isTemporaryHand, setIsTemporaryHand] = useState(false);

  const capabilities = deriveProjectCanvasCapabilities(currentProject.accessRole);
  const isAgentLocked = useAppStore((s) => s.isAgentLocked);

  const handleRoleChanged = useCallback((accessRole: "OWNER" | "EDITOR" | "READER") => {
    setCurrentProject((current) => ({ ...current, accessRole }));
  }, []);

  const { refreshSnapshot } = useDiagramRealtimeBridge({
    projectId: currentProject.id,
    viewerId,
    role: currentProject.accessRole as "OWNER" | "EDITOR" | "READER",
    enabled: Boolean(viewerId),
    onRoleChanged: handleRoleChanged,
  });

  const handleAiSuccess = useCallback(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  const [isAssistantOptionsOpen, setIsAssistantOptionsOpen] = useState(false);
  const {
    isRecording,
    isSending: isVoiceSending,
    barState,
    startRecording,
    stopAndSend,
    cancelRecording,
  } = useVoiceRecorder({
    projectId: currentProject.id,
    onSuccess: handleAiSuccess,
  });

  const {
    isSending: isImageSending,
    fileInputRef,
    openFilePicker,
    onFileInputChange,
  } = useImageImporter({
    projectId: currentProject.id,
    onSuccess: handleAiSuccess,
  });

  const isAiProcessing = isAgentLocked || isVoiceSending || isImageSending;
  const canEdit = capabilities.canEditDiagram && !isAiProcessing;

  const assistantVisualState: AssistantVisualState =
    isAiProcessing
      ? "thinking"
      : isRecording
      ? "recording"
      : isAssistantOptionsOpen
      ? "options_open"
      : "idle";

  // Revalidación reactiva ante cambios de foco/visibilidad y 403/404
  useProjectAccessRevalidation({
    projectId: currentProject.id,
    viewerId,
    currentRole: currentProject.accessRole,
    onAccessUpdated: (updated) => setCurrentProject(updated),
  });

  // Sincronizar activeTool directamente desde el store de diagrama
  const activeTool = useAppStore((s) => s.activeTool);
  const setActiveStoreTool = useAppStore((s) => s.setActiveTool);
  const cancelRelationCreation = useAppStore((s) => s.cancelRelationCreation);

  const { generateSpringBoot, isGenerating: isGeneratingBackend } =
    useGenerateBackend(currentProject.id);
  const { exportProject, isExporting } = useExportProject(currentProject.id);

  const handleSelectTool = useCallback(
    (tool: CanvasTool) => {
      setActiveStoreTool(tool);
      if (tool !== "relation") {
        cancelRelationCreation();
      }
    },
    [setActiveStoreTool, cancelRelationCreation]
  );

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

      // Escape: Cancelar draft de conexión o desactivar herramienta de relación
      if (e.key === "Escape") {
        const store = useAppStore.getState();
        if (
          store.relationDraftSource ||
          store.activeTool === "relation" ||
          store.activeRelationPreset ||
          store.isRelationPickerOpen
        ) {
          store.cancelRelationCreation();
          return;
        }
      }

      // Espacio mantenido: Paneo temporal (Mano)
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsTemporaryHand(true);
        return;
      }

      // V o B: Selección de herramienta Puntero
      if (e.key.toLowerCase() === "v" || e.key.toLowerCase() === "b") {
        if (canEdit) {
          handleSelectTool("cursor");
        }
        return;
      }

      // M: Selección de herramienta Marco de selección
      if (e.key.toLowerCase() === "m") {
        if (canEdit) {
          handleSelectTool("select");
        }
        return;
      }

      // H: Selección de herramienta Mano persistente
      if (e.key.toLowerCase() === "h") {
        handleSelectTool("hand");
        return;
      }

      // C: Selección de herramienta Crear clase UML (condicionada a canEdit)
      if (e.key.toLowerCase() === "c") {
        if (canEdit) {
          handleSelectTool("create-class");
        }
        return;
      }

      // R: Alternar catálogo / herramienta de relaciones UML (condicionada a canEdit)
      if (e.key.toLowerCase() === "r") {
        if (canEdit) {
          const store = useAppStore.getState();
          store.setRelationPickerOpen(!store.isRelationPickerOpen);
        }
        return;
      }

      // ⌘E / Ctrl+E: Exportar proyecto a archivo XMI
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        if (capabilities.canExportOrGenerate) {
          void exportProject();
        }
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
  }, [canEdit, capabilities.canExportOrGenerate, exportProject, handleSelectTool]);

  return (
    <ReactFlowProvider>
      <div className="relative w-screen h-screen overflow-hidden select-none bg-[#212224]">
      {/* Sombra / degradado superior sutil y continuo sin líneas de corte */}
      <div
        className="fixed top-0 inset-x-0 h-36 pointer-events-none z-20 select-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(33, 34, 36, 0.7) 0%, rgba(33, 34, 36, 0.45) 30%, rgba(33, 34, 36, 0.2) 60%, rgba(33, 34, 36, 0.05) 85%, transparent 100%)",
        }}
      />

      {/* Botón flotante del Asistente IA (bajo el menú de 3 líneas) */}
      <div className="fixed top-[58px] left-5 z-30 pointer-events-auto">
        <AgentOptionsDropdown
          isOpen={isAssistantOptionsOpen}
          onOpenChange={setIsAssistantOptionsOpen}
          onSelectImage={() => {
            setIsAssistantOptionsOpen(false);
            openFilePicker();
          }}
          onSelectVoice={() => {
            setIsAssistantOptionsOpen(false);
            void startRecording();
          }}
          disabled={!capabilities.canEditDiagram || isAiProcessing}
        >
          <AgentTriggerButton
            state={assistantVisualState}
            disabled={!capabilities.canEditDiagram || isAiProcessing}
          />
        </AgentOptionsDropdown>

        {/* Input oculto para carga de imágenes del diagrama */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Efecto perimetral de Auroras Boreales durante el bloqueo del agente */}
      <AgentAuroraOverlay isLocked={isAiProcessing} />

      {/* Encabezado flotante minimalista */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between py-3 px-5 pointer-events-none">
        {/* Izquierda: Menú principal y título del proyecto */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <ProjectActionsMenu
            capabilities={capabilities}
            isOwner={currentProject.accessRole === ProjectAccessRole.OWNER}
            onOpenCommands={() => setIsCommandOpen(true)}
            onOpenDelete={
              capabilities.canDuplicateOrDeleteProject
                ? () => setIsDeleteOpen(true)
                : undefined
            }
            onExport={exportProject}
          />

          {capabilities.canEditProjectDetails ? (
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

          {/* Badge de estado de sincronización al lado del nombre del proyecto */}
          <DiagramSyncBadge />
        </div>

        {/* Derecha: Acciones, Compartir y Colaboradores */}
        <div className="flex items-center space-x-2.5 pointer-events-auto">
          {/* Botones de acción futura */}
          {capabilities.canExportOrGenerate && (
            <>
              <button
                type="button"
                onClick={() => generateSpringBoot()}
                disabled={isGeneratingBackend}
                className="hidden sm:flex items-center space-x-1.5 bg-[#191a1d] border border-white/10 text-white hover:bg-white/10 px-3.5 py-2 rounded-full text-xs font-medium shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={CODE_GENERATION_MESSAGES.actions.generateBackend}
              >
                {isGeneratingBackend ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>
                  {isGeneratingBackend
                    ? CODE_GENERATION_MESSAGES.loading.buttonGenerating
                    : CODE_GENERATION_MESSAGES.actions.generateBackend}
                </span>
              </button>

              <button
                type="button"
                onClick={() => exportProject()}
                disabled={isExporting}
                className="hidden sm:flex items-center space-x-1.5 bg-[#191a1d] border border-white/10 text-white hover:bg-white/10 px-3.5 py-2 rounded-full text-xs font-medium shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar proyecto a XMI (Enterprise Architect)"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                )}
                <span>{isExporting ? "Exportando..." : "Exportar"}</span>
              </button>
            </>
          )}

          {capabilities.canShareInvitation && (
            <ProjectSharePopover projectId={currentProject.id} />
          )}

          <ProjectMembersPopover
            projectId={currentProject.id}
            initialMembers={initialMembers}
            capabilities={capabilities}
          />
        </div>
      </header>

      {/* Barra vertical de herramientas (Derecha) */}
      <ProjectCanvasToolbar
        activeTool={activeTool}
        isTemporaryHand={isTemporaryHand}
        canEdit={canEdit}
        onSelectTool={handleSelectTool}
      />

      {/* Lienzo interactivo React Flow con soporte de clases de diagrama */}
      <DiagramCanvasView
        projectId={currentProject.id}
        viewerId={viewerId}
        initialSnapshot={initialSnapshot}
        canEdit={canEdit}
        activeTool={activeTool}
        isTemporaryHand={isTemporaryHand}
        onClassCreated={() => handleSelectTool("cursor")}
      />

      {/* Pie de controles flotantes con distribución estable en 3 columnas */}
      <footer className="fixed bottom-6 left-0 right-0 z-30 px-5 flex items-center justify-between pointer-events-none">
        {/* Izquierda: Registro de agente */}
        <div className="flex-1 flex justify-start">
          <AgentActivityTrigger
            projectId={currentProject.id}
            initialActivities={initialActivities}
          />
        </div>

        {/* Centro: Barra de grabación de voz O Píldora de orientación contextual */}
        <div className="flex-1 flex justify-center pointer-events-none">
          {barState !== "idle" ? (
            <VoiceRecorderBar
              state={barState}
              onCancel={cancelRecording}
              onSend={() => void stopAndSend()}
            />
          ) : (
            <RelationGuidancePill />
          )}
        </div>

        {/* Derecha: Deshacer / Rehacer y Porcentaje de Zoom */}
        <div className="flex-1 flex justify-end">
          <ProjectCanvasBottomControls />
        </div>
      </footer>

      {/* Diálogo de atajos de teclado (⌘K) */}
      <ProjectCommandDialog
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        capabilities={capabilities}
      />

      {/* Diálogos exclusivos del propietario */}
      {capabilities.canDuplicateOrDeleteProject && (
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
