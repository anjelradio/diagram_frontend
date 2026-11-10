"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IntegrationModalBase,
  type IntegrationModalProps,
} from "./integration-modal-base";
import type { NotionIntegrationStatus } from "../../domain/entities/notion-integration.entity.ts";
import { defaultNotionIntegrationRepository } from "../../infrastructure/repositories/notion-integration.repository.ts";

export type NotionIntegrationDialogProps = Pick<
  IntegrationModalProps,
  "open" | "onOpenChange"
> & {
  projectId: string;
  status: NotionIntegrationStatus | null;
  onStatusUpdated?: (nextStatus: NotionIntegrationStatus) => void;
};

const NOTION_STEPS: React.ReactNode[] = [
  <>
    Accede a{" "}
    <a
      href="https://www.notion.so/profile/integrations"
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-medium inline-flex items-center gap-1 transition-colors"
      title="Abrir integraciones de Notion en una nueva pestaña"
    >
      <span>notion.so/profile/integrations</span>
      <ExternalLink className="h-3.5 w-3.5 inline-block shrink-0" />
    </a>{" "}
    (o Ajustes → Conexiones → Desarrollar o crear integraciones) e inicia sesión.
  </>,
  <>
    Crea una <strong className="text-white font-semibold">&apos;Nueva integración&apos;</strong> interna, asígnale el nombre de tu proyecto y copia el <strong className="text-white font-semibold">&apos;Secreto de integración interna&apos;</strong> (Internal Integration Secret).
  </>,
  <>
    En tu espacio de Notion, abre la página que contendrá este proyecto (si deseas que tu equipo la vea, puedes activar <span className="text-white font-medium">&apos;Compartir en la web&apos;</span> en el menú Compartir).
  </>,
  <>
    En esa misma página de Notion, ve al menú de tres puntos (•••) en la esquina superior derecha → <span className="text-white font-medium">Conexiones (Connections) → Conectar a...</span> y selecciona la integración creada.
  </>,
];

export function NotionIntegrationDialog({
  open,
  onOpenChange,
  projectId,
  status,
  onStatusUpdated,
}: NotionIntegrationDialogProps) {
  // Modo inicial derivado del estado
  const activeMode: "configure" | "initialize" | "capabilities" =
    status?.isInitialized
      ? "capabilities"
      : status?.hasApiKey
      ? "initialize"
      : "configure";

  // Sub-pasos internos
  const [configStep, setConfigStep] = useState<"welcome" | "config">("welcome");
  const [initStep, setInitStep] = useState<"description" | "ready">("description");

  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPageUrl, setCreatedPageUrl] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setConfigStep("welcome");
      setInitStep("description");
      setErrorMessage(null);
      setIsLoading(false);
    }, 200);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Por favor ingresa tu API Key de Notion.");
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await defaultNotionIntegrationRepository.configureApiKey(
        projectId,
        { apiKey: apiKey.trim() }
      );
      if (!res.ok) {
        setErrorMessage(
          res.errors?.[0] ||
            "No se pudo validar la clave con Notion. Verifica que el secreto sea correcto."
        );
        return;
      }
      onStatusUpdated?.(res.data);
      handleClose();
    } catch {
      setErrorMessage("Error de conexión al guardar la API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeProject = async () => {
    if (!description.trim() || description.trim().length < 3) {
      setErrorMessage(
        "Por favor escribe una breve descripción de lo que trata el proyecto (mínimo 3 caracteres)."
      );
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await defaultNotionIntegrationRepository.initializeProject(
        projectId,
        { description: description.trim() }
      );
      if (!res.ok) {
        setErrorMessage(
          res.errors?.[0] ||
            "No se pudo inicializar el proyecto en Notion. Asegúrate de haber conectado una página en Notion desde ••• → Conexiones."
        );
        return;
      }
      onStatusUpdated?.(res.data);
      setCreatedPageUrl(res.data.notionPageUrl);
      setInitStep("ready");
    } catch {
      setErrorMessage("Error al inicializar el proyecto en Notion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IntegrationModalBase
      id="notion"
      open={open}
      onOpenChange={(isOpen) => (!isOpen ? handleClose() : onOpenChange(true))}
      name="Notion"
      headerImageSrc="/integrations-header/notion-header.webp"
    >
      <div className="flex flex-col gap-4">
        {/* Banner de error si existe */}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* ── MODO 1: CONFIGURAR API KEY ────────────────────────── */}
        {activeMode === "configure" && (
          <AnimatePresence mode="wait">
            {configStep === "welcome" ? (
              <motion.div
                key="welcome-step"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                    Integración del proyecto
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Notion
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-slate-300">
                  Conecta tu espacio de trabajo de Notion para integrar tareas del
                  backlog, auditar el avance del diseño UML y vincular tus
                  requerimientos de proyecto en tiempo real.
                </p>

                <Button
                  type="button"
                  onClick={() => setConfigStep("config")}
                  className="mt-3 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Agregar API key</span>
                  <ArrowRight className="h-4 w-4 ml-auto opacity-70" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="config-step"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setConfigStep("welcome")}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition group cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    <span>Volver</span>
                  </button>
                  <span className="text-xs font-medium text-slate-400">
                    Configurar credencial
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    Pasos para obtener tu API Key en Notion:
                  </h4>
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    {NOTION_STEPS.map((stepNode, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-xs text-slate-300"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="leading-snug flex-1">{stepNode}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label
                    htmlFor="api-key-notion"
                    className="text-xs font-medium text-slate-300"
                  >
                    Clave de API
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="api-key-notion"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="ntn_... o secret_..."
                      disabled={isLoading}
                      className="h-10 pl-10 pr-3 text-sm bg-[#0b0c0f] border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500/40 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => setConfigStep("welcome")}
                    className="h-9 px-4 text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isLoading || !apiKey.trim()}
                    onClick={handleSaveApiKey}
                    className="h-9 px-5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Aceptar</span>
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── MODO 2: INICIALIZAR PROYECTO EN NOTION ─────────── */}
        {activeMode === "initialize" && (
          <AnimatePresence mode="wait">
            {initStep === "description" ? (
              <motion.div
                key="init-desc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Inicializar espacio en Notion
                  </h3>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <label
                    htmlFor="project-notion-description"
                    className="text-sm font-medium text-slate-200"
                  >
                    ¿De qué trata este proyecto o sistema?
                  </label>
                  <textarea
                    id="project-notion-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Sistema de punto de venta y gestión de inventario para una tienda de retail, con control de productos, ventas y proveedores..."
                    disabled={isLoading}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0c0f] p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={handleClose}
                    className="h-9 px-4 text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isLoading || !description.trim()}
                    onClick={handleInitializeProject}
                    className="h-9 px-5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Inicializando espacio en Notion...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Crear proyecto en Notion</span>
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="init-ready"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center gap-4 py-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </span>

                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    ¡Página de Notion creada!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                    La página de bienvenida, el resumen del proyecto y la base de datos de
                    tareas ya están listos en tu espacio de trabajo.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
                  {createdPageUrl && (
                    <Button
                      type="button"
                      asChild
                      className="w-full sm:flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md gap-1.5 cursor-pointer"
                    >
                      <a
                        href={createdPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Ir a Notion</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="w-full sm:w-auto h-10 px-5 rounded-xl border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-xs sm:text-sm cursor-pointer"
                  >
                    Cerrar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── MODO 3: GUÍA DE CAPACIDADES ─────────────────────── */}
        {activeMode === "capabilities" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                  Integración activa
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                ¿Qué puedes hacer con Notion?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El espacio de Notion del proyecto ya está vinculado. Puedes interactuar con
              él directamente mediante prompts en el chat del asistente:
            </p>

            <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="text-indigo-400 font-bold shrink-0">📝</span>
                <div>
                  <span className="font-semibold text-white">Crear tareas:</span>{" "}
                  Pídele al asistente <em>&quot;Crea una tarea en Notion: agregar validación a Producto&quot;</em> o convertir sugerencias previas en tareas.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-indigo-400 font-bold shrink-0">📋</span>
                <div>
                  <span className="font-semibold text-white">Consultar tus pendientes:</span>{" "}
                  Pregunta <em>&quot;¿Cuáles son mis tareas en Notion?&quot;</em> y verás solo las que te pertenecen.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-indigo-400 font-bold shrink-0">🔄</span>
                <div>
                  <span className="font-semibold text-white">Actualizar estado:</span>{" "}
                  Cambia tareas entre <em>Pendiente</em>, <em>En progreso</em> y <em>Done</em>.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-indigo-400 font-bold shrink-0">⚡</span>
                <div>
                  <span className="font-semibold text-white">Ejecutar en el diagrama:</span>{" "}
                  Dile <em>&quot;Ejecuta la tarea 1 de Notion&quot;</em>; el asistente aplicará los cambios UML y la marcará como <strong>Done</strong> automáticamente al finalizar.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {status?.notionPageUrl && (
                <Button
                  type="button"
                  asChild
                  className="h-9 px-4 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl gap-1.5 cursor-pointer"
                >
                  <a
                    href={status.notionPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Ir a Notion</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-9 px-4 text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </IntegrationModalBase>
  );
}
