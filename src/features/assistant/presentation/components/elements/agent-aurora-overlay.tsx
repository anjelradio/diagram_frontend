"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

interface AgentAuroraOverlayProps {
  isLocked: boolean;
}

export function AgentAuroraOverlay({ isLocked }: AgentAuroraOverlayProps) {
  if (!isLocked || typeof document === "undefined") return null;

  return createPortal((
    <div
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden transition-opacity duration-500 animate-in fade-in"
      aria-hidden="true"
    >
      {/* Velos ondulantes: feedback de aurora real, no un marco estático. */}
      <div className="agent-aurora-wave agent-aurora-wave-one" />
      <div className="agent-aurora-wave agent-aurora-wave-two" />
      <div className="agent-aurora-wave agent-aurora-wave-three" />

      {/* Píldora superior informativa flotante */}
      <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-50">
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#191a1d]/90 border border-cyan-500/40 text-cyan-200 shadow-2xl text-xs font-medium tracking-tight">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin motion-reduce:animate-none" />
          <span>El Asistente IA está modificando el lienzo...</span>
        </div>
      </div>
      <style>{`
        .agent-aurora-wave {
          position: absolute;
          left: -18%;
          width: 136%;
          height: 38vh;
          border-radius: 48% 52% 42% 58%;
          opacity: .42;
          will-change: transform, opacity;
          transform: translate3d(0, -8vh, 0) rotate(-4deg) skewX(-8deg);
          background: linear-gradient(105deg, transparent 8%, rgba(45, 212, 191, .7) 28%, rgba(99, 102, 241, .72) 52%, rgba(217, 70, 239, .58) 72%, transparent 94%);
          filter: blur(16px);
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .agent-aurora-wave-one {
          top: -12vh;
          animation: agent-aurora-drift-one 9s ease-in-out infinite alternate;
        }
        .agent-aurora-wave-two {
          top: 22vh;
          opacity: .28;
          transform: translate3d(0, -4vh, 0) rotate(5deg) skewX(10deg);
          background: linear-gradient(100deg, transparent 4%, rgba(34, 211, 238, .62) 25%, rgba(129, 140, 248, .64) 54%, rgba(192, 132, 252, .5) 78%, transparent 96%);
          animation: agent-aurora-drift-two 12s ease-in-out infinite alternate;
        }
        .agent-aurora-wave-three {
          bottom: -18vh;
          opacity: .3;
          transform: translate3d(0, 5vh, 0) rotate(-7deg) skewX(-12deg);
          background: linear-gradient(95deg, transparent 6%, rgba(20, 184, 166, .62) 26%, rgba(79, 70, 229, .64) 56%, rgba(236, 72, 153, .48) 80%, transparent 96%);
          animation: agent-aurora-drift-three 11s ease-in-out infinite alternate;
        }
        @keyframes agent-aurora-drift-one {
          from { transform: translate3d(-4vw, -6vh, 0) rotate(-6deg) skewX(-10deg); opacity: .28; }
          to { transform: translate3d(5vw, 7vh, 0) rotate(3deg) skewX(-2deg); opacity: .5; }
        }
        @keyframes agent-aurora-drift-two {
          from { transform: translate3d(5vw, -2vh, 0) rotate(7deg) skewX(12deg); opacity: .18; }
          to { transform: translate3d(-5vw, 6vh, 0) rotate(-2deg) skewX(4deg); opacity: .38; }
        }
        @keyframes agent-aurora-drift-three {
          from { transform: translate3d(-3vw, 4vh, 0) rotate(-9deg) skewX(-14deg); opacity: .2; }
          to { transform: translate3d(4vw, -3vh, 0) rotate(1deg) skewX(-5deg); opacity: .4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agent-aurora-wave { animation: none; transform: none; }
        }
      `}</style>
    </div>
  ), document.body);
}
