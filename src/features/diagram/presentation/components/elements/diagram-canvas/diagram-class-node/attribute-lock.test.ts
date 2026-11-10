import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rowSource = readFileSync(new URL("./attribute-row.tsx", import.meta.url), "utf8");
const popoverSource = readFileSync(new URL("./attribute-type-popover.tsx", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./attribute-list.tsx", import.meta.url), "utf8");
const buttonSource = readFileSync(new URL("./add-attribute-button.tsx", import.meta.url), "utf8");
const classNodeSource = readFileSync(new URL("./diagram-class-node.tsx", import.meta.url), "utf8");

test("AttributeRow adquiere class_lock al hacer clic o doble clic para editar", () => {
  assert.match(rowSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(rowSource, /ensureClassLock/);
  assert.match(rowSource, /isLockedByOther/);
});

test("AttributeRow refleja reservas efímeras del agente con isAttributeEditedByAgent y badge Editando", () => {
  assert.match(rowSource, /getEffectiveComponentReservation/);
  assert.match(rowSource, /isAttributeEditedByAgent/);
  assert.match(rowSource, /Editando/);
  assert.match(rowSource, /\(Editando por el asistente\)/);
  assert.match(rowSource, /isAgentReserved/);
  assert.match(rowSource, /isAgentReserved && isEditing/);
});

test("DiagramClassNode renderiza AgentReservationIndicator e incluye estado de reserva en aria-label y cancela edición", () => {
  assert.match(classNodeSource, /AgentReservationIndicator/);
  assert.match(classNodeSource, /getEffectiveComponentReservation/);
  assert.match(classNodeSource, /effectiveReservation/);
  assert.match(classNodeSource, /aria-label=\{`Clase \$\{data\.name\}\$\{effectiveReservation/);
  assert.match(classNodeSource, /setIsEditingName\(false\)/);
  assert.match(classNodeSource, /canEditClass/);
});

test("AttributeTypePopover adquiere class_lock al abrir el popover o despachar cambios", () => {
  assert.match(popoverSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(popoverSource, /handleOpenChange/);
  assert.match(popoverSource, /isLockedByOther/);
  assert.match(popoverSource, /isAgentReserved && open/);
  assert.match(popoverSource, /if \(!canEdit || isAgentReserved\) return/);
});

test("AttributeList adquiere class_lock durante drag-and-drop de atributos y se bloquea con reserva del agente", () => {
  assert.match(listSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(listSource, /onDragStart=\{ensureClassLock\}/);
  assert.match(listSource, /!canEdit \|\| isAgentReserved/);
});

test("AddAttributeButton adquiere class_lock al añadir un atributo a la clase y se bloquea con reserva del agente", () => {
  assert.match(buttonSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(buttonSource, /isAgentReserved/);
});


