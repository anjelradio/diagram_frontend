import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("IntegrationsPopoverButton component structure", () => {
  const componentPath = new URL("./integrations-popover-button.tsx", import.meta.url);
  const source = readFileSync(componentPath, "utf-8");

  it("contiene los logos y nombres de Notion y Neon en el popover", () => {
    assert.match(source, /\/logos\/notion-logo\.webp/);
    assert.match(source, /\/logos\/neon-logo\.webp/);
    assert.match(source, /Notion/);
    assert.match(source, /Neon/);
  });

  it("describe las capacidades de Notion y Neon requeridas", () => {
    assert.match(source, /Integrar tareas, auditar proyectos/);
    assert.match(source, /Desplegar y migrar bases de datos funcionales/);
  });

  it("recibe projectId y consulta el estado de las integraciones", () => {
    assert.match(source, /projectId\?: string/);
    assert.match(source, /defaultNotionIntegrationRepository\.getStatus/);
    assert.match(source, /defaultNeonIntegrationRepository\.getStatus/);
    assert.match(source, /notionStatus/);
    assert.match(source, /neonStatus/);
  });

  it("maneja los 3 estados visuales para el botón de acción de Notion y Neon (+, Rocket, CircleHelp)", () => {
    // Estado 1: Sin API Key -> Plus
    assert.match(source, /Configurar integración de Notion/);
    assert.match(source, /Configurar integración de Neon/);
    assert.match(source, /<Plus className="h-4 w-4" \/>/);

    // Estado 2: Con API Key y sin inicializar -> Rocket
    assert.match(source, /Inicializar proyecto en Notion/);
    assert.match(source, /Inicializar proyecto en Neon/);
    assert.match(source, /<Rocket className="h-4 w-4" \/>/);

    // Estado 3: Inicializado -> CircleHelp (?)
    assert.match(source, /Ver qué puedes hacer con Notion/);
    assert.match(source, /Ver qué puedes hacer con Neon/);
    assert.match(source, /<CircleHelp className="h-4 w-4" \/>/);
  });

  it("conecta los modales pasando projectId y el estado actualizado a Notion y Neon", () => {
    assert.match(source, /<NotionIntegrationDialog/);
    assert.match(source, /status=\{notionStatus\}/);
    assert.match(source, /<NeonIntegrationDialog/);
    assert.match(source, /status=\{neonStatus\}/);
    assert.match(source, /handleOpenModal/);
  });
});

describe("NotionIntegrationDialog - 3 Modes Flow", () => {
  const notionPath = new URL("./notion-integration-dialog.tsx", import.meta.url);
  const notionSource = readFileSync(notionPath, "utf-8");

  it("incluye las instrucciones reales y actualizadas de Notion", () => {
    assert.match(notionSource, /notion\.so\/profile\/integrations/);
    assert.match(notionSource, /Secreto de integración interna/);
    assert.match(notionSource, /Conexiones \(Connections\) → Conectar a\.\.\./);
    assert.match(notionSource, /Compartir en la web/);
  });

  it("implementa el Modo 1: Configurar API Key con estado de carga y guardado", () => {
    assert.match(notionSource, /handleSaveApiKey/);
    assert.match(notionSource, /defaultNotionIntegrationRepository\.configureApiKey/);
    assert.match(notionSource, /Guardando\.\.\./);
  });

  it("implementa el Modo 2: Inicializar con descripción breve y botón 'Ir a Notion'", () => {
    assert.match(notionSource, /Inicializar espacio en Notion/);
    assert.match(notionSource, /¿De qué trata este proyecto o sistema\?/);
    assert.match(notionSource, /defaultNotionIntegrationRepository\.initializeProject/);
    assert.match(notionSource, /Inicializando espacio en Notion\.\.\./);
    assert.match(notionSource, /¡Página de Notion creada!/);
    assert.match(notionSource, /Ir a Notion/);
    assert.match(notionSource, /target="_blank"/);
  });

  it("implementa el Modo 3: Guía de capacidades cuando ya está inicializado", () => {
    assert.match(notionSource, /Integración activa/);
    assert.match(notionSource, /¿Qué puedes hacer con Notion\?/);
    assert.match(notionSource, /Crear tareas:/);
    assert.match(notionSource, /Consultar tus pendientes:/);
    assert.match(notionSource, /Actualizar estado:/);
    assert.match(notionSource, /Ejecutar en el diagrama:/);
  });

  it("renderiza el enlace clicable a notion.so/profile/integrations en el paso 1", () => {
    assert.match(notionSource, /href="https:\/\/www\.notion\.so\/profile\/integrations"/);
    assert.match(notionSource, /target="_blank"/);
  });
});

describe("NeonIntegrationDialog - 3 Modes Flow", () => {
  const neonPath = new URL("./neon-integration-dialog.tsx", import.meta.url);
  const neonSource = readFileSync(neonPath, "utf-8");

  it("NeonIntegrationDialog utiliza la cabecera e instrucciones de Neon", () => {
    assert.match(neonSource, /\/integrations-header\/neon-header\.webp/);
    assert.match(neonSource, /console\.neon\.tech/);
    assert.match(neonSource, /API Keys/);
    assert.match(neonSource, /Generate new API key/);
  });

  it("implementa el Modo 1: Configurar API Key con guardado y llamada al repositorio", () => {
    assert.match(neonSource, /handleSaveApiKey/);
    assert.match(neonSource, /defaultNeonIntegrationRepository\.configureApiKey/);
    assert.match(neonSource, /Guardando\.\.\./);
  });

  it("implementa el Modo 2: Inicializar y desplegar base de datos inicial", () => {
    assert.match(neonSource, /Inicializar en Neon/);
    assert.match(neonSource, /defaultNeonIntegrationRepository\.initializeProject/);
    assert.match(neonSource, /Creando proyecto y desplegando en Neon\.\.\./);
    assert.match(neonSource, /¡Base de datos desplegada con éxito!/);
    assert.match(neonSource, /Ir a la consola de Neon/);
  });

  it("implementa el Modo 3: Información de base de datos activa y cómo sincronizar", () => {
    assert.match(neonSource, /Neon Postgres Conectado/);
    assert.match(neonSource, /¿Cómo sincronizar desde el Asistente\?/);
    assert.match(neonSource, /Despliega esto en Neon/);
    assert.match(neonSource, /Abrir consola de Neon/);
  });
});

describe("IntegrationModalBase", () => {
  const basePath = new URL("./integration-modal-base.tsx", import.meta.url);
  const baseSource = readFileSync(basePath, "utf-8");

  it("IntegrationModalBase soporta renderizado personalizado de children y fallback clásico", () => {
    assert.match(baseSource, /children\?: React\.ReactNode/);
    assert.match(baseSource, /\{children \? \(\s*children\s*\) :/);
  });
});
