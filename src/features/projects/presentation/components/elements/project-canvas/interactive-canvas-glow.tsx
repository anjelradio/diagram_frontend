"use client";

import { useEffect, useRef } from "react";
import { useViewport } from "@xyflow/react";
import { PROJECT_CANVAS_CONFIG } from "@/features/projects/presentation/constants/canvas.config";

const GRID_SPACING = PROJECT_CANVAS_CONFIG.grid.gap; // Sincronizado con React Flow Background
const BASE_DOT_SIZE = PROJECT_CANVAS_CONFIG.grid.size; // Tamaño base del punto
const GLOW_RADIUS = 210; // Radio de iluminación alrededor del cursor
const GLOW_RADIUS_SQ = GLOW_RADIUS * GLOW_RADIUS;
const INACTIVITY_DELAY = 1200; // 1.2s para suspender el bucle

/**
 * Capa hiper-optimizada que proyecta el efecto de iluminación del cursor (estilo layout de autenticación)
 * sobre los puntos del lienzo de React Flow en la vista de proyecto.
 *
 * Características de rendimiento:
 * - Se sincroniza en tiempo real con el viewport de React Flow (paneo x/y y zoom).
 * - Bounding Box Culling: sólo evalúa los puntos dentro de ~210px del cursor (~200 puntos).
 * - Dirty Rect: limpia únicamente el recuadro que cambió en el fotograma anterior en vez de toda la pantalla.
 * - Suspensión completa en reposo: 0.0% de uso de CPU cuando el mouse no se mueve por 1.2s.
 * - Soporte para DPR hasta 2x y respeto de 'prefers-reduced-motion'.
 * - pointer-events-none: 0 interferencia con clics, arrastres, selección o controles del lienzo.
 */
export function InteractiveCanvasGlow() {
  const { x, y, zoom } = useViewport();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const viewportRef = useRef({ x, y, zoom });
  const startLoopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    viewportRef.current = { x, y, zoom };
    // Si cambia el viewport mientras el resplandor está activo, reactivar el bucle para redibujar
    if (startLoopRef.current) {
      startLoopRef.current();
    }
  }, [x, y, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    let animationFrameId: number | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    let lastMoveTime = 0;
    let glowIntensity = 0;
    let isLoopRunning = false;

    type BoundingBox = {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    } | null;
    let prevBox: BoundingBox = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      prevBox = null;
    };

    const render = () => {
      const now = performance.now();
      const timeSinceMove = now - lastMoveTime;

      const targetIntensity =
        mouse.active && timeSinceMove < INACTIVITY_DELAY ? 1 : 0;
      const lerpSpeed = targetIntensity === 0 ? 0.045 : 0.12;
      glowIntensity += (targetIntensity - glowIntensity) * lerpSpeed;

      mouse.x += (mouse.targetX - mouse.x) * 0.25;
      mouse.y += (mouse.targetY - mouse.y) * 0.25;

      // Limpieza localizada del recuadro sucio anterior (Dirty Rect)
      if (prevBox) {
        const pad = 12;
        const clrX = Math.max(0, Math.floor(prevBox.minX - pad));
        const clrY = Math.max(0, Math.floor(prevBox.minY - pad));
        const clrW = Math.min(
          width - clrX,
          Math.ceil(prevBox.maxX - prevBox.minX + pad * 2)
        );
        const clrH = Math.min(
          height - clrY,
          Math.ceil(prevBox.maxY - prevBox.minY + pad * 2)
        );
        ctx.clearRect(clrX, clrY, clrW, clrH);
      }

      // Si la intensidad es prácticamente cero y el cursor está inactivo, suspender el bucle
      if (glowIntensity < 0.002 && targetIntensity === 0) {
        glowIntensity = 0;
        ctx.clearRect(0, 0, width, height);
        prevBox = null;
        isLoopRunning = false;
        return;
      }

      const currentVp = viewportRef.current;
      const currentZoom = currentVp.zoom;
      const spacing = GRID_SPACING * currentZoom;
      const scaledSize = BASE_DOT_SIZE * currentZoom;
      const baseDotRadius = scaledSize / 2;

      // Cálculo exacto del desfase alineado con el SVG <pattern> de React Flow Background
      // En React Flow: pattern x = (x % scaledGap) con patternTransform translate(-scaledGap/2, -scaledGap/2) y cx = radius
      const rawOffsetX =
        (currentVp.x % spacing) - spacing / 2 + baseDotRadius;
      const rawOffsetY =
        (currentVp.y % spacing) - spacing / 2 + baseDotRadius;

      const offsetX = ((rawOffsetX % spacing) + spacing) % spacing;
      const offsetY = ((rawOffsetY % spacing) + spacing) % spacing;

      // Delimitación local: iterar solo la cuadrícula en el radio relevante
      const startX =
        Math.floor((mouse.x - GLOW_RADIUS - offsetX) / spacing) * spacing +
        offsetX;
      const endX =
        Math.ceil((mouse.x + GLOW_RADIUS - offsetX) / spacing) * spacing +
        offsetX;
      const startY =
        Math.floor((mouse.y - GLOW_RADIUS - offsetY) / spacing) * spacing +
        offsetY;
      const endY =
        Math.ceil((mouse.y + GLOW_RADIUS - offsetY) / spacing) * spacing +
        offsetY;

      let currentMinX = width;
      let currentMinY = height;
      let currentMaxX = 0;
      let currentMaxY = 0;
      let drawnAny = false;

      for (let px = startX; px <= endX; px += spacing) {
        if (px < 0 || px > width) continue;
        for (let py = startY; py <= endY; py += spacing) {
          if (py < 0 || py > height) continue;

          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < GLOW_RADIUS_SQ && glowIntensity > 0) {
            const dist = Math.sqrt(distSq);
            const proximity = 1 - dist / GLOW_RADIUS;
            const eased = Math.pow(proximity, 1.35) * glowIntensity;

            if (eased > 0.008) {
              const angle = Math.atan2(dy, dx);
              const hue = Math.round(
                240 + Math.sin(angle * 2 + now * 0.002) * 55
              );

              const currentRadius = baseDotRadius + eased * 1.5;
              const alpha = Math.min(1, 0.18 + eased * 0.82);

              ctx.fillStyle = `hsla(${hue}, 85%, 68%, ${alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
              ctx.fill();

              if (px < currentMinX) currentMinX = px;
              if (px > currentMaxX) currentMaxX = px;
              if (py < currentMinY) currentMinY = py;
              if (py > currentMaxY) currentMaxY = py;
              drawnAny = true;
            }
          }
        }
      }

      if (drawnAny) {
        prevBox = {
          minX: currentMinX - 4,
          minY: currentMinY - 4,
          maxX: currentMaxX + 4,
          maxY: currentMaxY + 4,
        };
      } else {
        prevBox = null;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };
    startLoopRef.current = startLoop;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
      lastMoveTime = performance.now();
      startLoop();
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      startLoop();
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("mouseleave", handlePointerLeave);

    resize();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      startLoopRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
