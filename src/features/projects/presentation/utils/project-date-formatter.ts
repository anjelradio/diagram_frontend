/**
 * Utilidad pura para formatear la última fecha de actualización de un proyecto.
 *
 * Requisitos funcionales:
 * - Conversión horaria a Bolivia (America/La_Paz, UTC-4).
 * - Menos de 60 segundos: "hace unos momentos".
 * - Menos de 60 minutos: "hace X minutos" (o "hace un minuto").
 * - Menos de 24 horas: "hace X horas" (o "hace una hora").
 * - Entre 24 y 48 horas: "hace un día".
 * - Entre 2 y 6 días: "hace X días".
 * - A partir de 7 días (1 semana o más): Fecha completa en palabras,
 *   por ejemplo: "domingo, 26 de enero de 2027".
 */

export function formatProjectLastModified(
  dateInput: string | Date | number,
  currentDate: Date = new Date()
): string {
  if (!dateInput) return "Sin fecha";

  const targetDate = typeof dateInput === "object" ? dateInput : new Date(dateInput);

  if (Number.isNaN(targetDate.getTime())) {
    return "Fecha inválida";
  }

  const diffMs = currentDate.getTime() - targetDate.getTime();
  // Si la fecha está ligeramente en el futuro por jitter de reloj, tratar como presente
  if (diffMs < 0 && Math.abs(diffMs) < 60_000) {
    return "hace unos momentos";
  }

  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 1. Menos de 1 minuto
  if (diffMinutes < 1) {
    return "hace unos momentos";
  }

  // 2. Menos de 1 hora
  if (diffHours < 1) {
    if (diffMinutes === 1) return "hace un minuto";
    return `hace ${diffMinutes} minutos`;
  }

  // 3. Menos de 24 horas
  if (diffHours < 24) {
    if (diffHours === 1) return "hace una hora";
    return `hace ${diffHours} horas`;
  }

  // 4. Entre 1 y 2 días (24 a 47 horas)
  if (diffDays === 1) {
    return "hace un día";
  }

  // 5. Menos de 7 días
  if (diffDays < 7) {
    return `hace ${diffDays} días`;
  }

  // 6. 7 días o más: Fecha completa en palabras según huso horario de Bolivia (America/La_Paz)
  const formatter = new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatter.format(targetDate);
}
