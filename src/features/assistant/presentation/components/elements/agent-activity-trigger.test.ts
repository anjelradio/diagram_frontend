import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("./agent-activity-trigger.tsx", import.meta.url),
  "utf8"
);

test("AgentActivityTrigger maneja expansión in-situ sin modal central", () => {
  // No debe importar ni renderizar AgentActivityModal
  assert.equal(
    /AgentActivityModal/.test(source),
    false,
    "AgentActivityModal no debe ser utilizado"
  );
  // Debe manejar estado isExpanded y transición de origen inferior izquierdo
  assert.match(source, /isExpanded/);
  assert.match(source, /origin-bottom-left/);
  // Bordes redondeados conservados de forma estable
  assert.match(source, /rounded-2xl/);
  // Animación secuencial en dos fases con transitionDelay
  assert.match(source, /transitionDelay/);
  assert.match(source, /cubic-bezier/);
});

test("AgentActivityTrigger contiene cabecera con insignia de estado y colapso instantáneo", () => {
  assert.match(source, /Detalle de Actividad/);
  assert.match(source, /renderStateBadge/);
  assert.match(source, /handleCollapse/);
  assert.match(source, /transition: "none"/);
});

test("AgentActivityTrigger muestra transcripción, resumen del asistente e imagen", () => {
  assert.match(source, /Transcripción de voz/);
  assert.match(source, /Resumen del Asistente/);
  assert.match(source, /Imagen de referencia/);
  assert.match(source, /formatDate/);
});

test("AgentActivityTrigger mantiene la barra inferior con 'Registro de agente' en estado expandido", () => {
  assert.match(source, /Registro de agente/);
  assert.match(source, /Minimizar/);
  assert.match(source, /Terminal/);
});

test("AgentActivityTrigger soporta desexpansión por Escape y clic exterior", () => {
  assert.match(source, /e\.key === "Escape"/);
  assert.match(source, /handleClickOutside/);
  assert.match(source, /mousedown/);
});
