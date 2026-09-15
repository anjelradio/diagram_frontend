"use client";

import React from "react";
import { Image as ImageIcon, Mic, Radio } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgentOptionsDropdownProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isRecording: boolean;
  onSelectVoice: () => void;
  onCancelVoice?: () => void;
  disabled?: boolean;
}

export function AgentOptionsDropdown({
  children,
  isOpen,
  onOpenChange,
  isRecording,
  onSelectVoice,
  onCancelVoice,
  disabled = false,
}: AgentOptionsDropdownProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-56 bg-[#191a1d] border border-white/10 text-white rounded-2xl p-1.5 shadow-2xl space-y-1 z-50 select-none"
      >
        <div className="px-3 py-1.5 border-b border-white/5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Asistente IA
        </div>

        {/* Opción 1: Imagen (Deshabilitada con badge Próximamente) */}
        <DropdownMenuItem
          disabled
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs opacity-50 cursor-not-allowed text-zinc-400"
        >
          <div className="flex items-center space-x-2.5">
            <ImageIcon className="w-4 h-4 text-zinc-500" />
            <span>Imagen</span>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
            Próximamente
          </span>
        </DropdownMenuItem>

        {/* Opción 2: Voz (Interactiva) */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onSelectVoice();
          }}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
            isRecording
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "hover:bg-white/10 text-white"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {isRecording ? (
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Mic className="w-4 h-4 text-indigo-400" />
            )}
            <span className="font-medium">Voz</span>
          </div>

          {isRecording ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 animate-pulse">
              Grabando...
            </span>
          ) : (
            <span className="text-[10px] font-medium text-zinc-400">
              Dictar orden
            </span>
          )}
        </DropdownMenuItem>
        {isRecording && onCancelVoice ? (
          <DropdownMenuItem
            onSelect={onCancelVoice}
            className="rounded-xl px-3 py-2 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            Cancelar grabación
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
