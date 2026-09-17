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
  onSelectImage: () => void;
  onSelectVoice: () => void;
  disabled?: boolean;
}

export function AgentOptionsDropdown({
  children,
  isOpen,
  onOpenChange,
  onSelectImage,
  onSelectVoice,
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

        {/* Opción 1: Imagen (Habilitada para recreación de diagramas) */}
        <DropdownMenuItem
          onSelect={() => {
            onSelectImage();
          }}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer hover:bg-white/10 text-white transition"
        >
          <div className="flex items-center space-x-2.5">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">Imagen</span>
          </div>
          <span className="text-[10px] font-medium text-zinc-400">
            Subir diagrama
          </span>
        </DropdownMenuItem>

        {/* Opción 2: Voz (Abre barra flotante de grabación) */}
        <DropdownMenuItem
          onSelect={() => {
            onSelectVoice();
          }}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer hover:bg-white/10 text-white transition"
        >
          <div className="flex items-center space-x-2.5">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">Voz</span>
          </div>
          <span className="text-[10px] font-medium text-zinc-400">
            Dictar orden
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
