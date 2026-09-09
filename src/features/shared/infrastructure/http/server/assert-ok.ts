/**
 * Utilidades de aserción para Server Components y Server Actions.
 *
 * Estos helpers convierten resultados del API client en acciones de
 * enrutamiento de Next.js (notFound, redirect) de forma declarativa.
 *
 * ⚠️  SOLO SERVIDOR: `notFound()` y `redirect()` de `next/navigation`
 *   solo pueden llamarse en Server Components, Server Actions y Route Handlers.
 *   Nunca importes este módulo desde Client Components.
 */

import { notFound, redirect } from "next/navigation";
import type { ApiError, ApiResult, ApiActionResult, ApiMaybeResult } from "@/features/shared/domain/types/api-results";

// ─── Guardas de tipo ─────────────────────────────────────────────────────────

function isApiError(result: { ok: boolean }): result is ApiError {
  return result.ok === false;
}

// ─── Aserciones ──────────────────────────────────────────────────────────────

/**
 * Lanza la página 404 si el resultado es un error 404.
 * En cualquier otro error, no hace nada (el consumidor decide cómo manejarlo).
 *
 * Uso típico en una página de detalle:
 *
 * ```ts
 * const result = await getSchoolUseCase(params.id);
 * assertOrNotFound(result);
 * // Aquí TypeScript sabe que result.ok === true
 * return <SchoolDetail school={result.data} />;
 * ```
 */
export function assertOrNotFound<T>(
  result: ApiResult<T> | ApiActionResult | ApiMaybeResult<T>,
): asserts result is { ok: true } & (T extends undefined ? ApiActionResult : { data: T }) {
  if (isApiError(result) && result.statusCode === 404) {
    notFound();
  }
}

/**
 * Lanza la página 404 si el resultado es ok pero la data es null.
 * Combínalo con `apiRequestMaybeData` cuando la ausencia de recurso
 * debe mostrar la 404-page en vez de un estado vacío.
 *
 * Uso típico:
 *
 * ```ts
 * const result = await apiRequestMaybeData({ url: `/api/schools/${id}`, ... });
 * assertDataOrNotFound(result);
 * // Aquí TypeScript sabe que result.data no es null
 * ```
 */
export function assertDataOrNotFound<T>(
  result: { ok: true; data: T | null } | ApiError,
): asserts result is { ok: true; data: T } {
  if (isApiError(result)) return;
  if (result.data === null) {
    notFound();
  }
}

/**
 * Redirige a la ruta indicada si el resultado es un error con el status dado.
 * Por defecto redirige en cualquier error.
 *
 * Uso típico para proteger rutas según el status:
 *
 * ```ts
 * const result = await getUserUseCase(id);
 * assertOrRedirect(result, "/login", 401);
 * ```
 */
export function assertOrRedirect<T>(
  result: ApiResult<T> | ApiActionResult,
  to: string,
  onStatus?: number,
): asserts result is { ok: true } {
  if (isApiError(result)) {
    if (onStatus === undefined || result.statusCode === onStatus) {
      redirect(to);
    }
  }
}
