/**
 * Estado tipado de la integración de Neon para un proyecto.
 */
export type NeonIntegrationStatus = {
  projectId: string;
  provider: "NEON" | string;
  hasApiKey: boolean;
  isInitialized: boolean;
  neonProjectId: string | null;
  neonDatabaseName: string | null;
  neonConsoleUrl: string | null;
  neonBranchId: string | null;
  lastSyncedAt: string | null;
};

/**
 * Datos de entrada para configurar la clave de API de Neon.
 */
export type ConfigureNeonIntegrationInput = {
  apiKey: string;
};

/**
 * Resultado de sincronización de base de datos en Neon.
 */
export type NeonSyncResult = {
  hasChanges: boolean;
  createdTables: string[];
  droppedTables: string[];
  addedColumns: Record<string, string[]>;
  droppedColumns: Record<string, string[]>;
  alteredColumns: Record<string, string[]>;
  addedForeignKeys: string[];
  droppedForeignKeys: string[];
};

/**
 * Estados posibles del flujo visual de integración en la interfaz de usuario.
 */
export type NeonIntegrationUiState =
  | "UNCONFIGURED" // !hasApiKey -> icono '+'
  | "PENDING_INITIALIZATION" // hasApiKey && !isInitialized -> icono de iniciar (Rocket)
  | "INITIALIZED"; // isInitialized === true -> icono '?'
