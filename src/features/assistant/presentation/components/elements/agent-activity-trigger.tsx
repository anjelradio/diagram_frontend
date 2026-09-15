"use client";

import { useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Loader2,
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
import { AgentActivityModal } from "./agent-activity-modal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectActivity = (activity: AgentActivity) => {
    if (activity.state === "IN_PROGRESS") return;
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const renderStatusIcon = (state: AgentActivity["state"]) => {
    switch (state) {
      case "IN_PROGRESS":
        return <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />;
      case "FINISHED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "FAILED":
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case "CANCELLED":
        return <Ban className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="pointer-events-auto flex items-center space-x-2 bg-[#191a1d] text-white border border-white/10 py-2 px-4 rounded-full shadow-xl hover:bg-white/10 transition text-xs font-medium active:scale-95 cursor-pointer select-none"
            title="Ver registro de actividades del asistente"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Registro de agente</span>
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
                      {act.transcription || (isInProgress ? "Procesando orden..." : "Sin transcripción")}
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

      <AgentActivityModal
        activity={selectedActivity}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
