import type { ChatMessage } from "./chat-message.entity";
import type { MultimodalDraftAttachment } from "./multimodal-draft.entity";

export type AgentQueueMessageStatus =
  | "queued"
  | "running"
  | "cancelling"
  | "completed"
  | "cancelled"
  | "failed";

export interface AgentDraft {
  text: string;
  attachment: MultimodalDraftAttachment | null;
  editingMessageId: string | null;
}

export interface AgentQueueMessage {
  id: string;
  projectId: string;
  text: string;
  attachment: MultimodalDraftAttachment | null;
  status: AgentQueueMessageStatus;
  runId: string | null;
  submissionState?: "ready" | "submitting" | "accepted" | "uncertain";
  userId?: string;
  userName?: string;
  userAvatarUrl?: string | null;
}

export interface AssistantConversationSession {
  projectId: string;
  isOpen: boolean;
  messages: ChatMessage[];
  draft: AgentDraft;
  parkedDraft: AgentDraft | null;
  active: AgentQueueMessage | null;
  pending: AgentQueueMessage[];
  activeModalImageUrl: string | null;
  historyInitialized: boolean;
  historyLoading: boolean;
  historyHasMore: boolean;
  historyNextOffset: number;
  historySnapshotAt: string | null;
}

export const MAX_PENDING_AGENT_MESSAGES = 3;

export function createEmptyAgentDraft(): AgentDraft {
  return { text: "", attachment: null, editingMessageId: null };
}

export function createEmptyAssistantSession(projectId = ""): AssistantConversationSession {
  return {
    projectId,
    isOpen: false,
    messages: [],
    draft: createEmptyAgentDraft(),
    parkedDraft: null,
    active: null,
    pending: [],
    activeModalImageUrl: null,
    historyInitialized: false,
    historyLoading: false,
    historyHasMore: false,
    historyNextOffset: 0,
    historySnapshotAt: null,
  };
}
