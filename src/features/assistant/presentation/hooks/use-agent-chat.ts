"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  ChatMessage,
  ChatMessageSender,
} from "../../domain/entities/chat-message.entity";

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
  sendMessage: (text: string) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  appendTranscribedText: (transcribed: string) => void;
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

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const {
    initialOpen = false,
    initialMessages = DEFAULT_WELCOME_MESSAGES,
    currentUserId = "current-user",
    currentUserName = "Tú",
  } = options;

  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Sincronizar la hora del mensaje inicial en el cliente tras la hidratación
  useEffect(() => {
    const now = new Date();
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === "welcome-assistant-1"
          ? {
              ...msg,
              timestamp: now.toISOString(),
              formattedTime: formatSimpleTime(now),
            }
          : msg
      )
    );
  }, []);

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

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const now = new Date();
      const userSender: ChatMessageSender = {
        id: currentUserId,
        name: currentUserName,
        avatarUrl: null,
        role: "user",
      };

      const userMessage: ChatMessage = {
        id: typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: userSender,
        content: trimmed,
        timestamp: now.toISOString(),
        formattedTime: formatSimpleTime(now),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");

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
          content:
            "He recibido tu indicación. Por el momento esta es una interfaz de vista previa interactiva.",
          timestamp: aiNow.toISOString(),
          formattedTime: formatSimpleTime(aiNow),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 500);
    },
    [currentUserId, currentUserName]
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
  };
}
