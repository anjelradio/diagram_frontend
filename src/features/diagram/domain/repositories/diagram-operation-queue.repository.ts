import type { DiagramOperation } from "../entities/diagram-operation.entity";

/**
 * Contrato de Dominio para el almacenamiento duradero y local (IndexedDB) de la cola de operaciones.
 * Aislado estrictamente por viewerId y projectId.
 */
export interface DiagramOperationQueueRepository {
  /**
   * Encola una nueva operación asignándole la siguiente secuencia ascendente de forma transaccional.
   */
  enqueue(operation: Omit<DiagramOperation, "sequence">): Promise<DiagramOperation>;

  /**
   * Obtiene la siguiente operación pendiente (menor secuencia) para procesar, o null si la cola está vacía.
   */
  peekNext(viewerId: string, projectId: string): Promise<DiagramOperation | null>;

  /**
   * Obtiene todas las operaciones del proyecto ordenadas por secuencia ascendente.
   */
  getAllPending(viewerId: string, projectId: string): Promise<DiagramOperation[]>;

  /**
   * Actualiza el estado, reintentos o fecha de reintento de una operación en la cola.
   */
  update(operation: DiagramOperation): Promise<void>;

  /**
   * Elimina de forma duradera una operación completada con éxito.
   */
  dequeue(operationId: string): Promise<void>;

  /**
   * Retorna la cantidad de operaciones pendientes o en procesamiento para el usuario y proyecto.
   */
  countPending(viewerId: string, projectId: string): Promise<number>;

  /**
   * Limpia todas las operaciones asociadas a un proyecto de un usuario.
   */
  clearProjectQueue(viewerId: string, projectId: string): Promise<void>;

  /**
   * Restaura todas las operaciones bloqueadas de un proyecto a estado 'pending' para reintentar.
   */
  resetBlockedOperations(viewerId: string, projectId: string): Promise<number>;
}
