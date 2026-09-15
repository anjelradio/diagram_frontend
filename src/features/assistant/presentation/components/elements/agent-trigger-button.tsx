"use client";

import React from "react";
import type { AssistantVisualState } from "../../../domain/entities/agent-activity.entity";
import { cn } from "@/lib/utils";

export interface AgentTriggerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state?: AssistantVisualState;
}

export const AgentTriggerButton = React.forwardRef<
  HTMLButtonElement,
  AgentTriggerButtonProps
>(({ state = "idle", className, disabled = false, type = "button", ...props }, ref) => {
  const getImageSrc = () => {
    switch (state) {
      case "options_open":
        return "/assistant_states/attentiont.webp";
      case "recording":
        return "/assistant_states/listen.webp";
      case "thinking":
        return "/assistant_states/think.webp";
      case "idle":
      default:
        return "/assistant_states/base.webp";
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "w-14 h-14 rounded-2xl bg-[#1e1f23] border border-zinc-700/80 text-white hover:bg-[#282a2f] hover:border-zinc-500/80 shadow-2xl flex items-center justify-center p-1.5 transition active:scale-95 cursor-pointer select-none overflow-hidden",
        state === "thinking" && "ring-2 ring-indigo-500 animate-pulse",
        state === "recording" && "ring-2 ring-rose-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={props.title ?? "Asistente de Diagrama IA"}
      aria-label={props["aria-label"] ?? "Abrir asistente de diagrama"}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImageSrc()}
        alt="Estado del Asistente IA"
        width={46}
        height={46}
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </button>
  );
});

AgentTriggerButton.displayName = "AgentTriggerButton";
