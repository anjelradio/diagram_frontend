import { applyNodeChanges, type Node, type NodeChange } from "@xyflow/react";
import type { StateCreator } from "zustand";
import type { DiagramAttribute } from "../../domain/entities/diagram-attribute.entity";
import type {
  DiagramClass,
  DiagramClassWithAttributes,
  DiagramSnapshot,
} from "../../domain/entities/diagram-class.entity";
import type {
  CreateAttributePayload,
  CreateClassPayload,
  DeleteAttributePayload,
  DiagramOperation,
  MoveClassPayload,
  RenameClassPayload,
  RepositionAttributePayload,
  UpdateAttributePayload,
} from "../../domain/entities/diagram-operation.entity";

export type DiagramClassNodeData = {
  id: string;
  name: string;
  attributes: DiagramAttribute[];
};

export type DiagramClassNodeType = Node<DiagramClassNodeData, "diagramClass">;

export type SyncStatus = "idle" | "pending" | "blocked";

export type CanvasTool = "cursor" | "select" | "hand" | "create-class";

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

  setDiagramContext: (
    projectId: string,
    viewerId: string,
    canEdit: boolean
  ) => void;
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
  setActiveTool: (tool: CanvasTool) => void;
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
};

export const createDiagramSlice: StateCreator<
  DiagramSlice,
  [],
  [],
  DiagramSlice
> = (set) => ({
  projectId: null,
  viewerId: null,
  canEdit: true,
  isHydrated: false,
  syncStatus: "idle",
  syncError: null,
  nodes: [],
  selectedAttribute: null,
  activeTool: "cursor",

  setDiagramContext: (projectId, viewerId, canEdit) =>
    set({ projectId, viewerId, canEdit }),

  setSyncStatus: (status, error = null) =>
    set({ syncStatus: status, syncError: error }),

  setActiveTool: (activeTool) =>
    set({ activeTool }),

  setSelectedAttribute: (selectedAttribute) =>
    set({ selectedAttribute }),

  hydrateSnapshot: (snapshot, pendingOps = []) => {
    const classMap = new Map<string, DiagramClassWithAttributes>();
    for (const c of snapshot.classes) {
      classMap.set(c.id, {
        id: c.id,
        name: c.name,
        positionX: c.positionX,
        positionY: c.positionY,
        attributes: (c.attributes || []).map((a) => ({ ...a })).sort((a, b) => a.position - b.position),
      });
    }

    const sortedOps = [...pendingOps].sort((a, b) => a.sequence - b.sequence);
    for (const op of sortedOps) {
      if (op.kind === "CREATE") {
        const p = op.payload as CreateClassPayload;
        const pkAttr: DiagramAttribute = {
          id: p.primaryAttribute.id,
          name: p.primaryAttribute.name,
          dataType: p.primaryAttribute.dataType,
          position: p.primaryAttribute.position,
          isPrimaryKey: p.primaryAttribute.isPrimaryKey,
          isNullable: p.primaryAttribute.isNullable,
        };
        classMap.set(p.id, {
          id: p.id,
          name: p.name,
          positionX: p.positionX,
          positionY: p.positionY,
          attributes: [pkAttr],
        });
      } else if (op.kind === "RENAME") {
        const p = op.payload as RenameClassPayload;
        const existing = classMap.get(op.classId);
        if (existing) {
          existing.name = p.name;
        }
      } else if (op.kind === "MOVE") {
        const p = op.payload as MoveClassPayload;
        const existing = classMap.get(op.classId);
        if (existing) {
          existing.positionX = p.positionX;
          existing.positionY = p.positionY;
        }
      } else if (op.kind === "DELETE") {
        classMap.delete(op.classId);
      } else if (op.kind === "CREATE_ATTRIBUTE") {
        const p = op.payload as CreateAttributePayload;
        const existing = classMap.get(op.classId);
        if (existing) {
          const newAttr: DiagramAttribute = {
            id: p.id,
            name: p.name,
            dataType: null,
            position: p.position,
            isPrimaryKey: false,
            isNullable: true,
          };
          existing.attributes = [...existing.attributes, newAttr].sort(
            (a, b) => a.position - b.position
          );
        }
      } else if (op.kind === "UPDATE_ATTRIBUTE") {
        const p = op.payload as UpdateAttributePayload;
        const existing = classMap.get(op.classId);
        if (existing) {
          existing.attributes = existing.attributes.map((a) => {
            if (a.id === p.attributeId) {
              return {
                ...a,
                ...(p.name !== undefined ? { name: p.name } : {}),
                ...(p.dataType !== undefined ? { dataType: p.dataType } : {}),
                ...(p.isNullable !== undefined ? { isNullable: p.isNullable } : {}),
              };
            }
            return a;
          });
        }
      } else if (op.kind === "REPOSITION_ATTRIBUTE") {
        const p = op.payload as RepositionAttributePayload;
        const existing = classMap.get(op.classId);
        if (existing) {
          const pk = existing.attributes.find((a) => a.isPrimaryKey);
          const moving = existing.attributes.find((a) => a.id === p.attributeId);
          if (moving && !moving.isPrimaryKey) {
            const others = existing.attributes.filter(
              (a) => !a.isPrimaryKey && a.id !== p.attributeId
            );
            const targetIndex = Math.max(
              0,
              Math.min(p.position - 1, others.length)
            );
            others.splice(targetIndex, 0, moving);
            const updated = others.map((attr, idx) => ({
              ...attr,
              position: idx + 1,
            }));
            existing.attributes = pk ? [pk, ...updated] : updated;
          }
        }
      } else if (op.kind === "DELETE_ATTRIBUTE") {
        const p = op.payload as DeleteAttributePayload;
        const existing = classMap.get(op.classId);
        if (existing) {
          const pk = existing.attributes.find((a) => a.isPrimaryKey);
          const updated = existing.attributes
            .filter((a) => !a.isPrimaryKey && a.id !== p.attributeId)
            .sort((a, b) => a.position - b.position)
            .map((attr, idx) => ({
              ...attr,
              position: idx + 1,
            }));
          existing.attributes = pk ? [pk, ...updated] : updated;
        }
      }
    }

    const nodes: DiagramClassNodeType[] = Array.from(classMap.values()).map(
      (c) => ({
        id: c.id,
        type: "diagramClass",
        position: { x: c.positionX, y: c.positionY },
        data: {
          id: c.id,
          name: c.name,
          attributes: [...(c.attributes || [])].sort((a, b) => a.position - b.position),
        },
      })
    );

    set({
      nodes,
      canEdit: true,
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

  removeNodesOptimistic: (ids) => {
    const setIds = new Set(ids);
    set((state) => ({
      nodes: state.nodes.filter((n) => !setIds.has(n.id)),
    }));
  },

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
        const nextAttrs = currentAttrs.map((attr) =>
          attr.id === attributeId ? { ...attr, ...patch } : attr
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

  repositionAttributeOptimistic: (classId, attributeId, targetPosition) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== classId) return node;
        const currentAttrs = node.data.attributes || [];
        const pk = currentAttrs.find((a) => a.isPrimaryKey);
        const moving = currentAttrs.find((a) => a.id === attributeId);
        if (!moving || moving.isPrimaryKey) return node;

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
          if (!target || target.isPrimaryKey) return node;

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
