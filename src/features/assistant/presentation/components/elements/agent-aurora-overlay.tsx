"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import {
  sampleAuroraRidge,
  type AuroraRidgeSample,
} from "./agent-aurora-geometry";
import styles from "./agent-aurora-overlay.module.css";

interface AgentAuroraOverlayProps {
  isLocked: boolean;
  isCancelling?: boolean;
}

type AuroraEdgePosition = "top" | "bottom";

const FRAME_MS = 1000 / 30;
const MAX_DPR = 1.5;
const EXIT_MS = 850;
const SHEET_COLORS = [
  [31, 237, 229],
  [82, 249, 244],
  [83, 171, 252],
  [216, 104, 241],
  [38, 239, 232],
] as const;

function traceRidge(ctx: CanvasRenderingContext2D, samples: AuroraRidgeSample[]) {
  ctx.beginPath();
  samples.forEach((sample, index) => {
    if (index === 0) ctx.moveTo(sample.x, sample.y);
    else ctx.lineTo(sample.x, sample.y);
  });
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ridge: AuroraRidgeSample[],
) {
  const depth = ridge[0]?.depth ?? 0.5;
  const scale = height / 100;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  // One continuous surface: the wave is its inner edge and the viewport edge
  // closes it. A single gradient avoids seams between vertical segments.
  traceRidge(ctx, ridge);
  ctx.lineTo(width, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();

  const surface = ctx.createLinearGradient(0, 0, width, 0);
  SHEET_COLORS.forEach((channels, index) => {
    surface.addColorStop(index / (SHEET_COLORS.length - 1),
      `rgba(${channels.join(", ")}, ${0.58 + depth * 0.2})`);
  });
  ctx.fillStyle = surface;
  ctx.fill();

  const depthLight = ctx.createLinearGradient(0, 0, 0, height);
  depthLight.addColorStop(0, "rgba(255, 255, 255, 0)");
  depthLight.addColorStop(1, "rgba(255, 255, 255, 0.15)");
  ctx.fillStyle = depthLight;
  ctx.fill();

  const rim = ctx.createLinearGradient(0, 0, width, 0);
  rim.addColorStop(0, "rgba(31, 237, 229, 0.82)");
  rim.addColorStop(0.32, "rgba(82, 249, 244, 0.96)");
  rim.addColorStop(0.54, "rgba(83, 171, 252, 0.9)");
  rim.addColorStop(0.76, "rgba(216, 104, 241, 0.94)");
  rim.addColorStop(1, "rgba(38, 239, 232, 0.84)");
  ctx.strokeStyle = rim;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  traceRidge(ctx, ridge);

  // A broad bloom plus a soft luminous rim brighten the same silhouette;
  // the continuous fill remains the dominant shape, not a separate line.
  ctx.filter = `blur(${(9 + depth * 2) * scale}px)`;
  ctx.lineWidth = (18 + depth * 5) * scale;
  ctx.globalAlpha = 0.72 + depth * 0.18;
  ctx.stroke();

  ctx.filter = `blur(${(3 + depth * 1.5) * scale}px)`;
  ctx.lineWidth = (5 + depth * 2) * scale;
  ctx.globalAlpha = 0.82 + depth * 0.12;
  ctx.stroke();

  // The blurred rim may otherwise be cut by the canvas as a straight,
  // full-width line. Fade only its outer reach before that boundary.
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-in";
  const edgeFade = ctx.createLinearGradient(0, height * 0.78, 0, height);
  edgeFade.addColorStop(0, "rgba(0, 0, 0, 1)");
  edgeFade.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = edgeFade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function AuroraEdge({ position }: { position: AuroraEdgePosition }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seed = position === "top" ? 0 : 2.4;
    let frameId = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;

    const draw = (now: number) => {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const seconds = motionPreference.matches ? 0 : now / 1000;
      const step = Math.max(4, Math.min(8, width / 130));
      const ridge: AuroraRidgeSample[] = [];
      for (let x = 0; x < width; x += step) {
        ridge.push(sampleAuroraRidge(x, width, height, seconds, seed));
      }
      ridge.push(sampleAuroraRidge(width, width, height, seconds, seed));
      drawAurora(ctx, width, height, ridge);
    };

    const tick = (now: number) => {
      if (document.hidden || motionPreference.matches) return;
      if (now - lastFrame >= FRAME_MS) {
        draw(now);
        lastFrame = now;
      }
      frameId = requestAnimationFrame(tick);
    };

    const syncAnimation = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
      if (document.hidden) return;
      const now = performance.now();
      draw(now);
      lastFrame = now;
      if (!motionPreference.matches) frameId = requestAnimationFrame(tick);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncAnimation();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    motionPreference.addEventListener("change", syncAnimation);
    document.addEventListener("visibilitychange", syncAnimation);
    resize();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      motionPreference.removeEventListener("change", syncAnimation);
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, [position]);

  return (
    <div className={`${styles.edge} ${position === "bottom" ? styles.edgeBottom : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

export function AgentAuroraOverlay({ isLocked, isCancelling = false }: AgentAuroraOverlayProps) {
  const [shouldRender, setShouldRender] = useState(isLocked);

  useEffect(() => {
    if (isLocked) {
      if (shouldRender) return;
      const frameId = requestAnimationFrame(() => setShouldRender(true));
      return () => cancelAnimationFrame(frameId);
    }
    if (!shouldRender) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeoutId = window.setTimeout(() => setShouldRender(false), reducedMotion ? 150 : EXIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isLocked, shouldRender]);

  if ((!isLocked && !shouldRender) || typeof document === "undefined") return null;

  return createPortal(
    <div className={`fixed inset-0 z-[25] overflow-hidden pointer-events-none ${!isLocked ? styles.leaving : "animate-in fade-in duration-700 motion-reduce:animate-none"}`}>
      <AuroraEdge position="top" />
      <AuroraEdge position="bottom" />

      <div className={`absolute top-4 inset-x-0 z-10 flex justify-center ${styles.status}`} role="status" aria-live="polite">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#191a1d]/92 px-4 py-1.5 text-xs font-medium tracking-tight text-zinc-100 shadow-xl backdrop-blur-md">
          <Sparkles className="size-3.5 text-cyan-300/90 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <span>{isCancelling ? "Cancelando la instrucción actual…" : "El Asistente IA está trabajando..."}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
