import { z } from "zod";

// ==========================================
// 1. Esquema de Lectura (Backend snake_case 1:1)
// ==========================================

export const notionIntegrationStatusResponseSchema = z.object({
  project_id: z.string(),
  provider: z.string(),
  has_api_key: z.boolean(),
  is_initialized: z.boolean(),
  notion_page_id: z.string().nullable(),
  notion_tasks_database_id: z.string().nullable(),
  notion_page_url: z.string().nullable(),
});

export type NotionIntegrationStatusResponse = z.infer<
  typeof notionIntegrationStatusResponseSchema
>;

// ==========================================
// 2. Esquemas de Escritura (Frontend camelCase + Reglas Backend)
// ==========================================

export const configureNotionIntegrationRequestSchema = z.object({
  apiKey: z.string().trim().min(1, "La clave de API de Notion es obligatoria."),
  parentPageId: z.string().trim().nullable().optional(),
});

export type ConfigureNotionIntegrationRequest = z.infer<
  typeof configureNotionIntegrationRequestSchema
>;

export const initializeNotionProjectRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(3, "Ingresa una breve descripción del proyecto (mínimo 3 caracteres).")
    .max(2000, "La descripción no puede superar los 2000 caracteres."),
});

export type InitializeNotionProjectRequest = z.infer<
  typeof initializeNotionProjectRequestSchema
>;
