import type { ApiFileResult } from "../../../shared/domain/types/api-results.ts";
import type { SpringBootConfigInput } from "../../domain/entities/code-generation.entity.ts";
import type { CodeGenerationRepository } from "../../domain/repositories/code-generation.repository.ts";

export type FileRequester = (config: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  withAuth?: boolean;
  body?: unknown;
  defaultFileName: string;
  defaultContentType: string;
  fallbackMessage: string;
}) => Promise<ApiFileResult>;

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const apiBaseUrl = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export class HttpCodeGenerationRepository implements CodeGenerationRepository {
  private customFileRequester?: FileRequester;

  constructor(customFileRequester?: FileRequester) {
    this.customFileRequester = customFileRequester;
  }

  private async getFileRequester(): Promise<FileRequester> {
    if (this.customFileRequester) return this.customFileRequester;
    const mod = await import("../../../shared/infrastructure/http/api-client");
    this.customFileRequester = mod.apiRequestFile;
    return mod.apiRequestFile;
  }

  async generateSpringBootBackend(
    projectId: string,
    config?: SpringBootConfigInput
  ): Promise<ApiFileResult> {
    const requester = await this.getFileRequester();
    const payload = config
      ? {
          package_name: config.packageName,
          artifact_id: config.artifactId,
          database_name: config.databaseName,
        }
      : undefined;

    return requester({
      url: `${apiBaseUrl}/code-generation/projects/${projectId}/spring-boot`,
      method: "POST",
      withAuth: true,
      body: payload,
      defaultFileName: "backend.zip",
      defaultContentType: "application/zip",
      fallbackMessage: "No se pudo generar el backend Spring Boot. Intenta de nuevo.",
    });
  }
}

export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const codeGenerationRepository = new HttpCodeGenerationRepository();
