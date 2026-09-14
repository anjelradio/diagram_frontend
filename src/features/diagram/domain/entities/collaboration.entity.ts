export type CollaborationRole = "OWNER" | "EDITOR" | "READER";

export type PresenceUser = {
  userId: string;
  userName: string;
  role: CollaborationRole;
};

export type ClassLock = {
  classId: string;
  userId: string;
  userName: string;
  lockedAt: string;
  expiresAt: string;
};

export type RemoteCursor = {
  userId: string;
  userName: string;
  x: number;
  y: number;
  updatedAt: number;
};

export type DiagramMutation = {
  operationType: string;
  data: Record<string, unknown>;
  senderId: string;
};
