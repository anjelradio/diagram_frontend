/**
 * JWT Manager — Ciclo de vida del JSON Web Token.
 *
 * Isomorfo: funciona tanto en el browser como en el servidor (Server Components,
 * Server Actions, layouts de Next.js App Router).
 *
 * ── Rama servidor ────────────────────────────────────────────────────────────
 * Usa auth.api.getToken() de Better Auth, que lee las cookies de sesión
 * directamente de los headers del request actual del servidor.
 * No requiere tokenStore ni fetch al endpoint /token.
 * Las importaciones de lib/auth y next/headers son dinámicas para evitar
 * que el bundler incluya código de servidor (pg, variables de entorno, etc.)
 * en el bundle del cliente.
 *
 * ── Rama cliente ─────────────────────────────────────────────────────────────
 * El JWT Plugin de Better Auth expone el endpoint:
 *   GET /api/auth/token
 *
 * Este endpoint requiere la cookie de sesión (httpOnly) de Better Auth
 * para autenticarse. El browser la envía automáticamente al hacer fetch.
 *
 * Nota: El `jwtClient` de Better Auth solo expone el método `jwks()`.
 * El token se obtiene directamente haciendo fetch al endpoint /token.
 *
 * Responsabilidades:
 *   1. Obtener un JWT válido (de caché o pidiéndolo a /api/auth/token).
 *   2. Refrescar el JWT cuando expira, usando la cookie de sesión activa.
 *   3. Deduplicar peticiones concurrentes para no llamar a /api/auth/token
 *      múltiples veces si hay varias solicitudes simultáneas.
 *
 * Flujo de refresco (cliente):
 *   ① El JWT tiene una vida corta (15m recomendado, configurable con JWT_EXPIRATION_TIME).
 *   ② La sesión de Better Auth tiene una vida más larga (7d por defecto).
 *   ③ Cuando el JWT expira, el backend devuelve 401.
 *   ④ El ApiClient intercepta el 401 y llama a refreshJWT().
 *   ⑤ refreshJWT() hace fetch a /api/auth/token con la cookie de sesión.
 *   ⑥ Si la sesión sigue siendo válida, obtiene un nuevo JWT y reintenta.
 *   ⑦ Si la sesión también expiró, el endpoint devuelve 401 → retorna null.
 */

import { tokenStore } from "./token-store";

/** URL del endpoint de token de Better Auth. */
const TOKEN_ENDPOINT = "/api/auth/token";

/** Promesa compartida para deduplicar peticiones concurrentes (solo cliente). */
let _fetchPromise: Promise<string | null> | null = null;

/**
 * Invalida resultados de fetch iniciados antes de un logout o refresh.
 * No es posible cancelar un fetch ya enviado, pero si resuelve tarde no puede
 * volver a poblar el cache con un token de una sesion anterior.
 */
let _cacheGeneration = 0;

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo para leer el campo `exp` y calcular el tiempo de vida restante.
 */
function decodeJwtExp(token: string): number | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    // base64url → base64 estándar
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Llama al endpoint GET /api/auth/token de Better Auth.
 * El browser adjunta automáticamente la cookie de sesión (httpOnly).
 *
 * Retorna el JWT como string, o null si no hay sesión activa.
 */
async function fetchFreshJWT(cacheGeneration: number): Promise<string | null> {
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "GET",
      credentials: "include", // Incluye la cookie de sesión de Better Auth
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();

    // Better Auth responde con { token: "..." }
    if (!data || typeof data !== "object" || !("token" in data)) return null;
    const token = (data as { token: unknown }).token;
    if (typeof token !== "string") return null;

    // Un logout o refresh pudo ocurrir mientras se esperaba la respuesta.
    if (cacheGeneration !== _cacheGeneration) return null;

    // Better Auth siempre debe emitir `exp`. Si falta, se retorna el token
    // para la request actual, pero no se cachea con una duracion asumida.
    const exp = decodeJwtExp(token);
    if (exp !== null && exp * 1000 > Date.now()) {
      tokenStore.set(token, exp * 1000);
    }

    return token;
  } catch {
    return null;
  }
}

/**
 * Obtiene un JWT válido para autenticar peticiones al backend externo.
 *
 * Isomorfo — detecta el entorno y usa la estrategia correcta:
 *
 *   Servidor → auth.api.getToken() con los headers del request actual.
 *              Sin caché en memoria, sin fetch al endpoint /token.
 *              Las importaciones son dinámicas para no contaminar el bundle
 *              del cliente con código de servidor (pg, etc.).
 *
 *   Cliente  → tokenStore (caché en memoria) + fetchFreshJWT() con deduplicación.
 *
 * @returns El JWT como string, o null si no hay sesión activa.
 */
export async function getJWT(): Promise<string | null> {
  // ── Rama servidor ─────────────────────────────────────────────────
  if (typeof window === "undefined") {
    try {
      // Importaciones dinámicas: solo se resuelven en el servidor.
      // Evitan que lib/auth (Pool de PG, config de BD) aparezca en el bundle
      // del cliente, lo cual causaría errores y expondría configuración sensible.
      //
      // auth.api.getToken() es el método correcto expuesto por el JWT plugin
      // de Better Auth. Internamente firma el JWT con la clave privada del
      // servidor y retorna { token: string }.
      // requireHeaders: true → necesita los headers del request actual.
      const { auth } = await import("@/lib/auth");
      const { headers } = await import("next/headers");
      const jwtData = await auth.api.getToken({ headers: await headers() });
      return jwtData?.token ?? null;
    } catch {
      return null;
    }
  }

  // ── Rama cliente ───────────────────────────────────────────────────
  // 1. Devolver del caché si el token sigue siendo válido
  const cached = tokenStore.get();
  if (cached) return cached;

  // 2. Deduplicar: si ya hay una petición en vuelo, esperar su resultado
  if (_fetchPromise) return _fetchPromise;

  // 3. Iniciar nueva petición y limpiar solo su propia referencia al terminar.
  // Esto evita que un fetch anterior borre una petición más reciente.
  const fetchPromise = fetchFreshJWT(_cacheGeneration);
  _fetchPromise = fetchPromise;
  void fetchPromise.finally(() => {
    if (_fetchPromise === fetchPromise) {
      _fetchPromise = null;
    }
  });

  return fetchPromise;
}

function invalidateCachedJWT(): void {
  _cacheGeneration += 1;
  _fetchPromise = null;
  tokenStore.clear();
}

/**
 * Fuerza la obtenci\u00f3n de un nuevo JWT, descartando el cach\u00e9.
 * El ApiClient llama esto cuando el backend responde con 401.
 *
 * @returns El nuevo JWT, o null si la sesi\u00f3n de Better Auth tambi\u00e9n expir\u00f3.
 */
export async function refreshJWT(): Promise<string | null> {
  invalidateCachedJWT();
  return getJWT();
}

/**
 * Limpia el JWT almacenado en memoria.
 * Llama esto al cerrar sesi\u00f3n para no dejar tokens hu\u00e9rfanos.
 *
 * Ejemplo de uso en el logout handler:
 *   import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
 *   clearJWT();
 *   await authClient.signOut();
 */
export function clearJWT(): void {
  invalidateCachedJWT();
}
