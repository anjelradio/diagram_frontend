import type { StateCreator } from "zustand";
import type {
  AgentComponentReservation,
  RealtimeClassLock,
  RealtimeConnectionStatus,
  RealtimeDiagramMutation,
  RealtimePresenceUser,
  RealtimeRemoteCursor,
} from "../../domain/entities/realtime.entity.ts";

export type EffectiveReservation = {
  isReserved: boolean;
  activityType: "query" | "edit" | null;
  attributeId: string | null;
  messageIds: string[];
};

export const EMPTY_EFFECTIVE_RESERVATION: EffectiveReservation = Object.freeze({
  isReserved: false,
  activityType: null,
  attributeId: null,
  messageIds: [],
});

export type EditDecision = {
  allowed: boolean;
  reason?: string;
};

export const ALLOWED_EDIT_DECISION: EditDecision = Object.freeze({
  allowed: true,
});

export const NO_PROJECT_PERMISSION_DECISION: EditDecision = Object.freeze({
  allowed: false,
  reason: "No tienes permisos de edición en este proyecto.",
});

export const AGENT_EDIT_DECISION: EditDecision = Object.freeze({
  allowed: false,
  reason: "El asistente está modificando este elemento.",
});

export const AGENT_QUERY_DECISION: EditDecision = Object.freeze({
  allowed: false,
  reason: "El asistente está consultando este elemento.",
});

function computeEffectiveReservations(
  reservations: Record<string, AgentComponentReservation>
): Record<string, EffectiveReservation> {
  const byComponent: Record<string, AgentComponentReservation[]> = {};
  for (const r of Object.values(reservations)) {
    const key = `${r.componentType}:${r.componentId}`;
    (byComponent[key] ??= []).push(r);
  }
  const result: Record<string, EffectiveReservation> = {};
  for (const [key, matches] of Object.entries(byComponent)) {
    const hasEdit = matches.some((r) => r.activityType === "edit");
    const attributeId =
      matches.find((r) => Boolean(r.attributeId))?.attributeId ?? null;
    const messageIds = Array.from(new Set(matches.map((r) => r.messageId)));
    result[key] = {
      isReserved: true,
      activityType: hasEdit ? "edit" : "query",
      attributeId,
      messageIds,
    };
  }
  return result;
}

export type RealtimeSlice = {
  realtimeStatus: RealtimeConnectionStatus;
  presence: Record<string, RealtimePresenceUser>;
  classLocks: Record<string, RealtimeClassLock>;
  agentReservations: Record<string, AgentComponentReservation>;
  effectiveReservations: Record<string, EffectiveReservation>;
  remoteCursors: Record<string, RealtimeRemoteCursor>;
  lastRemoteMutation: RealtimeDiagramMutation | null;
  localLockedClassId: string | null;

  setRealtimeStatus: (status: RealtimeConnectionStatus) => void;
  setPresence: (users: RealtimePresenceUser[]) => void;
  upsertPresence: (user: RealtimePresenceUser) => void;
  removePresence: (userId: string) => void;
  setClassLock: (lock: RealtimeClassLock) => void;
  setClassLocks: (locks: RealtimeClassLock[]) => void;
  setLocalClassLock: (classId: string | null) => void;
  removeClassLock: (classId: string) => void;
  clearLocalClassLock: (classId?: string) => void;
  releaseAllLocalClassLocks: () => void;
  isClassLockedByOther: (classId: string, viewerId: string | null) => boolean;

  setAgentReservations: (reservations: AgentComponentReservation[]) => void;
  upsertAgentReservation: (reservation: AgentComponentReservation) => void;
  releaseAgentReservationsByMessage: (messageId: string) => void;
  getEffectiveComponentReservation: (
    componentId: string,
    componentType?: "class" | "relation"
  ) => EffectiveReservation;
  isComponentReservedByAgent: (
    componentId: string,
    componentType?: "class" | "relation"
  ) => boolean;
  canEditDiagramComponent: (
    componentId: string,
    componentType: "class" | "relation",
    viewerId: string | null,
    canEditProject: boolean
  ) => EditDecision;

  setRemoteCursor: (cursor: RealtimeRemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  setLastRemoteMutation: (mutation: RealtimeDiagramMutation | null) => void;
  resetRealtime: () => void;
};

export const createRealtimeSlice: StateCreator<RealtimeSlice> = (set, get) => ({
  realtimeStatus: "disconnected",
  presence: {},
  classLocks: {},
  agentReservations: {},
  effectiveReservations: {},
  remoteCursors: {},
  lastRemoteMutation: null,
  localLockedClassId: null,

  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),

  setPresence: (users) =>
    set({
      presence: Object.fromEntries(users.map((u) => [u.userId, u])),
    }),

  upsertPresence: (user) =>
    set((s) => ({
      presence: { ...s.presence, [user.userId]: user },
    })),

  removePresence: (userId) =>
    set((s) => {
      const presence = { ...s.presence };
      delete presence[userId];
      return { presence };
    }),

  setClassLock: (lock) =>
    set((s) => ({
      classLocks: { ...s.classLocks, [lock.classId]: lock },
    })),

  setClassLocks: (locks) =>
    set({
      classLocks: Object.fromEntries(locks.map((lock) => [lock.classId, lock])),
    }),

  setLocalClassLock: (localLockedClassId) => set({ localLockedClassId }),

  removeClassLock: (classId) =>
    set((s) => {
      const classLocks = { ...s.classLocks };
      delete classLocks[classId];
      return {
        classLocks,
        localLockedClassId:
          s.localLockedClassId === classId ? null : s.localLockedClassId,
      };
    }),

  clearLocalClassLock: (classId) =>
    set((s) => ({
      localLockedClassId:
        !classId || s.localLockedClassId === classId
          ? null
          : s.localLockedClassId,
    })),

  releaseAllLocalClassLocks: () => set({ localLockedClassId: null }),

  isClassLockedByOther: (classId, viewerId) => {
    const lock = get().classLocks[classId];
    return Boolean(lock && lock.userId !== viewerId);
  },

  setAgentReservations: (reservations) => {
    const next = Object.fromEntries(
      reservations.map((r) => [
        `${r.messageId}:${r.componentType}:${r.componentId}`,
        r,
      ])
    );
    set({
      agentReservations: next,
      effectiveReservations: computeEffectiveReservations(next),
    });
  },

  upsertAgentReservation: (reservation) =>
    set((s) => {
      const key = `${reservation.messageId}:${reservation.componentType}:${reservation.componentId}`;
      const existing = s.agentReservations[key];
      if (existing) {
        if (existing.sequence > reservation.sequence) {
          // Descartar evento obsoleto
          return s;
        }
        const effectiveActivity: "query" | "edit" =
          existing.activityType === "edit" || reservation.activityType === "edit"
            ? "edit"
            : "query";
        const effectiveAttributeId =
          reservation.attributeId !== undefined
            ? reservation.attributeId
            : existing.attributeId;
        const next = {
          ...s.agentReservations,
          [key]: {
            ...reservation,
            activityType: effectiveActivity,
            attributeId: effectiveAttributeId,
          },
        };
        return {
          agentReservations: next,
          effectiveReservations: computeEffectiveReservations(next),
        };
      }
      const next = {
        ...s.agentReservations,
        [key]: reservation,
      };
      return {
        agentReservations: next,
        effectiveReservations: computeEffectiveReservations(next),
      };
    }),

  releaseAgentReservationsByMessage: (messageId) =>
    set((s) => {
      let changed = false;
      const nextReservations: Record<string, AgentComponentReservation> = {};
      for (const [key, res] of Object.entries(s.agentReservations)) {
        if (res.messageId === messageId) {
          changed = true;
        } else {
          nextReservations[key] = res;
        }
      }
      return changed
        ? {
            agentReservations: nextReservations,
            effectiveReservations: computeEffectiveReservations(nextReservations),
          }
        : s;
    }),

  getEffectiveComponentReservation: (componentId, componentType) => {
    const effMap = get().effectiveReservations;
    if (componentType) {
      return effMap?.[`${componentType}:${componentId}`] ?? EMPTY_EFFECTIVE_RESERVATION;
    }
    for (const [key, eff] of Object.entries(effMap ?? {})) {
      if (key.endsWith(`:${componentId}`)) {
        return eff;
      }
    }
    return EMPTY_EFFECTIVE_RESERVATION;
  },

  isComponentReservedByAgent: (componentId, componentType) => {
    return get().getEffectiveComponentReservation(componentId, componentType).isReserved;
  },

  canEditDiagramComponent: (
    componentId,
    componentType,
    viewerId,
    canEditProject
  ) => {
    if (!canEditProject) {
      return NO_PROJECT_PERMISSION_DECISION;
    }
    if (componentType === "class") {
      const lock = get().classLocks[componentId];
      if (lock && lock.userId !== viewerId) {
        return {
          allowed: false,
          reason: `Bloqueado por ${lock.userName || "otro colaborador"}.`,
        };
      }
    }
    const agentRes = get().getEffectiveComponentReservation(
      componentId,
      componentType
    );
    if (agentRes.isReserved) {
      return agentRes.activityType === "edit"
        ? AGENT_EDIT_DECISION
        : AGENT_QUERY_DECISION;
    }
    return ALLOWED_EDIT_DECISION;
  },

  setRemoteCursor: (cursor) =>
    set((s) => ({
      remoteCursors: { ...s.remoteCursors, [cursor.userId]: cursor },
    })),

  removeRemoteCursor: (userId) =>
    set((s) => {
      const remoteCursors = { ...s.remoteCursors };
      delete remoteCursors[userId];
      return { remoteCursors };
    }),

  setLastRemoteMutation: (lastRemoteMutation) => set({ lastRemoteMutation }),

  resetRealtime: () =>
    set({
      realtimeStatus: "disconnected",
      presence: {},
      classLocks: {},
      agentReservations: {},
      effectiveReservations: {},
      remoteCursors: {},
      lastRemoteMutation: null,
      localLockedClassId: null,
    }),
});
