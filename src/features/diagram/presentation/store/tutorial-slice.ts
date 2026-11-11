import { create } from "zustand";
import type { TutorialScene } from "../../domain/entities/tutorial.entity.ts";
import {
  setTutorialCookieStatus,
} from "../../infrastructure/utils/tutorial-cookie.ts";

export interface TutorialState {
  isActive: boolean;
  currentScene: TutorialScene;
  startTutorial: () => void;
  skipTutorial: () => void;
  setScene: (scene: TutorialScene) => void;
  nextScene: (next: TutorialScene) => void;
  completeTutorial: () => void;
  restartTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isActive: false,
  currentScene: "IDLE",

  startTutorial: () => {
    setTutorialCookieStatus("in_progress");
    set({
      isActive: true,
      currentScene: "SCENE_1_NEW_PROJECT",
    });
  },

  skipTutorial: () => {
    setTutorialCookieStatus("completed");
    set({
      isActive: false,
      currentScene: "IDLE",
    });
  },

  setScene: (scene: TutorialScene) => {
    if (scene === "IDLE") {
      set({ isActive: false, currentScene: "IDLE" });
    } else {
      set({ isActive: true, currentScene: scene });
    }
  },

  nextScene: (next: TutorialScene) => {
    set({
      isActive: next !== "IDLE",
      currentScene: next,
    });
  },

  completeTutorial: () => {
    setTutorialCookieStatus("completed");
    set({
      isActive: false,
      currentScene: "IDLE",
    });
  },

  restartTutorial: () => {
    setTutorialCookieStatus("pending");
    set({
      isActive: true,
      currentScene: "MODAL_WELCOME",
    });
  },
}));
