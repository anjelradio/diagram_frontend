"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Terminal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AgentActivity } from "../../../domain/entities/agent-activity.entity";
import { useAgentActivities } from "../../hooks/use-agent-activities";

interface AgentActivityTriggerProps {
  projectId: string;
  initialActivities?: AgentActivity[];
}

export function AgentActivityTrigger({
  projectId,
  initialActivities = [],
}: AgentActivityTriggerProps) {
  const { activities, isLoading } = useAgentActivities({
    projectId,
    initialActivities,
  });

  const [selectedActivity, setSelectedActivity] = useState<AgentActivity | null>(
    null
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectActivity = (activity: AgentActivity) => {
    if (activity.state === "IN_PROGRESS") return;
    setIsDropdownOpen(false);
    setSelectedActivity(activity);
    setIsExpanded(true);
  };

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setSelectedActivity(null);
  }, []);

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, handleCollapse]);

  // Cerrar al hacer clic fuera del componente expandido
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleCollapse();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, handleCollapse]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
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

  const renderStatusIcon = (state: AgentActivity["state"]) => {
    switch (state) {
      case "IN_PROGRESS":
        return (
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
        );
      case "FINISHED":
        return (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        );
      case "FAILED":
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case "CANCELLED":
        return <Ban className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const renderStateBadge = (state: AgentActivity["state"]) => {
    switch (state) {
      case "FINISHED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completado</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Fallido</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-white/10">
            <Ban className="w-3 h-3" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
            <Clock className="w-3 h-3" />
            <span>En proceso</span>
          </span>
        );
    }
  };

  // Animación de apertura suave y ligeramente pausada:
  // Al expandir: ancho primero (350ms), luego alto (400ms con retraso de 260ms).
  // Al colapsar: sin animación de cierre, desaparece inmediatamente como antes.
  const containerStyle: React.CSSProperties = isExpanded
    ? {
        width: "min(490px, calc(100vw - 2.5rem))",
        height: "min(540px, calc(100vh - 5rem))",
        transitionProperty:
          "width, height, background-color, border-color, box-shadow",
        transitionDuration: "350ms, 400ms, 250ms, 250ms, 250ms",
        transitionDelay: "0ms, 260ms, 0ms, 0ms, 0ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }
    : {
        width: "168px",
        height: "40px",
        transition: "none",
      };

  return (
    <div
      ref={containerRef}
      className="relative pointer-events-auto select-none min-w-[168px] h-10"
    >
      <div
        style={containerStyle}
        className={`origin-bottom-left rounded-2xl overflow-hidden ${
          isExpanded
            ? "absolute bottom-0 left-0 bg-[#191a1d]/95 backdrop-blur-xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] z-50 flex flex-col"
            : "relative bg-[#191a1d] border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-xl flex items-center"
        }`}
      >
        {/* Contenido expandido con fade in sincronizado con la fase de apertura de altura */}
        {selectedActivity && (
          <div
            className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-opacity duration-250 ${
              isExpanded
                ? "opacity-100 delay-260"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Cabecera con título e insignia de estado */}
            <header className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-semibold text-white">
                  Detalle de Actividad
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {renderStateBadge(selectedActivity.state)}
              </div>
            </header>

            {/* Cuerpo de la actividad con scroll suave */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
              {/* Fecha y hora */}
              <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400">
                <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                <span>{formatDate(selectedActivity.createdDate)}</span>
              </div>

              {/* Transcripción de voz */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                  Transcripción de voz
                </h4>
                <div className="p-3 bg-white/[0.04] border border-white/5 rounded-xl text-xs text-zinc-200 leading-relaxed max-h-36 overflow-y-auto">
                  {selectedActivity.transcription ||
                    "Sin transcripción disponible."}
                </div>
              </div>

              {/* Resumen del Asistente */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                  Resumen del Asistente
                </h4>
                <div className="p-3 bg-white/[0.04] border border-white/5 rounded-xl text-xs text-zinc-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedActivity.resume || "Sin resumen disponible."}
                </div>
              </div>

              {/* Imagen de referencia si existe */}
              {selectedActivity.imageUrl && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                    Imagen de referencia
                  </h4>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 max-h-48 flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedActivity.imageUrl}
                      alt="Referencia de la actividad"
                      className="max-h-44 w-auto object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección inferior: en estado expandido es barra de anclaje; en colapsado es el botón disparador con dropdown */}
        {isExpanded ? (
          <footer className="shrink-0 h-10 px-4 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-medium text-white/90">Registro de agente</span>
            </div>
            <button
              type="button"
              onClick={handleCollapse}
              className="text-[11px] text-zinc-400 hover:text-white transition flex items-center space-x-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5"
              title="Minimizar registro"
            >
              <span>Minimizar</span>
            </button>
          </footer>
        ) : (
          <div className="w-full h-10 flex items-center">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full h-full flex items-center justify-center space-x-2 text-white px-4 rounded-2xl text-xs font-medium active:scale-95 cursor-pointer select-none hover:bg-white/10 transition"
                  title="Ver registro de actividades del asistente"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="whitespace-nowrap">Registro de agente</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-80 max-h-72 overflow-y-auto bg-[#191a1d] border border-white/10 text-white rounded-2xl p-1.5 shadow-2xl space-y-1 z-50"
              >
                <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Actividades del Agente</span>
                  {isLoading && (
                    <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
                  )}
                </div>

                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    No hay actividades registradas aún.
                  </div>
                ) : (
                  activities.map((act) => {
                    const isInProgress = act.state === "IN_PROGRESS";
                    return (
                      <DropdownMenuItem
                        key={act.id}
                        disabled={isInProgress}
                        onSelect={() => handleSelectActivity(act)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                          isInProgress
                            ? "opacity-75 cursor-not-allowed bg-indigo-500/10 text-indigo-200"
                            : "hover:bg-white/10 text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          {renderStatusIcon(act.state)}
                          <span className="truncate max-w-[210px] text-xs">
                            {act.transcription ||
                              (isInProgress
                                ? "Procesando orden..."
                                : "Sin transcripción")}
                          </span>
                        </div>
                        {!isInProgress && (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-1" />
                        )}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
