/**
 * Estado tipado de la integración de Notion para un proyecto.
 */
export type NotionIntegrationStatus = {
  projectId: string;
  provider: "NOTION" | string;
  hasApiKey: boolean;
  isInitialized: boolean;
  notionPageId: string | null;
  notionTasksDatabaseId: string | null;
  notionPageUrl: string | null;
};

/**
 * Datos de entrada para configurar la clave de API de Notion.
 */
export type ConfigureNotionIntegrationInput = {
  apiKey: string;
  parentPageId?: string | null;
};

/**
 * Datos de entrada para inicializar el proyecto en Notion.
 */
export type InitializeNotionProjectInput = {
  description: string;
};

/**
 * Estados posibles del flujo visual de integración en la interfaz de usuario.
 */
export type NotionIntegrationUiState =
  | "UNCONFIGURED" // !hasApiKey -> icono '+'
  | "PENDING_INITIALIZATION" // hasApiKey && !isInitialized -> icono de iniciar
  | "INITIALIZED"; // isInitialized === true -> icono '?'
