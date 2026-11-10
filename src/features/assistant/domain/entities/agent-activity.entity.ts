/**
 * Entidades y tipos de dominio para el Asistente IA y su historial de actividades.
 * TypeScript puro conforme al Principio 1 de la Constitución de Frontend.
 */

export type AssistantVisualState =
  | "idle"
  | "options_open"
  | "recording"
  | "thinking";

export type AgentActivityCode =
  | "preparing_context"
  | "analyzing_prompt"
  | "planning"
  | "analyzing_image"
  | "reading_diagram"
  | "reading_classes"
  | "reading_attributes"
  | "reading_relations"
  | "creating_class"
  | "editing_class"
  | "deleting_class"
  | "creating_attribute"
  | "editing_attribute"
  | "deleting_attribute"
  | "creating_relation"
  | "editing_relation"
  | "deleting_relation"
  | "recalling_conversation"
  | "finalizing";

export type AgentActivityType = "query" | "edit" | "analysis" | "planning";

const activityLabels = {
  preparing_context: "Preparando el contexto…",
  analyzing_prompt: "Analizando la solicitud…",
  planning: "Creando un plan…",
  analyzing_image: "Analizando la imagen…",
  reading_diagram: "Consultando el diagrama…",
  reading_classes: "Consultando clases…",
  reading_attributes: "Consultando atributos…",
  reading_relations: "Consultando relaciones…",
  recalling_conversation: "Recordando conversaciones…",
  creating_class: "Creando clase…",
  editing_class: "Editando clase…",
  deleting_class: "Eliminando clase…",
  creating_attribute: "Creando atributo…",
  editing_attribute: "Editando atributo…",
  deleting_attribute: "Eliminando atributo…",
  creating_relation: "Creando relación…",
  editing_relation: "Editando relación…",
  deleting_relation: "Eliminando relación…",
  finalizing: "Preparando la respuesta…",
} satisfies Record<AgentActivityCode, string>;

export function getAgentActivityLabel(code: AgentActivityCode | null | undefined): string {
  return code ? activityLabels[code] : "Pensando…";
}

export function getAgentActivityType(code: AgentActivityCode | null | undefined): AgentActivityType {
  switch (code) {
    case "reading_diagram":
    case "reading_classes":
    case "reading_attributes":
    case "reading_relations":
    case "recalling_conversation":
      return "query";
    case "creating_class":
    case "editing_class":
    case "deleting_class":
    case "creating_attribute":
    case "editing_attribute":
    case "deleting_attribute":
    case "creating_relation":
    case "editing_relation":
    case "deleting_relation":
      return "edit";
    case "planning":
      return "planning";
    case "preparing_context":
    case "analyzing_prompt":
    case "analyzing_image":
    case "finalizing":
    default:
      return "analysis";
  }
}
