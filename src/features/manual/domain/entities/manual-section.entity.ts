import type { ComponentType } from "react";

/**
 * Identificadores únicos de sección para anclaje de scroll (Slugs).
 */
export type ManualSectionId =
  | "introduccion"
  | "inicio-rapido"
  | "modelado-clases"
  | "colaboracion"
  | "asistente-ia"
  | "spring-boot"
  | "enterprise-architect";

/**
 * Nombres de iconos Lucide válidos utilizados en el manual.
 */
export type ManualIconName =
  | "BookOpen"
  | "Rocket"
  | "Boxes"
  | "Users"
  | "Bot"
  | "Cpu"
  | "FileSpreadsheet"
  | "SquarePlus"
  | "Network"
  | "Share2"
  | "Mic"
  | "Image"
  | "Download"
  | "UploadCloud"
  | "Sparkles"
  | "HelpCircle"
  | "ArrowLeft"
  | "CheckCircle2"
  | "Compass"
  | "Terminal"
  | "Workflow"
  | "Layers"
  | "FolderPlus"
  | "Database"
  | "Code2";

/**
 * Elemento de navegación rápida en la barra de anclajes del manual.
 */
export interface ManualNavItem {
  id: ManualSectionId;
  label: string;
  iconName: ManualIconName;
  badge?: string;
}

/**
 * Instrucción paso a paso orientada al usuario ("dónde hacer clic").
 */
export interface ManualStep {
  stepNumber: number;
  title: string;
  description: string;
  clickTarget?: string; // Indicación visual del control o botón en la UI
  shortcut?: string;    // Atajo de teclado aplicable (ej. ⌘K, V, H, C)
  highlightNote?: string;
}

/**
 * Característica o capacidad clave destacada dentro de una sección.
 */
export interface ManualFeatureItem {
  title: string;
  description: string;
  iconName: ManualIconName;
  tag?: string;
}

/**
 * Sección completa de documentación temática.
 */
export interface ManualSection {
  id: ManualSectionId;
  title: string;
  subtitle: string;
  iconName: ManualIconName;
  badge?: string;
  summary: string;
  steps: ManualStep[];
  features?: ManualFeatureItem[];
  tips?: string[];
}

/**
 * Documento estructurado raíz que contiene todo el manual.
 */
export interface ManualDocument {
  title: string;
  version: string;
  lastUpdated: string;
  navigation: ManualNavItem[];
  sections: ManualSection[];
}
