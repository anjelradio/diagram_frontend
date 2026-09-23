import { useState, useCallback } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import {
  projectRepositoryImpl,
  triggerBrowserDownload,
} from "../../infrastructure/repositories/project.repository";

/**
 * Hook para gestionar la exportación y descarga en el navegador del proyecto actual
 * en formato OMG UML 2.1 / XMI 2.1 para Enterprise Architect.
 */
export function useExportProject(projectId: string) {
  const [isExporting, setIsExporting] = useState(false);

  const exportProject = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    appToast.info("Exportando proyecto a formato Enterprise Architect (XMI)...");

    try {
      const result = await projectRepositoryImpl.exportProject(projectId);

      if (result.ok) {
        triggerBrowserDownload(result.data.blob, result.data.fileName);
        appToast.success("Proyecto exportado exitosamente");
      } else {
        const errorMsg =
          result.errors?.[0] || "No se pudo exportar el proyecto.";
        appToast.error("Error al exportar", errorMsg);
      }
    } catch {
      appToast.error("Error", "Ocurrió un error inesperado al exportar el proyecto.");
    } finally {
      setIsExporting(false);
    }
  }, [projectId, isExporting]);

  return {
    exportProject,
    isExporting,
  };
}
