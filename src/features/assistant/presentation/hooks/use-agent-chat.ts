"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../../domain/entities/chat-message.entity.ts";
import type { MultimodalDraftAttachment } from "../../domain/entities/multimodal-draft.entity.ts";
import {
  createEmptyAssistantSession,
  MAX_PENDING_AGENT_MESSAGES,
} from "../../domain/entities/agent-queue.entity.ts";
import { assistantRepositoryImpl } from "../../infrastructure/repositories/http-assistant.repository";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { useAppStore } from "@/features/shared/presentation/store/app-store";

export interface UseAgentChatOptions {
  projectId?: string;
  enabled?: boolean;
  initialOpen?: boolean;
  initialMessages?: ChatMessage[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
}

export interface UseAgentChatReturn {
  currentUserId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  messages: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  sendMessage: (text: string, attachment?: MultimodalDraftAttachment | null) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  appendTranscribedText: (transcribed: string) => void;
  draftAttachment: MultimodalDraftAttachment | null;
  setDraftAttachment: (attachment: MultimodalDraftAttachment | null) => void;
  attachImageFile: (file: File) => boolean;
  removeDraftAttachment: () => void;
  activeModalImageUrl: string | null;
  markResponseAnimationConsumed: (responseMessageId: string) => void;
  openModalImage: (url: string) => void;
  closeModalImage: () => void;
  activeMessage: ReturnType<typeof useAgentChatSession>["active"];
  pendingMessages: ReturnType<typeof useAgentChatSession>["pending"];
  isEditingPending: boolean;
  isQueueFull: boolean;
  isHistoryLoading: boolean;
  hasMoreHistory: boolean;
  isActiveUncertain: boolean;
  loadMoreMessages: () => Promise<void>;
  takePendingForEdit: (messageId: string) => void;
  removePending: (messageId: string) => void;
  discardEdit: () => void;
  stopActive: () => void;
}

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const HISTORY_PAGE_SIZE = 6;

function formatSimpleTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getWelcomeMessage(): ChatMessage {
  const now = new Date();
  return {
    id: "welcome-assistant-1",
    sender: { id: "assistant", name: "Asistente", role: "assistant" },
    content: "¡Hola! Soy tu asistente de arquitectura UML. Puedes pedirme crear clases, definir atributos o relaciones por voz, imagen o texto.",
    timestamp: now.toISOString(),
    formattedTime: formatSimpleTime(now),
  };
}

function useAgentChatSession(projectId: string) {
  const emptySession = useMemo(() => createEmptyAssistantSession(projectId), [projectId]);
  return useAppStore((state) => state.assistantSessions[projectId] ?? emptySession);
}

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const {
    projectId = "assistant-preview",
    enabled = true,
    initialOpen = false,
    initialMessages,
    currentUserId = "current-user",
    currentUserName = "Tú",
    currentUserAvatarUrl = null,
  } = options;

  const session = useAgentChatSession(projectId);
  const [isRecording, setIsRecording] = useState(false);
  const realtimeStatus = useAppStore((state) => state.realtimeStatus);
  const ensureSession = useAppStore((state) => state.ensureAssistantSession);
  const setChatOpen = useAppStore((state) => state.setAssistantChatOpen);
  const setDraftText = useAppStore((state) => state.setAssistantDraftText);
  const appendDraftText = useAppStore((state) => state.appendAssistantDraftText);
  const setDraftAttachment = useAppStore((state) => state.setAssistantDraftAttachment);
  const submitDraft = useAppStore((state) => state.submitAssistantDraft);
  const takeForEdit = useAppStore((state) => state.takeAssistantMessageForEdit);
  const removePending = useAppStore((state) => state.removeAssistantPendingMessage);
  const discardEdit = useAppStore((state) => state.discardAssistantEdit);
  const markSubmitting = useAppStore((state) => state.markAssistantMessageSubmitting);
  const acceptMessage = useAppStore((state) => state.acceptAssistantMessage);
  const markUncertain = useAppStore((state) => state.markAssistantMessageUncertain);
  const rejectMessage = useAppStore((state) => state.rejectAssistantMessage);
  const requestCancellation = useAppStore((state) => state.requestAssistantCancellation);
  const revertCancellation = useAppStore((state) => state.revertAssistantCancellation);
  const applyFinished = useAppStore((state) => state.applyAssistantMessageFinished);
  const clearResponseAnimation = useAppStore((state) => state.clearAssistantResponseAnimation);
  const recoverActive = useAppStore((state) => state.recoverAssistantActiveMessage);
  const setHistoryLoading = useAppStore((state) => state.setAssistantHistoryLoading);
  const hydrateHistory = useAppStore((state) => state.hydrateAssistantHistory);
  const setModalImage = useAppStore((state) => state.setAssistantModalImage);
  const initialLoadStarted = useRef(false);
  const activeSubmissionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    ensureSession(projectId, initialMessages?.[0]);
    if (initialOpen) setChatOpen(projectId, true);
  }, [enabled, ensureSession, initialMessages, initialOpen, projectId, setChatOpen]);

  const reconcileActive = useCallback(async () => {
    if (!enabled || projectId === "assistant-preview") return;
    const activeResult = await assistantRepositoryImpl.getActiveMessage(projectId);
    if (activeResult.ok && activeResult.data) {
      recoverActive(projectId, activeResult.data, currentUserId);
      return;
    }

    const localActive = useAppStore.getState().assistantSessions[projectId]?.active;
    if (!localActive || localActive.userId !== currentUserId) return;
    const detailResult = await assistantRepositoryImpl.getMessage(projectId, localActive.id);
    if (!detailResult.ok) return;
    if (["completed", "failed", "cancelled"].includes(detailResult.data.status)) {
      applyFinished(projectId, detailResult.data, currentUserId);
    } else {
      acceptMessage(projectId, detailResult.data, currentUserId);
    }
  }, [acceptMessage, applyFinished, currentUserId, enabled, projectId, recoverActive]);

  useEffect(() => {
    if (!enabled || projectId === "assistant-preview" || initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    let cancelled = false;
    setHistoryLoading(projectId, true);
    void Promise.all([
      assistantRepositoryImpl.listMessages({ projectId, limit: HISTORY_PAGE_SIZE, offset: 0 }),
      assistantRepositoryImpl.getActiveMessage(projectId),
    ]).then(([historyResult, activeResult]) => {
      if (cancelled) return;
      if (historyResult.ok) hydrateHistory(projectId, historyResult.data);
      else setHistoryLoading(projectId, false);
      if (activeResult.ok && activeResult.data) recoverActive(projectId, activeResult.data, currentUserId);
    });
    return () => {
      cancelled = true;
      initialLoadStarted.current = false;
    };
  }, [currentUserId, enabled, hydrateHistory, projectId, recoverActive, setHistoryLoading]);

  useEffect(() => {
    if (realtimeStatus === "connected") void reconcileActive();
  }, [realtimeStatus, reconcileActive]);

  useEffect(() => {
    const active = session.active;
    if (!enabled || projectId === "assistant-preview" || !active || active.submissionState !== "ready") return;
    if (activeSubmissionRef.current === active.id) return;
    activeSubmissionRef.current = active.id;
    markSubmitting(projectId, active.id);

    void assistantRepositoryImpl.submitMessage({
      projectId,
      messageId: active.id,
      prompt: active.text,
      image: active.attachment?.file ?? null,
    }).then(async (result) => {
      if (result.ok) {
        acceptMessage(projectId, result.data, currentUserId);
        return;
      }

      activeSubmissionRef.current = null;
      const message = result.errors[0] ?? "No se pudo aceptar el mensaje.";
      if (result.statusCode === 409) {
        const existing = await assistantRepositoryImpl.getMessage(projectId, active.id);
        if (existing.ok && existing.data.userId === currentUserId) {
          acceptMessage(projectId, existing.data, currentUserId);
          return;
        }
        if (existing.ok || existing.statusCode === 404) {
          rejectMessage(projectId, active.id, message);
          appToast.error(message);
          return;
        }
      }
      if (result.statusCode >= 400 && result.statusCode < 500 && result.statusCode !== 409) {
        rejectMessage(projectId, active.id, message);
        appToast.error(message);
        return;
      }

      markUncertain(projectId, active.id);
      appToast.error("No pude confirmar si el mensaje se aceptó. Consultaré el estado sin reenviarlo.");
      void reconcileActive();
    });
  }, [acceptMessage, currentUserId, enabled, markSubmitting, markUncertain, projectId, reconcileActive, rejectMessage, session.active]);

  const setIsOpen = useCallback((open: boolean) => setChatOpen(projectId, open), [projectId, setChatOpen]);
  const toggleOpen = useCallback(() => setChatOpen(projectId, !session.isOpen), [projectId, session.isOpen, setChatOpen]);
  const setInputText = useCallback((text: string) => setDraftText(projectId, text), [projectId, setDraftText]);
  const appendTranscribedText = useCallback((text: string) => appendDraftText(projectId, text), [appendDraftText, projectId]);

  const attachImageFile = useCallback((file: File): boolean => {
    if (!file) return false;
    const mimeType = file.type.toLowerCase();
    if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      appToast.error("Formato no compatible. Usa PNG, JPEG o WEBP.");
      return false;
    }
    if (file.size === 0) {
      appToast.error("El archivo seleccionado está vacío.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      appToast.error("La imagen excede el tamaño máximo permitido (10 MB).");
      return false;
    }
    setDraftAttachment(projectId, {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type || "image/png",
      sizeBytes: file.size,
    });
    return true;
  }, [projectId, setDraftAttachment]);

  const sendMessage = useCallback((text: string, attachment?: MultimodalDraftAttachment | null) => {
    setDraftText(projectId, text);
    if (attachment !== undefined && attachment !== session.draft.attachment) setDraftAttachment(projectId, attachment);
    if (!text.trim()) {
      appToast.error("Escribe una instrucción antes de enviar la imagen.");
      return;
    }
    submitDraft(projectId, currentUserId, currentUserName, currentUserAvatarUrl);
  }, [currentUserAvatarUrl, currentUserId, currentUserName, projectId, session.draft.attachment, setDraftAttachment, setDraftText, submitDraft]);

  const stopActive = useCallback(() => {
    const active = useAppStore.getState().assistantSessions[projectId]?.active;
    if (!active || active.status !== "running") return;
    requestCancellation(projectId, active.id);
    void assistantRepositoryImpl.cancelMessage(projectId, active.id).then((result) => {
      if (!result.ok) {
        if (result.statusCode === 404 && active.submissionState === "uncertain") {
          rejectMessage(projectId, active.id, "La solicitud no llegó al servidor. Puedes volver a enviarla.");
          return;
        }
        revertCancellation(projectId, active.id);
        appToast.error(result.errors[0] ?? "No se pudo solicitar la cancelación.");
        return;
      }
      if (["completed", "failed", "cancelled"].includes(result.data.status)) {
        applyFinished(projectId, result.data, currentUserId);
      } else {
        acceptMessage(projectId, result.data, currentUserId);
      }
    });
  }, [acceptMessage, applyFinished, currentUserId, projectId, rejectMessage, requestCancellation, revertCancellation]);

  const markResponseAnimationConsumed = useCallback(
    (responseMessageId: string) => clearResponseAnimation(projectId, responseMessageId),
    [clearResponseAnimation, projectId]
  );

  const loadMoreMessages = useCallback(async () => {
    const current = useAppStore.getState().assistantSessions[projectId];
    if (!current?.historyHasMore || current.historyLoading || !current.historySnapshotAt) return;
    setHistoryLoading(projectId, true);
    const result = await assistantRepositoryImpl.listMessages({
      projectId,
      limit: HISTORY_PAGE_SIZE,
      offset: current.historyNextOffset,
      snapshotAt: current.historySnapshotAt,
    });
    if (result.ok) hydrateHistory(projectId, result.data, true);
    else {
      setHistoryLoading(projectId, false);
      appToast.error(result.errors[0] ?? "No se pudo cargar más historial.");
    }
  }, [hydrateHistory, projectId, setHistoryLoading]);

  return {
    currentUserId,
    isOpen: session.isOpen,
    setIsOpen,
    toggleOpen,
    messages: session.messages,
    inputText: session.draft.text,
    setInputText,
    sendMessage,
    isRecording,
    toggleRecording: useCallback(() => setIsRecording((value) => !value), []),
    appendTranscribedText,
    draftAttachment: session.draft.attachment,
    setDraftAttachment: useCallback((attachment) => setDraftAttachment(projectId, attachment), [projectId, setDraftAttachment]),
    attachImageFile,
    removeDraftAttachment: useCallback(() => setDraftAttachment(projectId, null), [projectId, setDraftAttachment]),
    activeModalImageUrl: session.activeModalImageUrl,
    markResponseAnimationConsumed,
    openModalImage: useCallback((url) => setModalImage(projectId, url), [projectId, setModalImage]),
    closeModalImage: useCallback(() => setModalImage(projectId, null), [projectId, setModalImage]),
    activeMessage: session.active,
    pendingMessages: session.pending,
    isEditingPending: Boolean(session.draft.editingMessageId),
    isQueueFull: session.pending.length >= MAX_PENDING_AGENT_MESSAGES,
    isHistoryLoading: session.historyLoading,
    hasMoreHistory: session.historyHasMore,
    isActiveUncertain: session.active?.submissionState === "uncertain",
    loadMoreMessages,
    takePendingForEdit: useCallback((messageId) => takeForEdit(projectId, messageId), [projectId, takeForEdit]),
    removePending: useCallback((messageId) => removePending(projectId, messageId), [projectId, removePending]),
    discardEdit: useCallback(() => discardEdit(projectId), [discardEdit, projectId]),
    stopActive,
  };
}
