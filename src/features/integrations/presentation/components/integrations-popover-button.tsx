"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Blocks, CircleHelp, Plus, Rocket } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotionIntegrationDialog } from "./notion-integration-dialog";
import { NeonIntegrationDialog } from "./neon-integration-dialog";
import type { NotionIntegrationStatus } from "../../domain/entities/notion-integration.entity";
import type { NeonIntegrationStatus } from "../../domain/entities/neon-integration.entity";
import { defaultNotionIntegrationRepository } from "../../infrastructure/repositories/notion-integration.repository";
import { defaultNeonIntegrationRepository } from "../../infrastructure/repositories/neon-integration.repository";

export type IntegrationsPopoverButtonProps = {
  projectId?: string;
};

type IntegrationItemConfig = {
  id: "notion" | "neon";
  name: string;
  description: string;
  logoSrc: string;
};

const INTEGRATIONS_CONFIG: IntegrationItemConfig[] = [
  {
    id: "notion",
    name: "Notion",
    description: "Integrar tareas, auditar proyectos",
    logoSrc: "/logos/notion-logo.webp",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Desplegar y migrar bases de datos funcionales",
    logoSrc: "/logos/neon-logo.webp",
  },
];

export function IntegrationsPopoverButton({
  projectId,
}: IntegrationsPopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"notion" | "neon" | null>(null);
  const [notionStatus, setNotionStatus] =
    useState<NotionIntegrationStatus | null>(null);
  const [neonStatus, setNeonStatus] =
    useState<NeonIntegrationStatus | null>(null);

  // Consultar estado de Notion y Neon al abrir el popover o cambiar el proyecto
  useEffect(() => {
    let isMounted = true;
    if (!projectId) return;

    const fetchStatuses = async () => {
      try {
        const [notionRes, neonRes] = await Promise.allSettled([
          defaultNotionIntegrationRepository.getStatus(projectId),
          defaultNeonIntegrationRepository.getStatus(projectId),
        ]);
        if (!isMounted) return;
        if (notionRes.status === "fulfilled" && notionRes.value.ok) {
          setNotionStatus(notionRes.value.data);
        }
        if (neonRes.status === "fulfilled" && neonRes.value.ok) {
          setNeonStatus(neonRes.value.data);
        }
      } catch {
        // En caso de error silencioso de red, los botones mantendrán el fallback por defecto
      }
    };

    if (open) {
      void fetchStatuses();
    }

    return () => {
      isMounted = false;
    };
  }, [open, projectId]);

  const handleOpenModal = (id: "notion" | "neon") => {
    // Cerramos el popover para enfocar completamente el modal
    setOpen(false);
    setActiveModal(id);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Abrir integraciones"
            title="Integraciones"
            className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#16171b]/95 text-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#1d1f25] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:translate-y-0 active:scale-95"
          >
            <Blocks className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={10}
          className="w-[360px] rounded-3xl border border-white/10 bg-[#131418]/95 p-4 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-3">
            {/* Cabecera del popover */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Blocks className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Integraciones
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Conexiones externas
              </span>
            </div>

            {/* Filas de Integraciones */}
            <div className="flex flex-col gap-2.5">
              {INTEGRATIONS_CONFIG.map((item) => {
                const isNotion = item.id === "notion";
                const isNeon = item.id === "neon";
                const isInitialized = isNotion
                  ? notionStatus?.isInitialized
                  : isNeon
                  ? neonStatus?.isInitialized
                  : false;
                const hasApiKey = isNotion
                  ? notionStatus?.hasApiKey
                  : isNeon
                  ? neonStatus?.hasApiKey
                  : false;

                // Definición dinámica del botón según el estado
                const actionAriaLabel = isNotion
                  ? isInitialized
                    ? "Ver qué puedes hacer con Notion"
                    : hasApiKey
                    ? "Inicializar proyecto en Notion"
                    : "Configurar integración de Notion"
                  : isNeon
                  ? isInitialized
                    ? "Ver qué puedes hacer con Neon"
                    : hasApiKey
                    ? "Inicializar proyecto en Neon"
                    : "Configurar integración de Neon"
                  : `Configurar integración de ${item.name}`;

                return (
                  <div
                    key={item.id}
                    className="group/item flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    {/* Fila principal: Logo + Textos */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0d0e11] p-1.5 shadow-sm">
                        <Image
                          src={item.logoSrc}
                          alt={`Logo de ${item.name}`}
                          width={28}
                          height={28}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400 leading-tight line-clamp-2">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    {/* Botón dinámico según el estado de la integración */}
                    <button
                      type="button"
                      aria-label={actionAriaLabel}
                      title={actionAriaLabel}
                      onClick={() => handleOpenModal(item.id)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                        isInitialized
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/20"
                          : hasApiKey
                          ? "border-teal-500/30 bg-teal-500/20 text-teal-300 hover:border-teal-500/50 hover:bg-teal-500/30"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {isInitialized ? (
                        <CircleHelp className="h-4 w-4" />
                      ) : hasApiKey ? (
                        <Rocket className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Diálogos modales dedicados para Notion y Neon */}
      <NotionIntegrationDialog
        open={activeModal === "notion"}
        onOpenChange={(isOpen) => setActiveModal(isOpen ? "notion" : null)}
        projectId={projectId || ""}
        status={notionStatus}
        onStatusUpdated={(updated) => setNotionStatus(updated)}
      />

      <NeonIntegrationDialog
        open={activeModal === "neon"}
        onOpenChange={(isOpen) => setActiveModal(isOpen ? "neon" : null)}
        projectId={projectId || ""}
        status={neonStatus}
        onStatusUpdated={(updated) => setNeonStatus(updated)}
      />
    </>
  );
}
