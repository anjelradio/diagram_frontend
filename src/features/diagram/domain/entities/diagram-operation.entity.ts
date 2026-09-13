import type { DiagramAttributeDataType } from "./diagram-attribute.entity";

/**
 * Entidades y tipos del dominio de Diagrama para operaciones serializables en cola.
 */

export type DiagramOperationKind =
  | "CREATE"
  | "RENAME"
  | "MOVE"
  | "DELETE"
  | "CREATE_ATTRIBUTE"
  | "UPDATE_ATTRIBUTE"
  | "REPOSITION_ATTRIBUTE"
  | "DELETE_ATTRIBUTE";

export type DiagramOperationState = "pending" | "processing" | "blocked";

export type PrimaryAttributePayload = {
  id: string;
  name: "id";
  dataType: "UUID";
  position: 0;
  isPrimaryKey: true;
  isNullable: false;
};

export type CreateClassPayload = {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
  primaryAttribute: PrimaryAttributePayload;
};

export type RenameClassPayload = {
  name: string;
};

export type MoveClassPayload = {
  positionX: number;
  positionY: number;
};

export type DeleteClassPayload = Record<string, never>;

export type CreateAttributePayload = {
  id: string;
  name: string;
  position: number;
};

export type UpdateAttributePayload = {
  attributeId: string;
  name?: string;
  dataType?: DiagramAttributeDataType | null;
  isNullable?: boolean;
};

export type RepositionAttributePayload = {
  attributeId: string;
  position: number;
};

export type DeleteAttributePayload = {
  attributeId: string;
};

export type DiagramOperationPayload =
  | CreateClassPayload
  | RenameClassPayload
  | MoveClassPayload
  | DeleteClassPayload
  | CreateAttributePayload
  | UpdateAttributePayload
  | RepositionAttributePayload
  | DeleteAttributePayload;

export type DiagramOperation = {
  operationId: string;
  viewerId: string;
  projectId: string;
  sequence: number;
  kind: DiagramOperationKind;
  classId: string;
  payload: DiagramOperationPayload;
  createdAt: string;
  attempts: number;
  nextAttemptAt?: string;
  state: DiagramOperationState;
};
