"use client";

import React, { useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/assistant/domain/entities/chat-message.entity";

export interface AgentAiMessageProps {
  /** Mensaje de la IA */
  message: ChatMessage;
  /** Clases CSS opcionales */
  className?: string;
  onAnimationConsumed?: (responseMessageId: string) => void;
}

export function AgentAiMessage({ message, className, onAnimationConsumed }: AgentAiMessageProps) {
  const animationConsumedRef = useRef(false);
  const consumeAnimation = useCallback(() => {
    if (animationConsumedRef.current) return;
    animationConsumedRef.current = true;
    onAnimationConsumed?.(message.id);
  }, [message.id, onAnimationConsumed]);

  useEffect(() => {
    if (!message.animateResponse) return;
    animationConsumedRef.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(consumeAnimation);
      return () => window.cancelAnimationFrame(frame);
    }
    const fallback = window.setTimeout(consumeAnimation, 350);
    return () => window.clearTimeout(fallback);
  }, [consumeAnimation, message.animateResponse]);

  return (
    <div
      className={cn(
        "group relative flex flex-col my-2 max-w-full items-start text-left select-text",
        message.animateResponse && "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
        className
      )}
      onAnimationEnd={consumeAnimation}
    >
      <div className="max-w-none break-words px-1 text-sm leading-relaxed text-zinc-200 [&_p]:my-2 [&_h1]:my-3 [&_h2]:my-3 [&_h3]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/30 [&_pre]:p-3 [&_code]:rounded [&_code]:bg-black/20 [&_code]:px-1 [&_a]:text-cyan-300 [&_a]:underline">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Fecha/hora en hover */}
      <div
        suppressHydrationWarning
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-zinc-500 mt-1 px-1 select-none"
      >
        {message.formattedTime}
      </div>
    </div>
  );
}
