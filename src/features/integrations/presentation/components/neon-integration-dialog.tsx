"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IntegrationModalBase,
  type IntegrationModalProps,
} from "./integration-modal-base";
import type { NeonIntegrationStatus } from "../../domain/entities/neon-integration.entity";
import { defaultNeonIntegrationRepository } from "../../infrastructure/repositories/neon-integration.repository";

export type NeonIntegrationDialogProps = Pick<
  IntegrationModalProps,
  "open" | "onOpenChange"
> & {
  projectId: string;
  status: NeonIntegrationStatus | null;
  onStatusUpdated?: (nextStatus: NeonIntegrationStatus) => void;
};

const NEON_STEPS: React.ReactNode[] = [
  <>
    Accede a{" "}
    <a
      href="https://console.neon.tech/app/settings/api-keys"
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-medium inline-flex items-center gap-1 transition-colors"
      title="Abrir consola de Neon en una nueva pestaña"
    >
      <span>console.neon.tech/app/settings/api-keys</span>
      <ExternalLink className="h-3.5 w-3.5 inline-block shrink-0" />
    </a>{" "}
    (o Account Settings → API Keys) e inicia sesión en Neon.
  </>,
  <>
    Haz clic en <strong className="text-white font-semibold">&apos;Generate new API key&apos;</strong>, asígnale un nombre descriptivo y copia la clave generada.
  </>,
  <>
    Pega tu clave de API a continuación para autorizar la creación del proyecto y el despliegue automático de tus tablas PostgreSQL.
  </>,
];

export function NeonIntegrationDialog({
  open,
  onOpenChange,
  projectId,
  status,
  onStatusUpdated,
}: NeonIntegrationDialogProps) {
  // Modo inicial derivado del estado
  const activeMode: "configure" | "initialize" | "capabilities" =
    status?.isInitialized
      ? "capabilities"
      : status?.hasApiKey
      ? "initialize"
      : "configure";

  // Sub-pasos internos
  const [configStep, setConfigStep] = useState<"welcome" | "config">("welcome");
  const [initStep, setInitStep] = useState<"ready_to_init" | "done">("ready_to_init");

  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setConfigStep("welcome");
      setInitStep("ready_to_init");
      setErrorMessage(null);
      setIsLoading(false);
    }, 200);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Por favor ingresa tu API Key de Neon.");
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await defaultNeonIntegrationRepository.configureApiKey(
        projectId,
        { apiKey: apiKey.trim() }
      );
      if (!res.ok) {
        setErrorMessage(
          res.errors?.[0] ||
            "No se pudo validar la API Key con Neon. Verifica que la clave sea correcta."
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
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await defaultNeonIntegrationRepository.initializeProject(projectId);
      if (!res.ok) {
        setErrorMessage(
          res.errors?.[0] ||
            "No se pudo inicializar el proyecto en Neon. Verifica que tu diagrama UML tenga al menos una clase y que no existan errores de nombres duplicados."
        );
        return;
      }
      onStatusUpdated?.(res.data);
      setInitStep("done");
    } catch {
      setErrorMessage("Error al inicializar el proyecto en Neon.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IntegrationModalBase
      id="neon"
      open={open}
      onOpenChange={(isOpen) => (!isOpen ? handleClose() : onOpenChange(true))}
      name="Neon"
      headerImageSrc="/integrations-header/neon-header.webp"
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
                  <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
                    Integración de Base de Datos
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Neon Postgres
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-slate-300">
                  Conecta tu cuenta de Neon Postgres para desplegar automáticamente
                  esquemas relacionales a partir del diagrama UML, gestionar bases de
                  datos funcionales y ejecutar migraciones de forma segura.
                </p>

                <Button
                  type="button"
                  onClick={() => setConfigStep("config")}
                  className="mt-3 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm shadow-lg shadow-teal-600/25 transition-all active:scale-[0.98] cursor-pointer"
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
                    Pasos para obtener tu API Key en Neon:
                  </h4>
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    {NEON_STEPS.map((stepNode, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-xs text-slate-300"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-semibold text-teal-300 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="leading-snug flex-1">{stepNode}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label
                    htmlFor="api-key-neon"
                    className="text-xs font-medium text-slate-300"
                  >
                    Clave de API de Neon
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="api-key-neon"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="napi_..."
                      disabled={isLoading}
                      className="h-10 pl-10 pr-3 text-sm bg-[#0b0c0f] border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-teal-500/40 rounded-xl"
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
                    className="h-9 px-5 text-xs sm:text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl shadow-sm gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
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

        {/* ── MODO 2: INICIALIZAR Y DESPLEGAR BASE DE DATOS ─────── */}
        {activeMode === "initialize" && (
          <AnimatePresence mode="wait">
            {initStep === "ready_to_init" ? (
              <motion.div
                key="init-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
                    Paso 2 · Despliegue Inicial
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Inicializar en Neon
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3.5 py-2.5 text-xs text-teal-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                  <span>API Key configurada y validada correctamente.</span>
                </div>

                <p className="text-sm leading-relaxed text-slate-300">
                  Al inicializar, se creará un proyecto dedicado en tu cuenta de
                  Neon y se desplegará el diagrama UML actual como esquema relacional
                  PostgreSQL (tablas, columnas, tipos de datos y relaciones).
                </p>

                <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2 font-medium text-slate-300">
                    <Database className="h-4 w-4 text-teal-400" />
                    <span>¿Qué se realizará en Neon?</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li>Creación de proyecto PostgreSQL Serverless dedicado.</li>
                    <li>Creación de tablas correspondientes a tus clases.</li>
                    <li>Configuración de tipos y restricciones de integridad.</li>
                  </ul>
                </div>

                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={handleInitializeProject}
                  className="mt-2 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm shadow-lg shadow-teal-600/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creando proyecto y desplegando en Neon...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      <span>Inicializar y desplegar base de datos</span>
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="done-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-4 text-center items-center py-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-white">
                    ¡Base de datos desplegada con éxito!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Tu diagrama UML fue convertido en esquema PostgreSQL activo en Neon.
                  </p>
                </div>

                {status?.neonConsoleUrl && (
                  <a
                    href={status.neonConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition cursor-pointer"
                  >
                    <span>Ir a la consola de Neon</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <Button
                  type="button"
                  onClick={handleClose}
                  className="w-full mt-2 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium"
                >
                  Finalizar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── MODO 3: CAPACIDADES E INFORMACIÓN (INICIALIZADO) ──── */}
        {activeMode === "capabilities" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                  Base de Datos Activa
                </span>
                <h3 className="text-xl font-bold text-white">
                  Neon Postgres Conectado
                </h3>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                Sincronizado
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Proyecto Neon:</span>
                <span className="font-mono text-slate-200">
                  {status?.neonProjectId || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Base de datos:</span>
                <span className="font-mono text-slate-200">
                  {status?.neonDatabaseName || "neondb"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Rama principal:</span>
                <span className="font-mono text-slate-200">
                  {status?.neonBranchId || "main"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs">
              <h4 className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                <span>¿Cómo sincronizar desde el Asistente?</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Pídele al asistente en cualquier momento:
              </p>
              <div className="rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-teal-300 border border-white/5">
                &ldquo;Despliega esto en Neon&rdquo; o &ldquo;Sincroniza la base de datos&rdquo;
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                El motor calculará deterministamente las diferencias y aplicará las
                migraciones necesarias de forma no destructiva.
              </p>
            </div>

            {status?.neonConsoleUrl && (
              <a
                href={status.neonConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition cursor-pointer"
              >
                <span>Abrir consola de Neon</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </IntegrationModalBase>
  );
}
