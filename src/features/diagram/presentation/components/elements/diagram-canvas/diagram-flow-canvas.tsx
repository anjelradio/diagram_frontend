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
  ViewportPortal,
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
import { VertexRelationPopover } from "./relations/vertex-relation-popover";
import { RelationRubberbandOverlay } from "./relations/relation-rubberband-overlay";
import { convertRelationsToEdges } from "./relations/diagram-relation-edge.utils";
import { getHandlePoint } from "./relations/relation-handle-geometry";
import {
  resolveOptimalHandles,
} from "@/features/diagram/domain/services/diagram-relation-planner";
import { createCreateDiagramRelation } from "@/features/diagram/application/use-cases/create-diagram-relation";
import { createDeleteDiagramRelation } from "@/features/diagram/application/use-cases/delete-diagram-relation";
import { createCreateDiagramClass } from "@/features/diagram/application/use-cases/create-diagram-class";
import { createMoveDiagramClass } from "@/features/diagram/application/use-cases/move-diagram-class";
import { createDeleteDiagramClass } from "@/features/diagram/application/use-cases/delete-diagram-class";
import { createDeleteDiagramAttribute } from "@/features/diagram/application/use-cases/delete-diagram-attribute";

import {
  useAppStore,
} from "@/features/shared/presentation/store/app-store";
import type { DiagramClassNodeType } from "@/features/diagram/presentation/store/diagram-slice";
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
  const updateClassPositionOptimistic = useAppStore(
    (s) => s.updateClassPositionOptimistic
  );
  const dispatchDiagramOperation = useAppStore((s) => s.dispatchDiagramOperation);
  const setSelectedAttribute = useAppStore((s) => s.setSelectedAttribute);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const relations = useAppStore((s) => s.relations);
  const selectedRelationId = useAppStore((s) => s.selectedRelationId);
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);
  const selectRelationPreset = useAppStore((s) => s.selectRelationPreset);
  const setRelationDraftSource = useAppStore((s) => s.setRelationDraftSource);
  const canEdit = useAppStore((s) => s.canEdit);
  const classLocks = useAppStore((s) => s.classLocks);
  const agentReservations = useAppStore((s) => s.agentReservations);
  const dragStartPositionsRef = useRef(
    new Map<string, { x: number; y: number }>()
  );

  // React Flow respeta `draggable` por nodo: evita iniciar un arrastre ajeno o reservado por el agente.
  const interactiveNodes = useMemo(
    () =>
      nodes.map((node) => {
        const isReserved = Object.values(agentReservations).some(
          (r) => r.componentId === node.id && r.componentType === "class"
        );
        const lock = classLocks[node.id];
        const isLockedByOther = Boolean(lock && lock.userId !== viewerId);
        return {
          ...node,
          draggable:
            canEdit &&
            !isTemporaryHand &&
            activeTool !== "create-class" &&
            !isLockedByOther &&
            !isReserved,
        };
      }),
    [activeTool, canEdit, classLocks, agentReservations, isTemporaryHand, nodes, viewerId]
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

  const isRelationActive = !isTemporaryHand && activeTool === "relation";
  const relationDraft = useAppStore((s) => s.relationDraft);
  const activeVertexPopover = useAppStore((s) => s.activeVertexPopover);
  const selectSourceOption = useAppStore((s) => s.selectSourceOption);
  const completeAssociativeRelation = useAppStore(
    (s) => s.completeAssociativeRelation
  );
  const closeVertexMenu = useAppStore((s) => s.closeVertexMenu);
  const isPopoverOpen = Boolean(activeVertexPopover);

  // Congelar eventos de scroll y zoom en la ventana mientras el menú de relación esté abierto
  useEffect(() => {
    if (!isPopoverOpen) return;
    const preventWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    window.addEventListener("wheel", preventWheel, { capture: true });
    return () => {
      window.removeEventListener("wheel", preventWheel, { capture: true });
    };
  }, [isPopoverOpen]);

  // Calcula dinámicamente el origen de la línea elástica con precisión matemática
  const rubberbandSourcePoint = useMemo(() => {
    if (!relationDraft?.source) return null;
    const node = nodes.find((n) => n.id === relationDraft.source!.classId);
    if (!node) return relationDraft.source.flowPosition;
    const pt = getHandlePoint(node, relationDraft.source.handle);
    return { x: pt.x, y: pt.y };
  }, [relationDraft, nodes]);

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
        const isReserved = useAppStore
          .getState()
          .isComponentReservedByAgent(params.nodeId, "class");
        if (isReserved) {
          appToast.error("El asistente está utilizando esta clase.");
          return;
        }
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

  // Validación de arista: permitir autorrelación únicamente para ASSOCIATION
  const isValidConnection = useCallback((connection: Edge | Connection) => {
    if (!connection.source || !connection.target) return false;
    const state = useAppStore.getState();
    const isSourceReserved = state.isComponentReservedByAgent(connection.source, "class");
    const isTargetReserved = state.isComponentReservedByAgent(connection.target, "class");
    if (isSourceReserved || isTargetReserved) {
      return false;
    }
    if (connection.source === connection.target) {
      const preset = state.activeRelationPreset;
      const custom = state.customRelationDraft;
      const relType = preset?.relationType ?? (custom ? "ASSOCIATION" : null);

      if (relType && relType !== "ASSOCIATION") {
        appToast.error(
          "Las relaciones recursivas (auto-referenciadas) solo están permitidas para el tipo de relación Asociación."
        );
        return false;
      }
      return true;
    }
    return true;
  }, []);

  // Manejo de conexión completada entre handles
  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!canEdit || !projectId || !viewerId) return;
      if (!connection.source || !connection.target) return;

      const state = useAppStore.getState();
      const isSourceReserved = state.isComponentReservedByAgent(connection.source, "class");
      const isTargetReserved = state.isComponentReservedByAgent(connection.target, "class");
      if (isSourceReserved || isTargetReserved) {
        appToast.error("No se puede conectar una clase reservada por el asistente.");
        return;
      }

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

      if (connection.source === connection.target) {
        if (relationType !== "ASSOCIATION") {
          appToast.error(
            "Las relaciones recursivas (auto-referenciadas) solo están permitidas para el tipo de relación Asociación."
          );
          return;
        }
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

      let sourceHandle = connection.sourceHandle as DiagramRelationHandle | undefined;
      let targetHandle = connection.targetHandle as DiagramRelationHandle | undefined;

      if (!sourceHandle || !targetHandle) {
        const optimal = resolveOptimalHandles(
          { x: sourceNode.position.x, y: sourceNode.position.y },
          { x: targetNode.position.x, y: targetNode.position.y },
          state.relations,
          sourceNode.id,
          targetNode.id
        );
        sourceHandle = sourceHandle || optimal.sourceHandle;
        targetHandle = targetHandle || optimal.targetHandle;
      }

      if (sourceNode.id === targetNode.id && sourceHandle === targetHandle) {
        const optimal = resolveOptimalHandles(
          { x: sourceNode.position.x, y: sourceNode.position.y },
          { x: targetNode.position.x, y: targetNode.position.y },
          state.relations,
          sourceNode.id,
          targetNode.id
        );
        sourceHandle = optimal.sourceHandle;
        targetHandle = optimal.targetHandle;
      }



      try {
        await createCreateDiagramRelation({ dispatch: dispatchDiagramOperation })({
          viewerId,
          projectId,
          sourceClass,
          targetClass,
          relationType,
          sourceCardinality,
          targetCardinality,
          sourceHandle,
          targetHandle,
          existingClasses,
        });

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
      dispatchDiagramOperation,
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
          store.relationDraft ||
          store.activeVertexPopover ||
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
    if (state.relationDraft || state.activeVertexPopover) {
      state.cancelRelationCreation();
    }
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

    try {
      await createCreateDiagramClass({ dispatch: dispatchDiagramOperation })(
        viewerId,
        projectId,
        createPayload
      );

      // 4. Retorno al puntero
      onClassCreated?.();
    } catch (err) {
      console.error("Error creando clase:", err);
    }
  };

  const handlePaneMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!canEdit) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      sendRealtimeMessage({ type: "cursor_move", x: position.x, y: position.y });

      const store = useAppStore.getState();
      if (store.relationDraft?.phase === "tracking_cursor") {
        store.updateRubberbandCursor(position);
      }
    },
    [canEdit, screenToFlowPosition]
  );


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
      const isReserved = useAppStore.getState().isComponentReservedByAgent(node.id, "class");
      if (isReserved) return;
      const currentNode = useAppStore.getState().nodes.find((item) => item.id === node.id);
      if (currentNode) {
        dragStartPositionsRef.current.set(node.id, { ...currentNode.position });
      }
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
    const isReserved = useAppStore.getState().isComponentReservedByAgent(node.id, "class");
    if (isReserved) {
      const startPosition = dragStartPositionsRef.current.get(node.id);
      if (startPosition) {
        updateClassPositionOptimistic(node.id, startPosition);
      }
      dragStartPositionsRef.current.delete(node.id);
      return;
    }
    const lock = useAppStore.getState().classLocks[node.id];
    if (lock && lock.userId !== viewerId) return;

    try {
      await createMoveDiagramClass({ dispatch: dispatchDiagramOperation })(
        viewerId,
        projectId,
        node.id,
        node.position.x,
        node.position.y
      );
      dragStartPositionsRef.current.delete(node.id);
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
      const startPosition = dragStartPositionsRef.current.get(node.id);
      if (startPosition) {
        updateClassPositionOptimistic(node.id, startPosition);
      }
      dragStartPositionsRef.current.delete(node.id);
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
        const isClassReserved = useAppStore
          .getState()
          .isComponentReservedByAgent(selectedAttr.classId, "class");
        if (isClassReserved) {
          appToast.error("La clase está reservada por el asistente.");
          return;
        }

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

          try {
            await createDeleteDiagramAttribute({ dispatch: dispatchDiagramOperation })(
              viewerId,
              projectId,
              selectedAttr.classId,
              { attributeId: selectedAttr.attributeId }
            );
          } catch (err) {
            console.error("Error al encolar eliminación de atributo:", err);
          }
          return;
        }
      }

      // Prioridad 2: Si hay una relación seleccionada, eliminarla
      const state = useAppStore.getState();
      const selectedRelationId = state.selectedRelationId;
      if (selectedRelationId) {
        const rel = state.relations.find((r) => r.id === selectedRelationId);
        const isRelReserved = state.isComponentReservedByAgent(selectedRelationId, "relation");
        const isSourceReserved = rel ? state.isComponentReservedByAgent(rel.source.classId, "class") : false;
        const isTargetReserved = rel ? state.isComponentReservedByAgent(rel.target.classId, "class") : false;
        const isBridgeReserved = rel?.bridge ? state.isComponentReservedByAgent(rel.bridge.classId, "class") : false;
        if (isRelReserved || isSourceReserved || isTargetReserved || isBridgeReserved) {
          appToast.error("No se puede eliminar una relación reservada por el asistente.");
          return;
        }

        e.preventDefault();

        try {
          await createDeleteDiagramRelation({ dispatch: dispatchDiagramOperation })(
            viewerId,
            projectId,
            selectedRelationId
          );
        } catch (err) {
          console.error("Error al encolar eliminación de relación:", err);
        }
        return;
      }

      // Prioridad 3: Clases seleccionadas (excluyendo las bloqueadas por otro usuario o reservadas por el agente)
      const selectedNodes = state.nodes.filter((n) => {
        if (!n.selected) return false;
        const lock = state.classLocks[n.id];
        const isReserved = state.isComponentReservedByAgent(n.id, "class");
        return (!lock || lock.userId === viewerId) && !isReserved;
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
        try {
          await createDeleteDiagramRelation({ dispatch: dispatchDiagramOperation })(
            viewerId,
            projectId,
            relId
          );
        } catch (err) {
          console.error(
            "Error al encolar eliminación de relación puente:",
            err
          );
        }
      }

      // 2. Eliminar clases normales seleccionadas
      if (regularNodesToDelete.length > 0) {
        for (const node of regularNodesToDelete) {
          try {
            await createDeleteDiagramClass({ dispatch: dispatchDiagramOperation })(
              viewerId,
              projectId,
              node.id
            );
          } catch (err) {
            console.error("Error al encolar eliminación de clase:", err);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canEdit,
    projectId,
    viewerId,
    activeTool,
    dispatchDiagramOperation,
  ]);

  return (
    <div
      onMouseMove={handlePaneMouseMove}
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
        panOnDrag={
          isPopoverOpen
            ? false
            : !canEdit
              ? [0, 1, 2]
              : isHandActive
                ? [0, 1, 2]
                : false
        }
        selectionOnDrag={!isPopoverOpen && canEdit && isSelectActive}
        elementsSelectable={!isPopoverOpen && canEdit && !isHandActive && !isCreateClassActive}
        nodesDraggable={!isPopoverOpen && canEdit && !isHandActive && !isCreateClassActive}
        panOnScroll={!isPopoverOpen && PROJECT_CANVAS_CONFIG.navigation.panOnScroll}
        panOnScrollMode={
          PROJECT_CANVAS_CONFIG.navigation.panOnScrollMode as PanOnScrollMode
        }
        panOnScrollSpeed={PROJECT_CANVAS_CONFIG.navigation.panOnScrollSpeed}
        zoomOnScroll={!isPopoverOpen}
        zoomOnPinch={!isPopoverOpen}
        preventScrolling={isPopoverOpen}
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
        {/* Línea elástica interactiva continua al cursor */}
        {relationDraft &&
          relationDraft.phase === "tracking_cursor" &&
          relationDraft.source &&
          relationDraft.currentCursorPosition && (
            <ViewportPortal>
              <RelationRubberbandOverlay
                sourcePoint={
                  rubberbandSourcePoint ?? relationDraft.source.flowPosition
                }
                currentPoint={relationDraft.currentCursorPosition}
                relationType={relationDraft.selectedRelationType}
                sourceCardinality={relationDraft.sourceCardinality}
                sourceHandle={relationDraft.source.handle}
              />
            </ViewportPortal>
          )}
        {children}
      </ReactFlow>

      {/* Menú Contextual de Vértice (Origen / Destino) */}
      {activeVertexPopover && relationDraft && (
        <VertexRelationPopover
          anchor={activeVertexPopover}
          step={activeVertexPopover.step}
          onSelectOption={(option) => {
            if (activeVertexPopover.step === "source") {
              selectSourceOption(option);
            } else if (option.cardinality) {
              void completeAssociativeRelation(option.cardinality);
            }
          }}
          onClose={closeVertexMenu}
        />
      )}
    </div>
  );
}

