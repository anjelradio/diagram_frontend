"use client";

import { useState, useCallback } from "react";
import type {
  ChatMessage,
  ChatMessageSender,
  ChatMessageAttachment,
} from "../../domain/entities/chat-message.entity";
import type { MultimodalDraftAttachment } from "../../domain/entities/multimodal-draft.entity";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

export interface UseAgentChatOptions {
  initialOpen?: boolean;
  initialMessages?: ChatMessage[];
  currentUserId?: string;
  currentUserName?: string;
}

export interface UseAgentChatReturn {
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
  openModalImage: (url: string) => void;
  closeModalImage: () => void;
}

function formatSimpleTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DEFAULT_WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-assistant-1",
    sender: {
      id: "assistant",
      name: "Asistente",
      role: "assistant",
    },
    content:
      "¡Hola! Soy tu asistente de arquitectura UML. Puedes pedirme crear clases, definir atributos o relaciones por voz, imagen o texto.",
    timestamp: "2026-01-01T00:00:00.000Z",
    formattedTime: "12:00 PM",
  },
];

const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const {
    initialOpen = false,
    initialMessages = DEFAULT_WELCOME_MESSAGES,
    currentUserId = "current-user",
    currentUserName = "Tú",
  } = options;

  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const now = new Date();
    return initialMessages.map((msg) =>
      msg.id === "welcome-assistant-1"
        ? {
            ...msg,
            timestamp: now.toISOString(),
            formattedTime: formatSimpleTime(now),
          }
        : msg
    );
  });
  const [inputText, setInputText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [draftAttachment, setDraftAttachment] = useState<MultimodalDraftAttachment | null>(null);
  const [activeModalImageUrl, setActiveModalImageUrl] = useState<string | null>(null);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  const appendTranscribedText = useCallback((transcribed: string) => {
    const cleanTranscribed = transcribed.trim();
    if (!cleanTranscribed) return;

    setInputText((prev) => {
      const cleanPrev = prev.trim();
      return cleanPrev ? `${cleanPrev} ${cleanTranscribed}` : cleanTranscribed;
    });
  }, []);

  const attachImageFile = useCallback((file: File): boolean => {
    if (!file) return false;

    const mimeType = file.type.toLowerCase();
    if (
      !SUPPORTED_IMAGE_TYPES.includes(mimeType) &&
      !mimeType.startsWith("image/")
    ) {
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

    setDraftAttachment((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        name: file.name,
        mimeType: file.type || "image/png",
        sizeBytes: file.size,
      };
    });

    return true;
  }, []);

  const removeDraftAttachment = useCallback(() => {
    setDraftAttachment((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  }, []);

  const openModalImage = useCallback((url: string) => {
    setActiveModalImageUrl(url);
  }, []);

  const closeModalImage = useCallback(() => {
    setActiveModalImageUrl(null);
  }, []);

  const sendMessage = useCallback(
    (text: string, attachment?: MultimodalDraftAttachment | null) => {
      const trimmed = text.trim();
      const currentAttachment = attachment !== undefined ? attachment : draftAttachment;

      if (!trimmed && !currentAttachment) return;

      const now = new Date();
      const userSender: ChatMessageSender = {
        id: currentUserId,
        name: currentUserName,
        avatarUrl: null,
        role: "user",
      };

      const attachments: ChatMessageAttachment[] = currentAttachment
        ? [
            {
              id: currentAttachment.id,
              type: "image",
              url: currentAttachment.previewUrl,
              name: currentAttachment.name,
              sizeBytes: currentAttachment.sizeBytes,
            },
          ]
        : [];

      const userMessage: ChatMessage = {
        id: typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: userSender,
        content: trimmed,
        timestamp: now.toISOString(),
        formattedTime: formatSimpleTime(now),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setDraftAttachment(null);

      // Simulación de respuesta minimalista del asistente
      setTimeout(() => {
        const aiNow = new Date();
        const aiMessage: ChatMessage = {
          id: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `msg-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sender: {
            id: "assistant",
            name: "Asistente IA",
            role: "assistant",
          },
          content: attachments.length > 0
            ? "He recibido tu imagen y la indicación. Analizando estructura visual del diagrama..."
            : "He recibido tu indicación. Por el momento esta es una interfaz de vista previa interactiva.",
          timestamp: aiNow.toISOString(),
          formattedTime: formatSimpleTime(aiNow),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 500);
    },
    [currentUserId, currentUserName, draftAttachment]
  );

  return {
    isOpen,
    setIsOpen,
    toggleOpen,
    messages,
    inputText,
    setInputText,
    sendMessage,
    isRecording,
    toggleRecording,
    appendTranscribedText,
    draftAttachment,
    setDraftAttachment,
    attachImageFile,
    removeDraftAttachment,
    activeModalImageUrl,
    openModalImage,
    closeModalImage,
  };
}
