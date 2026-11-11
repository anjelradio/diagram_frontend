"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type {
  PetVisualState,
  PetPlacement,
  TutorialActionButton,
} from "../../../../domain/entities/tutorial.entity";
import { cn } from "@/lib/utils";

export interface TutorialPetBubbleProps {
  visible: boolean;
  state: PetVisualState;
  placement: PetPlacement;
  targetSelector?: string | null;
  message: string;
  actionButton?: TutorialActionButton;
  className?: string;
}

const PET_IMAGES: Record<PetVisualState, string> = {
  done: "/pet/done-pet.webp",
  explore: "/pet/explore-pet.webp",
  happy: "/pet/happy-pet.webp",
  idle: "/pet/idle-pet.webp",
  relation: "/pet/relation-pet.webp",
  think: "/pet/think-pet.webp",
};

/**
 * Mascota interactiva de onboarding con soporte para 6 expresiones,
 * globo de diálogo y botón de acción.
 */
export function TutorialPetBubble({
  visible,
  state,
  placement,
  targetSelector,
  message,
  actionButton,
  className,
}: TutorialPetBubbleProps) {
  const [coords, setCoords] = useState<{ top?: number; left?: number; right?: number; bottom?: number }>({});

  const isCustomPlacement =
    visible &&
    Boolean(targetSelector) &&
    (placement === "left-of-target" ||
      placement === "right-of-target" ||
      placement === "bottom-of-target" ||
      placement === "top-of-target");

  useEffect(() => {
    if (!isCustomPlacement || !targetSelector) return;

    const updatePosition = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (placement === "left-of-target") {
          setCoords({
            top: Math.max(16, rect.top + (rect.height / 2) - 45),
            right: Math.max(16, window.innerWidth - rect.left + 16),
          });
        } else if (placement === "right-of-target") {
          setCoords({
            top: Math.max(16, rect.top + (rect.height / 2) - 45),
            left: rect.right + 16,
          });
        } else if (placement === "bottom-of-target") {
          setCoords({
            top: rect.bottom + 16,
            right: Math.max(16, window.innerWidth - rect.right),
          });
        } else if (placement === "top-of-target") {
          setCoords({
            bottom: Math.max(16, window.innerHeight - rect.top + 16),
            right: Math.max(16, window.innerWidth - rect.right),
          });
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const interval = setInterval(updatePosition, 250);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      clearInterval(interval);
    };
  }, [isCustomPlacement, targetSelector, placement]);

  if (!visible) return null;

  const effectiveCoords = isCustomPlacement ? coords : {};

  // Clases según placement predefinido cuando no hay coordenadas dinámicas
  const getFixedPlacementClass = () => {
    if (effectiveCoords.top !== undefined || effectiveCoords.right !== undefined || effectiveCoords.left !== undefined) {
      return "";
    }
    switch (placement) {
      case "bottom-right":
        return "fixed bottom-28 right-8";
      case "bottom-left":
        return "fixed bottom-28 left-8";
      case "center":
        return "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "left-of-target":
        return "fixed top-1/3 right-28";
      case "right-of-target":
      default:
        return "fixed top-1/3 left-28";
    }
  };

  const isBubbleOnLeft =
    placement === "left-of-target" ||
    placement === "bottom-right" ||
    placement === "bottom-of-target" ||
    placement === "top-of-target";

  return (
    <AnimatePresence>
      <motion.div
        data-testid="tutorial-pet-bubble"
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          ...(effectiveCoords.top !== undefined ? { top: effectiveCoords.top } : {}),
          ...(effectiveCoords.left !== undefined ? { left: effectiveCoords.left } : {}),
          ...(effectiveCoords.right !== undefined ? { right: effectiveCoords.right } : {}),
          ...(effectiveCoords.bottom !== undefined ? { bottom: effectiveCoords.bottom } : {}),
        }}
        className={cn(
          "z-50 flex items-center gap-3.5 select-none pointer-events-auto",
          isBubbleOnLeft ? "flex-row-reverse" : "flex-row",
          getFixedPlacementClass(),
          className
        )}
      >
        {/* Imagen de la Mascota */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
          <Image
            src={PET_IMAGES[state] || PET_IMAGES.idle}
            alt={`Mascota tutorial - estado ${state}`}
            width={96}
            height={96}
            className="w-full h-full object-contain filter drop-shadow-md"
            priority
          />
        </div>

        {/* Burbuja de diálogo */}
        <div className="relative max-w-xs sm:max-w-sm rounded-2xl bg-[#191a1d] border border-white/15 p-4 text-slate-100 shadow-2xl backdrop-blur-md">
          <p className="text-sm leading-relaxed text-slate-200 font-medium">
            {message}
          </p>

          {actionButton && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={actionButton.onClick}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer",
                  actionButton.variant === "success"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : actionButton.variant === "secondary"
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                )}
              >
                {actionButton.label}
              </button>
            </div>
          )}

          {/* Flecha / Colita de la burbuja */}
          <div
            className={cn(
              "absolute top-6 w-2.5 h-2.5 bg-[#191a1d] border-t border-l border-white/15",
              isBubbleOnLeft
                ? "-right-1.5 rotate-[135deg]"
                : "-left-1.5 -rotate-45"
            )}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
