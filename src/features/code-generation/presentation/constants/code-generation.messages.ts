export const CODE_GENERATION_MESSAGES = {
  loading: {
    generating: "Generando backend en Spring Boot...",
    buttonGenerating: "Generando...",
  },
  success: {
    downloadComplete: "¡Backend generado y descargado con éxito!",
  },
  validation: {
    emptyDiagram: "El diagrama no contiene clases para generar el backend.",
    noProject: "No se encontró el proyecto seleccionado.",
  },
  error: {
    defaultTitle: "Error de Generación",
    defaultMessage: "No se pudo generar el backend del proyecto.",
    unexpectedTitle: "Error Inesperado",
    unexpectedMessage: "No fue posible generar el backend debido a un error imprevisto.",
    networkTitle: "Error de Conexión",
    networkMessage: "No se pudo establecer conexión con el servidor para la descarga.",
  },
  actions: {
    generateBackend: "Generar Backend",
    exportUpcoming: "La exportación de diagramas estará disponible próximamente.",
  },
} as const;

export type CodeGenerationMessages = typeof CODE_GENERATION_MESSAGES;
