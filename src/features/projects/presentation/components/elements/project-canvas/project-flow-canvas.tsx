"use client";

import type { ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  PanOnScrollMode,
  ReactFlow,
  useNodesState,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Redo2, Undo2 } from "lucide-react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { cn } from "@/lib/utils";
import { InteractiveCanvasGlow } from "./interactive-canvas-glow";
import {
  defaultProductClassNode,
  UmlClassNode,
  type UmlClassNodeType,
} from "./uml-class-node";
import { PROJECT_CANVAS_CONFIG } from "@/features/projects/presentation/constants/canvas.config";

export type CanvasTool = "cursor" | "select" | "hand";

const nodeTypes = {
  umlClass: UmlClassNode,
};

type ProjectFlowCanvasProps = {
  activeTool: CanvasTool;
  isTemporaryHand: boolean;
  children?: ReactNode;
};

/**
 * Indicador aislado de nivel de zoom que se re-renderiza solo cuando cambia el viewport.
 */
export function ProjectZoomIndicator() {
  const { zoom = 1 } = useViewport();
  const percentage = Math.round(zoom * 100);

  return (
    <div className="flex items-center justify-center bg-[#191a1d] border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg text-white text-xs font-medium select-none">
      <span
        className="text-[11.5px] font-mono text-white"
        title="Nivel de zoom"
      >
        {percentage}%
      </span>
    </div>
  );
}

/**
 * Controles de zoom y deshacer/rehacer ubicados en la esquina inferior derecha.
 */
export function ProjectCanvasBottomControls() {
  return (
    <div className="pointer-events-auto flex items-center gap-2.5 select-none">
      <div className="flex items-center space-x-1 bg-[#191a1d] border border-white/10 px-2 py-1 rounded-full shadow-lg text-white text-xs font-medium">
        <button
          type="button"
          onClick={() =>
            appToast.info(
              "Deshacer estará disponible en una próxima versión.",
            )
          }
          className="w-7 h-7 rounded-full text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            appToast.info(
              "Rehacer estará disponible en una próxima versión.",
            )
          }
          className="w-7 h-7 rounded-full text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Rehacer (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <ProjectZoomIndicator />
    </div>
  );
}

/**
 * Lienzo cliente interactivo basado en React Flow.
 * Configurado con fondo de puntos idéntico a Stitch, límites de zoom 25%-200%,
 * zoom condicionado a tecla Control/Meta + rueda y nodo de prueba de Clase UML Producto.
 */
export function ProjectFlowCanvas({
  activeTool,
  isTemporaryHand,
  children,
}: ProjectFlowCanvasProps) {
  const [nodes, , onNodesChange] = useNodesState<UmlClassNodeType>([
    defaultProductClassNode,
  ]);

  const isHandActive = activeTool === "hand" || isTemporaryHand;
  const isSelectActive = activeTool === "select" && !isTemporaryHand;

  const cursorClass = isHandActive
    ? "cursor-grab active:cursor-grabbing"
    : isSelectActive
      ? "cursor-crosshair"
      : "cursor-default";

  return (
    <div
      className={cn(
        "relative w-full h-screen overflow-hidden select-none bg-[#212224]",
        cursorClass,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        minZoom={PROJECT_CANVAS_CONFIG.zoom.min}
        maxZoom={PROJECT_CANVAS_CONFIG.zoom.max}
        defaultViewport={PROJECT_CANVAS_CONFIG.viewport.default}
        translateExtent={PROJECT_CANVAS_CONFIG.extent.translate}
        nodeExtent={PROJECT_CANVAS_CONFIG.extent.node}
        zoomActivationKeyCode={
          PROJECT_CANVAS_CONFIG.shortcuts.zoomActivationKeyCode as unknown as string[]
        }
        panOnDrag={isHandActive ? [0, 1, 2] : false}
        selectionOnDrag={isSelectActive}
        elementsSelectable={!isHandActive}
        nodesDraggable={!isHandActive}
        panOnScroll={PROJECT_CANVAS_CONFIG.navigation.panOnScroll}
        panOnScrollMode={PROJECT_CANVAS_CONFIG.navigation.panOnScrollMode as PanOnScrollMode}
        panOnScrollSpeed={PROJECT_CANVAS_CONFIG.navigation.panOnScrollSpeed}
        zoomOnScroll={true}
        zoomOnPinch={true}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={false}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={PROJECT_CANVAS_CONFIG.grid.gap}
          size={PROJECT_CANVAS_CONFIG.grid.size}
          color={PROJECT_CANVAS_CONFIG.grid.color}
          bgColor={PROJECT_CANVAS_CONFIG.grid.bgColor}
        />
        <InteractiveCanvasGlow />
        {children}
      </ReactFlow>
    </div>
  );
}
