/**
 * Utilitario de gestión de cookies para el tutorial interactivo del lienzo.
 * Nombre de cookie: diagram_tutorial_status
 * Valores permitidos:
 * - "completed": El usuario completó o ignoró el tutorial. No se debe abrir automáticamente.
 * - "in_progress": El tutorial está en curso entre vistas (ej: desde /projects hacia /projects/[id]).
 * - "pending": El tutorial debe abrirse automáticamente para usuarios nuevos.
 */

export const TUTORIAL_COOKIE_NAME = "diagram_tutorial_status";

export type TutorialCookieStatus = "completed" | "in_progress" | "pending";

/**
 * Lee el estado actual de la cookie del tutorial en el cliente.
 */
export function getTutorialCookieStatus(): TutorialCookieStatus {
  if (typeof document === "undefined") {
    return "completed";
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [name, val] = cookie.split("=");
    if (name === TUTORIAL_COOKIE_NAME) {
      const decoded = decodeURIComponent(val || "");
      if (decoded === "completed" || decoded === "in_progress" || decoded === "pending") {
        return decoded;
      }
    }
  }

  return "pending";
}

/**
 * Escribe el estado de la cookie del tutorial con caducidad extendida (365 días).
 */
export function setTutorialCookieStatus(status: TutorialCookieStatus): void {
  if (typeof document === "undefined") return;

  const maxAge = 60 * 60 * 24 * 365; // 1 año
  document.cookie = `${TUTORIAL_COOKIE_NAME}=${encodeURIComponent(
    status
  )}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/**
 * Elimina la cookie del tutorial (para pruebas o reinicio).
 */
export function clearTutorialCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TUTORIAL_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}
