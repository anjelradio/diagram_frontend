export type AgentMessageStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "queued"
  | "partial";

export interface AgentMessage {
  id: string;
  projectId: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  prompt: string;
  imageUrl: string | null;
  status: AgentMessageStatus;
  cancelRequested: boolean;
  responseMarkdown: string | null;
  createdAt: string;
}

export interface AgentMessagePage {
  items: AgentMessage[];
  limit: number;
  offset: number;
  nextOffset: number | null;
  hasMore: boolean;
  snapshotAt: string;
}

export function formatAgentMessageTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
