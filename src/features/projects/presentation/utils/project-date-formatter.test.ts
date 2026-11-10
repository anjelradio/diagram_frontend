import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatProjectLastModified } from "./project-date-formatter.ts";

describe("formatProjectLastModified", () => {
  const baseNow = new Date("2026-11-10T12:00:00Z");

  it("retorna 'hace unos momentos' para fechas de hace menos de 60 segundos", () => {
    const recent = new Date("2026-11-10T11:59:30Z");
    assert.equal(formatProjectLastModified(recent, baseNow), "hace unos momentos");
  });

  it("retorna 'hace un minuto' o 'hace X minutos' para menos de 1 hora", () => {
    const oneMin = new Date("2026-11-10T11:59:00Z");
    assert.equal(formatProjectLastModified(oneMin, baseNow), "hace un minuto");

    const tenMin = new Date("2026-11-10T11:50:00Z");
    assert.equal(formatProjectLastModified(tenMin, baseNow), "hace 10 minutos");
  });

  it("retorna 'hace una hora' o 'hace X horas' para menos de 24 horas", () => {
    const oneHour = new Date("2026-11-10T11:00:00Z");
    assert.equal(formatProjectLastModified(oneHour, baseNow), "hace una hora");

    const fiveHours = new Date("2026-11-10T07:00:00Z");
    assert.equal(formatProjectLastModified(fiveHours, baseNow), "hace 5 horas");
  });

  it("retorna 'hace un día' para diferencias entre 24 y 48 horas", () => {
    const yesterday = new Date("2026-11-09T10:00:00Z");
    assert.equal(formatProjectLastModified(yesterday, baseNow), "hace un día");
  });

  it("retorna 'hace X días' para diferencias de 2 a 6 días", () => {
    const threeDays = new Date("2026-11-07T12:00:00Z");
    assert.equal(formatProjectLastModified(threeDays, baseNow), "hace 3 días");

    const sixDays = new Date("2026-11-04T12:00:00Z");
    assert.equal(formatProjectLastModified(sixDays, baseNow), "hace 6 días");
  });

  it("retorna la fecha en palabras completa en hora boliviana cuando sobrepasa 7 días", () => {
    // 2026-01-26 UTC
    const dateFar = new Date("2026-01-26T14:00:00Z");
    const result = formatProjectLastModified(dateFar, baseNow);
    assert.ok(result.toLowerCase().includes("enero"));
    assert.ok(result.includes("26"));
    assert.ok(result.includes("2026"));
  });

  it("maneja entradas inválidas sin lanzar excepciones", () => {
    assert.equal(formatProjectLastModified("invalid-date", baseNow), "Fecha inválida");
    // @ts-expect-error test invalid null
    assert.equal(formatProjectLastModified(null, baseNow), "Sin fecha");
  });
});
