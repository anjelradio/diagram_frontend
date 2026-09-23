"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { createInvitationAction } from "@/features/collaboration/presentation/actions/invitation.action";

type ProjectSharePopoverProps = {
  projectId: string;
};

/**
 * Popover de compartir proyecto para el propietario.
 * Genera o recupera el código de invitación mediante la Server Action,
 * muestra esqueletos durante la carga y permite copiar el enlace mediante el botón principal inferior.
 */
export function ProjectSharePopover({ projectId }: ProjectSharePopoverProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !invitationLink && !isLoading) {
      setIsLoading(true);
      try {
        const result = await createInvitationAction(projectId);
        if (result.ok) {
          const origin =
            typeof window !== "undefined" ? window.location.origin : "";
          setInvitationLink(`${origin}/join/${result.data.code}`);
        } else {
          appToast.error(
            result.errors?.[0] || "No fue posible generar el enlace de invitación."
          );
        }
      } catch {
        appToast.error("Error inesperado al generar el enlace de invitación.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!invitationLink) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      setHasCopied(true);
      appToast.success("Enlace de invitación copiado al portapapeles.");
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      appToast.error("No se pudo copiar el enlace al portapapeles.");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Compartir proyecto"
          title="Compartir enlace del proyecto"
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-medium shadow-lg shadow-blue-600/30 transition active:scale-95 rounded-full cursor-pointer select-none"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 bg-[#191a1d] border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 z-50 text-slate-200 flex flex-col gap-3"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <span className="text-xs font-semibold text-white tracking-tight">
            Compartir proyecto
          </span>
          {isLoading ? (
            <Skeleton className="h-4 w-12 rounded-full bg-white/10" />
          ) : (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Público
            </span>
          )}
        </div>

        {/* Estado de carga con Skeletons */}
        {isLoading ? (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28 rounded bg-white/10" />
              <Skeleton className="h-9 w-full rounded-lg bg-white/5" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl bg-blue-600/30" />
          </div>
        ) : (
          <>
            {/* Campo con el enlace (sin botón interno de copiar) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="share-link-input"
                className="text-[11px] font-medium text-slate-400 tracking-tight"
              >
                Enlace para compartir
              </label>
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={invitationLink || "No disponible"}
                onFocus={(e) => e.target.select()}
                className="w-full bg-[#121316] border border-white/10 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 font-mono select-all transition"
              />
            </div>

            {/* Único botón de acción para copiar */}
            <button
              type="button"
              disabled={!invitationLink}
              onClick={handleCopy}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md text-xs cursor-pointer select-none"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
