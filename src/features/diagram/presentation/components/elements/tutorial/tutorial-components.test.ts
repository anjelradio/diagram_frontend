import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  getTutorialCookieStatus,
  setTutorialCookieStatus,
  clearTutorialCookie,
} from "../../../../infrastructure/utils/tutorial-cookie.ts";
import { useTutorialStore } from "../../../store/tutorial-slice.ts";

const overlaySource = readFileSync(
  new URL("./tutorial-spotlight-overlay.tsx", import.meta.url),
  "utf8"
);
const petBubbleSource = readFileSync(
  new URL("./tutorial-pet-bubble.tsx", import.meta.url),
  "utf8"
);
const welcomeModalSource = readFileSync(
  new URL("./tutorial-welcome-modal.tsx", import.meta.url),
  "utf8"
);
const exitButtonSource = readFileSync(
  new URL("./tutorial-exit-button.tsx", import.meta.url),
  "utf8"
);

describe("Tutorial components and store", () => {
  beforeEach(() => {
    // Mock basico de document.cookie para entorno node
    const cookieJar: Record<string, string> = {};
    Object.defineProperty(globalThis, "document", {
      value: {
        get cookie() {
          return Object.entries(cookieJar)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
        },
        set cookie(val: string) {
          const [pair] = val.split(";");
          const [k, v] = pair.split("=");
          if (val.includes("max-age=0")) {
            delete cookieJar[k.trim()];
          } else {
            cookieJar[k.trim()] = v ? v.trim() : "";
          }
        },
      },
      writable: true,
      configurable: true,
    });
    clearTutorialCookie();
    useTutorialStore.setState({ isActive: false, currentScene: "IDLE" });
  });

  it("cookie utility devuelve 'pending' por defecto", () => {
    assert.equal(getTutorialCookieStatus(), "pending");
  });

  it("cookie utility permite setear y leer 'in_progress' y 'completed'", () => {
    setTutorialCookieStatus("in_progress");
    assert.equal(getTutorialCookieStatus(), "in_progress");
    setTutorialCookieStatus("completed");
    assert.equal(getTutorialCookieStatus(), "completed");
  });

  it("useTutorialStore inicia en SCENE_1_NEW_PROJECT y setea cookie in_progress", () => {
    useTutorialStore.getState().startTutorial();
    assert.equal(useTutorialStore.getState().isActive, true);
    assert.equal(useTutorialStore.getState().currentScene, "SCENE_1_NEW_PROJECT");
    assert.equal(getTutorialCookieStatus(), "in_progress");
  });

  it("useTutorialStore omite el tutorial y setea cookie completed", () => {
    useTutorialStore.getState().startTutorial();
    useTutorialStore.getState().skipTutorial();
    assert.equal(useTutorialStore.getState().isActive, false);
    assert.equal(useTutorialStore.getState().currentScene, "IDLE");
    assert.equal(getTutorialCookieStatus(), "completed");
  });

  it("TutorialSpotlightOverlay implementa box-shadow de corte y selector data-testid", () => {
    assert.match(overlaySource, /tutorial-spotlight-overlay/);
    assert.match(overlaySource, /boxShadow:\s*"0 0 0 9999px/);
  });

  it("TutorialPetBubble carga las 6 imagenes de mascotas desde /pet/", () => {
    assert.match(petBubbleSource, /\/pet\/done-pet\.webp/);
    assert.match(petBubbleSource, /\/pet\/explore-pet\.webp/);
    assert.match(petBubbleSource, /\/pet\/happy-pet\.webp/);
    assert.match(petBubbleSource, /\/pet\/idle-pet\.webp/);
    assert.match(petBubbleSource, /\/pet\/relation-pet\.webp/);
    assert.match(petBubbleSource, /\/pet\/think-pet\.webp/);
  });

  it("TutorialWelcomeModal utiliza tutorial.webp y no muestra botón de cerrar X", () => {
    assert.match(welcomeModalSource, /\/images\/tutorial\.webp/);
    assert.match(welcomeModalSource, /showCloseButton=\{false\}/);
    assert.match(welcomeModalSource, /Comenzar tutorial/);
  });

  it("TutorialExitButton renderiza botón 'Salir del tutorial'", () => {
    assert.match(exitButtonSource, /Salir del tutorial/);
  });
});
