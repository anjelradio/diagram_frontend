"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type {
  RealtimeRole,
  RealtimeServerMessage,
} from "../../domain/entities/realtime.entity.ts";
import {
  RealtimeSocket,
  sendRealtimeMessage,
  setActiveRealtimeSocket,
} from "../../infrastructure/websocket/realtime-socket.ts";

export type UseRealtimeSessionOptions = {
  projectId: string;
  viewerId: string;
  role: RealtimeRole;
  enabled?: boolean;
  onMessage?: (message: RealtimeServerMessage) => void;
  onRoleChanged?: (role: RealtimeRole) => void;
};

export function useRealtimeSession({
  projectId,
  viewerId,
  role,
  enabled = true,
  onMessage,
  onRoleChanged,
}: UseRealtimeSessionOptions) {
  const setStatus = useAppStore((s) => s.setRealtimeStatus);
  const reset = useAppStore((s) => s.resetRealtime);
  // Pulido T020: refs para que callbacks de UI (Agent button) no disparen reconexión ws
  const onMessageRef = useRef(onMessage);
  const onRoleChangedRef = useRef(onRoleChanged);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onRoleChangedRef.current = onRoleChanged;
  }, [onRoleChanged]);

  const sendCursor = useCallback((x: number, y: number) => {
    return sendRealtimeMessage({ type: "cursor_move", x, y });
  }, []);

  const sendClassDrag = useCallback(
    (classId: string, x: number, y: number) => {
      return sendRealtimeMessage({ type: "class_drag", class_id: classId, x, y });
    },
    []
  );

  const acquireLock = useCallback((classId: string) => {
    return sendRealtimeMessage({ type: "class_lock_acquire", class_id: classId });
  }, []);

  const releaseLock = useCallback((classId: string) => {
    return sendRealtimeMessage({ type: "class_lock_release", class_id: classId });
  }, []);

  useEffect(() => {
    if (!enabled || !projectId || !viewerId) return;

    const handleMessage = (message: RealtimeServerMessage) => {
      const store = useAppStore.getState();

      switch (message.type) {
        case "presenceSnapshot":
          store.setPresence(message.peers);
          store.setClassLocks(message.classLocks);
          if (message.agentLock) {
            store.acquireAgentLock(message.agentLock);
          }
          break;

        case "userJoined":
          store.upsertPresence(message.user);
          break;

        case "userLeft":
          store.removePresence(message.userId);
          store.removeRemoteCursor(message.userId);
          // Limpiar locks de usuario desconectado
          Object.values(store.classLocks).forEach((lock) => {
            if (lock.userId === message.userId) {
              store.removeClassLock(lock.classId);
            }
          });
          break;

        case "classLocked":
          store.setClassLock(message.lock);
          if (message.lock.userId === viewerId) {
            store.setLocalClassLock(message.lock.classId);
          }
          break;

        case "classUnlocked":
          store.removeClassLock(message.classId);
          if (message.userId === viewerId) {
            store.clearLocalClassLock(message.classId);
          }
          break;

        case "classLockDenied":
          store.clearLocalClassLock(message.classId);
          appToast.error(
            message.ownerName
              ? `${message.ownerName} está editando esta clase.`
              : "La clase está siendo editada por otra persona."
          );
          break;

        case "cursorMoved":
          if (message.cursor.userId !== viewerId) {
            store.setRemoteCursor(message.cursor);
          }
          break;

        case "roleChanged":
          onRoleChangedRef.current?.(message.role);
          if (message.role === "READER") {
            store.releaseAllLocalClassLocks();
          }
          break;

        case "diagramMutation":
          store.setLastRemoteMutation(message.mutation);
          break;

        case "agentLock":
          store.acquireAgentLock({
            activityId: message.activityId,
            userId: message.userId,
          });
          break;

        case "agentFinished":
          store.releaseAgentLock(message.activityId);
          break;

        case "pong":
        case "classDragged":
          // Consumidos externamente por callback o ignorados
          break;
      }

      onMessageRef.current?.(message);
    };

    const socket = new RealtimeSocket({
      projectId,
      role,
      onMessage: handleMessage,
      onStatus: setStatus,
    });

    setActiveRealtimeSocket(socket);
    void socket.connect();

    return () => {
      socket.close();
      setActiveRealtimeSocket(null);
      reset();
    };
  }, [enabled, projectId, reset, role, setStatus, viewerId]);

  return {
    sendCursor,
    sendClassDrag,
    acquireLock,
    releaseLock,
  };
}
