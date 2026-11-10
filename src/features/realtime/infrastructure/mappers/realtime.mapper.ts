import type {
  AgentComponentReservation,
  RealtimeClassLock,
  RealtimePresenceUser,
  RealtimeRemoteCursor,
  RealtimeServerMessage,
} from "../../domain/entities/realtime.entity.ts";
import type { RealtimeMessageWire } from "../schemas/realtime.schemas.ts";
import { getAgentActivityType } from "../../../assistant/domain/entities/agent-activity.entity.ts";

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

  toAgentComponentReservation: (raw: {
    project_id: string;
    message_id: string;
    sequence: number;
    component_type: "class" | "relation";
    component_id: string;
    activity_type: "query" | "edit";
    attribute_id?: string | null;
  }): AgentComponentReservation => ({
    projectId: raw.project_id,
    messageId: raw.message_id,
    sequence: raw.sequence,
    componentType: raw.component_type,
    componentId: raw.component_id,
    activityType: raw.activity_type,
    attributeId: raw.attribute_id ?? null,
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
          agentComponentReservations: (
            raw.agent_component_reservations ?? []
          ).map(realtimeMapper.toAgentComponentReservation),
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
      case "agent_message_accepted":
        return {
          type: "agentMessageAccepted",
          message: {
            id: raw.message_id,
            projectId: raw.project_id,
            userId: raw.user_id,
            authorName: raw.author_name,
            authorAvatarUrl: raw.author_avatar_url,
            prompt: raw.prompt,
            imageUrl: raw.image_url,
            status: raw.status,
            cancelRequested: raw.cancel_requested,
            responseMarkdown: raw.response_markdown,
            createdAt: raw.created_at,
          },
        };
      case "agent_message_activity":
        return {
          type: "agentMessageActivity",
          projectId: raw.project_id,
          messageId: raw.message_id,
          attemptId: raw.attempt_id,
          sequence: raw.sequence,
          activityCode: raw.activity_code,
          activityType: raw.activity_type ?? getAgentActivityType(raw.activity_code),
          occurredAt: raw.occurred_at,
        };
      case "agent_message_finished":
        return {
          type: "agentMessageFinished",
          message: {
            id: raw.message_id,
            projectId: raw.project_id,
            userId: raw.user_id,
            authorName: raw.author_name ?? raw.user_id,
            authorAvatarUrl: raw.author_avatar_url,
            prompt: raw.prompt,
            imageUrl: raw.image_url,
            status: raw.status,
            cancelRequested: false,
            responseMarkdown: raw.response_markdown,
            createdAt: raw.created_at,
          },
        };
      case "agent_component_reserved":
        return {
          type: "agentComponentReserved",
          reservation: realtimeMapper.toAgentComponentReservation(raw),
        };
      case "agent_component_reservations_released":
        return {
          type: "agentComponentReservationsReleased",
          projectId: raw.project_id,
          messageId: raw.message_id,
        };
    }
  },
};
