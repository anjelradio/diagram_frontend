"use client";

import { CheckCircle2, AlertCircle, Clock, Ban, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AgentActivity } from "../../../domain/entities/agent-activity.entity";

interface AgentActivityModalProps {
  activity: AgentActivity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentActivityModal({
  activity,
  open,
  onOpenChange,
}: AgentActivityModalProps) {
  if (!activity) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const renderStateBadge = () => {
    switch (activity.state) {
      case "FINISHED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completado</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Fallido</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-white/10">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>En proceso</span>
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg bg-[#191a1d] border border-white/10 text-white rounded-2xl shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-semibold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Detalle de Actividad</span>
            </DialogTitle>
            {renderStateBadge()}
          </div>
          <p className="text-xs text-zinc-400 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{formatDate(activity.createdDate)}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Transcripción del audio */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-zinc-300">
              Transcripción de voz
            </h4>
            <div className="p-3 bg-white/[0.04] border border-white/5 rounded-xl text-xs text-zinc-200 leading-relaxed max-h-40 overflow-y-auto">
              {activity.transcription || "Sin transcripción disponible."}
            </div>
          </div>

          {/* Resumen de la IA */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-zinc-300">
              Resumen del Asistente
            </h4>
            <div className="p-3 bg-white/[0.04] border border-white/5 rounded-xl text-xs text-zinc-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {activity.resume || "Sin resumen disponible."}
            </div>
          </div>

          {/* Imagen si existe */}
          {activity.imageUrl && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-zinc-300">
                Imagen de referencia
              </h4>
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 max-h-60 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activity.imageUrl}
                  alt="Referencia de la actividad"
                  className="max-h-60 w-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
