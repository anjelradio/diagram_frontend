"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

interface AgentAuroraOverlayProps {
  isLocked: boolean;
}

export function AgentAuroraOverlay({ isLocked }: AgentAuroraOverlayProps) {
  if (!isLocked || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden animate-in fade-in duration-700"
      aria-hidden="true"
    >
      {/* Ondas horizontales en sentido horario + variación de altura sutil */}
      <div className="aurora-stream aurora-stream-top" />
      <div className="aurora-stream aurora-stream-bottom" />
      <div className="aurora-stream aurora-stream-left" />
      <div className="aurora-stream aurora-stream-right" />

      {/* Velos de glow con pulso de altura */}
      <div className="aurora-glow aurora-glow-top" />
      <div className="aurora-glow aurora-glow-bottom" />

      <div className="aurora-haze" />

      <div className="absolute top-4 inset-x-0 flex justify-center z-50">
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#191a1d]/92 border border-white/10 text-zinc-100 shadow-xl backdrop-blur-md text-xs font-medium tracking-tight">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300/90 animate-pulse motion-reduce:animate-none" />
          <span>El Asistente IA está trabajando...</span>
        </div>
      </div>

      <style>{`
        .aurora-stream {
          position: absolute;
          pointer-events: none;
          will-change: transform;
          mix-blend-mode: screen;
          filter: blur(16px);
          opacity: 0.64;
          overflow: hidden;
        }
        .aurora-stream::before {
          content: "";
          position: absolute;
          inset: 0;
          background-size: 200% 100%;
          will-change: background-position, transform;
        }
        /* Superior: onda viaja izquierda -> derecha (horario) */
        .aurora-stream-top {
          top: 0; left: 0; right: 0; height: 18px;
        }
        .aurora-stream-top::before {
          background: linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.0) 8%, rgba(34,211,238,0.95) 22%, rgba(99,102,241,0.85) 44%, rgba(192,132,252,0.55) 64%, rgba(34,211,238,0.0) 92%, transparent 100%);
          animation: aurora-slide-right 3.8s linear infinite, aurora-height-pulse 2.9s ease-in-out infinite alternate;
        }
        /* Derecha: onda viaja arriba -> abajo (horario) */
        .aurora-stream-right {
          top: 0; right: 0; bottom: 0; width: 18px;
        }
        .aurora-stream-right::before {
          background: linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.0) 8%, rgba(99,102,241,0.82) 22%, rgba(192,132,252,0.55) 46%, rgba(34,211,238,0.42) 68%, transparent 92%);
          background-size: 100% 200%;
          animation: aurora-slide-down 3.8s linear infinite 0.95s, aurora-width-pulse 2.9s ease-in-out infinite alternate 0.4s;
        }
        /* Inferior: derecha -> izquierda (horario) */
        .aurora-stream-bottom {
          bottom: 0; left: 0; right: 0; height: 18px;
        }
        .aurora-stream-bottom::before {
          background: linear-gradient(270deg, transparent 0%, rgba(20,184,166,0.0) 8%, rgba(20,184,166,0.88) 22%, rgba(79,70,229,0.72) 46%, rgba(236,72,153,0.38) 68%, transparent 92%);
          background-size: 200% 100%;
          animation: aurora-slide-left 3.8s linear infinite 1.9s, aurora-height-pulse 2.9s ease-in-out infinite alternate 0.8s;
        }
        /* Izquierda: abajo -> arriba (horario) */
        .aurora-stream-left {
          top: 0; left: 0; bottom: 0; width: 18px;
        }
        .aurora-stream-left::before {
          background: linear-gradient(0deg, transparent 0%, rgba(34,211,238,0.0) 8%, rgba(34,211,238,0.74) 22%, rgba(99,102,241,0.52) 48%, rgba(192,132,252,0.36) 70%, transparent 92%);
          background-size: 100% 200%;
          animation: aurora-slide-up 3.8s linear infinite 2.85s, aurora-width-pulse 2.9s ease-in-out infinite alternate 1.2s;
        }

        .aurora-glow {
          position: absolute;
          pointer-events: none;
          will-change: transform, opacity;
          mix-blend-mode: screen;
          filter: blur(24px);
          opacity: 0.26;
        }
        .aurora-glow-top {
          top: 0; left: 2%; right: 2%; height: 14vh; max-height: 128px;
          background:
            radial-gradient(110% 100% at 24% 0%, rgba(34,211,238,0.38) 0%, transparent 62%),
            radial-gradient(110% 100% at 62% 0%, rgba(99,102,241,0.32) 0%, transparent 60%),
            radial-gradient(110% 100% at 86% 0%, rgba(192,132,252,0.20) 0%, transparent 62%),
            linear-gradient(180deg, rgba(45,212,191,0.16), transparent 94%);
          border-radius: 0 0 40% 40% / 0 0 100% 100%;
          animation: aurora-glow-pulse 3.2s ease-in-out infinite alternate;
        }
        .aurora-glow-bottom {
          bottom: 0; left: 2%; right: 2%; height: 13vh; max-height: 118px;
          background:
            radial-gradient(110% 100% at 32% 100%, rgba(20,184,166,0.30) 0%, transparent 62%),
            radial-gradient(110% 100% at 70% 100%, rgba(79,70,229,0.26) 0%, transparent 60%),
            radial-gradient(110% 100% at 88% 100%, rgba(236,72,153,0.14) 0%, transparent 62%),
            linear-gradient(0deg, rgba(45,212,191,0.11), transparent 94%);
          border-radius: 40% 40% 0 0 / 100% 100% 0 0;
          animation: aurora-glow-pulse 3.2s ease-in-out infinite alternate-reverse;
        }

        .aurora-haze {
          position: absolute;
          inset: 0;
          background: radial-gradient(70% 58% at 50% 18%, rgba(99,102,241,0.085), transparent 70%);
          filter: blur(14px);
          opacity: 0.95;
        }

        @keyframes aurora-slide-right {
          0% { background-position: -100% 0%; transform: translateX(-2%); }
          100% { background-position: 200% 0%; transform: translateX(2%); }
        }
        @keyframes aurora-slide-left {
          0% { background-position: 200% 0%; transform: translateX(2%); }
          100% { background-position: -100% 0%; transform: translateX(-2%); }
        }
        @keyframes aurora-slide-down {
          0% { background-position: 0% -100%; transform: translateY(-2%); }
          100% { background-position: 0% 200%; transform: translateY(2%); }
        }
        @keyframes aurora-slide-up {
          0% { background-position: 0% 200%; transform: translateY(2%); }
          100% { background-position: 0% -100%; transform: translateY(-2%); }
        }
        /* Variación sutil de altura (glow) */
        @keyframes aurora-height-pulse {
          0% { transform: scaleY(1) translateX(-1%); opacity: 0.9; }
          100% { transform: scaleY(1.55) translateX(1%); opacity: 1; }
        }
        @keyframes aurora-width-pulse {
          0% { transform: scaleX(1) translateY(-1%); opacity: 0.9; }
          100% { transform: scaleX(1.55) translateY(1%); opacity: 1; }
        }
        @keyframes aurora-glow-pulse {
          0% { transform: scaleY(0.92); opacity: 0.82; }
          100% { transform: scaleY(1.18); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-stream::before, .aurora-glow { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
