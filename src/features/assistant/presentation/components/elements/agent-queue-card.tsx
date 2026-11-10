"use client";

import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentQueueMessage } from "@/features/assistant/domain/entities/agent-queue.entity";

type AgentQueueCardProps = {
  messages: AgentQueueMessage[];
  onEdit: (messageId: string) => void;
  onRemove: (messageId: string) => void;
  isEditingPending?: boolean;
  className?: string;
};

export function AgentQueueCard({ messages, onEdit, onRemove, className }: AgentQueueCardProps) {
  if (messages.length === 0) return null;

  return (
    <section
      aria-label={`Mensajes en espera: ${messages.length} de 3`}
      className={cn(
        "relative z-10 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#191a1d]/95 p-2.5 text-zinc-100 shadow-xl backdrop-blur-md",
        className
      )}
    >
      <div className="mb-1.5 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-zinc-200">En espera</h2>
        <span className="text-[11px] tabular-nums text-zinc-400">{messages.length}/3</span>
      </div>
      <ol className="divide-y divide-white/[0.06]" aria-live="polite" aria-relevant="additions removals">
        {messages.map((message, index) => (
          <li key={message.id} className="flex min-w-0 items-center gap-2 px-1 py-1.5">
            <span className="w-4 shrink-0 text-center text-[11px] tabular-nums text-zinc-500" aria-label={`Posición ${index + 1}`}>
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {message.attachment && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] text-zinc-300">
                  <ImageIcon className="size-3" aria-hidden="true" />
                  Imagen
                </span>
              )}
              <span className="min-w-0 truncate text-xs text-zinc-200" title={message.text || "Imagen adjunta"}>
                {message.text || "Imagen adjunta"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEdit(message.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label={`Editar mensaje en espera ${index + 1}`}
              title="Editar"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(message.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label={`Eliminar mensaje en espera ${index + 1}`}
              title="Eliminar"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
