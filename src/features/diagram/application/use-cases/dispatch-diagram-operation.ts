import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity";
import type { DiagramOperationQueueRepository } from "../../domain/repositories/diagram-operation-queue.repository";
import type {
  DiagramOperationDispatcherPort,
  DispatchDiagramOperationCommand,
} from "../ports/diagram-operation-dispatcher.port";
import type { DiagramProjectionPort } from "../ports/diagram-projection.port";
import type { DiagramRuntimePort } from "../ports/diagram-runtime.port";

type DispatchDiagramOperationDependencies = {
  queue: Pick<DiagramOperationQueueRepository, "enqueue">;
  projection: DiagramProjectionPort;
  runtime: DiagramRuntimePort;
};

/** Persiste primero; sólo una operación durable puede llegar a la proyección optimista. */
export function createDispatchDiagramOperation({
  queue,
  projection,
  runtime,
}: DispatchDiagramOperationDependencies): DiagramOperationDispatcherPort {
  return {
    async dispatch(command: DispatchDiagramOperationCommand): Promise<DiagramOperation> {
      const operation = await queue.enqueue({
        ...command,
        operationId: runtime.createId(),
        createdAt: runtime.now(),
        attempts: 0,
        state: "pending",
      });

      projection.apply(operation);
      runtime.requestSync();
      return operation;
    },
  };
}
