"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  PanOnScrollMode,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { PROJECT_CANVAS_CONFIG } from "@/features/projects/presentation/constants/canvas.config";
import { InteractiveCanvasGlow } from "@/features/projects/presentation/components/elements/project-canvas/interactive-canvas-glow";
import { DiagramClassNode } from "./diagram-class-node";
import {
  useAppStore,
} from "@/features/shared/presentation/store/app-store";
import type { DiagramClassNodeType } from "@/features/diagram/presentation/store/diagram-slice";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import type { DiagramClassWithAttributes } from "@/features/diagram/domain/entities/diagram-class.entity";
import type { CreateClassPayload } from "@/features/diagram/domain/entities/diagram-operation.entity";

export type CanvasTool = "cursor" | "select" | "hand" | "create-class";

const nodeTypes = {
  diagramClass: DiagramClassNode,
};

type DiagramFlowCanvasProps = {
  activeTool: CanvasTool;
  isTemporaryHand: boolean;
  onClassCreated?: () => void;
  children?: ReactNode;
};

export function DiagramFlowCanvas({
  activeTool,
  isTemporaryHand,
  onClassCreated,
  children,
}: DiagramFlowCanvasProps) {
  const nodes = useAppStore((s) => s.nodes);
  const onNodesChange = useAppStore((s) => s.onNodesChange);
  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const addOptimisticClass = useAppStore((s) => s.addOptimisticClass);
  const updateClassPositionOptimistic = useAppStore(
    (s) => s.updateClassPositionOptimistic
  );
  const removeNodesOptimistic = useAppStore((s) => s.removeNodesOptimistic);
  const removeAttributeOptimistic = useAppStore(
    (s) => s.removeAttributeOptimistic
  );
  const setSelectedAttribute = useAppStore((s) => s.setSelectedAttribute);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  useEffect(() => {
    setActiveTool(activeTool);
  }, [activeTool, setActiveTool]);

  const { screenToFlowPosition, fitView, setCenter } = useReactFlow();
  const hasCenteredOnLoadRef = useRef(false);

  // Inicialización de vista: centrado y zoom mínimo al 50% en la carga de la página
  useEffect(() => {
    if (hasCenteredOnLoadRef.current) return;

    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        if (hasCenteredOnLoadRef.current) return;
        hasCenteredOnLoadRef.current = true;
        fitView({
          minZoom: PROJECT_CANVAS_CONFIG.zoom.min,
          maxZoom: PROJECT_CANVAS_CONFIG.zoom.min,
          duration: 0,
        });
      }, 50);
      return () => clearTimeout(timer);
    }

    const emptyTimer = setTimeout(() => {
      if (hasCenteredOnLoadRef.current) return;
      hasCenteredOnLoadRef.current = true;
      setCenter(0, 0, {
        zoom: PROJECT_CANVAS_CONFIG.zoom.min,
        duration: 0,
      });
    }, 120);

    return () => clearTimeout(emptyTimer);
  }, [nodes.length, fitView, setCenter]);

  const isHandActive = isTemporaryHand || activeTool === "hand";
  const isSelectActive = !isTemporaryHand && activeTool === "select";
  const isCreateClassActive = !isTemporaryHand && activeTool === "create-class";

  // Manejo de clic en el lienzo para creación de clase con PK atómica
  const handlePaneClick = async (event: React.MouseEvent) => {
    setSelectedAttribute(null);
    if (!isCreateClassActive || !projectId || !viewerId) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newId = crypto.randomUUID();
    const primaryAttributeId = crypto.randomUUID();

    const createPayload: CreateClassPayload = {
      id: newId,
      name: "Nueva clase",
      positionX: position.x,
      positionY: position.y,
      primaryAttribute: {
        id: primaryAttributeId,
        name: "id",
        dataType: "UUID",
        position: 0,
        isPrimaryKey: true,
        isNullable: false,
      },
    };

    const newClass: DiagramClassWithAttributes = {
      id: newId,
      name: "Nueva clase",
      positionX: position.x,
      positionY: position.y,
      attributes: [
        {
          id: primaryAttributeId,
          name: "id",
          dataType: "UUID",
          position: 0,
          isPrimaryKey: true,
          isNullable: false,
        },
      ],
    };

    try {
      // 1. Persistencia duradera en cola IndexedDB antes del estado optimista
      await diagramOperationQueueRepositoryImpl.enqueue({
        operationId: crypto.randomUUID(),
        viewerId,
        projectId,
        kind: "CREATE",
        classId: newId,
        payload: createPayload,
        createdAt: new Date().toISOString(),
        attempts: 0,
        state: "pending",
      });

      // 2. Aplicación optimista en el lienzo
      addOptimisticClass(newClass);

      // 3. Disparo de sincronización
      window.dispatchEvent(new CustomEvent("diagram:process-queue"));

      // 4. Retorno al puntero
      onClassCreated?.();
    } catch (err) {
      console.error("Error creando clase:", err);
    }
  };

  // Manejo de fin de arrastre de nodo (US2 - Mover)
  const handleNodeDragStop = async (
    _event: MouseEvent | TouchEvent,
    node: DiagramClassNodeType
  ) => {
    if (!projectId || !viewerId) return;

    updateClassPositionOptimistic(node.id, {
      x: node.position.x,
      y: node.position.y,
    });

    try {
      await diagramOperationQueueRepositoryImpl.enqueue({
        operationId: crypto.randomUUID(),
        viewerId,
        projectId,
        kind: "MOVE",
        classId: node.id,
        payload: {
          positionX: node.position.x,
          positionY: node.position.y,
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
        state: "pending",
      });
      window.dispatchEvent(new CustomEvent("diagram:process-queue"));
    } catch (err) {
      console.error("Error moviendo clase:", err);
    }
  };

  // Manejo de eliminación con teclas Delete / Backspace:
  // Prioridad 1: Atributo secundario seleccionado
  // Prioridad 2: Clases seleccionadas bajo la herramienta 'select'
  // Ignora inputs, textareas, contenteditable y diálogos/popovers
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!projectId || !viewerId) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest('[role="dialog"]') ||
          target.closest('[role="popover"]') ||
          target.closest('[data-slot="popover-content"]') ||
          target.closest('[data-slot="dialog"]'))
      ) {
        return;
      }

      // Prioridad 1: Si hay un atributo secundario seleccionado, eliminarlo
      const selectedAttr = useAppStore.getState().selectedAttribute;
      if (selectedAttr) {
        const targetNode = useAppStore
          .getState()
          .nodes.find((n) => n.id === selectedAttr.classId);
        const targetAttr = targetNode?.data.attributes?.find(
          (a) => a.id === selectedAttr.attributeId
        );

        if (targetAttr) {
          if (targetAttr.isPrimaryKey) {
            // La llave primaria es inmutable y no se elimina
            return;
          }

          e.preventDefault();

          // Eliminación optimista en el cliente
          removeAttributeOptimistic(
            selectedAttr.classId,
            selectedAttr.attributeId
          );

          // Encolar operación durable DELETE_ATTRIBUTE en IndexedDB
          try {
            await diagramOperationQueueRepositoryImpl.enqueue({
              operationId: crypto.randomUUID(),
              viewerId,
              projectId,
              kind: "DELETE_ATTRIBUTE",
              classId: selectedAttr.classId,
              payload: {
                attributeId: selectedAttr.attributeId,
              },
              createdAt: new Date().toISOString(),
              attempts: 0,
              state: "pending",
            });
            window.dispatchEvent(new CustomEvent("diagram:process-queue"));
          } catch (err) {
            console.error("Error al encolar eliminación de atributo:", err);
          }
          return;
        }
      }

      // Prioridad 2: Clases seleccionadas bajo la herramienta 'select'
      if (activeTool !== "select") return;

      const selectedNodes = useAppStore
        .getState()
        .nodes.filter((n) => n.selected);
      if (selectedNodes.length === 0) return;

      e.preventDefault();

      const selectedIds = selectedNodes.map((n) => n.id);
      removeNodesOptimistic(selectedIds);

      for (const node of selectedNodes) {
        try {
          await diagramOperationQueueRepositoryImpl.enqueue({
            operationId: crypto.randomUUID(),
            viewerId,
            projectId,
            kind: "DELETE",
            classId: node.id,
            payload: {},
            createdAt: new Date().toISOString(),
            attempts: 0,
            state: "pending",
          });
        } catch (err) {
          console.error("Error al encolar eliminación:", err);
        }
      }

      window.dispatchEvent(new CustomEvent("diagram:process-queue"));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    projectId,
    viewerId,
    activeTool,
    removeNodesOptimistic,
    removeAttributeOptimistic,
  ]);

  return (
    <div
      className={cn(
        "w-full h-full relative overflow-hidden bg-[#212224]",
        isCreateClassActive && "cursor-crosshair",
        isHandActive && "cursor-grab active:cursor-grabbing",
        isSelectActive && "cursor-default",
        !isHandActive && !isSelectActive && !isCreateClassActive && "cursor-default"
      )}
    >
      <ReactFlow<DiagramClassNodeType>
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        minZoom={PROJECT_CANVAS_CONFIG.zoom.min}
        maxZoom={PROJECT_CANVAS_CONFIG.zoom.max}
        defaultViewport={PROJECT_CANVAS_CONFIG.viewport.default}
        translateExtent={PROJECT_CANVAS_CONFIG.extent.translate}
        nodeExtent={PROJECT_CANVAS_CONFIG.extent.node}
        zoomActivationKeyCode={
          PROJECT_CANVAS_CONFIG.shortcuts.zoomActivationKeyCode as unknown as string[]
        }
        panOnDrag={isHandActive ? [0, 1, 2] : false}
        selectionOnDrag={isSelectActive}
        elementsSelectable={!isHandActive && !isCreateClassActive}
        nodesDraggable={!isHandActive && !isCreateClassActive}
        panOnScroll={PROJECT_CANVAS_CONFIG.navigation.panOnScroll}
        panOnScrollMode={
          PROJECT_CANVAS_CONFIG.navigation.panOnScrollMode as PanOnScrollMode
        }
        panOnScrollSpeed={PROJECT_CANVAS_CONFIG.navigation.panOnScrollSpeed}
        zoomOnScroll={true}
        zoomOnPinch={true}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={false}
        deleteKeyCode={null}
        selectionKeyCode={null}
        className="transition-colors duration-200"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={PROJECT_CANVAS_CONFIG.grid.gap}
          size={PROJECT_CANVAS_CONFIG.grid.size}
          color={PROJECT_CANVAS_CONFIG.grid.color}
          bgColor={PROJECT_CANVAS_CONFIG.grid.bgColor}
        />
        <InteractiveCanvasGlow />
        {children}
      </ReactFlow>
    </div>
  );
}
