"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { CollaborationSocket, setActiveCollaborationSocket, type CollaborationMessage } from "../../infrastructure/realtime/collaboration-socket";
import type { CollaborationRole, ClassLock, PresenceUser } from "../../domain/entities/collaboration.entity";
import type { DiagramAttribute } from "../../domain/entities/diagram-attribute.entity";
import type { DiagramRelation } from "../../domain/entities/diagram-relation.entity";

type Options = { projectId: string; role: CollaborationRole; enabled?: boolean };

function applyMutation(message: CollaborationMessage): void {
  const data = (message.data || {}) as Record<string, unknown>;
  const store = useAppStore.getState();
  const op = String(message.operation_type || "");
  if (op === "CREATE_CLASS" && data.id && typeof data.name === "string") {
    store.addOptimisticClass({
      id: String(data.id), name: String(data.name),
      positionX: Number(data.position_x ?? data.positionX ?? 0),
      positionY: Number(data.position_y ?? data.positionY ?? 0),
      attributes: Array.isArray(data.attributes) ? data.attributes as DiagramAttribute[] : [],
    });
  } else if (op === "MOVE_CLASS" && data.class_id) {
    store.updateClassPositionOptimistic(String(data.class_id), {
      x: Number(data.position_x ?? data.positionX ?? 0), y: Number(data.position_y ?? data.positionY ?? 0),
    });
  } else if (op === "RENAME_CLASS" && data.class_id && typeof data.name === "string") {
    store.updateClassNameOptimistic(String(data.class_id), String(data.name));
  } else if (op === "DELETE_CLASS" && data.class_id) {
    store.removeNodesOptimistic([String(data.class_id)]);
  } else if (op === "CREATE_ATTRIBUTE" && data.class_id && data.id) {
    store.addAttributeOptimistic(String(data.class_id), data as unknown as DiagramAttribute);
  } else if (op === "UPDATE_ATTRIBUTE" && data.class_id && data.attribute_id) {
    store.updateAttributeOptimistic(String(data.class_id), String(data.attribute_id), data as Partial<DiagramAttribute>);
  } else if (op === "DELETE_ATTRIBUTE" && data.class_id && data.attribute_id) {
    store.removeAttributeOptimistic(String(data.class_id), String(data.attribute_id));
  } else if (op === "CREATE_RELATION" && data.id) {
    store.addOptimisticRelation(data as unknown as DiagramRelation);
  } else if (op === "RENAME_RELATION" && data.relation_id && typeof data.name === "string") {
    store.renameRelationOptimistic(String(data.relation_id), String(data.name));
  } else if (op === "DELETE_RELATION" && data.relation_id) {
    store.removeRelationOptimistic(String(data.relation_id));
  }
}

export function useCollaborationSocket({ projectId, role, enabled = true }: Options): void {
  const socketRef = useRef<CollaborationSocket | null>(null);
  const setStatus = useAppStore((s) => s.setCollaborationStatus);
  const reset = useAppStore((s) => s.resetCollaboration);

  useEffect(() => {
    if (!enabled || !projectId) return;
    const handleMessage = (message: CollaborationMessage) => {
      const store = useAppStore.getState();
      switch (message.type) {
        case "presence_snapshot":
          store.setPresence((message.users as PresenceUser[]) || []);
          (message.locks as ClassLock[] || []).forEach(store.setClassLock);
          break;
        case "user_joined":
          if (message.user_id) store.upsertPresence({ userId: String(message.user_id), userName: String(message.user_name || "Usuario"), role: String(message.role || "READER") as CollaborationRole });
          break;
        case "user_left":
          if (message.user_id) store.removePresence(String(message.user_id));
          if (message.user_id) store.removeRemoteCursor(String(message.user_id));
          break;
        case "class_locked":
          store.setClassLock(message as unknown as ClassLock);
          break;
        case "class_unlocked":
          if (message.class_id) store.removeClassLock(String(message.class_id));
          break;
        case "cursor_moved":
          if (message.user_id) store.setRemoteCursor({ userId: String(message.user_id), userName: String(message.user_name || "Usuario"), x: Number(message.x), y: Number(message.y), updatedAt: Date.now() });
          break;
        case "diagram_mutation":
          applyMutation(message);
          store.setLastRemoteMutation({ operationType: String(message.operation_type), data: (message.data || {}) as Record<string, unknown>, senderId: String(message.sender_id || "") });
          break;
      }
    };
    const socket = new CollaborationSocket({ projectId, role, onMessage: handleMessage, onStatus: setStatus });
    socketRef.current = socket;
    setActiveCollaborationSocket(socket);
    void socket.connect();
    return () => { socket.close(); socketRef.current = null; setActiveCollaborationSocket(null); reset(); };
  }, [enabled, projectId, role, reset, setStatus]);
}

export function useCollaborationSender() {
  const socketRef = useRef<CollaborationSocket | null>(null);
  return socketRef;
}
