import { useState, useCallback } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import {
  codeGenerationRepository,
  triggerBrowserDownload,
} from "../../infrastructure/repositories/http-code-generation.repository";
import type { SpringBootConfigInput } from "../../domain/entities/code-generation.entity";
import { CODE_GENERATION_MESSAGES } from "../constants/code-generation.messages";

export function useGenerateBackend(projectId: string) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSpringBoot = useCallback(
    async (config?: SpringBootConfigInput) => {
      if (isGenerating) return;

      setIsGenerating(true);
      appToast.info(CODE_GENERATION_MESSAGES.loading.generating);

      try {
        const result = await codeGenerationRepository.generateSpringBootBackend(
          projectId,
          config
        );

        if (result.ok) {
          triggerBrowserDownload(result.data.blob, result.data.fileName);
          appToast.success(CODE_GENERATION_MESSAGES.success.downloadComplete);
        } else {
          const errorMsg =
            result.errors?.[0] || CODE_GENERATION_MESSAGES.error.defaultMessage;
          appToast.error(CODE_GENERATION_MESSAGES.error.defaultTitle, errorMsg);
        }
      } catch {
        appToast.error(
          CODE_GENERATION_MESSAGES.error.unexpectedTitle,
          CODE_GENERATION_MESSAGES.error.unexpectedMessage
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [projectId, isGenerating]
  );

  return {
    generateSpringBoot,
    isGenerating,
  };
}
