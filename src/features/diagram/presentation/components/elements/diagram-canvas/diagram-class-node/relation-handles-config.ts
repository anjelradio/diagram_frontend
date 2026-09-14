import type { DiagramRelationHandle } from "../../../../../domain/entities/diagram-relation.entity";

export type HandleSide = "top" | "right" | "bottom" | "left";

export type RelationHandleConfig = {
  id: DiagramRelationHandle;
  side: HandleSide;
  offset: "25%" | "50%" | "75%";
  style: {
    left?: string;
    top?: string;
    right?: string;
    bottom?: string;
    transform?: string;
  };
};

export const RELATION_HANDLE_CONFIGS: readonly RelationHandleConfig[] = [
  {
    id: "TOP_LEFT",
    side: "top",
    offset: "25%",
    style: { left: "25%", top: "0px", transform: "translate(-50%, -50%)" },
  },
  {
    id: "TOP_CENTER",
    side: "top",
    offset: "50%",
    style: { left: "50%", top: "0px", transform: "translate(-50%, -50%)" },
  },
  {
    id: "TOP_RIGHT",
    side: "top",
    offset: "75%",
    style: { left: "75%", top: "0px", transform: "translate(-50%, -50%)" },
  },
  {
    id: "RIGHT_TOP",
    side: "right",
    offset: "25%",
    style: { right: "0px", top: "25%", transform: "translate(50%, -50%)" },
  },
  {
    id: "RIGHT_CENTER",
    side: "right",
    offset: "50%",
    style: { right: "0px", top: "50%", transform: "translate(50%, -50%)" },
  },
  {
    id: "RIGHT_BOTTOM",
    side: "right",
    offset: "75%",
    style: { right: "0px", top: "75%", transform: "translate(50%, -50%)" },
  },
  {
    id: "BOTTOM_LEFT",
    side: "bottom",
    offset: "25%",
    style: { left: "25%", bottom: "0px", transform: "translate(-50%, 50%)" },
  },
  {
    id: "BOTTOM_CENTER",
    side: "bottom",
    offset: "50%",
    style: { left: "50%", bottom: "0px", transform: "translate(-50%, 50%)" },
  },
  {
    id: "BOTTOM_RIGHT",
    side: "bottom",
    offset: "75%",
    style: { left: "75%", bottom: "0px", transform: "translate(-50%, 50%)" },
  },
  {
    id: "LEFT_TOP",
    side: "left",
    offset: "25%",
    style: { left: "0px", top: "25%", transform: "translate(-50%, -50%)" },
  },
  {
    id: "LEFT_CENTER",
    side: "left",
    offset: "50%",
    style: { left: "0px", top: "50%", transform: "translate(-50%, -50%)" },
  },
  {
    id: "LEFT_BOTTOM",
    side: "left",
    offset: "75%",
    style: { left: "0px", top: "75%", transform: "translate(-50%, -50%)" },
  },
] as const;

export function getHandleConfig(
  handleId: DiagramRelationHandle
): RelationHandleConfig | undefined {
  return RELATION_HANDLE_CONFIGS.find((h) => h.id === handleId);
}
