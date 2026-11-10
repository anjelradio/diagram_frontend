import type {
  DiagramOperation,
  DiagramOperationInput,
} from "../../domain/entities/diagram-operation.entity";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type DispatchDiagramOperationCommand = DistributiveOmit<
  DiagramOperationInput,
  "operationId" | "createdAt" | "attempts" | "state"
>;

/** Puerta que define el orden entre cola durable, proyección visible y sincronización. */
export interface DiagramOperationDispatcherPort {
  dispatch(operation: DispatchDiagramOperationCommand): Promise<DiagramOperation>;
}
