"use client";

import type { RealtimeRemoteCursor } from "../../../domain/entities/realtime.entity.ts";

type RemoteCursorProps = { cursor: RealtimeRemoteCursor };

/** Cursor efímero de un colaborador, dibujado dentro del viewport de React Flow. */
export function RemoteCursor({ cursor }: RemoteCursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-transform duration-[33ms] ease-linear"
      style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
    >
      <span
        className="block h-3 w-3 rounded-full shadow-[0_0_10px_rgba(103,232,249,.8)]"
        style={{ backgroundColor: cursor.color }}
      />
      <span className="mt-1 block whitespace-nowrap rounded-full bg-[#17181d]/90 px-2 py-0.5 text-[10px] text-white">
        {cursor.userName}
      </span>
    </div>
  );
}
