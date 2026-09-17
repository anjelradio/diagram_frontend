"use client";

import { useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  type Connection,
  type Edge,
  PanOnScrollMode,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { PROJECT_CANVAS_CONFIG } from "@/features/projects/presentation/constants/canvas.config";
import { InteractiveCanvasGlow } from "@/features/projects/presentation/components/elements/project-canvas/interactive-canvas-glow";
import { DiagramClassNode } from "./diagram-class-node";
import { DiagramRelationEdge } from "./relations/diagram-relation-edge";
import { ManyToManyRelationEdge } from "./relations/many-to-many-relation-edge";
import { UmlRelationMarkers } from "./relations/uml-relation-markers";
import { convertRelationsToEdges } from "./relations/diagram-relation-edge.utils";
import { planRelationCreation } from "@/features/diagram/domain/services/diagram-relation-planner";
import {
  useAppStore,
} from "@/features/shared/presentation/store/app-store";
import type { DiagramClassNodeType } from "@/features/diagram/presentation/store/diagram-slice";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import type { DiagramClassWithAttributes } from "@/features/diagram/domain/entities/diagram-class.entity";
import type { CreateClassPayload } from "@/features/diagram/domain/entities/diagram-operation.entity";
import type {
  DiagramCardinality,
  DiagramRelationHandle,
  DiagramRelationType,
} from "@/features/diagram/domain/entities/diagram-relation.entity";
import { sendRealtimeMessage } from "@/features/realtime/infrastructure/websocket/realtime-socket";
import { RemoteCursorsOverlay } from "@/features/realtime/presentation/components/elements/remote-cursors-overlay";

export type CanvasTool =
  | "cursor"
  | "select"
  | "hand"
  | "create-class"
  | "relation";

const nodeTypes = {
  diagramClass: DiagramClassNode,
};

const edgeTypes = {
  diagramRelation: DiagramRelationEdge,
  manyToManyRelation: ManyToManyRelationEdge,
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
  const relations = useAppStore((s) => s.relations);
  const selectedRelationId = useAppStore((s) => s.selectedRelationId);
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);
  const removeRelationOptimistic = useAppStore(
    (s) => s.removeRelationOptimistic
  );
  const addOptimisticRelationAggregate = useAppStore(
    (s) => s.addOptimisticRelationAggregate
  );
  const selectRelationPreset = useAppStore((s) => s.selectRelationPreset);
  const setRelationDraftSource = useAppStore((s) => s.setRelationDraftSource);
  const canEdit = useAppStore((s) => s.canEdit);
  const classLocks = useAppStore((s) => s.classLocks);

  // React Flow respeta `draggable` por nodo: evita iniciar un arrastre ajeno.
  const interactiveNodes = useMemo(
    () => nodes.map((node) => ({
      ...node,
      draggable: canEdit && !isTemporaryHand && activeTool !== "create-class" && (!classLocks[node.id] || classLocks[node.id]?.userId === viewerId),
    })),
    [activeTool, canEdit, classLocks, isTemporaryHand, nodes, viewerId]
  );

  const edges = useMemo(
    () => convertRelationsToEdges(relations, selectedRelationId),
    [relations, selectedRelationId]
  );

  useEffect(() => {
    setActiveTool(activeTool);
  }, [activeTool, setActiveTool]);

  const { screenToFlowPosition, fitView, setCenter, getNodes } = useReactFlow();
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

  const activeRelationPreset = useAppStore((s) => s.activeRelationPreset);
  const isRelationActive =
    !isTemporaryHand &&
    (activeTool === "relation" || activeRelationPreset !== null);

  const isHandActive = isTemporaryHand || activeTool === "hand";
  const isSelectActive = !isTemporaryHand && activeTool === "select";
  const isCreateClassActive = !isTemporaryHand && activeTool === "create-class";

  // Manejo de inicio de conexión desde un handle
  const handleConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: { nodeId?: string | null; handleId?: string | null }
    ) => {
      if (params.nodeId && params.handleId) {
        // Las relaciones no están bloqueadas por la edición exclusiva de una clase.
        useAppStore.getState().setRelationDraftSource({
          classId: params.nodeId,
          handle: params.handleId as DiagramRelationHandle,
        });
      }
    },
    []
  );

  // Limpieza de borrador si no se finaliza la conexión
  const handleConnectEnd = useCallback(() => {
    setTimeout(() => {
      const state = useAppStore.getState();
      if (state.relationDraftSource) {
        state.setRelationDraftSource(null);
      }
    }, 50);
  }, []);

  // Validación de arista: rechazar autorrelación en la misma clase
  const isValidConnection = useCallback((connection: Edge | Connection) => {
    if (!connection.source || !connection.target) return false;
    if (connection.source === connection.target) {
      appToast.error("Esta primera versión solo conecta clases distintas.");
      return false;
    }
    return true;
  }, []);

  // Manejo de conexión completada entre handles de clases distintas
  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!canEdit || !projectId || !viewerId) return;
      if (!connection.source || !connection.target) return;

      if (connection.source === connection.target) {
        appToast.error("Esta primera versión solo conecta clases distintas.");
        return;
      }

      const state = useAppStore.getState();
      const preset = state.activeRelationPreset;
      const custom = state.customRelationDraft;

      let relationType: DiagramRelationType;
      let sourceCardinality: DiagramCardinality | null = null;
      let targetCardinality: DiagramCardinality | null = null;

      if (preset) {
        relationType = preset.relationType;
        sourceCardinality = preset.sourceCardinality;
        targetCardinality = preset.targetCardinality;
      } else if (custom) {
        relationType = "ASSOCIATION";
        sourceCardinality = custom.sourceCardinality;
        targetCardinality = custom.targetCardinality;
      } else {
        appToast.error("Selecciona un tipo de relación antes de conectar.");
        return;
      }

      // Invariante: una subclase solo puede ser origen de una GENERALIZATION activa
      if (relationType === "GENERALIZATION") {
        const alreadySubclass = state.relations.some(
          (r) =>
            r.relationType === "GENERALIZATION" &&
            r.source.classId === connection.source
        );
        if (alreadySubclass) {
          appToast.error(
            "Una subclase solo puede tener una relación de generalización en esta versión."
          );
          return;
        }
      }

      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      const targetNode = state.nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      const sourceClass: DiagramClassWithAttributes = {
        id: sourceNode.id,
        name: sourceNode.data.name,
        positionX: sourceNode.position.x,
        positionY: sourceNode.position.y,
        attributes: sourceNode.data.attributes || [],
      };

      const targetClass: DiagramClassWithAttributes = {
        id: targetNode.id,
        name: targetNode.data.name,
        positionX: targetNode.position.x,
        positionY: targetNode.position.y,
        attributes: targetNode.data.attributes || [],
      };

      const existingClasses: DiagramClassWithAttributes[] = state.nodes.map(
        (n) => ({
          id: n.id,
          name: n.data.name,
          positionX: n.position.x,
          positionY: n.position.y,
          attributes: n.data.attributes || [],
        })
      );

      const sourceHandle = (connection.sourceHandle ||
        "RIGHT_CENTER") as DiagramRelationHandle;
      const targetHandle = (connection.targetHandle ||
        "LEFT_CENTER") as DiagramRelationHandle;

      const aggregate = planRelationCreation({
        sourceClass,
        targetClass,
        relationType,
        sourceCardinality,
        targetCardinality,
        sourceHandle,
        targetHandle,
        existingClasses,
      });

      try {
        // 1. Encolar durablemente en IndexedDB antes de proyectar
        await diagramOperationQueueRepositoryImpl.enqueue({
          operationId: crypto.randomUUID(),
          viewerId,
          projectId,
          kind: "CREATE_RELATION",
          classId: aggregate.relation.source.classId,
          payload: {
            id: aggregate.relation.id,
            name: aggregate.relation.name,
            relationType: aggregate.relation.relationType,
            source: aggregate.relation.source,
            target: aggregate.relation.target,
            materialization: aggregate.materialization,
          },
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });

        // 2. Proyección optimista atómica en el store
        addOptimisticRelationAggregate(aggregate);

        // 3. Disparar sincronizador
        window.dispatchEvent(new CustomEvent("diagram:process-queue"));

        // 4. Retorno automático a herramienta cursor
        selectRelationPreset(null);
        setRelationDraftSource(null);
        setActiveTool("cursor");
        useAppStore.getState().setRelationPickerOpen(false);
      } catch (err) {
        console.error("Error al crear relación:", err);
        appToast.error("Error al crear la relación.");
      }
    },
    [
      canEdit,
      projectId,
      viewerId,
      addOptimisticRelationAggregate,
      selectRelationPreset,
      setRelationDraftSource,
      setActiveTool,
    ]
  );


  // Cancelación de draft de relación mediante tecla Escape
  useEffect(() => {
    const handleEscapeKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const store = useAppStore.getState();
        if (
          store.relationDraftSource ||
          store.activeTool === "relation" ||
          store.isRelationPickerOpen
        ) {
          e.preventDefault();
          store.cancelRelationCreation();
        }
      }
    };

    window.addEventListener("keydown", handleEscapeKeyDown);
    return () => window.removeEventListener("keydown", handleEscapeKeyDown);
  }, []);

  // Manejo de clic en el lienzo para creación de clase con PK atómica
  const handlePaneClick = async (event: React.MouseEvent) => {
    setSelectedAttribute(null);
    setSelectedRelationId(null);
    const state = useAppStore.getState();
    Object.keys(state.classLocks).forEach((classId) => {
      if (state.classLocks[classId].userId === viewerId) {
        sendRealtimeMessage({ type: "class_lock_release", class_id: classId });
      }
    });
    if (!canEdit || !isCreateClassActive || !projectId || !viewerId) return;

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

  const handlePaneMouseMove = useCallback((event: React.MouseEvent) => {
    if (!canEdit) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    sendRealtimeMessage({ type: "cursor_move", x: position.x, y: position.y });
  }, [canEdit, screenToFlowPosition]);

  const handleSelectionChange = useCallback(({ nodes: selected }: { nodes: DiagramClassNodeType[] }) => {
    if (!canEdit) return;
    const selectedId = selected[0]?.id;
    const state = useAppStore.getState();
    Object.keys(state.classLocks).forEach((classId) => {
      if (classId !== selectedId && state.classLocks[classId].userId === viewerId) {
        sendRealtimeMessage({ type: "class_lock_release", class_id: classId });
      }
    });
    if (selectedId && !state.classLocks[selectedId]) {
      sendRealtimeMessage({ type: "class_lock_acquire", class_id: selectedId });
    }
  }, [canEdit, viewerId]);

  const handleNodeDragStart = useCallback(
    (_event: MouseEvent | TouchEvent, node: DiagramClassNodeType) => {
      if (!canEdit) return;
      const currentLock = useAppStore.getState().classLocks[node.id];
      if (!currentLock || currentLock.userId === viewerId) {
        sendRealtimeMessage({ type: "class_lock_acquire", class_id: node.id });
      }
    },
    [canEdit, viewerId]
  );

  const handleNodeDrag = useCallback(
    (_event: MouseEvent | TouchEvent, node: DiagramClassNodeType) => {
      const lock = useAppStore.getState().classLocks[node.id];
      if (lock && lock.userId !== viewerId) return;
      sendRealtimeMessage({ type: "class_drag", class_id: node.id, x: node.position.x, y: node.position.y });
    },
    [viewerId]
  );

  // Manejo de fin de arrastre de nodo (US2 - Mover)
  const handleNodeDragStop = async (
    _event: MouseEvent | TouchEvent,
    node: DiagramClassNodeType
  ) => {
    if (!projectId || !viewerId) return;
    const lock = useAppStore.getState().classLocks[node.id];
    if (lock && lock.userId !== viewerId) return;

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
      sendRealtimeMessage({
        type: "class_drag",
        class_id: node.id,
        x: node.position.x,
        y: node.position.y,
      });
      const isStillSelected =
        node.selected ||
        getNodes().some((n) => n.id === node.id && n.selected);
      if (!isStillSelected) {
        sendRealtimeMessage({ type: "class_lock_release", class_id: node.id });
      }
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
      if (!canEdit) return;
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
          if (targetAttr.isPrimaryKey || targetAttr.isForeignKey) {
            // La llave primaria o foránea derivada es inmutable y no se elimina manualmente
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

      // Prioridad 2: Si hay una relación seleccionada, eliminarla
      const selectedRelationId = useAppStore.getState().selectedRelationId;
      if (selectedRelationId) {
        e.preventDefault();

        // Eliminación optimista en el cliente (incluye cascada de puente y FK)
        removeRelationOptimistic(selectedRelationId);

        try {
          await diagramOperationQueueRepositoryImpl.enqueue({
            operationId: crypto.randomUUID(),
            viewerId,
            projectId,
            kind: "DELETE_RELATION",
            relationId: selectedRelationId,
            payload: {
              relationId: selectedRelationId,
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            state: "pending",
          });
          window.dispatchEvent(new CustomEvent("diagram:process-queue"));
        } catch (err) {
          console.error("Error al encolar eliminación de relación:", err);
        }
        return;
      }

      // Prioridad 3: Clases seleccionadas (excluyendo las bloqueadas por otro usuario)
      const state = useAppStore.getState();
      const selectedNodes = state.nodes.filter((n) => {
        if (!n.selected) return false;
        const lock = state.classLocks[n.id];
        return !lock || lock.userId === viewerId;
      });
      if (selectedNodes.length === 0) return;

      e.preventDefault();

      // Separar nodos puente (redirigir al agregado N:M) de nodos normales
      const bridgeRelationsToDelete = new Set<string>();
      const regularNodesToDelete: typeof selectedNodes = [];

      for (const node of selectedNodes) {
        const parentRelation = state.relations.find(
          (r) => r.bridge?.classId === node.id
        );
        if (parentRelation) {
          bridgeRelationsToDelete.add(parentRelation.id);
        } else {
          regularNodesToDelete.push(node);
        }
      }

      // 1. Eliminar relaciones N:M cuyos puentes fueron seleccionados
      for (const relId of bridgeRelationsToDelete) {
        removeRelationOptimistic(relId);
        try {
          await diagramOperationQueueRepositoryImpl.enqueue({
            operationId: crypto.randomUUID(),
            viewerId,
            projectId,
            kind: "DELETE_RELATION",
            relationId: relId,
            payload: {
              relationId: relId,
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            state: "pending",
          });
        } catch (err) {
          console.error(
            "Error al encolar eliminación de relación puente:",
            err
          );
        }
      }

      // 2. Eliminar clases normales seleccionadas
      if (regularNodesToDelete.length > 0) {
        const selectedIds = regularNodesToDelete.map((n) => n.id);
        removeNodesOptimistic(selectedIds);

        for (const node of regularNodesToDelete) {
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
            console.error("Error al encolar eliminación de clase:", err);
          }
        }
      }

      window.dispatchEvent(new CustomEvent("diagram:process-queue"));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canEdit,
    projectId,
    viewerId,
    activeTool,
    removeNodesOptimistic,
    removeRelationOptimistic,
    removeAttributeOptimistic,
  ]);

  return (
    <div
      className={cn(
        "w-full h-full relative overflow-hidden bg-[#212224]",
        !canEdit && "cursor-grab active:cursor-grabbing",
        canEdit && (isCreateClassActive || isRelationActive) && "cursor-crosshair",
        canEdit && isHandActive && "cursor-grab active:cursor-grabbing",
        canEdit && isSelectActive && "cursor-default",
        canEdit &&
          !isHandActive &&
          !isSelectActive &&
          !isCreateClassActive &&
          !isRelationActive &&
          "cursor-default"
      )}
    >
      <ReactFlow<DiagramClassNodeType>
        nodes={interactiveNodes}
        nodeTypes={nodeTypes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onNodeDrag={handleNodeDrag}
        onPaneClick={handlePaneClick}
        onPaneMouseMove={handlePaneMouseMove}
        onSelectionChange={handleSelectionChange}
        onConnect={handleConnect}
        onEdgeClick={canEdit ? (_event, edge) => setSelectedRelationId(edge.id) : undefined}
        onNodeClick={canEdit ? () => setSelectedRelationId(null) : undefined}
        minZoom={PROJECT_CANVAS_CONFIG.zoom.min}
        maxZoom={PROJECT_CANVAS_CONFIG.zoom.max}
        defaultViewport={PROJECT_CANVAS_CONFIG.viewport.default}
        translateExtent={PROJECT_CANVAS_CONFIG.extent.translate}
        nodeExtent={PROJECT_CANVAS_CONFIG.extent.node}
        zoomActivationKeyCode={
          PROJECT_CANVAS_CONFIG.shortcuts.zoomActivationKeyCode as unknown as string[]
        }
        panOnDrag={!canEdit ? [0, 1, 2] : isHandActive ? [0, 1, 2] : false}
        selectionOnDrag={canEdit && isSelectActive}
        elementsSelectable={canEdit && !isHandActive && !isCreateClassActive}
        nodesDraggable={canEdit && !isHandActive && !isCreateClassActive}
        panOnScroll={PROJECT_CANVAS_CONFIG.navigation.panOnScroll}
        panOnScrollMode={
          PROJECT_CANVAS_CONFIG.navigation.panOnScrollMode as PanOnScrollMode
        }
        panOnScrollSpeed={PROJECT_CANVAS_CONFIG.navigation.panOnScrollSpeed}
        zoomOnScroll={true}
        zoomOnPinch={true}
        connectionMode={ConnectionMode.Loose}
        nodesConnectable={canEdit && isRelationActive}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        isValidConnection={isValidConnection}
        nodesFocusable={canEdit}
        edgesFocusable={canEdit}
        deleteKeyCode={null}
        selectionKeyCode={null}
        className="transition-colors duration-200"
        proOptions={{ hideAttribution: true }}
      >
        <RemoteCursorsOverlay />
        <Background
          variant={BackgroundVariant.Dots}
          gap={PROJECT_CANVAS_CONFIG.grid.gap}
          size={PROJECT_CANVAS_CONFIG.grid.size}
          color={PROJECT_CANVAS_CONFIG.grid.color}
          bgColor={PROJECT_CANVAS_CONFIG.grid.bgColor}
        />
        <InteractiveCanvasGlow />
        <UmlRelationMarkers />
        {children}
      </ReactFlow>

    </div>
  );
}
