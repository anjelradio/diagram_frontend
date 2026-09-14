import { create } from "zustand";
import {
  createDiagramSlice,
  type DiagramSlice,
} from "@/features/diagram/presentation/store/diagram-slice";
import {
  createCollaborationSlice,
  type CollaborationSlice,
} from "@/features/diagram/presentation/store/collaboration-slice";

/**
 * Agregador global de Zustand para la aplicación.
 * Combina los slices de cada feature en una única fuente de verdad controlada.
 * No se usa persist para los nodos del diagrama para garantizar integridad con el servidor.
 */
export type AppStore = DiagramSlice & CollaborationSlice;

export const useAppStore = create<AppStore>((set, get, store) => ({
  ...createDiagramSlice(set, get, store),
  ...createCollaborationSlice(set, get, store),
}));
