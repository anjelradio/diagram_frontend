import { applyNodeChanges, type Node, type NodeChange } from "@xyflow/react";
import type { StateCreator } from "zustand";
import type { DiagramAttribute } from "../../domain/entities/diagram-attribute.entity.ts";
import type {
  DiagramClass,
  DiagramClassWithAttributes,
  DiagramSnapshot,
} from "../../domain/entities/diagram-class.entity.ts";
import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity.ts";

import type {
  DiagramCardinality,
  DiagramRelation,
  DiagramRelationHandle,
  RelationPreset,
} from "../../domain/entities/diagram-relation.entity.ts";
import type { PlannedRelationAggregate } from "../../domain/services/diagram-relation-planner.ts";
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
  setRelations: (relations: DiagramRelation[]) => void;
  addOptimisticRelation: (relation: DiagramRelation) => void;
  addOptimisticRelationAggregate: (aggregate: PlannedRelationAggregate) => void;
  renameRelationOptimistic: (relationId: string, name: string) => void;
  removeRelationOptimistic: (relationId: string) => void;
  hydrateSnapshot: (
    snapshot: DiagramSnapshot,
    pendingOps?: DiagramOperation[]
  ) => void;
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

export const createDiagramSlice: StateCreator<
  DiagramSlice,
  [],
  [],
  DiagramSlice
> = (set) => ({
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
          }
        : {}),
    }),

  setSelectedAttribute: (selectedAttribute) =>
    set({ selectedAttribute }),

  applyRemoteMutation: (operationType, data) => {
    set((state) => {
      const classId = String(data.class_id ?? "");
      const attributeId = String(data.attribute_id ?? data.id ?? "");
      if (operationType === "MOVE_CLASS") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, position: { x: Number(data.position_x ?? 0), y: Number(data.position_y ?? 0) } } : n) };
      if (operationType === "RENAME_CLASS") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, data: { ...n.data, name: String(data.name) } } : n) };
      if (operationType === "DELETE_CLASS") return { nodes: state.nodes.filter((n) => n.id !== classId), relations: state.relations.filter((r) => r.source.classId !== classId && r.target.classId !== classId) };
      if (operationType === "CREATE_CLASS") return { nodes: [...state.nodes, { id: String(data.id), type: "diagramClass", position: { x: Number(data.position_x ?? 0), y: Number(data.position_y ?? 0) }, data: { id: String(data.id), name: String(data.name), attributes: Array.isArray(data.attributes) ? data.attributes as DiagramAttribute[] : [] } }] };
      if (operationType === "CREATE_ATTRIBUTE") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, data: { ...n.data, attributes: [...(n.data.attributes || []), data as unknown as DiagramAttribute].sort((a, b) => a.position - b.position) } } : n) };
      if (operationType === "UPDATE_ATTRIBUTE") return { nodes: state.nodes.map((n) => n.id === classId ? { ...n, data: { ...n.data, attributes: (n.data.attributes || []).map((a) => a.id === attributeId ? { ...a, ...(data.name !== undefined ? { name: String(data.name) } : {}), ...(data.data_type !== undefined ? { dataType: data.data_type as DiagramAttribute["dataType"] } : {}), ...(data.is_nullable !== undefined ? { isNullable: Boolean(data.is_nullable) } : {}) } : a) } } : n) };
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
      if (operationType === "DELETE_RELATION") return { relations: state.relations.filter((r) => r.id !== String(data.relation_id)) };
      if (operationType === "CREATE_RELATION") {
        const source = (data.source || {}) as Record<string, unknown>;
        const target = (data.target || {}) as Record<string, unknown>;
        const relation = {
          id: String(data.id), name: String(data.name || ""), relationType: String(data.relation_type || data.relationType),
          source: { classId: String(source.class_id || source.classId), handle: String(source.handle), cardinality: source.cardinality ?? null },
          target: { classId: String(target.class_id || target.classId), handle: String(target.handle), cardinality: target.cardinality ?? null },
          bridge: null,
        } as unknown as DiagramRelation;
        return { relations: [...state.relations, relation] };
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
    }));
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

      if (aggregate.sharedPrimaryKeyAttribute) {
        const spk = aggregate.sharedPrimaryKeyAttribute;
        nextNodes = nextNodes.map((node) => {
          if (node.id !== spk.classId) return node;
          const currentAttrs = node.data.attributes || [];
          const updatedAttrs = currentAttrs.map((a) =>
            a.id === spk.id ? { ...spk } : a
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

    const nodes: DiagramClassNodeType[] = projected.classes.map((c) => ({
      id: c.id,
      type: "diagramClass",
      position: { x: c.positionX, y: c.positionY },
      data: {
        id: c.id,
        name: c.name,
        attributes: [...(c.attributes || [])].sort(
          (a, b) => a.position - b.position
        ),
      },
    }));

    set({
      nodes,
      relations: [...(projected.relations || [])],
      isHydrated: true,
    });
  },

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
