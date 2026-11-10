import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity";

/** Puerta de aplicación para proyectar una operación durable sobre el estado visible. */
export interface DiagramProjectionPort {
  apply(operation: DiagramOperation): void;
}
