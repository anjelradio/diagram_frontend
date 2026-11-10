import type { StateCreator } from "zustand";
import type { AgentMessage, AgentMessagePage } from "../../domain/entities/agent-message.entity.ts";
import { formatAgentMessageTime } from "../../domain/entities/agent-message.entity.ts";
import type {
  AgentActivityCode,
  AgentActivityType,
} from "../../domain/entities/agent-activity.entity.ts";
import { getAgentActivityType } from "../../domain/entities/agent-activity.entity.ts";
import type {
  AgentDraft,
  AgentQueueMessage,
  AssistantConversationSession,
} from "../../domain/entities/agent-queue.entity.ts";
import {
  createEmptyAgentDraft,
  createEmptyAssistantSession,
  MAX_PENDING_AGENT_MESSAGES,
} from "../../domain/entities/agent-queue.entity.ts";
import type { ChatMessage, ChatMessageAttachment } from "../../domain/entities/chat-message.entity.ts";
import type { MultimodalDraftAttachment } from "../../domain/entities/multimodal-draft.entity.ts";

type AgentChatSlice = {
  assistantSessions: Record<string, AssistantConversationSession>;
  ensureAssistantSession: (projectId: string, welcomeMessage?: ChatMessage) => void;
  clearAssistantSession: (projectId: string) => void;
  setAssistantChatOpen: (projectId: string, isOpen: boolean) => void;
  setAssistantDraftText: (projectId: string, text: string) => void;
  appendAssistantDraftText: (projectId: string, text: string) => void;
  setAssistantDraftAttachment: (projectId: string, attachment: MultimodalDraftAttachment | null) => void;
  clearAssistantDraft: (projectId: string) => void;
  takeAssistantMessageForEdit: (projectId: string, messageId: string) => void;
  discardAssistantEdit: (projectId: string) => void;
  removeAssistantPendingMessage: (projectId: string, messageId: string) => void;
  submitAssistantDraft: (projectId: string, userId: string, userName: string, userAvatarUrl?: string | null) => boolean;
  markAssistantMessageSubmitting: (projectId: string, messageId: string) => void;
  acceptAssistantMessage: (projectId: string, message: AgentMessage, currentUserId: string) => void;
  markAssistantMessageUncertain: (projectId: string, messageId: string) => void;
  rejectAssistantMessage: (projectId: string, messageId: string, reason: string) => void;
  requestAssistantCancellation: (projectId: string, messageId: string) => void;
  revertAssistantCancellation: (projectId: string, messageId: string) => void;
  applyAssistantMessageFinished: (projectId: string, message: AgentMessage, currentUserId: string) => void;
  clearAssistantResponseAnimation: (projectId: string, responseMessageId: string) => void;
  applyAssistantMessageActivity: (projectId: string, activity: {
    projectId: string;
    messageId: string;
    attemptId: string;
    sequence: number;
    activityCode: AgentActivityCode;
    activityType?: AgentActivityType | null;
    occurredAt: string;
  }) => void;
  setAssistantActivityConnection: (projectId: string, connected: boolean) => void;
  recoverAssistantActiveMessage: (projectId: string, message: AgentMessage, currentUserId: string) => void;
  setAssistantHistoryLoading: (projectId: string, loading: boolean) => void;
  hydrateAssistantHistory: (projectId: string, page: AgentMessagePage, appendOlder?: boolean) => void;
  setAssistantModalImage: (projectId: string, url: string | null) => void;
};

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function collectObjectUrls(session: AssistantConversationSession): Set<string> {
  const urls = new Set<string>();
  const addAttachment = (attachment: MultimodalDraftAttachment | null) => {
    if (attachment?.previewUrl.startsWith("blob:")) urls.add(attachment.previewUrl);
  };
  addAttachment(session.draft.attachment);
  addAttachment(session.parkedDraft?.attachment ?? null);
  addAttachment(session.active?.attachment ?? null);
  session.pending.forEach((message) => addAttachment(message.attachment));
  session.messages.forEach((message) =>
    message.attachments?.forEach((attachment) => {
      if (attachment.url.startsWith("blob:")) urls.add(attachment.url);
    })
  );
  if (session.activeModalImageUrl?.startsWith("blob:")) urls.add(session.activeModalImageUrl);
  return urls;
}

function releaseUnusedUrls(previous: AssistantConversationSession, next: AssistantConversationSession) {
  if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") return;
  const nextUrls = collectObjectUrls(next);
  collectObjectUrls(previous).forEach((url) => {
    if (!nextUrls.has(url)) URL.revokeObjectURL(url);
  });
}

function projectAgentMessage(message: AgentMessage, animateResponse = false): ChatMessage[] {
  const timestamp = message.createdAt;
  const formattedTime = formatAgentMessageTime(timestamp);
  const attachment: ChatMessageAttachment | undefined = message.imageUrl
    ? {
        id: `${message.id}:image`,
        type: "image",
        url: message.imageUrl,
        name: "Imagen adjunta",
      }
    : undefined;
  const promptMessage: ChatMessage = {
    id: message.id,
    serverMessageId: message.id,
    sender: { id: message.userId, name: message.authorName, avatarUrl: message.authorAvatarUrl ?? null, role: "user" },
    content: message.prompt,
    timestamp,
    formattedTime,
    attachments: attachment ? [attachment] : undefined,
    status: message.status,
    cancelRequested: message.cancelRequested,
    responseMarkdown: message.responseMarkdown,
  };
  if (!message.responseMarkdown) return [promptMessage];

  return [
    promptMessage,
    {
      id: `${message.id}:response`,
      serverMessageId: message.id,
      sender: { id: "assistant", name: "Asistente", role: "assistant" },
      content: message.responseMarkdown,
      timestamp,
      formattedTime,
      status: message.status,
      animateResponse,
    },
  ];
}

function upsertServerMessage(
  messages: ChatMessage[],
  message: AgentMessage,
  animateResponse = false
): ChatMessage[] {
  const terminalStatuses = new Set(["completed", "failed", "cancelled"]);
  const existingPrompt = messages.find((item) => item.id === message.id);
  if (existingPrompt?.status && terminalStatuses.has(existingPrompt.status)) return messages;
  const next = messages.filter(
    (item) => item.id !== message.id && item.serverMessageId !== message.id
  );
  const projected = projectAgentMessage(message, animateResponse).map((item) => {
    if (item.id !== message.id || !existingPrompt || message.status !== "running") return item;
    return {
      ...item,
      activityCode: existingPrompt.activityCode,
      activityType: existingPrompt.activityType,
      activityAttemptId: existingPrompt.activityAttemptId,
      activitySequence: existingPrompt.activitySequence,
      activityOccurredAt: existingPrompt.activityOccurredAt,
      activityStale: existingPrompt.activityStale,
    };
  });
  next.push(...projected);
  return next.sort((left, right) => {
    const timeOrder = new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
    if (timeOrder !== 0) return timeOrder;
    if (left.id === message.id) return -1;
    if (right.id === message.id) return 1;
    return left.id.localeCompare(right.id);
  });
}

function createOptimisticMessage(message: AgentQueueMessage): ChatMessage {
  const now = new Date();
  const attachment: ChatMessageAttachment | undefined = message.attachment
    ? {
        id: message.attachment.id,
        type: "image",
        url: message.attachment.previewUrl,
        name: message.attachment.name,
        sizeBytes: message.attachment.sizeBytes,
      }
    : undefined;
  return {
    id: message.id,
    sender: {
      id: message.userId ?? "current-user",
      name: message.userName ?? "Tú",
      avatarUrl: message.userAvatarUrl ?? null,
      role: "user",
    },
    content: message.text,
    timestamp: now.toISOString(),
    formattedTime: formatTime(now),
    attachments: attachment ? [attachment] : undefined,
    status: "running",
  };
}

function startQueuedMessage(message: AgentQueueMessage): AgentQueueMessage {
  return {
    ...message,
    status: "running",
    runId: message.id,
    submissionState: "ready",
  };
}

function toAgentMessage(
  draft: AgentDraft,
  projectId: string,
  userId: string,
  userName: string,
  userAvatarUrl?: string | null
): AgentQueueMessage {
  return {
    id: createId(),
    projectId,
    text: draft.text.trim(),
    attachment: draft.attachment,
    status: "queued",
    runId: null,
    submissionState: "ready",
    userId,
    userName,
    userAvatarUrl,
  };
}

function resolveSession(
  sessions: Record<string, AssistantConversationSession>,
  projectId: string
): AssistantConversationSession {
  return sessions[projectId] ?? createEmptyAssistantSession(projectId);
}

function promoteNext(session: AssistantConversationSession): AssistantConversationSession {
  const [nextPending, ...pending] = session.pending;
  if (!nextPending) return { ...session, active: null, pending };
  const active = startQueuedMessage(nextPending);
  return {
    ...session,
    active,
    pending,
    messages: [...session.messages, createOptimisticMessage(active)],
  };
}

export const createAgentChatSlice: StateCreator<AgentChatSlice> = (set) => ({
  assistantSessions: {},

  ensureAssistantSession: (projectId, welcomeMessage) =>
    set((state) => {
      if (state.assistantSessions[projectId]) return state;
      const session = createEmptyAssistantSession(projectId);
      if (welcomeMessage) session.messages = [welcomeMessage];
      return { assistantSessions: { ...state.assistantSessions, [projectId]: session } };
    }),

  clearAssistantSession: (projectId) =>
    set((state) => {
      const session = state.assistantSessions[projectId];
      if (!session) return state;
      collectObjectUrls(session).forEach((url) => {
        if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
      });
      const assistantSessions = { ...state.assistantSessions };
      delete assistantSessions[projectId];
      return { assistantSessions };
    }),

  setAssistantChatOpen: (projectId, isOpen) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, isOpen } } };
    }),

  setAssistantDraftText: (projectId, text) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, draft: { ...session.draft, text } } } };
    }),

  appendAssistantDraftText: (projectId, text) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const cleanText = text.trim();
      if (!cleanText) return state;
      const current = session.draft.text.trim();
      return {
        assistantSessions: {
          ...state.assistantSessions,
          [projectId]: { ...session, draft: { ...session.draft, text: current ? `${current} ${cleanText}` : cleanText } },
        },
      };
    }),

  setAssistantDraftAttachment: (projectId, attachment) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const next = { ...session, draft: { ...session.draft, attachment } };
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  clearAssistantDraft: (projectId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const next = {
        ...session,
        draft: createEmptyAgentDraft(),
        parkedDraft: session.draft.editingMessageId ? session.parkedDraft : null,
      };
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  takeAssistantMessageForEdit: (projectId, messageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const message = session.pending.find((item) => item.id === messageId);
      if (!message) return state;
      const next = {
        ...session,
        pending: session.pending.filter((item) => item.id !== messageId),
        draft: { text: message.text, attachment: message.attachment, editingMessageId: message.id },
        parkedDraft: null,
      };
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  discardAssistantEdit: (projectId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const next = { ...session, draft: createEmptyAgentDraft(), parkedDraft: null };
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  removeAssistantPendingMessage: (projectId, messageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const next = { ...session, pending: session.pending.filter((item) => item.id !== messageId) };
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  submitAssistantDraft: (projectId, userId, userName, userAvatarUrl) => {
    let submitted = false;
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const text = session.draft.text.trim();
      if (!text || (session.active && session.pending.length >= MAX_PENDING_AGENT_MESSAGES)) return state;
      const queueMessage = toAgentMessage({ ...session.draft, text }, projectId, userId, userName, userAvatarUrl);
      const next = { ...session, draft: createEmptyAgentDraft(), parkedDraft: null };
      if (session.active) next.pending = [...session.pending, queueMessage];
      else {
        next.active = startQueuedMessage(queueMessage);
        next.messages = [...session.messages, createOptimisticMessage(next.active)];
      }
      submitted = true;
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    });
    return submitted;
  },

  markAssistantMessageSubmitting: (projectId, messageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      if (!session.active || session.active.id !== messageId || session.active.submissionState !== "ready") return state;
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, active: { ...session.active, submissionState: "submitting" } } } };
    }),

  acceptAssistantMessage: (projectId, message, currentUserId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      let next = { ...session, messages: upsertServerMessage(session.messages, message) };
      if (message.userId === currentUserId && session.active?.id === message.id) {
        next.active = {
          ...session.active,
          status: message.cancelRequested ? "cancelling" : message.status === "cancelled" ? "cancelled" : "running",
          submissionState: "accepted",
        };
        if (["completed", "failed", "cancelled"].includes(message.status)) next = promoteNext(next);
      }
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  markAssistantMessageUncertain: (projectId, messageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      if (session.active?.id !== messageId) return state;
      const messages = session.messages.map((message) =>
        message.id === messageId ? { ...message, status: "uncertain" as const } : message
      );
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages, active: { ...session.active, submissionState: "uncertain" } } } };
    }),

  rejectAssistantMessage: (projectId, messageId, reason) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      if (session.active?.id !== messageId) return state;
      const now = new Date();
      const notice: ChatMessage = {
        id: `${messageId}:rejected`,
        sender: { id: "assistant", name: "Asistente", role: "assistant" },
        content: reason,
        timestamp: now.toISOString(),
        formattedTime: formatTime(now),
        status: "failed",
      };
      const messages = session.messages.map((message) =>
        message.id === messageId ? { ...message, status: "failed" as const } : message
      );
      const next = promoteNext({ ...session, messages: [...messages, notice] });
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  requestAssistantCancellation: (projectId, messageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      if (session.active?.id !== messageId || session.active.status !== "running") return state;
      const messages = session.messages.map((message) =>
        message.id === messageId ? { ...message, status: "running" as const, cancelRequested: true } : message
      );
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages, active: { ...session.active, status: "cancelling" } } } };
    }),

  revertAssistantCancellation: (projectId, messageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      if (session.active?.id !== messageId || session.active.status !== "cancelling") return state;
      const messages = session.messages.map((message) =>
        message.id === messageId
          ? { ...message, status: session.active?.submissionState === "uncertain" ? "uncertain" as const : "running" as const, cancelRequested: false }
          : message
      );
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages, active: { ...session.active, status: "running" } } } };
    }),

  applyAssistantMessageFinished: (projectId, message, currentUserId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      let next = { ...session, messages: upsertServerMessage(session.messages, message, true) };
      if (message.userId === currentUserId && session.active?.id === message.id) next = promoteNext(next);
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  clearAssistantResponseAnimation: (projectId, responseMessageId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const messages = session.messages.map((message) =>
        message.id === responseMessageId && message.animateResponse
          ? { ...message, animateResponse: false }
          : message
      );
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages } } };
    }),

  applyAssistantMessageActivity: (projectId, activity) =>
    set((state) => {
      if (activity.projectId !== projectId || activity.sequence < 1) return state;
      const session = resolveSession(state.assistantSessions, projectId);
      const existing = session.messages.find(
        (message) => message.id === activity.messageId && message.sender.role !== "assistant"
      );
      if (!existing || existing.status !== "running") return state;
      if (
        existing.activityAttemptId === activity.attemptId &&
        (existing.activitySequence ?? 0) >= activity.sequence
      ) return state;
      const currentAt = existing.activityOccurredAt
        ? Date.parse(existing.activityOccurredAt)
        : Number.NEGATIVE_INFINITY;
      const incomingAt = Date.parse(activity.occurredAt);
      if (existing.activityAttemptId && existing.activityAttemptId !== activity.attemptId) {
        if (!Number.isFinite(incomingAt) || !Number.isFinite(currentAt) || incomingAt === currentAt) {
          const messages = session.messages.map((message) =>
            message.id === activity.messageId
              ? {
                  ...message,
                  activityCode: null,
                  activityType: null,
                  activityAttemptId: null,
                  activitySequence: 0,
                  activityOccurredAt: null,
                  activityStale: false,
                }
              : message
          );
          return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages } } };
        }
        if (incomingAt < currentAt) return state;
      }
      const messages = session.messages.map((message) =>
        message.id === activity.messageId
          ? {
              ...message,
              activityCode: activity.activityCode,
              activityType:
                activity.activityType ??
                (activity.activityCode ? getAgentActivityType(activity.activityCode) : null),
              activityAttemptId: activity.attemptId,
              activitySequence: activity.sequence,
              activityOccurredAt: activity.occurredAt,
              activityStale: false,
            }
          : message
      );
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages } } };
    }),

  setAssistantActivityConnection: (projectId, connected) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const messages = session.messages.map((message) =>
        message.status === "running" && message.sender.role !== "assistant"
          ? { ...message, activityCode: null, activityType: null, activityStale: !connected }
          : message
      );
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, messages } } };
    }),

  recoverAssistantActiveMessage: (projectId, message, currentUserId) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const next = { ...session, messages: upsertServerMessage(session.messages, message) };
      if (message.userId === currentUserId && !session.active && message.status === "running") {
        next.active = {
          id: message.id,
          projectId,
          text: message.prompt,
          attachment: null,
          status: message.cancelRequested ? "cancelling" : "running",
          runId: message.id,
          submissionState: "accepted",
          userId: message.userId,
          userName: message.authorName,
        };
      }
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  setAssistantHistoryLoading: (projectId, loading) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: { ...session, historyLoading: loading } } };
    }),

  hydrateAssistantHistory: (projectId, page, appendOlder = false) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const historical = page.items.slice().reverse().flatMap((message) => projectAgentMessage(message));
      const historicalIds = new Set(page.items.map(({ id }) => id));
      const localOptimistic = session.messages.filter(
        (message) => !message.serverMessageId && !historicalIds.has(message.id) && message.sender.role !== "assistant"
      );
      const messages = appendOlder
        ? [...historical, ...session.messages].filter((message, index, all) => all.findIndex((item) => item.id === message.id) === index)
        : [...historical, ...localOptimistic];
      const next = {
        ...session,
        messages: messages.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()),
        historyInitialized: true,
        historyLoading: false,
        historyHasMore: page.hasMore,
        historyNextOffset: page.nextOffset ?? page.offset + page.items.length,
        historySnapshotAt: page.snapshotAt,
      };
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),

  setAssistantModalImage: (projectId, url) =>
    set((state) => {
      const session = resolveSession(state.assistantSessions, projectId);
      const next = { ...session, activeModalImageUrl: url };
      releaseUnusedUrls(session, next);
      return { assistantSessions: { ...state.assistantSessions, [projectId]: next } };
    }),
});

export type { AgentChatSlice };
