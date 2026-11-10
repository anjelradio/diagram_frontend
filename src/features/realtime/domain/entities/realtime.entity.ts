import type { AgentMessage } from "@/features/assistant/domain/entities/agent-message.entity";
import type {
  AgentActivityCode,
  AgentActivityType,
} from "@/features/assistant/domain/entities/agent-activity.entity";

export type RealtimeRole = "OWNER" | "EDITOR" | "READER";

export type RealtimePresenceUser = {
  userId: string;
  userName: string;
  role: RealtimeRole;
  color: string;
};

export type RealtimeClassLock = {
  classId: string;
  userId: string;
  userName: string;
  lockedAt: number;
  expiresAt: number;
  color: string;
};

export type RealtimeRemoteCursor = {
  userId: string;
  userName: string;
  x: number;
  y: number;
  updatedAt: number;
  color: string;
};

export type RealtimeDiagramMutation = {
  operationType: string;
  data: Record<string, unknown>;
  senderId: string;
};

export type RealtimeConnectionStatus = "connecting" | "connected" | "disconnected";

export type AgentComponentType = "class" | "relation";
export type AgentReservationActivityType = "query" | "edit";

export type AgentComponentReservation = {
  projectId: string;
  messageId: string;
  sequence: number;
  componentType: AgentComponentType;
  componentId: string;
  activityType: AgentReservationActivityType;
  attributeId?: string | null;
};

/** Mensajes de servidor ya validados por Zod y convertidos a camelCase para consumo interno */
export type RealtimeServerMessage =
  | { type: "pong" }
  | {
      type: "presenceSnapshot";
      peers: RealtimePresenceUser[];
      classLocks: RealtimeClassLock[];
      agentComponentReservations?: AgentComponentReservation[];
    }
  | { type: "userJoined"; user: RealtimePresenceUser }
  | { type: "userLeft"; userId: string }
  | { type: "cursorMoved"; cursor: RealtimeRemoteCursor }
  | { type: "classDragged"; classId: string; userId: string; userName: string; x: number; y: number }
  | { type: "classLocked"; lock: RealtimeClassLock }
  | { type: "classLockDenied"; classId: string; userId?: string | null; ownerName?: string | null }
  | { type: "classUnlocked"; classId: string; userId: string }
  | { type: "diagramMutation"; mutation: RealtimeDiagramMutation }
  | { type: "roleChanged"; role: RealtimeRole }
  | { type: "agentMessageAccepted"; message: AgentMessage }
  | { type: "agentMessageFinished"; message: AgentMessage }
  | {
      type: "agentMessageActivity";
      projectId: string;
      messageId: string;
      attemptId: string;
      sequence: number;
      activityCode: AgentActivityCode;
      activityType?: AgentActivityType;
      occurredAt: string;
    }
  | {
      type: "agentComponentReserved";
      reservation: AgentComponentReservation;
    }
  | {
      type: "agentComponentReservationsReleased";
      projectId: string;
      messageId: string;
    };

