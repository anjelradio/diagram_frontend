"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ArrowLeft, KeyRound, Check, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type IntegrationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: "notion" | "neon";
  name: string;
  headerImageSrc: string;
  welcomeDescription?: string;
  instructions?: string[];
  apiKeyPlaceholder?: string;
  onSave?: (apiKey: string) => void;
  children?: React.ReactNode;
};

export function IntegrationModalBase({
  open,
  onOpenChange,
  name,
  headerImageSrc,
  welcomeDescription = "",
  instructions = [],
  apiKeyPlaceholder = "",
  onSave,
  children,
}: IntegrationModalProps) {
  const [step, setStep] = useState<"welcome" | "config">("welcome");
  const [apiKey, setApiKey] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("welcome");
    }, 200);
  };

  const handleAccept = () => {
    if (onSave) {
      onSave(apiKey);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? handleClose() : onOpenChange(true))}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[540px] sm:max-w-[560px] p-0 gap-0 overflow-hidden rounded-3xl border border-white/10 bg-[#131418] text-slate-200 shadow-[0_30px_70px_rgba(0,0,0,0.8)]"
      >
        <DialogTitle className="sr-only">
          {`Configurar integración con ${name}`}
        </DialogTitle>

        {/* Header con imagen full-width de mayor escala visual, sin bordes ni padding arriba */}
        <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-black select-none">
          <Image
            src={headerImageSrc}
            alt={`Cabecera de integración ${name}`}
            fill
            className="object-cover object-center"
            priority
          />

          {/* Difuminado suave hacia el color de la superficie inferior (#131418) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#131418] via-[#131418]/50 to-transparent pointer-events-none" />

          {/* Botón X de cierre en la esquina superior derecha */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-slate-300 hover:text-white hover:bg-black/80 border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido inferior más amplio y limpio con tipografía mejorada */}
        <div className="relative px-7 pb-7 pt-2 bg-[#131418] overflow-hidden">
          {children ? (
            children
          ) : (
            <AnimatePresence mode="wait">
              {step === "welcome" ? (
                <motion.div
                  key="welcome-step"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="flex flex-col gap-4"
                >
                  {/* Nombre de la aplicación y subtítulo Integración del proyecto */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                      Integración del proyecto
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {name}
                    </h3>
                  </div>

                  {/* Breve descripción con tipografía más legible */}
                  <p className="text-sm leading-relaxed text-slate-300">
                    {welcomeDescription}
                  </p>

                  {/* Botón CTA para avanzar a la configuración de la API Key */}
                  <Button
                    type="button"
                    onClick={() => setStep("config")}
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
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="flex flex-col gap-4"
                >
                  {/* Botón de retroceso y estado */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <button
                      type="button"
                      onClick={() => setStep("welcome")}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition group cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                      <span>Volver</span>
                    </button>
                    <span className="text-xs font-medium text-slate-400">
                      Configurar credencial
                    </span>
                  </div>

                  {/* Pasos breves para obtener la API Key con tipografía más clara y espaciada */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      Pasos para obtener tu API Key:
                    </h4>
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      {instructions.map((instruction, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input de API Key */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label htmlFor={`api-key-${name.toLowerCase()}`} className="text-xs font-medium text-slate-300">
                      Clave de API
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id={`api-key-${name.toLowerCase()}`}
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={apiKeyPlaceholder}
                        className="h-10 pl-10 pr-3 text-sm bg-[#0b0c0f] border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500/40 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Botones de acción inferiores */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("welcome")}
                      className="h-9 px-4 text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAccept}
                      className="h-9 px-5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Aceptar</span>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
