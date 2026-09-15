import type { StateCreator } from "zustand";
import type {
  RealtimeClassLock,
  RealtimeConnectionStatus,
  RealtimeDiagramMutation,
  RealtimePresenceUser,
  RealtimeRemoteCursor,
} from "../../domain/entities/realtime.entity.ts";

export type RealtimeSlice = {
  realtimeStatus: RealtimeConnectionStatus;
  presence: Record<string, RealtimePresenceUser>;
  classLocks: Record<string, RealtimeClassLock>;
  remoteCursors: Record<string, RealtimeRemoteCursor>;
  lastRemoteMutation: RealtimeDiagramMutation | null;
  localLockedClassId: string | null;
  isAgentLocked: boolean;
  agentActivityId: string | null;
  agentLock: { activityId: string; userId: string } | null;
  lastAgentFinishedActivityId: string | null;

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
  setRemoteCursor: (cursor: RealtimeRemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  setLastRemoteMutation: (mutation: RealtimeDiagramMutation | null) => void;
  setAgentLock: (isLocked: boolean, activityId?: string | null) => void;
  acquireAgentLock: (lock: { activityId: string; userId: string }) => void;
  releaseAgentLock: (activityId: string) => void;
  resetRealtime: () => void;
};

export const createRealtimeSlice: StateCreator<RealtimeSlice> = (set, get) => ({
  realtimeStatus: "disconnected",
  presence: {},
  classLocks: {},
  remoteCursors: {},
  lastRemoteMutation: null,
  localLockedClassId: null,
  isAgentLocked: false,
  agentActivityId: null,
  agentLock: null,
  lastAgentFinishedActivityId: null,

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

  setAgentLock: (isAgentLocked, agentActivityId = null) =>
    set((state) => {
      if (!isAgentLocked) {
        return { isAgentLocked: false, agentActivityId: null, agentLock: null };
      }
      const lock = agentActivityId
        ? { activityId: agentActivityId, userId: state.agentLock?.userId ?? "" }
        : null;
      return { isAgentLocked: true, agentActivityId, agentLock: lock };
    }),

  acquireAgentLock: (lock) =>
    set({ isAgentLocked: true, agentActivityId: lock.activityId, agentLock: lock }),

  releaseAgentLock: (activityId) =>
    set((state) =>
      state.agentLock?.activityId === activityId
        ? { isAgentLocked: false, agentActivityId: null, agentLock: null, lastAgentFinishedActivityId: activityId }
        : state,
    ),

  resetRealtime: () =>
    set({
      realtimeStatus: "disconnected",
      presence: {},
      classLocks: {},
      remoteCursors: {},
      lastRemoteMutation: null,
      localLockedClassId: null,
      isAgentLocked: false,
      agentActivityId: null,
      agentLock: null,
      lastAgentFinishedActivityId: null,
    }),
});
