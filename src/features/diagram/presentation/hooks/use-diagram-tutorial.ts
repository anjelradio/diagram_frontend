"use client";

import { useEffect, useRef } from "react";
import { useTutorialStore } from "../store/tutorial-slice.ts";
import { useAppStore, type AppStore } from "@/features/shared/presentation/store/app-store";
import { getTutorialCookieStatus } from "../../infrastructure/utils/tutorial-cookie.ts";
import type { DiagramClassNodeType } from "../store/diagram-slice.ts";
import type {
  PetVisualState,
  PetPlacement,
  TutorialActionButton,
  TutorialSpotlightConfig,
} from "../../domain/entities/tutorial.entity.ts";

export interface DiagramTutorialUIState {
  isActive: boolean;
  spotlight: TutorialSpotlightConfig | null;
  petState: PetVisualState;
  petPlacement: PetPlacement;
  message: string;
  actionButton?: TutorialActionButton;
  targetSelector?: string | null;
}

/**
 * Hook orquestador del tutorial interactivo dentro del lienzo de diagramas.
 * Observa el store de ReactFlow (nodos, relaciones), herramientas y el asistente
 * para hacer avanzar secuencialmente las 17 escenas del tutorial de forma dinámica.
 */
export function useDiagramTutorial(): DiagramTutorialUIState & {
  onExit: () => void;
  nextStep: () => void;
} {
  const {
    isActive,
    currentScene,
    setScene,
    nextScene,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();

  const projectId = useAppStore((state: AppStore) => state.projectId);
  const nodes = useAppStore((state: AppStore) => state.nodes);
  const relations = useAppStore((state: AppStore) => state.relations);
  const activeTool = useAppStore((state: AppStore) => state.activeTool);
  const assistantSession = useAppStore((state: AppStore) =>
    projectId ? state.assistantSessions[projectId] : null
  );
  const isChatOpen = Boolean(assistantSession?.isOpen);
  const messagesCount = assistantSession?.messages.length ?? 0;

  // Guardar estado inicial para detectar cambios
  const initialNodesCountRef = useRef<number | null>(null);
  const initialClassNamesRef = useRef<string[]>([]);
  const initialRelationsCountRef = useRef<number | null>(null);
  const initialUserMessagesCountRef = useRef<number | null>(null);

  // Inicialización de la sesión del tutorial si la cookie está en 'in_progress'
  useEffect(() => {
    const status = getTutorialCookieStatus();
    if (status === "in_progress" && currentScene === "IDLE") {
      setScene("SCENE_2_TOOLBAR_EXPLORE");
    }
  }, [currentScene, setScene]);

  // Almacenar referencias iniciales cuando la escena entra al canvas
  useEffect(() => {
    if (isActive && initialNodesCountRef.current === null) {
      initialNodesCountRef.current = nodes.length;
      initialClassNamesRef.current = nodes.map((n: DiagramClassNodeType) => n.data?.name || "");
      initialRelationsCountRef.current = relations.length;
    }
  }, [isActive, nodes, relations]);

  // 1. Escena 3 -> Escena 4: cuando el usuario hace clic en el botón de crear clase
  useEffect(() => {
    if (currentScene === "SCENE_3_FOCUS_CREATE_CLASS" && activeTool === "create-class") {
      setScene("SCENE_4_CLICK_CANVAS");
    }
  }, [currentScene, activeTool, setScene]);

  // 2. Escena 4 -> Escena 5: cuando se crea la primera clase en el lienzo
  useEffect(() => {
    if (currentScene === "SCENE_4_CLICK_CANVAS") {
      const initial = initialNodesCountRef.current ?? 0;
      if (nodes.length > initial) {
        setScene("SCENE_5_CLASS_CREATED");
      }
    }
  }, [currentScene, nodes.length, setScene]);

  // 3. Escena 5 -> Escena 6: cuando el usuario renombra la clase
  useEffect(() => {
    if (currentScene === "SCENE_5_CLASS_CREATED") {
      const currentNames = nodes.map((n: DiagramClassNodeType) => n.data?.name || "");
      const changed = currentNames.some(
        (name: string, idx: number) => initialClassNamesRef.current[idx] && name !== initialClassNamesRef.current[idx]
      );
      if (changed) {
        setScene("SCENE_6_RENAME_DETECTED");
      }
    }
  }, [currentScene, nodes, setScene]);

  // 4. Escena 6 o posterior -> Escena 7 / 8: cuando se detecta al menos 2 clases en el lienzo
  useEffect(() => {
    if (
      currentScene === "SCENE_5_CLASS_CREATED" ||
      currentScene === "SCENE_6_RENAME_DETECTED" ||
      currentScene === "SCENE_7_TWO_CLASSES_CREATED"
    ) {
      const initial = initialNodesCountRef.current ?? 0;
      if (nodes.length >= initial + 2) {
        if (currentScene !== "SCENE_7_TWO_CLASSES_CREATED") {
          setScene("SCENE_7_TWO_CLASSES_CREATED");
        }
        // Pasar automáticamente a enfocar la barra de herramientas para relaciones
        const timer = setTimeout(() => {
          setScene("SCENE_8_RELATION_TOOLBAR");
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentScene, nodes.length, setScene]);

  // 5. Escena 8 -> Escena 9: cuando se hace clic en el botón de relaciones en la toolbar
  useEffect(() => {
    if (currentScene === "SCENE_8_RELATION_TOOLBAR" && activeTool === "relation") {
      setScene("SCENE_9_FIRST_VERTEX_PICKER");
    }
  }, [currentScene, activeTool, setScene]);

  // 6. Escena 9 y 10 -> Escena 11: detección de relaciones completadas
  useEffect(() => {
    if (currentScene === "SCENE_9_FIRST_VERTEX_PICKER" || currentScene === "SCENE_10_SECOND_VERTEX") {
      const initial = initialRelationsCountRef.current ?? 0;
      if (relations.length > initial) {
        setScene("SCENE_11_RELATION_DONE");
      }
    }
  }, [currentScene, relations.length, setScene]);

  // 7. Escena 12 -> Escena 13: cuando se abre el widget del chat del Agente
  useEffect(() => {
    if (currentScene === "SCENE_12_FOCUS_AGENT" && isChatOpen) {
      setScene("SCENE_13_AGENT_OPEN");
    }
  }, [currentScene, isChatOpen, setScene]);

  // 8. Escena 13 -> Escena 14: cuando el usuario envía su primer mensaje al chat
  useEffect(() => {
    if (currentScene === "SCENE_13_AGENT_OPEN") {
      if (initialUserMessagesCountRef.current === null) {
        initialUserMessagesCountRef.current = messagesCount;
      } else if (messagesCount > initialUserMessagesCountRef.current) {
        setScene("SCENE_14_AGENT_FIRST_MESSAGE");
      }
    }
  }, [currentScene, messagesCount, setScene]);

  // Configuración reactiva según la escena activa
  switch (currentScene) {
    case "SCENE_2_TOOLBAR_EXPLORE":
      return {
        isActive: true,
        spotlight: { targetSelector: "[data-tutorial='canvas-toolbar']", shape: "pill", padding: 8 },
        targetSelector: "[data-tutorial='canvas-toolbar']",
        petState: "explore",
        petPlacement: "left-of-target",
        message: "Mira, esta es la barra de herramientas. Aquí tienes las herramientas principales para crear clases y relacionarlas.",
        actionButton: {
          label: "Siguiente",
          onClick: () => nextScene("SCENE_3_FOCUS_CREATE_CLASS"),
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_3_FOCUS_CREATE_CLASS"),
      };

    case "SCENE_3_FOCUS_CREATE_CLASS":
      return {
        isActive: true,
        spotlight: { targetSelector: "[data-tutorial='tool-create-class']", shape: "circle", padding: 6 },
        targetSelector: "[data-tutorial='tool-create-class']",
        petState: "explore",
        petPlacement: "left-of-target",
        message: "Haz clic en ese botón para poder crear nuestra primera clase.",
        onExit: skipTutorial,
        nextStep: () => setScene("SCENE_4_CLICK_CANVAS"),
      };

    case "SCENE_4_CLICK_CANVAS":
      return {
        isActive: true,
        spotlight: null, // Pantalla normal
        targetSelector: null,
        petState: "idle",
        petPlacement: "bottom-right",
        message: "Haz clic en cualquier lado del lienzo para colocar tu primera clase.",
        onExit: skipTutorial,
        nextStep: () => setScene("SCENE_5_CLASS_CREATED"),
      };

    case "SCENE_5_CLASS_CREATED":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "happy",
        petPlacement: "bottom-right",
        message: "¡Bien hecho! Ahora intenta hacer doble clic en el nombre de la clase para editarlo.",
        actionButton: {
          label: "Continuar",
          onClick: () => nextScene("SCENE_6_RENAME_DETECTED"),
          variant: "secondary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_6_RENAME_DETECTED"),
      };

    case "SCENE_6_RENAME_DETECTED":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "think",
        petPlacement: "bottom-left",
        message: "¡Excelente! Ahora activa la herramienta de clase y crea una segunda clase en el lienzo.",
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_7_TWO_CLASSES_CREATED"),
      };

    case "SCENE_7_TWO_CLASSES_CREATED":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "happy",
        petPlacement: "bottom-left",
        message: "¡Fantástico, ya tenemos dos clases listas!",
        actionButton: {
          label: "Crear relación",
          onClick: () => nextScene("SCENE_8_RELATION_TOOLBAR"),
          variant: "primary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_8_RELATION_TOOLBAR"),
      };

    case "SCENE_8_RELATION_TOOLBAR":
      return {
        isActive: true,
        spotlight: { targetSelector: "[data-tutorial='tool-relation']", shape: "circle", padding: 6 },
        targetSelector: "[data-tutorial='tool-relation']",
        petState: "explore",
        petPlacement: "left-of-target",
        message: "Este botón sirve para hacer relaciones entre clases. Haz clic en él.",
        onExit: skipTutorial,
        nextStep: () => setScene("SCENE_9_FIRST_VERTEX_PICKER"),
      };

    case "SCENE_9_FIRST_VERTEX_PICKER":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "relation",
        petPlacement: "bottom-right",
        message: "Haz clic en alguno de los vértices (puntos de conexión) de la primera clase.",
        actionButton: {
          label: "Vértice seleccionado",
          onClick: () => nextScene("SCENE_10_SECOND_VERTEX"),
          variant: "secondary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_10_SECOND_VERTEX"),
      };

    case "SCENE_10_SECOND_VERTEX":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "relation",
        petPlacement: "bottom-right",
        message: "Selecciona una relación y luego haz clic en algún vértice de la otra clase para conectarlas.",
        actionButton: {
          label: "Relación conectada",
          onClick: () => nextScene("SCENE_11_RELATION_DONE"),
          variant: "secondary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_11_RELATION_DONE"),
      };

    case "SCENE_11_RELATION_DONE":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "done",
        petPlacement: "bottom-right",
        message: "¡Genial! Ahora ya sabes cómo crear clases y conectarlas con relaciones en tu diagrama.",
        actionButton: {
          label: "Siguiente",
          onClick: () => nextScene("SCENE_12_FOCUS_AGENT"),
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_12_FOCUS_AGENT"),
      };

    case "SCENE_12_FOCUS_AGENT":
      return {
        isActive: true,
        spotlight: { targetSelector: "[data-tutorial='agent-trigger-btn']", shape: "pill", padding: 8 },
        targetSelector: "[data-tutorial='agent-trigger-btn']",
        petState: "think",
        petPlacement: "right-of-target",
        message: "Mira este botón: es tu Asistente IA. Haz clic en él para abrir el chat inteligente.",
        actionButton: {
          label: "Abrir chat",
          onClick: () => nextScene("SCENE_13_AGENT_OPEN"),
          variant: "secondary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_13_AGENT_OPEN"),
      };

    case "SCENE_13_AGENT_OPEN":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "idle",
        petPlacement: "bottom-right",
        message: "Yo estaré aquí para ayudarte en todo momento. Prueba escribiendo un 'hola' en el chat.",
        actionButton: {
          label: "Mensaje enviado",
          onClick: () => nextScene("SCENE_14_AGENT_FIRST_MESSAGE"),
          variant: "secondary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_14_AGENT_FIRST_MESSAGE"),
      };

    case "SCENE_14_AGENT_FIRST_MESSAGE":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "happy",
        petPlacement: "bottom-right",
        message: "¡Hola! Puedo crear clases por ti, resolver dudas de modelado y sugerir mejoras.",
        actionButton: {
          label: "Siguiente",
          onClick: () => nextScene("SCENE_15_FOCUS_INTEGRATIONS"),
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_15_FOCUS_INTEGRATIONS"),
      };

    case "SCENE_15_FOCUS_INTEGRATIONS":
      return {
        isActive: true,
        spotlight: { targetSelector: "[data-tutorial='integrations-btn']", shape: "pill", padding: 6 },
        targetSelector: "[data-tutorial='integrations-btn']",
        petState: "think",
        petPlacement: "left-of-target",
        message: "Por último, haz clic en el botón de Integraciones para conectar tus herramientas externas.",
        actionButton: {
          label: "Ver integraciones",
          onClick: () => nextScene("SCENE_16_INTEGRATIONS_OPEN"),
          variant: "secondary",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_16_INTEGRATIONS_OPEN"),
      };

    case "SCENE_16_INTEGRATIONS_OPEN":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "explore",
        petPlacement: "bottom-left",
        message: "Contamos con integraciones como Notion y Neon para sincronizar tu documentación y bases de datos más eficientemente.",
        actionButton: {
          label: "Finalizar",
          onClick: () => nextScene("SCENE_17_TUTORIAL_COMPLETED"),
          variant: "success",
        },
        onExit: skipTutorial,
        nextStep: () => nextScene("SCENE_17_TUTORIAL_COMPLETED"),
      };

    case "SCENE_17_TUTORIAL_COMPLETED":
      return {
        isActive: true,
        spotlight: null,
        targetSelector: null,
        petState: "done",
        petPlacement: "center",
        message: "¡Felicidades! Has completado el tutorial básico. Ahora estás listo para modelar tus sistemas.",
        actionButton: {
          label: "Comenzar a diseñar",
          onClick: () => completeTutorial(),
          variant: "success",
        },
        onExit: completeTutorial,
        nextStep: () => completeTutorial(),
      };

    default:
      return {
        isActive: false,
        spotlight: null,
        targetSelector: null,
        petState: "idle",
        petPlacement: "bottom-right",
        message: "",
        onExit: skipTutorial,
        nextStep: () => {},
      };
  }
}
