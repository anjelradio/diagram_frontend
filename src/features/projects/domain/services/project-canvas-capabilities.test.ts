import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ProjectAccessRole } from "../entities/project.entity.ts";
import { deriveProjectCanvasCapabilities } from "./project-canvas-capabilities.ts";

describe("deriveProjectCanvasCapabilities - Matriz pura de capacidades", () => {
  it("otorga todas las capacidades al rol OWNER", () => {
    const caps = deriveProjectCanvasCapabilities(ProjectAccessRole.OWNER);

    assert.equal(caps.canViewProject, true);
    assert.equal(caps.canPanAndZoom, true);
    assert.equal(caps.canEditDiagram, true);
    assert.equal(caps.canViewToolbar, true);
    assert.equal(caps.canExportOrGenerate, true);
    assert.equal(caps.canShareInvitation, true);
    assert.equal(caps.canEditProjectDetails, true);
    assert.equal(caps.canManageMembers, true);
    assert.equal(caps.canViewHistoricalMembers, true);
    assert.equal(caps.canDuplicateOrDeleteProject, true);
  });

  it("otorga edición de diagrama y exportación pero no administración al rol EDITOR", () => {
    const caps = deriveProjectCanvasCapabilities(ProjectAccessRole.EDITOR);

    assert.equal(caps.canViewProject, true);
    assert.equal(caps.canPanAndZoom, true);
    assert.equal(caps.canEditDiagram, true);
    assert.equal(caps.canViewToolbar, true);
    assert.equal(caps.canExportOrGenerate, true);

    // Capacidades restringidas exclusivamente al owner
    assert.equal(caps.canShareInvitation, false);
    assert.equal(caps.canEditProjectDetails, false);
    assert.equal(caps.canManageMembers, false);
    assert.equal(caps.canViewHistoricalMembers, false);
    assert.equal(caps.canDuplicateOrDeleteProject, false);
  });

  it("otorga únicamente visualización, pan y zoom al rol READER", () => {
    const caps = deriveProjectCanvasCapabilities(ProjectAccessRole.READER);

    assert.equal(caps.canViewProject, true);
    assert.equal(caps.canPanAndZoom, true);

    // Sin edición ni toolbar ni exportación
    assert.equal(caps.canEditDiagram, false);
    assert.equal(caps.canViewToolbar, false);
    assert.equal(caps.canExportOrGenerate, false);

    // Sin gestión
    assert.equal(caps.canShareInvitation, false);
    assert.equal(caps.canEditProjectDetails, false);
    assert.equal(caps.canManageMembers, false);
    assert.equal(caps.canViewHistoricalMembers, false);
    assert.equal(caps.canDuplicateOrDeleteProject, false);
  });
});
