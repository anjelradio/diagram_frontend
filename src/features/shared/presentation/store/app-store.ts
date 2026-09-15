import { create } from "zustand";
import {
  createDiagramSlice,
  type DiagramSlice,
} from "@/features/diagram/presentation/store/diagram-slice";
import {
  createRealtimeSlice,
  type RealtimeSlice,
} from "@/features/realtime/presentation/store/realtime-slice";

/**
 * Agregador global de Zustand para la aplicación.
 * Combina los slices de cada feature en una única fuente de verdad controlada.
 * No se usa persist para los nodos del diagrama para garantizar integridad con el servidor.
 */
export type AppStore = DiagramSlice & RealtimeSlice;

export const useAppStore = create<AppStore>((set, get, store) => ({
  ...createDiagramSlice(set, get, store),
  ...createRealtimeSlice(set, get, store),
}));

