"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowUpRight,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { useGenerateBackend } from "@/features/code-generation/presentation/hooks/use-generate-backend";
import { useExportProject } from "@/features/projects/presentation/hooks/use-export-project";
import { useProjectThumbnailCapture } from "@/features/projects/presentation/hooks/use-project-thumbnail-capture";
import { CODE_GENERATION_MESSAGES } from "@/features/code-generation/presentation/constants/code-generation.messages";
import {
  ProjectAccessRole,
  type ProjectDetail,
} from "@/features/projects/domain/entities/project.entity";
import { deriveProjectCanvasCapabilities } from "@/features/projects/domain/services/project-canvas-capabilities";
import type { ProjectMember } from "@/features/collaboration/domain/entities/project-member.entity";
import type { DiagramSnapshot } from "@/features/diagram/domain/entities/diagram-class.entity";
import {
  ProjectCanvasToolbar,
  type CanvasTool,
} from "./project-canvas-toolbar";
import { DiagramCanvasView } from "@/features/diagram/presentation/components/elements/diagram-canvas/diagram-canvas-view";
import { DiagramSyncBadge } from "@/features/diagram/presentation/components/elements/diagram-canvas/diagram-sync-badge";
import { RelationGuidancePill } from "@/features/diagram/presentation/components/elements/diagram-canvas/relations/relation-guidance-pill";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectSharePopover } from "@/features/collaboration/presentation/components/elements/project-canvas/project-share-popover";
import { ProjectMembersPopover } from "@/features/collaboration/presentation/components/elements/project-canvas/project-members-popover";
import { ProjectInformationPopover } from "./project-information-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { useProjectAccessRevalidation } from "@/features/projects/presentation/hooks/use-project-access-revalidation";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { useDiagramRealtimeBridge } from "@/features/diagram/presentation/hooks/use-diagram-realtime-bridge";
import type {
  AssistantVisualState,
} from "@/features/assistant/domain/entities/agent-activity.entity";
import { AgentChatWidget } from "@/features/assistant/presentation/components/elements/chat/agent-chat-widget";
import { AssistantFloatingDock } from "@/features/assistant/presentation/components/elements/dock/assistant-floating-dock";
import { IntegrationsPopoverButton } from "@/features/integrations/presentation/components/integrations-popover-button";
import { AgentAuroraOverlay } from "@/features/assistant/presentation/components/elements/agent-aurora-overlay";
import { useAgentChat } from "@/features/assistant/presentation/hooks/use-agent-chat";
import { useInBrowserStt } from "@/features/assistant/presentation/hooks/use-in-browser-stt";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { useDiagramTutorial } from "@/features/diagram/presentation/hooks/use-diagram-tutorial";
import { TutorialSpotlightOverlay } from "@/features/diagram/presentation/components/elements/tutorial/tutorial-spotlight-overlay";
import { TutorialPetBubble } from "@/features/diagram/presentation/components/elements/tutorial/tutorial-pet-bubble";
import { TutorialExitButton } from "@/features/diagram/presentation/components/elements/tutorial/tutorial-exit-button";

type ProjectCanvasViewProps = {
  project: ProjectDetail;
  initialMembers?: ProjectMember[];
  initialSnapshot?: DiagramSnapshot;
  viewerId: string;
  viewerAvatarUrl?: string | null;
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
  viewerId,
  viewerAvatarUrl = null,
}: ProjectCanvasViewProps) {
  const [currentProject, setCurrentProject] = useState<ProjectDetail>(project);
  const [isTemporaryHand, setIsTemporaryHand] = useState(false);

  const capabilities = deriveProjectCanvasCapabilities(currentProject.accessRole);

  const handleRoleChanged = useCallback((accessRole: "OWNER" | "EDITOR" | "READER") => {
    setCurrentProject((current) => ({ ...current, accessRole }));
  }, []);

  useDiagramRealtimeBridge({
    projectId: currentProject.id,
    viewerId,
    role: currentProject.accessRole as "OWNER" | "EDITOR" | "READER",
    enabled: Boolean(viewerId),
    onRoleChanged: handleRoleChanged,
  });

  // Hook centralizado de conversación y multimodalidad del asistente
  const chat = useAgentChat({ projectId: currentProject.id, currentUserId: viewerId, currentUserAvatarUrl: viewerAvatarUrl });

  // Hook de reconocimiento por voz STT en navegador para el chat lateral (manual)
  const lateralStt = useInBrowserStt({
    onTranscribeSuccess: (transcribedText) => {
      chat.appendTranscribedText(transcribedText);
    },
  });

  // Callback para auto-enviar mensaje desde el dock flotante al terminar de transcribir voz
  const handleDockTranscribeSuccess = useCallback(
    (transcribedText: string) => {
      const text = transcribedText.trim();
      const currentInput = chat.inputText.trim();
      const fullText = [currentInput, text].filter(Boolean).join(" ");
      const attachment = chat.draftAttachment;

      if (!fullText) {
        if (attachment) {
          appToast.error("Escribe una instrucción antes de enviar la imagen.");
        }
        return;
      }

      if (chat.isQueueFull && chat.activeMessage) {
        appToast.warning("La cola de instrucciones está llena (máx 3).");
        return;
      }

      chat.sendMessage(fullText, attachment);
    },
    [chat]
  );

  // Hook de reconocimiento por voz STT en navegador para el dock flotante (auto-envío)
  const dockStt = useInBrowserStt({
    onTranscribeSuccess: handleDockTranscribeSuccess,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        chat.attachImageFile(file);
      }
    },
    [chat]
  );

  const isAiProcessing = Boolean(chat.activeMessage && chat.activeMessage.submissionState !== "uncertain" && ["running", "cancelling"].includes(chat.activeMessage.status));
  const canEdit = capabilities.canEditDiagram;

  const assistantVisualState: AssistantVisualState =
    isAiProcessing
      ? "thinking"
      : lateralStt.state.status === "recording" || dockStt.state.status === "recording"
      ? "recording"
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

  const diagramNodes = useAppStore((s) => s.nodes);
  const { generateSpringBoot, isGenerating: isGeneratingBackend } =
    useGenerateBackend(currentProject.id);
  const { exportProject, isExporting } = useExportProject(currentProject.id);
  const { captureAndNavigate } = useProjectThumbnailCapture({
    projectId: currentProject.id,
    hasClasses: diagramNodes.length > 0,
  });

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

      // V: Selección de herramienta Crear clase UML (condicionada a canEdit)
      if (e.key.toLowerCase() === "v") {
        if (canEdit) {
          handleSelectTool("create-class");
        }
        return;
      }

      // B: Alternar herramienta de relaciones UML (condicionada a canEdit)
      if (e.key.toLowerCase() === "b") {
        if (canEdit) {
          handleSelectTool(activeTool === "relation" ? "cursor" : "relation");
        }
        return;
      }

      // N: Selección de herramienta Puntero / Cursor
      if (e.key.toLowerCase() === "n") {
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
  }, [activeTool, canEdit, capabilities.canExportOrGenerate, exportProject, handleSelectTool]);

  const tutorial = useDiagramTutorial();

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

      {/* Widget expandible del Asistente IA (bajo el menú de 3 líneas) */}
      <div className="fixed top-[58px] left-5 z-40 pointer-events-auto">
        <AgentChatWidget
          chat={chat}
          stt={lateralStt}
          visualState={assistantVisualState}
          canInteract={capabilities.canEditDiagram}
          onImageSelect={openFilePicker}
        />

        {/* Input oculto para carga de imágenes del diagrama */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <AgentAuroraOverlay
        isLocked={Boolean(chat.activeMessage && !chat.isActiveUncertain)}
        isCancelling={chat.activeMessage?.status === "cancelling"}
      />

      {/* Encabezado flotante minimalista */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between py-3 px-5 pointer-events-none">
        {/* Izquierda: Menú principal y título del proyecto */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <ProjectActionsMenu
            capabilities={capabilities}
            isOwner={currentProject.accessRole === ProjectAccessRole.OWNER}
            onOpenDelete={
              capabilities.canDuplicateOrDeleteProject
                ? () => setIsDeleteOpen(true)
                : undefined
            }
            onExport={exportProject}
            onBackToProjects={() => captureAndNavigate("/projects")}
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

          {/* Colaboradores y debajo botón exclusivo de Integraciones */}
          <div className="relative flex flex-col items-end">
            <ProjectMembersPopover
              projectId={currentProject.id}
              initialMembers={initialMembers}
              capabilities={capabilities}
            />

            {capabilities.canManageIntegrations && (
              <div className="absolute top-full right-0 mt-2.5 pointer-events-auto">
                <IntegrationsPopoverButton projectId={currentProject.id} />
              </div>
            )}
          </div>
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
        {/* Izquierda: Espacio reservado para balance de 3 columnas */}
        <div className="flex-1 flex justify-start" />

        {/* Centro: Píldora de orientación contextual y Dock flotante inferior del asistente */}
        <div className="flex-1 flex flex-col items-center gap-2 pointer-events-none">
          <RelationGuidancePill />
          <AnimatePresence>
            {capabilities.canEditDiagram && !chat.isOpen && (
              <motion.div
                key="assistant-floating-dock-wrapper"
                initial={{ y: 36, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 36, opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto"
              >
                <AssistantFloatingDock
                  value={chat.inputText}
                  onChange={chat.setInputText}
                  onSend={chat.sendMessage}
                  onAudioStart={dockStt.handleRecordClick}
                  onAudioStop={dockStt.handlePauseClick}
                  onAudioCancel={dockStt.cancelSession}
                  onImageAttachClick={openFilePicker}
                  onImageFileSelected={(file) => chat.attachImageFile(file)}
                  draftAttachment={chat.draftAttachment}
                  onRemoveAttachment={chat.removeDraftAttachment}
                  onPreviewAttachment={chat.openModalImage}
                  sttState={dockStt.state}
                  canEdit={capabilities.canEditDiagram}
                  isProcessing={Boolean(chat.activeMessage)}
                  isCancelling={chat.activeMessage?.status === "cancelling"}
                  isQueueFull={chat.isQueueFull}
                  isEditingPending={chat.isEditingPending}
                  pendingMessages={chat.pendingMessages}
                  onEditPending={chat.takePendingForEdit}
                  onRemovePending={chat.removePending}
                  onDiscardEdit={chat.discardEdit}
                  onStopAgent={chat.stopActive}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Derecha: Espaciador reservado para balance de 3 columnas */}
        <div className="flex-1 flex justify-end pointer-events-none" />
      </footer>

      {/* Diálogos exclusivos del propietario */}
      {capabilities.canDuplicateOrDeleteProject && (
        <DeleteProjectDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}

      {/* Componentes del Tutorial Interactivo en el Lienzo */}
      {tutorial.isActive && (
        <>
          <TutorialSpotlightOverlay
            active={Boolean(tutorial.spotlight)}
            targetSelector={tutorial.spotlight?.targetSelector}
            shape={tutorial.spotlight?.shape}
            padding={tutorial.spotlight?.padding}
          />
          <TutorialPetBubble
            visible={true}
            state={tutorial.petState}
            placement={tutorial.petPlacement}
            targetSelector={tutorial.targetSelector}
            message={tutorial.message}
            actionButton={tutorial.actionButton}
          />
          <TutorialExitButton onExit={tutorial.onExit} />
        </>
      )}
      </div>
    </ReactFlowProvider>
  );
}
