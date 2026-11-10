import { applyNodeChanges, type Node, type NodeChange } from "@xyflow/react";
import type { StateCreator } from "zustand";
import type { DiagramAttribute } from "../../domain/entities/diagram-attribute.entity.ts";
import type {
  DiagramClass,
  DiagramClassWithAttributes,
  DiagramSnapshot,
} from "../../domain/entities/diagram-class.entity.ts";
import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity.ts";
import type { DispatchDiagramOperationCommand } from "../../application/ports/diagram-operation-dispatcher.port.ts";
import type { DiagramOperationDispatcherPort } from "../../application/ports/diagram-operation-dispatcher.port.ts";
import { createCreateDiagramRelation } from "../../application/use-cases/create-diagram-relation.ts";

import type {
  DiagramCardinality,
  DiagramRelation,
  DiagramRelationHandle,
  RelationPreset,
  RelationCreationDraft,
  VertexPopoverAnchor,
  VertexOptionItem,
} from "../../domain/entities/diagram-relation.entity.ts";
import {
  type PlannedRelationAggregate,
} from "../../domain/services/diagram-relation-planner.ts";
import {
  projectDiagramOperation,
  projectDiagramOperations,
} from "./diagram-operation-projector.ts";


export type DiagramClassNodeData = {
  id: string;
  name: string;
  attributes: DiagramAttribute[];
};

export type DiagramClassNodeType = Node<DiagramClassNodeData, "diagramClass">;

export type SyncStatus = "idle" | "pending" | "blocked";

export type CanvasTool = "cursor" | "select" | "hand" | "create-class" | "relation";

export type SelectedAttribute = {
  classId: string;
  attributeId: string;
} | null;

/**
 * Slice de Zustand para el feature de Diagrama.
 * Controla el contexto, nodos, atributos y sincronización del lienzo.
 */
export type DiagramSlice = {
  projectId: string | null;
  viewerId: string | null;
  canEdit: boolean;
  isHydrated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  nodes: DiagramClassNodeType[];
  selectedAttribute: SelectedAttribute;
  activeTool: CanvasTool;
  relations: DiagramRelation[];
  activeRelationPreset: RelationPreset | null;
  customRelationDraft: {
    sourceCardinality: DiagramCardinality;
    targetCardinality: DiagramCardinality;
  } | null;
  relationDraftSource: {
    classId: string;
    handle: DiagramRelationHandle;
  } | null;
  selectedRelationId: string | null;
  isRelationPickerOpen: boolean;

  /** Borrador de creación interactiva de relaciones en 2 pasos */
  relationDraft: RelationCreationDraft | null;
  /** Ancla activa para renderizar el menú contextual flotante de vértice */
  activeVertexPopover: VertexPopoverAnchor | null;

  setDiagramContext: (
    projectId: string,
    viewerId: string,
    canEdit: boolean
  ) => void;
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
  setActiveTool: (tool: CanvasTool) => void;
  setRelationPickerOpen: (isOpen: boolean) => void;
  selectRelationPreset: (preset: RelationPreset | null) => void;
  setCustomRelationDraft: (
    draft: {
      sourceCardinality: DiagramCardinality;
      targetCardinality: DiagramCardinality;
    } | null
  ) => void;
  setRelationDraftSource: (
    source: {
      classId: string;
      handle: DiagramRelationHandle;
    } | null
  ) => void;
  setSelectedRelationId: (id: string | null) => void;
  cancelRelationCreation: () => void;

  /** Acciones del flujo interactivo de relaciones */
  openVertexMenu: (anchor: VertexPopoverAnchor) => void;
  closeVertexMenu: () => void;
  selectSourceOption: (option: VertexOptionItem) => void;
  updateRubberbandCursor: (cursorPosition: { x: number; y: number }) => void;
  completeAssociativeRelation: (targetCardinality: DiagramCardinality) => Promise<void>;
  completeStructuralRelation: (
    targetClassId: string,
    targetHandle: DiagramRelationHandle
  ) => Promise<void>;

  setRelations: (relations: DiagramRelation[]) => void;
  addOptimisticRelation: (relation: DiagramRelation) => void;
  addOptimisticRelationAggregate: (aggregate: PlannedRelationAggregate) => void;
  renameRelationOptimistic: (relationId: string, name: string) => void;
  removeRelationOptimistic: (relationId: string) => void;
  hydrateSnapshot: (
    snapshot: DiagramSnapshot,
    pendingOps?: DiagramOperation[]
  ) => void;
  applyDiagramOperation: (operation: DiagramOperation) => void;
  dispatchDiagramOperation: (
    operation: DispatchDiagramOperationCommand
  ) => Promise<DiagramOperation>;
  onNodesChange: (changes: NodeChange<DiagramClassNodeType>[]) => void;
  addOptimisticClass: (newClass: DiagramClassWithAttributes | DiagramClass) => void;
  updateClassNameOptimistic: (id: string, name: string) => void;
  updateClassPositionOptimistic: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  removeNodesOptimistic: (ids: string[]) => void;
  addAttributeOptimistic: (classId: string, attribute: DiagramAttribute) => void;
  updateAttributeOptimistic: (
    classId: string,
    attributeId: string,
    patch: Partial<DiagramAttribute>
  ) => void;
  repositionAttributeOptimistic: (
    classId: string,
    attributeId: string,
    targetPosition: number
  ) => void;
  removeAttributeOptimistic: (classId: string, attributeId: string) => void;
  setSelectedAttribute: (selection: SelectedAttribute) => void;
  applyRemoteMutation: (operationType: string, data: Record<string, unknown>) => void;
};

export const createDiagramSlice = (
  dispatcher: DiagramOperationDispatcherPort
): StateCreator<DiagramSlice, [], [], DiagramSlice> => (set, get) => ({
  projectId: null,
  viewerId: null,
  canEdit: false,
  isHydrated: false,
  syncStatus: "idle",
  syncError: null,
  nodes: [],
  selectedAttribute: null,
  activeTool: "cursor",
  relations: [],
  activeRelationPreset: null,
  customRelationDraft: null,
  relationDraftSource: null,
  selectedRelationId: null,
  isRelationPickerOpen: false,

  relationDraft: null,
  activeVertexPopover: null,

  setDiagramContext: (projectId, viewerId, canEdit) =>
    set((state) => ({
      projectId,
      viewerId,
      canEdit,
      ...(!canEdit
        ? {
            activeRelationPreset: null,
            relationDraftSource: null,
            customRelationDraft: null,
            relationDraft: null,
            activeVertexPopover: null,
            activeTool:
              state.activeTool === "relation" ? "cursor" : state.activeTool,
          }
        : {}),
    })),

  setSyncStatus: (status, error = null) =>
    set({ syncStatus: status, syncError: error }),

  setActiveTool: (activeTool) =>
    set({
      activeTool,
      ...(activeTool !== "relation"
        ? {
            activeRelationPreset: null,
            relationDraftSource: null,
            customRelationDraft: null,
            relationDraft: null,
            activeVertexPopover: null,
          }
        : {}),
    }),


  setSelectedAttribute: (selectedAttribute) =>
    set({ selectedAttribute }),

  applyRemoteMutation: (operationType, data) => {
    set((state) => {
      const classId = String(data.class_id ?? "");
      const attributeId = String(data.attribute_id ?? data.id ?? "");
      const normalizeAttr = (raw: Record<string, unknown>): DiagramAttribute => ({
        id: String(raw.id || raw.attribute_id || ""),
        classId: raw.class_id ? String(raw.class_id) : raw.classId ? String(raw.classId) : undefined,
        name: String(raw.name || ""),
        dataType: (raw.data_type ?? raw.dataType ?? null) as DiagramAttribute["dataType"],
        position: Number(raw.position ?? 0),
        isPrimaryKey: Boolean(raw.is_primary_key ?? raw.isPrimaryKey),
        isNullable: Boolean(raw.is_nullable ?? raw.isNullable ?? true),
        isForeignKey: Boolean(raw.is_foreign_key ?? raw.isForeignKey),
        referencedClassId: (raw.referenced_class_id ?? raw.referencedClassId ?? null) as string | null,
        relationId: (raw.relation_id ?? raw.relationId ?? null) as string | null,
      });
      const applyMaterializedClasses = (nodes: typeof state.nodes): DiagramClassNodeType[] => {
        const snapshots = Array.isArray(data.materialized_classes)
          ? (data.materialized_classes as Record<string, unknown>[])
          : [];
        return snapshots.reduce<DiagramClassNodeType[]>((currentNodes, snapshot) => {
          const snapshotId = String(snapshot.id ?? "");
          if (!snapshotId) return currentNodes;
          const attributes = Array.isArray(snapshot.attributes)
            ? (snapshot.attributes as Record<string, unknown>[]).map(normalizeAttr)
            : [];
          const existing = currentNodes.find((node) => node.id === snapshotId);
          if (!existing) {
            return [
              ...currentNodes,
              {
                id: snapshotId,
                type: "diagramClass" as const,
                position: {
                  x: Number(snapshot.position_x ?? 0),
                  y: Number(snapshot.position_y ?? 0),
                },
                data: { id: snapshotId, name: String(snapshot.name ?? ""), attributes },
              } as DiagramClassNodeType,
            ];
          }

          const currentAttributes = existing.data.attributes || [];
          const mergedAttributes = currentAttributes.filter(
            (attribute) => !attributes.some((incoming) => incoming.id === attribute.id)
          );
          return currentNodes.map((node) => node.id !== snapshotId ? node : {
            ...node,
            data: {
              ...node.data,
              attributes: [...mergedAttributes, ...attributes].sort((left, right) => left.position - right.position),
            },
          });
        }, nodes);
      };
      const removeMaterializedEntities = (nodes: typeof state.nodes) => {
        const removedClassIds = new Set(
          Array.isArray(data.removed_class_ids) ? data.removed_class_ids.map(String) : []
        );
        const removedAttributeIds = new Set(
          Array.isArray(data.removed_attribute_ids) ? data.removed_attribute_ids.map(String) : []
        );
        return nodes
          .filter((node) => !removedClassIds.has(node.id))
          .map((node) => ({
            ...node,
            data: {
              ...node.data,
              attributes: (node.data.attributes || []).filter((attribute) => !removedAttributeIds.has(attribute.id)),
            },
          }));
      };

      if (operationType === "MOVE_CLASS") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, position: { x: Number(data.position_x ?? 0), y: Number(data.position_y ?? 0) } } : n) };
      if (operationType === "RENAME_CLASS") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, data: { ...n.data, name: String(data.name) } } : n) };
      if (operationType === "DELETE_CLASS") return { nodes: state.nodes.filter((n) => n.id !== classId), relations: state.relations.filter((r) => r.source.classId !== classId && r.target.classId !== classId) };
      if (operationType === "CREATE_CLASS") {
        const rawAttrs = Array.isArray(data.attributes) ? (data.attributes as Record<string, unknown>[]) : [];
        const normalizedAttrs = rawAttrs.map(normalizeAttr);
        return {
          nodes: [
            ...state.nodes.filter((n) => n.id !== String(data.id)),
            {
              id: String(data.id),
              type: "diagramClass",
              position: { x: Number(data.position_x ?? 0), y: Number(data.position_y ?? 0) },
              data: {
                id: String(data.id),
                name: String(data.name),
                attributes: normalizedAttrs,
              },
            },
          ],
        };
      }
      if (operationType === "CREATE_ATTRIBUTE") {
        const newAttr = normalizeAttr(data);
        return {
          nodes: state.nodes.map((n) => {
            if (n.id !== classId) return n;
            const current = (n.data.attributes || []).filter((a) => a.id !== newAttr.id);
            return {
              ...n,
              data: {
                ...n.data,
                attributes: [...current, newAttr].sort((a, b) => a.position - b.position),
              },
            };
          }),
        };
      }
      if (operationType === "UPDATE_ATTRIBUTE") {
        return {
          nodes: state.nodes.map((n) => {
            if (n.id !== classId) return n;
            return {
              ...n,
              data: {
                ...n.data,
                attributes: (n.data.attributes || []).map((a) => {
                  if (a.id !== attributeId) return a;
                  return {
                    ...a,
                    ...(data.name !== undefined ? { name: String(data.name) } : {}),
                    ...(data.data_type !== undefined || data.dataType !== undefined
                      ? { dataType: (data.data_type ?? data.dataType) as DiagramAttribute["dataType"] }
                      : {}),
                    ...(data.is_nullable !== undefined || data.isNullable !== undefined
                      ? { isNullable: Boolean(data.is_nullable ?? data.isNullable) }
                      : {}),
                  };
                }),
              },
            };
          }),
        };
      }
      if (operationType === "REPOSITION_ATTRIBUTE") {
        const targetPosition = Number(data.position ?? 1);
        return {
          nodes: state.nodes.map((node) => {
            if (node.id !== classId) return node;
            const currentAttrs = node.data.attributes || [];
            const pk = currentAttrs.find((a) => a.isPrimaryKey);
            const moving = currentAttrs.find((a) => a.id === attributeId);
            if (!moving) return node;

            const otherSecondaries = currentAttrs
              .filter((a) => !a.isPrimaryKey && a.id !== attributeId)
              .sort((a, b) => a.position - b.position);

            const targetIndex = Math.max(
              0,
              Math.min(targetPosition - 1, otherSecondaries.length)
            );
            otherSecondaries.splice(targetIndex, 0, { ...moving, position: targetPosition });

            const updatedSecondaries = otherSecondaries.map((attr, idx) => ({
              ...attr,
              position: idx + 1,
            }));

            const nextAttrs = pk ? [pk, ...updatedSecondaries] : updatedSecondaries;
            return {
              ...node,
              data: {
                ...node.data,
                attributes: nextAttrs,
              },
            };
          }),
        };
      }
      if (operationType === "DELETE_ATTRIBUTE") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, data: { ...n.data, attributes: (n.data.attributes || []).filter((a) => a.id !== attributeId) } } : n) };
      if (operationType === "RENAME_RELATION") return { relations: state.relations.map((r) => r.id === String(data.relation_id) ? { ...r, name: String(data.name) } : r) };
      if (operationType === "DELETE_RELATION") {
        const nodes = removeMaterializedEntities(applyMaterializedClasses(state.nodes));
        return {
          nodes,
          relations: state.relations.filter((relation) => relation.id !== String(data.relation_id)),
        };
      }
      if (operationType === "CREATE_RELATION") {
        const source = (data.source || {}) as Record<string, unknown>;
        const target = (data.target || {}) as Record<string, unknown>;
        const bridge = data.bridge as Record<string, unknown> | null | undefined;
        const relation = {
          id: String(data.id), name: String(data.name || ""), relationType: String(data.relation_type || data.relationType),
          source: { classId: String(source.class_id || source.classId), handle: String(source.handle), cardinality: source.cardinality ?? null },
          target: { classId: String(target.class_id || target.classId), handle: String(target.handle), cardinality: target.cardinality ?? null },
          bridge: bridge?.class_id
            ? { classId: String(bridge.class_id), handle: String(bridge.handle) }
            : null,
        } as unknown as DiagramRelation;
        return {
          nodes: applyMaterializedClasses(state.nodes),
          relations: [...state.relations.filter((item) => item.id !== relation.id), relation],
        };
      }
      return {};
    });
  },

  setRelationPickerOpen: (isRelationPickerOpen) =>
    set({ isRelationPickerOpen }),

  selectRelationPreset: (activeRelationPreset) =>
    set({
      activeRelationPreset,
      activeTool: activeRelationPreset ? "relation" : "cursor",
      relationDraftSource: null,
      isRelationPickerOpen: false,
    }),

  setCustomRelationDraft: (customRelationDraft) =>
    set({ customRelationDraft }),

  setRelationDraftSource: (relationDraftSource) =>
    set({ relationDraftSource }),

  setSelectedRelationId: (selectedRelationId) =>
    set({ selectedRelationId }),

  cancelRelationCreation: () => {
    set((state) => ({
      activeTool: state.activeTool === "relation" ? "cursor" : state.activeTool,
      activeRelationPreset: null,
      relationDraftSource: null,
      customRelationDraft: null,
      isRelationPickerOpen: false,
      relationDraft: null,
      activeVertexPopover: null,
    }));
  },

  openVertexMenu: (anchor: VertexPopoverAnchor) => {
    if (anchor.step === "source") {
      set({
        activeVertexPopover: anchor,
        relationDraft: {
          phase: "source_popover_open",
          source: {
            classId: anchor.classId,
            handle: anchor.handleId,
            flowPosition: anchor.flowPosition,
          },
          selectedRelationType: null,
          sourceCardinality: null,
          target: null,
          targetCardinality: null,
          currentCursorPosition: anchor.flowPosition,
          activePopover: anchor,
        },
      });
    } else {
      set((state) => ({
        activeVertexPopover: anchor,
        relationDraft: state.relationDraft
          ? {
              ...state.relationDraft,
              phase: "target_popover_open",
              target: {
                classId: anchor.classId,
                handle: anchor.handleId,
                flowPosition: anchor.flowPosition,
              },
              activePopover: anchor,
            }
          : null,
      }));
    }
  },

  closeVertexMenu: () => {
    set((state) => {
      if (!state.relationDraft) {
        return { activeVertexPopover: null };
      }
      if (state.relationDraft.phase === "source_popover_open") {
        return {
          activeVertexPopover: null,
          relationDraft: null,
        };
      }
      if (state.relationDraft.phase === "target_popover_open") {
        return {
          activeVertexPopover: null,
          relationDraft: {
            ...state.relationDraft,
            phase: "tracking_cursor",
            target: null,
            activePopover: null,
          },
        };
      }
      return { activeVertexPopover: null };
    });
  },

  selectSourceOption: (option: VertexOptionItem) => {
    set((state) => {
      if (!state.relationDraft?.source) return {};
      return {
        activeVertexPopover: null,
        relationDraft: {
          ...state.relationDraft,
          phase: "tracking_cursor",
          selectedRelationType: option.relationType,
          sourceCardinality: option.cardinality ?? null,
          activePopover: null,
        },
      };
    });
  },

  updateRubberbandCursor: (cursorPosition: { x: number; y: number }) => {
    set((state) => {
      if (!state.relationDraft || state.relationDraft.phase !== "tracking_cursor") {
        return {};
      }
      return {
        relationDraft: {
          ...state.relationDraft,
          currentCursorPosition: cursorPosition,
        },
      };
    });
  },

  completeAssociativeRelation: async (targetCardinality: DiagramCardinality) => {
    const state = get();
    const draft = state.relationDraft;
    if (!draft || !draft.source || !draft.target) return;

    const sourceNode = state.nodes.find((n) => n.id === draft.source!.classId);
    const targetNode = state.nodes.find((n) => n.id === draft.target!.classId);
    if (!sourceNode || !targetNode) {
      set({ relationDraft: null, activeVertexPopover: null });
      return;
    }

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

    const existingClasses: DiagramClass[] = state.nodes.map((n) => ({
      id: n.id,
      name: n.data.name,
      positionX: n.position.x,
      positionY: n.position.y,
    }));

    if (state.projectId && state.viewerId) {
      try {
        await createCreateDiagramRelation({ dispatch: state.dispatchDiagramOperation })({
          viewerId: state.viewerId,
          projectId: state.projectId,
          sourceClass,
          targetClass,
          relationType: "ASSOCIATION",
          sourceCardinality: draft.sourceCardinality,
          targetCardinality,
          sourceHandle: draft.source.handle,
          targetHandle: draft.target.handle,
          existingClasses,
        });
      } catch (err) {
        console.error("Error encolando creación de relación asociativa:", err);
        return;
      }
    }
    set({
      relationDraft: null,
      activeVertexPopover: null,
    });
  },

  completeStructuralRelation: async (
    targetClassId: string,
    targetHandle: DiagramRelationHandle
  ) => {
    const state = get();
    const draft = state.relationDraft;
    if (!draft || !draft.source) return;

    if (draft.source.classId === targetClassId) {
      return;
    }

    const sourceNode = state.nodes.find((n) => n.id === draft.source!.classId);
    const targetNode = state.nodes.find((n) => n.id === targetClassId);
    if (!sourceNode || !targetNode) {
      set({ relationDraft: null, activeVertexPopover: null });
      return;
    }

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

    const existingClasses: DiagramClass[] = state.nodes.map((n) => ({
      id: n.id,
      name: n.data.name,
      positionX: n.position.x,
      positionY: n.position.y,
    }));

    if (state.projectId && state.viewerId) {
      try {
        await createCreateDiagramRelation({ dispatch: state.dispatchDiagramOperation })({
          viewerId: state.viewerId,
          projectId: state.projectId,
          sourceClass,
          targetClass,
          relationType: draft.selectedRelationType || "GENERALIZATION",
          sourceHandle: draft.source.handle,
          targetHandle,
          existingClasses,
        });
      } catch (err) {
        console.error("Error encolando creación de relación estructural:", err);
        return;
      }
    }
    set({
      relationDraft: null,
      activeVertexPopover: null,
    });
  },


  setRelations: (relations) => set({ relations }),

  addOptimisticRelation: (relation) =>
    set((state) => ({ relations: [...state.relations, relation] })),

  renameRelationOptimistic: (relationId, name) =>
    set((state) => ({
      relations: state.relations.map((r) =>
        r.id === relationId ? { ...r, name } : r
      ),
    })),

  removeRelationOptimistic: (relationId) =>
    set((state) => {
      const snapshot: DiagramSnapshot = {
        classes: state.nodes.map((n) => ({
          id: n.id,
          name: n.data.name,
          positionX: n.position.x,
          positionY: n.position.y,
          attributes: n.data.attributes || [],
        })),
        relations: state.relations,
      };

      const projected = projectDiagramOperation(snapshot, {
        operationId: "optimistic-delete-rel",
        viewerId: state.viewerId || "",
        projectId: state.projectId || "",
        sequence: 0,
        kind: "DELETE_RELATION",
        relationId,
        payload: { relationId },
        createdAt: new Date().toISOString(),
        attempts: 0,
        state: "pending",
      });

      const nextNodes: DiagramClassNodeType[] = projected.classes.map((c) => {
        const existingNode = state.nodes.find((n) => n.id === c.id);
        return {
          id: c.id,
          type: "diagramClass",
          position: { x: c.positionX, y: c.positionY },
          selected: existingNode?.selected,
          data: {
            id: c.id,
            name: c.name,
            attributes: [...(c.attributes || [])].sort(
              (a, b) => a.position - b.position
            ),
          },
        };
      });

      return {
        selectedRelationId:
          state.selectedRelationId === relationId ? null : state.selectedRelationId,
        nodes: nextNodes,
        relations: projected.relations,
      };
    }),

  addOptimisticRelationAggregate: (aggregate) => {
    set((state) => {
      let nextNodes = state.nodes;

      if (aggregate.bridgeClass) {
        const bridgeNode: DiagramClassNodeType = {
          id: aggregate.bridgeClass.id,
          type: "diagramClass",
          position: {
            x: aggregate.bridgeClass.positionX,
            y: aggregate.bridgeClass.positionY,
          },
          data: {
            id: aggregate.bridgeClass.id,
            name: aggregate.bridgeClass.name,
            attributes: [...aggregate.bridgeClass.attributes],
          },
        };
        nextNodes = [...nextNodes, bridgeNode];
      }

      if (aggregate.foreignKeyAttribute) {
        const fk = aggregate.foreignKeyAttribute;
        nextNodes = nextNodes.map((node) => {
          if (node.id !== fk.classId) return node;
          const currentAttrs = node.data.attributes || [];
          const updatedAttrs = [...currentAttrs, fk].sort(
            (a, b) => a.position - b.position
          );
          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttrs,
            },
          };
        });
      }

      return {
        nodes: nextNodes,
        relations: [...state.relations, aggregate.relation],
        activeRelationPreset: null,
        relationDraftSource: null,
        customRelationDraft: null,
        activeTool: "cursor" as CanvasTool,
      };
    });
  },

  hydrateSnapshot: (snapshot, pendingOps = []) => {
    const projected = projectDiagramOperations(snapshot, pendingOps);

    set((state) => {
      const nodes: DiagramClassNodeType[] = projected.classes.map((c) => {
        const existingNode = state.nodes.find((n) => n.id === c.id);
        return {
          id: c.id,
          type: "diagramClass",
          position: { x: c.positionX, y: c.positionY },
          selected: existingNode?.selected,
          data: {
            id: c.id,
            name: c.name,
            attributes: [...(c.attributes || [])].sort(
              (a, b) => a.position - b.position
            ),
          },
        };
      });

      return {
        nodes,
        relations: [...(projected.relations || [])],
        isHydrated: true,
      };
    });
  },

  applyDiagramOperation: (operation) => {
    const current = get();
    const projected = projectDiagramOperation(
      {
        classes: current.nodes.map((node) => ({
          id: node.id,
          name: node.data.name,
          positionX: node.position.x,
          positionY: node.position.y,
          attributes: node.data.attributes,
        })),
        relations: current.relations,
      },
      operation
    );

    set((state) => ({
      nodes: projected.classes.map((cls) => {
        const existingNode = state.nodes.find((node) => node.id === cls.id);
        return {
          id: cls.id,
          type: "diagramClass",
          position: { x: cls.positionX, y: cls.positionY },
          selected: existingNode?.selected,
          data: {
            id: cls.id,
            name: cls.name,
            attributes: [...(cls.attributes || [])].sort(
              (a, b) => a.position - b.position
            ),
          },
        };
      }),
      relations: projected.relations,
    }));
  },

  dispatchDiagramOperation: (operation) => dispatcher.dispatch(operation),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  addOptimisticClass: (newClass) => {
    const rawAttrs = "attributes" in newClass && Array.isArray(newClass.attributes) ? newClass.attributes : [];
    const newNode: DiagramClassNodeType = {
      id: newClass.id,
      type: "diagramClass",
      position: { x: newClass.positionX, y: newClass.positionY },
      data: {
        id: newClass.id,
        name: newClass.name,
        attributes: [...rawAttrs].sort((a, b) => a.position - b.position),
      },
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  updateClassNameOptimistic: (id, name) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, name } } : n
      ),
    }));
  },

  updateClassPositionOptimistic: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position: { x: position.x, y: position.y } } : n
      ),
    }));
  },

  removeNodesOptimistic: (ids) =>
    set((state) => {
      let currentSnapshot: DiagramSnapshot = {
        classes: state.nodes.map((n) => ({
          id: n.id,
          name: n.data.name,
          positionX: n.position.x,
          positionY: n.position.y,
          attributes: n.data.attributes || [],
        })),
        relations: state.relations,
      };

      for (const id of ids) {
        currentSnapshot = projectDiagramOperation(currentSnapshot, {
          operationId: "optimistic-delete-class",
          viewerId: state.viewerId || "",
          projectId: state.projectId || "",
          sequence: 0,
          kind: "DELETE_CLASS",
          classId: id,
          payload: {},
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });
      }

      const nextNodes: DiagramClassNodeType[] = currentSnapshot.classes.map((c) => {
        const existingNode = state.nodes.find((n) => n.id === c.id);
        return {
          id: c.id,
          type: "diagramClass",
          position: { x: c.positionX, y: c.positionY },
          selected: existingNode?.selected,
          data: {
            id: c.id,
            name: c.name,
            attributes: [...(c.attributes || [])].sort(
              (a, b) => a.position - b.position
            ),
          },
        };
      });

      const nextSelectedRelationId = currentSnapshot.relations.some(
        (r) => r.id === state.selectedRelationId
      )
        ? state.selectedRelationId
        : null;

      const draftSourceDeleted =
        state.relationDraftSource &&
        ids.includes(state.relationDraftSource.classId);

      return {
        nodes: nextNodes,
        relations: currentSnapshot.relations,
        selectedRelationId: nextSelectedRelationId,
        ...(draftSourceDeleted
          ? {
              relationDraftSource: null,
              activeRelationPreset: null,
              customRelationDraft: null,
              activeTool:
                state.activeTool === "relation" ? "cursor" : state.activeTool,
            }
          : {}),
      };
    }),

  addAttributeOptimistic: (classId, attribute) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== classId) return node;
        const currentAttrs = node.data.attributes || [];
        const nextAttrs = [...currentAttrs, attribute].sort(
          (a, b) => a.position - b.position
        );
        return {
          ...node,
          data: {
            ...node.data,
            attributes: nextAttrs,
          },
        };
      }),
    }));
  },

  updateAttributeOptimistic: (classId, attributeId, patch) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== classId) return node;
        const currentAttrs = node.data.attributes || [];
        const nextAttrs = currentAttrs.map((attr) => {
          if (attr.id !== attributeId) return attr;
          // PK (incluida PK compartida): completamente inmutable
          if (attr.isPrimaryKey) return attr;
          // FK secundaria: únicamente name puede modificarse
          if (attr.isForeignKey) {
            return patch.name !== undefined ? { ...attr, name: patch.name } : attr;
          }
          return { ...attr, ...patch };
        });
        return {
          ...node,
          data: {
            ...node.data,
            attributes: nextAttrs,
          },
        };
      }),
    }));
  },

  repositionAttributeOptimistic: (classId, attributeId, targetPosition) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== classId) return node;
        const currentAttrs = node.data.attributes || [];
        const pk = currentAttrs.find((a) => a.isPrimaryKey);
        const moving = currentAttrs.find((a) => a.id === attributeId);
        if (!moving || moving.isPrimaryKey || moving.isForeignKey) return node;

        const otherSecondaries = currentAttrs
          .filter((a) => !a.isPrimaryKey && a.id !== attributeId)
          .sort((a, b) => a.position - b.position);

        const targetIndex = Math.max(
          0,
          Math.min(targetPosition - 1, otherSecondaries.length)
        );
        otherSecondaries.splice(targetIndex, 0, moving);

        const updatedSecondaries = otherSecondaries.map((attr, idx) => ({
          ...attr,
          position: idx + 1,
        }));

        const nextAttrs = pk ? [pk, ...updatedSecondaries] : updatedSecondaries;
        return {
          ...node,
          data: {
            ...node.data,
            attributes: nextAttrs,
          },
        };
      }),
    }));
  },

  removeAttributeOptimistic: (classId, attributeId) => {
    set((state) => {
      const nextSelected =
        state.selectedAttribute?.attributeId === attributeId
          ? null
          : state.selectedAttribute;

      return {
        selectedAttribute: nextSelected,
        nodes: state.nodes.map((node) => {
          if (node.id !== classId) return node;
          const currentAttrs = node.data.attributes || [];
          const target = currentAttrs.find((a) => a.id === attributeId);
          if (!target || target.isPrimaryKey || target.isForeignKey) return node;

          const pk = currentAttrs.find((a) => a.isPrimaryKey);
          const remainingSecondaries = currentAttrs
            .filter((a) => !a.isPrimaryKey && a.id !== attributeId)
            .sort((a, b) => a.position - b.position)
            .map((attr, idx) => ({
              ...attr,
              position: idx + 1,
            }));

          const nextAttrs = pk ? [pk, ...remainingSecondaries] : remainingSecondaries;
          return {
            ...node,
            data: {
              ...node.data,
              attributes: nextAttrs,
            },
          };
        }),
      };
    });
  },
});
