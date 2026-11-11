/**
 * Tipos de dominio y máquina de estados para el tutorial dinámico e interactivo del lienzo.
 */

export type TutorialScene =
  | "IDLE"
  | "MODAL_WELCOME"
  | "SCENE_1_NEW_PROJECT"
  | "SCENE_2_TOOLBAR_EXPLORE"
  | "SCENE_3_FOCUS_CREATE_CLASS"
  | "SCENE_4_CLICK_CANVAS"
  | "SCENE_5_CLASS_CREATED"
  | "SCENE_6_RENAME_DETECTED"
  | "SCENE_7_TWO_CLASSES_CREATED"
  | "SCENE_8_RELATION_TOOLBAR"
  | "SCENE_9_FIRST_VERTEX_PICKER"
  | "SCENE_10_SECOND_VERTEX"
  | "SCENE_11_RELATION_DONE"
  | "SCENE_12_FOCUS_AGENT"
  | "SCENE_13_AGENT_OPEN"
  | "SCENE_14_AGENT_FIRST_MESSAGE"
  | "SCENE_15_FOCUS_INTEGRATIONS"
  | "SCENE_16_INTEGRATIONS_OPEN"
  | "SCENE_17_TUTORIAL_COMPLETED";

export type PetVisualState =
  | "done"
  | "explore"
  | "happy"
  | "idle"
  | "relation"
  | "think";

export type PetPlacement =
  | "left-of-target"
  | "right-of-target"
  | "bottom-of-target"
  | "top-of-target"
  | "bottom-right"
  | "bottom-left"
  | "center";

export interface TutorialSpotlightConfig {
  targetSelector: string;
  shape?: "rect" | "pill" | "circle";
  padding?: number;
}

export interface TutorialActionButton {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success";
}

export interface TutorialStepConfig {
  scene: TutorialScene;
  spotlight: TutorialSpotlightConfig | null;
  petState: PetVisualState;
  petPlacement: PetPlacement;
  message: string;
  bubblePosition?: "left" | "right" | "top" | "bottom";
  actionButton?: TutorialActionButton;
}
