"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { AgentActivity } from "../../domain/entities/agent-activity.entity";
import { assistantRepositoryImpl } from "../../infrastructure/repositories/http-assistant.repository";

interface UseAgentActivitiesOptions {
  projectId: string;
  initialActivities?: AgentActivity[];
}

export function useAgentActivities({
  projectId,
  initialActivities = [],
}: UseAgentActivitiesOptions) {
  const [prevInitial, setPrevInitial] = useState(initialActivities);
  const [activities, setActivities] = useState<AgentActivity[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(false);
  const lastFinishedActivityId = useAppStore((state) => state.lastAgentFinishedActivityId);
  const refreshedActivityRef = useRef<string | null>(null);

  if (initialActivities !== prevInitial) {
    setPrevInitial(initialActivities);
    setActivities(initialActivities);
  }

  const reloadActivities = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await assistantRepositoryImpl.listActivities(projectId);
      if (res.ok) {
        setActivities(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (lastFinishedActivityId && refreshedActivityRef.current !== lastFinishedActivityId) {
      refreshedActivityRef.current = lastFinishedActivityId;
      void reloadActivities();
    }
  }, [lastFinishedActivityId, reloadActivities]);

  return {
    activities,
    isLoading,
    reloadActivities,
  };
}
