import type {
  RealtimeClassLock,
  RealtimePresenceUser,
  RealtimeRemoteCursor,
  RealtimeServerMessage,
} from "../../domain/entities/realtime.entity.ts";
import type { RealtimeMessageWire } from "../schemas/realtime.schemas.ts";

const colors = ["#22d3ee", "#a78bfa", "#fb7185", "#34d399", "#fbbf24", "#60a5fa"];

export function realtimeColor(userId: string): string {
  const hash = Array.from(userId).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
  return colors[hash % colors.length];
}

export const realtimeMapper = {
  toPresence: (raw: {
    user_id: string;
    user_name: string;
    role: RealtimePresenceUser["role"];
  }): RealtimePresenceUser => ({
    userId: raw.user_id,
    userName: raw.user_name,
    role: raw.role,
    color: realtimeColor(raw.user_id),
  }),

  toClassLock: (raw: {
    class_id: string;
    user_id: string;
    user_name: string;
    locked_at: number;
    expires_at: number;
  }): RealtimeClassLock => ({
    classId: raw.class_id,
    userId: raw.user_id,
    userName: raw.user_name,
    lockedAt: raw.locked_at,
    expiresAt: raw.expires_at,
    color: realtimeColor(raw.user_id),
  }),

  toRemoteCursor: (raw: {
    user_id: string;
    user_name: string;
    x: number;
    y: number;
  }): RealtimeRemoteCursor => ({
    userId: raw.user_id,
    userName: raw.user_name,
    x: raw.x,
    y: raw.y,
    updatedAt: Date.now(),
    color: realtimeColor(raw.user_id),
  }),

  toDomain(raw: RealtimeMessageWire): RealtimeServerMessage {
    switch (raw.type) {
      case "pong":
        return { type: "pong" };
      case "presence_snapshot":
        return {
          type: "presenceSnapshot",
          peers: raw.peers.map(realtimeMapper.toPresence),
          classLocks: raw.class_locks.map(realtimeMapper.toClassLock),
          agentLock: raw.agent_lock
            ? { userId: raw.agent_lock.user_id, activityId: raw.agent_lock.activity_id }
            : null,
        };
      case "user_joined":
        return { type: "userJoined", user: realtimeMapper.toPresence(raw) };
      case "user_left":
        return { type: "userLeft", userId: raw.user_id };
      case "cursor_moved":
        return { type: "cursorMoved", cursor: realtimeMapper.toRemoteCursor(raw) };
      case "class_dragged":
        return {
          type: "classDragged",
          classId: raw.class_id,
          userId: raw.user_id,
          userName: raw.user_name,
          x: raw.x,
          y: raw.y,
        };
      case "class_locked":
        return { type: "classLocked", lock: realtimeMapper.toClassLock(raw) };
      case "class_lock_denied":
        return {
          type: "classLockDenied",
          classId: raw.class_id,
          userId: raw.user_id ?? null,
          ownerName: raw.user_name ?? null,
        };
      case "class_unlocked":
        return { type: "classUnlocked", classId: raw.class_id, userId: raw.user_id };
      case "diagram_mutation":
        return {
          type: "diagramMutation",
          mutation: {
            operationType: raw.operation_type,
            data: raw.data,
            senderId: raw.sender_id,
          },
        };
      case "role_changed":
        return { type: "roleChanged", role: raw.role };
      case "agent_lock":
        return {
          type: "agentLock",
          userId: raw.user_id,
          activityId: raw.activity_id,
        };
      case "agent_finished":
        return {
          type: "agentFinished",
          userId: raw.user_id,
          activityId: raw.activity_id,
          state: raw.state,
        };
    }
  },
};
