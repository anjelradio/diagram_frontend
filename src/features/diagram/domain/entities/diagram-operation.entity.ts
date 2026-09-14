import type { DiagramAttributeDataType } from "./diagram-attribute.entity";
import type {
  DiagramCardinality,
  DiagramRelationHandle,
  DiagramRelationType,
  RelationMaterializationStrategy,
} from "./diagram-relation.entity";

/**
 * Entidades y tipos del dominio de Diagrama para operaciones serializables en cola.
 */

export type DiagramOperationKind =
  | "CREATE_CLASS"
  | "RENAME_CLASS"
  | "MOVE_CLASS"
  | "DELETE_CLASS"
  | "CREATE"
  | "RENAME"
  | "MOVE"
  | "DELETE"
  | "CREATE_ATTRIBUTE"
  | "UPDATE_ATTRIBUTE"
  | "REPOSITION_ATTRIBUTE"
  | "DELETE_ATTRIBUTE"
  | "CREATE_RELATION"
  | "RENAME_RELATION"
  | "DELETE_RELATION";

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

export type ForeignAttributePayload = {
  id: string;
  classId: string;
  name: string;
  dataType: "UUID";
  position: number;
  isPrimaryKey: false;
  isNullable: boolean;
  isForeignKey: true;
  referencedClassId: string;
  relationId: string;
};

export type SharedPrimaryKeyPayload = {
  attributeId: string;
  classId: string;
  referencedClassId: string;
  relationId: string;
};

export type BridgeClassPayload = {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
  handle: DiagramRelationHandle;
  primaryAttribute: PrimaryAttributePayload;
  foreignAttributes: [ForeignAttributePayload, ForeignAttributePayload];
};

export type CreateRelationPayload = {
  id: string;
  name: string;
  relationType: DiagramRelationType;
  source: {
    classId: string;
    handle: DiagramRelationHandle;
    cardinality: DiagramCardinality | null;
  };
  target: {
    classId: string;
    handle: DiagramRelationHandle;
    cardinality: DiagramCardinality | null;
  };
  materialization: {
    strategy: RelationMaterializationStrategy;
    foreignAttributes: ForeignAttributePayload[];
    sharedPrimaryKey: SharedPrimaryKeyPayload | null;
    bridgeClass: BridgeClassPayload | null;
  };
};

export type RenameRelationPayload = {
  relationId: string;
  name: string;
};

export type DeleteRelationPayload = {
  relationId: string;
};

export type DiagramOperationPayload =
  | CreateClassPayload
  | RenameClassPayload
  | MoveClassPayload
  | DeleteClassPayload
  | CreateAttributePayload
  | UpdateAttributePayload
  | RepositionAttributePayload
  | DeleteAttributePayload
  | CreateRelationPayload
  | RenameRelationPayload
  | DeleteRelationPayload;

type BaseDiagramOperation = {
  operationId: string;
  viewerId: string;
  projectId: string;
  sequence: number;
  createdAt: string;
  attempts: number;
  nextAttemptAt?: string;
  state: DiagramOperationState;
};

export type CreateClassOperation = BaseDiagramOperation & {
  kind: "CREATE_CLASS" | "CREATE";
  classId: string;
  payload: CreateClassPayload;
};

export type RenameClassOperation = BaseDiagramOperation & {
  kind: "RENAME_CLASS" | "RENAME";
  classId: string;
  payload: RenameClassPayload;
};

export type MoveClassOperation = BaseDiagramOperation & {
  kind: "MOVE_CLASS" | "MOVE";
  classId: string;
  payload: MoveClassPayload;
};

export type DeleteClassOperation = BaseDiagramOperation & {
  kind: "DELETE_CLASS" | "DELETE";
  classId: string;
  payload: DeleteClassPayload;
};

export type CreateAttributeOperation = BaseDiagramOperation & {
  kind: "CREATE_ATTRIBUTE";
  classId: string;
  payload: CreateAttributePayload;
};

export type UpdateAttributeOperation = BaseDiagramOperation & {
  kind: "UPDATE_ATTRIBUTE";
  classId: string;
  payload: UpdateAttributePayload;
};

export type RepositionAttributeOperation = BaseDiagramOperation & {
  kind: "REPOSITION_ATTRIBUTE";
  classId: string;
  payload: RepositionAttributePayload;
};

export type DeleteAttributeOperation = BaseDiagramOperation & {
  kind: "DELETE_ATTRIBUTE";
  classId: string;
  payload: DeleteAttributePayload;
};

export type CreateRelationOperation = BaseDiagramOperation & {
  kind: "CREATE_RELATION";
  classId?: string;
  relationId?: string;
  payload: CreateRelationPayload;
};

export type RenameRelationOperation = BaseDiagramOperation & {
  kind: "RENAME_RELATION";
  classId?: string;
  relationId?: string;
  payload: RenameRelationPayload;
};

export type DeleteRelationOperation = BaseDiagramOperation & {
  kind: "DELETE_RELATION";
  classId?: string;
  relationId?: string;
  payload: DeleteRelationPayload;
};

export type DiagramOperation =
  | CreateClassOperation
  | RenameClassOperation
  | MoveClassOperation
  | DeleteClassOperation
  | CreateAttributeOperation
  | UpdateAttributeOperation
  | RepositionAttributeOperation
  | DeleteAttributeOperation
  | CreateRelationOperation
  | RenameRelationOperation
  | DeleteRelationOperation;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type DiagramOperationInput = DistributiveOmit<
  DiagramOperation,
  "sequence"
>;
