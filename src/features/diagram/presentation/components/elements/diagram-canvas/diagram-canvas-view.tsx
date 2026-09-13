"use client";

import { useDiagramSynchronizer } from "@/features/diagram/presentation/hooks/use-diagram-synchronizer";
import { DiagramFlowCanvas, type CanvasTool } from "./diagram-flow-canvas";
import type { DiagramSnapshot } from "@/features/diagram/domain/entities/diagram-class.entity";

type DiagramCanvasViewProps = {
  projectId: string;
  viewerId: string;
  initialSnapshot?: DiagramSnapshot;
  activeTool: CanvasTool;
  isTemporaryHand: boolean;
  onClassCreated?: () => void;
};

export function DiagramCanvasView({
  projectId,
  viewerId,
  initialSnapshot,
  activeTool,
  isTemporaryHand,
  onClassCreated,
}: DiagramCanvasViewProps) {
  useDiagramSynchronizer({
    projectId,
    viewerId,
    initialSnapshot,
  });

  return (
    <div className="w-full h-full relative">
      <DiagramFlowCanvas
        activeTool={activeTool}
        isTemporaryHand={isTemporaryHand}
        onClassCreated={onClassCreated}
      />
    </div>
  );
}
