import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const toolbarSource = readFileSync(
  new URL("./project-canvas-toolbar.tsx", import.meta.url),
  "utf8"
);
const canvasViewSource = readFileSync(
  new URL("./project-canvas-view.tsx", import.meta.url),
  "utf8"
);

describe("ProjectCanvasToolbar - Activación directa de herramienta de relaciones", () => {
  it("elimina la inclusión de RelationPickerPopover en la barra de herramientas", () => {
    assert.doesNotMatch(
      toolbarSource,
      /<RelationPickerPopover\s*\/>/,
      "No debe renderizar RelationPickerPopover dentro del toolbar"
    );
    assert.doesNotMatch(
      toolbarSource,
      /import\s+.*RelationPickerPopover/,
      "No debe importar RelationPickerPopover"
    );
  });

  it("conmuta directamente la herramienta de relaciones al hacer clic en el botón de la barra", () => {
    assert.match(
      toolbarSource,
      /data-relation-toolbar-button="true"/,
      "El botón de relaciones debe mantener el data-attribute accesible"
    );
    assert.match(
      toolbarSource,
      /onSelectTool\(\s*activeTool === "relation" \? "cursor" : "relation"\s*\)/,
      "Hacer clic debe activar directamente 'relation' o alternar a 'cursor'"
    );
  });

  it("deriva el estado activo de la herramienta de relaciones sin depender de popovers", () => {
    assert.match(
      toolbarSource,
      /const isRelationActive = !isTemporaryHand && activeTool === "relation";/,
      "isRelationActive debe derivarse únicamente de activeTool"
    );
    assert.doesNotMatch(
      toolbarSource,
      /isRelationPickerOpen/,
      "isRelationActive no debe depender de isRelationPickerOpen"
    );
  });

  it("conmuta la herramienta de relaciones directamente al presionar la tecla B en el lienzo", () => {
    assert.match(
      canvasViewSource,
      /e\.key\.toLowerCase\(\) === "b"/,
      "Debe existir el manejador para la tecla B"
    );
    assert.match(
      canvasViewSource,
      /handleSelectTool\(\s*activeTool === "relation" \? "cursor" : "relation"\s*\)/,
      "La tecla B debe conmutar activeTool directamente sin abrir paneles laterales"
    );
  });

  it("asigna los atajos ergonómicos consecutivos V, B, N, M y Espacio", () => {
    assert.match(
      canvasViewSource,
      /e\.key\.toLowerCase\(\) === "v"[\s\S]*?handleSelectTool\("create-class"\)/,
      "V debe activar la creación de clase UML"
    );
    assert.match(
      canvasViewSource,
      /e\.key\.toLowerCase\(\) === "n"[\s\S]*?handleSelectTool\("cursor"\)/,
      "N debe activar el puntero/cursor"
    );
    assert.match(
      canvasViewSource,
      /e\.key\.toLowerCase\(\) === "m"[\s\S]*?handleSelectTool\("select"\)/,
      "M debe activar el marco de selección"
    );
    assert.match(
      toolbarSource,
      /title="Nueva Clase UML \(V\)"/,
      "Toolbar debe mostrar atajo V para crear clase"
    );
    assert.match(
      toolbarSource,
      /title="Relaciones UML \(B\)"/,
      "Toolbar debe mostrar atajo B para relaciones"
    );
    assert.match(
      toolbarSource,
      /title="Seleccionar \/ Puntero \(N\)"/,
      "Toolbar debe mostrar atajo N para puntero"
    );
    assert.match(
      toolbarSource,
      /title="Marco de selección \(M\)"/,
      "Toolbar debe mostrar atajo M para selección"
    );
  });

  it("elimina las herramientas de insertar texto e imagen en próximamente", () => {
    assert.doesNotMatch(
      toolbarSource,
      /Insertar texto/,
      "No debe contener la herramienta de insertar texto"
    );
    assert.doesNotMatch(
      toolbarSource,
      /Insertar imagen/,
      "No debe contener la herramienta de insertar imagen"
    );
  });

  it("elimina los controles de deshacer, rehacer y porcentaje de zoom del lienzo", () => {
    assert.doesNotMatch(
      canvasViewSource,
      /ProjectCanvasBottomControls/,
      "ProjectCanvasView no debe importar ni renderizar ProjectCanvasBottomControls"
    );
  });
});
