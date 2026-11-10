/** Dependencias de entorno necesarias para construir y despachar operaciones. */
export interface DiagramRuntimePort {
  createId(): string;
  now(): string;
  requestSync(): void;
}
