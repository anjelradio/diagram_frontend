import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const popoverSource = readFileSync(
  new URL("./relation-picker-popover.tsx", import.meta.url),
  "utf8"
);

const guidanceSource = readFileSync(
  new URL("./relation-guidance-pill.tsx", import.meta.url),
  "utf8"
);

const globalsCss = readFileSync(
  new URL("../../../../../../../styles/globals.css", import.meta.url),
  "utf8"
);

test("RelationPickerPopover elimina la acción de asociación personalizada", () => {
  // No debe contener la opción ni el separador de Asociación personalizada
  assert.equal(
    /Asociación personalizada/.test(popoverSource),
    false,
    "Asociación personalizada no debe existir en el dropdown"
  );
  assert.equal(
    /isCustomOpen/.test(popoverSource),
    false,
    "isCustomOpen no debe existir en el componente"
  );
  assert.equal(
    /SlidersHorizontal/.test(popoverSource),
    false,
    "SlidersHorizontal no debe ser importado"
  );
  // Debe conservar el catálogo de presets estándar
  assert.match(popoverSource, /RELATION_PRESETS/);
  assert.match(popoverSource, /handleSelectPreset/);
});

test("RelationGuidancePill presenta diseño simplificado sin exceso de texto", () => {
  // Dimensiones ampliadas y contenedor de tarjeta redondeada
  assert.match(guidanceSource, /rounded-2xl/);
  assert.match(guidanceSource, /w-\[560px\]/);
  assert.match(guidanceSource, /min-h-\[106px\]/);
  assert.match(guidanceSource, /backdrop-blur-xl/);
  assert.match(guidanceSource, /pointer-events-auto/);
  // No debe contener badges redundantes de 'Paso 1 de 2' ni fila de texto inferior
  assert.equal(/Paso 1 de 2/.test(guidanceSource), false, "No debe incluir badge Paso 1 de 2");
  assert.equal(/Paso 2 de 2/.test(guidanceSource), false, "No debe incluir badge Paso 2 de 2");
});

test("RelationGuidancePill incluye visualización clara de cardinalidad y nombres de clase", () => {
  // Indicadores de Origen y Destino con roles y cardinalidades
  assert.match(guidanceSource, /Origen/);
  assert.match(guidanceSource, /Destino/);
  assert.match(guidanceSource, /guidance\.sourceRole/);
  assert.match(guidanceSource, /guidance\.targetRole/);
  assert.match(guidanceSource, /sourceClassName/);
  // Cardinalidad central destacada
  assert.match(guidanceSource, /font-mono font-bold bg-white\/10/);
  // Debe usar el selector canónico nodes de DiagramSlice y no classes inexistente
  assert.match(guidanceSource, /useAppStore\(\(s\) => s\.nodes\)/);
  assert.equal(/useAppStore\(\(s\) => s\.classes\)/.test(guidanceSource), false);
});

test("RelationGuidancePill implementa animación direccional en cascada entre pasos (Paso 1 <-> Paso 2)", () => {
  // Transición hacia adelante: paso 1 cae abajo, paso 2 entra desde arriba
  assert.match(guidanceSource, /animate-relation-step-exit-down/);
  assert.match(guidanceSource, /animate-relation-step-enter-down/);

  // Transición hacia atrás: paso 2 sube arriba, paso 1 entra desde abajo
  assert.match(guidanceSource, /animate-relation-step-exit-up/);
  assert.match(guidanceSource, /animate-relation-step-enter-up/);

  // Definición de keyframes en globals.css
  assert.match(globalsCss, /@keyframes relation-step-exit-down/);
  assert.match(globalsCss, /@keyframes relation-step-enter-down/);
  assert.match(globalsCss, /@keyframes relation-step-exit-up/);
  assert.match(globalsCss, /@keyframes relation-step-enter-up/);
});

test("RelationGuidancePill permite volver al Paso 1 y cancelar la creación", () => {
  // Botón Volver al paso 1
  assert.match(guidanceSource, /handleBackToStep1/);
  assert.match(guidanceSource, /setRelationDraftSource\(null\)/);
  assert.match(guidanceSource, /Undo2/);

  // Botón Cancelar con Escape
  assert.match(guidanceSource, /cancelRelationCreation/);
  assert.match(guidanceSource, /Esc/);
});
