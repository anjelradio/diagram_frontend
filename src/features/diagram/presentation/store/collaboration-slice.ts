import type { StateCreator } from "zustand";
import type {
  ClassLock,
  DiagramMutation,
  PresenceUser,
  RemoteCursor,
} from "../../domain/entities/collaboration.entity";

export type CollaborationConnectionStatus = "disconnected" | "connecting" | "connected";

export type CollaborationSlice = {
  collaborationStatus: CollaborationConnectionStatus;
  presence: Record<string, PresenceUser>;
  classLocks: Record<string, ClassLock>;
  remoteCursors: Record<string, RemoteCursor>;
  lastRemoteMutation: DiagramMutation | null;
  setCollaborationStatus: (status: CollaborationConnectionStatus) => void;
  setPresence: (users: PresenceUser[]) => void;
  upsertPresence: (user: PresenceUser) => void;
  removePresence: (userId: string) => void;
  setClassLock: (lock: ClassLock) => void;
  removeClassLock: (classId: string) => void;
  setRemoteCursor: (cursor: RemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  setLastRemoteMutation: (mutation: DiagramMutation | null) => void;
  resetCollaboration: () => void;
};

export const createCollaborationSlice: StateCreator<CollaborationSlice> = (set) => ({
  collaborationStatus: "disconnected",
  presence: {},
  classLocks: {},
  remoteCursors: {},
  lastRemoteMutation: null,
  setCollaborationStatus: (collaborationStatus) => set({ collaborationStatus }),
  setPresence: (users) => set({ presence: Object.fromEntries(users.map((u) => [u.userId, u])) }),
  upsertPresence: (user) => set((s) => ({ presence: { ...s.presence, [user.userId]: user } })),
  removePresence: (userId) => set((s) => {
    const presence = { ...s.presence };
    delete presence[userId];
    return { presence };
  }),
  setClassLock: (lock) => set((s) => ({ classLocks: { ...s.classLocks, [lock.classId]: lock } })),
  removeClassLock: (classId) => set((s) => {
    const classLocks = { ...s.classLocks };
    delete classLocks[classId];
    return { classLocks };
  }),
  setRemoteCursor: (cursor) => set((s) => ({ remoteCursors: { ...s.remoteCursors, [cursor.userId]: cursor } })),
  removeRemoteCursor: (userId) => set((s) => {
    const remoteCursors = { ...s.remoteCursors };
    delete remoteCursors[userId];
    return { remoteCursors };
  }),
  setLastRemoteMutation: (lastRemoteMutation) => set({ lastRemoteMutation }),
  resetCollaboration: () => set({ collaborationStatus: "disconnected", presence: {}, classLocks: {}, remoteCursors: {}, lastRemoteMutation: null }),
});
