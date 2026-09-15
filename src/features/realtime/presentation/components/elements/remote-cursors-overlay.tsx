"use client";

import { ViewportPortal } from "@xyflow/react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { RemoteCursor } from "./remote-cursor.tsx";

export function RemoteCursorsOverlay() {
  const remoteCursors = useAppStore((s) => s.remoteCursors);
  const cursors = Object.values(remoteCursors);
  return (
    <ViewportPortal>
      {cursors.map((cursor) => (
        <RemoteCursor key={cursor.userId} cursor={cursor} />
      ))}
    </ViewportPortal>
  );
}
