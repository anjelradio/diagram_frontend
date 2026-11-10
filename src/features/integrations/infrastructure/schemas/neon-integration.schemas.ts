import { z } from "zod";

// ==========================================
// 1. Esquema de Lectura (Backend snake_case 1:1)
// ==========================================

export const neonIntegrationStatusResponseSchema = z.object({
  project_id: z.string(),
  provider: z.string(),
  has_api_key: z.boolean(),
  is_initialized: z.boolean(),
  neon_project_id: z.string().nullable().optional(),
  neon_database_name: z.string().nullable().optional(),
  neon_console_url: z.string().nullable().optional(),
  neon_branch_id: z.string().nullable().optional(),
  last_synced_at: z.string().nullable().optional(),
});

export type NeonIntegrationStatusResponse = z.infer<
  typeof neonIntegrationStatusResponseSchema
>;

export const neonSyncResultResponseSchema = z.object({
  has_changes: z.boolean(),
  created_tables: z.array(z.string()).default([]),
  dropped_tables: z.array(z.string()).default([]),
  added_columns: z.record(z.string(), z.array(z.string())).default({}),
  dropped_columns: z.record(z.string(), z.array(z.string())).default({}),
  altered_columns: z.record(z.string(), z.array(z.string())).default({}),
  added_foreign_keys: z.array(z.string()).default([]),
  dropped_foreign_keys: z.array(z.string()).default([]),
});

export type NeonSyncResultResponse = z.infer<
  typeof neonSyncResultResponseSchema
>;

// ==========================================
// 2. Esquemas de Escritura (Frontend camelCase)
// ==========================================

export const configureNeonIntegrationRequestSchema = z.object({
  apiKey: z.string().trim().min(1, "La clave de API de Neon es obligatoria."),
});

export type ConfigureNeonIntegrationRequest = z.infer<
  typeof configureNeonIntegrationRequestSchema
>;
