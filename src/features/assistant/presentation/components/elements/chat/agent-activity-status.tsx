"use client";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ListTodo, Pencil, Search, Sparkles, Square } from "lucide-react";
import type {
  AgentActivityCode,
  AgentActivityType,
} from "@/features/assistant/domain/entities/agent-activity.entity";
import {
  getAgentActivityLabel,
  getAgentActivityType,
} from "@/features/assistant/domain/entities/agent-activity.entity";
import styles from "./agent-activity-status.module.css";

type AgentActivityStatusProps = {
  code?: AgentActivityCode | null;
  type?: AgentActivityType | null;
  stale?: boolean;
  cancelling?: boolean;
  className?: string;
};

export function AgentActivityStatus({
  code,
  type,
  stale = false,
  cancelling = false,
  className,
}: AgentActivityStatusProps) {
  const label = cancelling
    ? "Cancelando…"
    : stale
      ? "Reconectando…"
      : getAgentActivityLabel(code);

  const activityType = type ?? getAgentActivityType(code);

  const renderIcon = () => {
    if (cancelling) {
      return <Square className="size-3 text-zinc-400 shrink-0 fill-current" aria-hidden="true" />;
    }
    if (stale) {
      return (
        <Spinner
          className="size-3.5 text-zinc-400 shrink-0 motion-reduce:animate-none"
          aria-hidden="true"
        />
      );
    }
    switch (activityType) {
      case "query":
        return <Search className="size-3.5 text-zinc-400 shrink-0" aria-hidden="true" />;
      case "edit":
        return <Pencil className="size-3.5 text-zinc-400 shrink-0" aria-hidden="true" />;
      case "planning":
        return <ListTodo className="size-3.5 text-zinc-400 shrink-0" aria-hidden="true" />;
      case "analysis":
      default:
        return <Sparkles className="size-3.5 text-zinc-400 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-6 items-center gap-2 pl-1 pr-2 py-0.5 text-left self-start text-xs text-zinc-400",
        className
      )}
      data-testid="agent-activity-status"
      data-activity-type={activityType}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {renderIcon()}
      <span className={styles.activityText}>{label}</span>
    </div>
  );
}

