import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rowSource = readFileSync(new URL("./attribute-row.tsx", import.meta.url), "utf8");
const popoverSource = readFileSync(new URL("./attribute-type-popover.tsx", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./attribute-list.tsx", import.meta.url), "utf8");
const buttonSource = readFileSync(new URL("./add-attribute-button.tsx", import.meta.url), "utf8");

test("AttributeRow adquiere class_lock al hacer clic o doble clic para editar", () => {
  assert.match(rowSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(rowSource, /ensureClassLock/);
  assert.match(rowSource, /isLockedByOther/);
});

test("AttributeTypePopover adquiere class_lock al abrir el popover o despachar cambios", () => {
  assert.match(popoverSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(popoverSource, /handleOpenChange/);
  assert.match(popoverSource, /isLockedByOther/);
});

test("AttributeList adquiere class_lock durante drag-and-drop de atributos", () => {
  assert.match(listSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
  assert.match(listSource, /onDragStart=\{ensureClassLock\}/);
});

test("AddAttributeButton adquiere class_lock al añadir un atributo a la clase", () => {
  assert.match(buttonSource, /sendRealtimeMessage\(\{ type: "class_lock_acquire", class_id: classId \}\)/);
});
