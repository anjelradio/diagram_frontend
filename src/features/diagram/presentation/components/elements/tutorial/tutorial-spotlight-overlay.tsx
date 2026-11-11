"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TutorialSpotlightOverlayProps {
  active: boolean;
  targetSelector?: string | null;
  padding?: number;
  shape?: "rect" | "pill" | "circle";
  className?: string;
  children?: React.ReactNode;
}

interface RectBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Overlay oscuro envolvente con ventana iluminada/recortada (Spotlight)
 * que destaca de forma precisa el elemento interactivo en foco.
 */
export function TutorialSpotlightOverlay({
  active,
  targetSelector,
  padding = 8,
  shape = "rect",
  className,
  children,
}: TutorialSpotlightOverlayProps) {
  const [targetRect, setTargetRect] = useState<RectBounds | null>(null);

  useEffect(() => {
    if (!active || !targetSelector) {
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: Math.max(0, rect.top - padding),
          left: Math.max(0, rect.left - padding),
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const interval = setInterval(updateRect, 250);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearInterval(interval);
    };
  }, [active, targetSelector, padding]);

  if (!active) {
    return null;
  }

  const effectiveRect = targetSelector ? targetRect : null;

  const borderRadiusClass =
    shape === "pill"
      ? "rounded-full"
      : shape === "circle"
      ? "rounded-full aspect-square"
      : "rounded-2xl";

  return (
    <div
      aria-hidden="true"
      data-testid="tutorial-spotlight-overlay"
      className={cn(
        "fixed inset-0 pointer-events-none select-none z-40 transition-opacity duration-300",
        className
      )}
    >
      {/* Si hay un elemento objetivo, renderizamos la máscara de corte spotlight con box-shadow masivo */}
      {effectiveRect ? (
        <div
          data-testid="tutorial-spotlight-cutout"
          style={{
            position: "fixed",
            top: effectiveRect.top,
            left: effectiveRect.left,
            width: effectiveRect.width,
            height: effectiveRect.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className={cn(
            borderRadiusClass,
            "border border-white/25 pointer-events-none ring-2 ring-indigo-500/40"
          )}
        />
      ) : (
        /* Si no hay target específico pero el overlay está activo, oscurece uniformemente */
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] transition-opacity duration-300" />
      )}

      {children}
    </div>
  );
}
