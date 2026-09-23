/**
 * Entidades y tipos de dominio puro para relaciones UML de diagramas.
 */

export type DiagramRelationType =
  | 'ASSOCIATION'
  | 'AGGREGATION'
  | 'COMPOSITION'
  | 'GENERALIZATION'
  | 'REALIZATION'
  | 'DEPENDENCY';

export type DiagramCardinality = '0..1' | '1' | '0..*' | '1..*';

export type DiagramRelationHandle =
  | 'TOP_LEFT'
  | 'TOP_CENTER'
  | 'TOP_RIGHT'
  | 'RIGHT_TOP'
  | 'RIGHT_CENTER'
  | 'RIGHT_BOTTOM'
  | 'BOTTOM_RIGHT'
  | 'BOTTOM_CENTER'
  | 'BOTTOM_LEFT'
  | 'LEFT_BOTTOM'
  | 'LEFT_CENTER'
  | 'LEFT_TOP';

export const ALL_RELATION_HANDLES: readonly DiagramRelationHandle[] = [
  'TOP_LEFT',
  'TOP_CENTER',
  'TOP_RIGHT',
  'RIGHT_TOP',
  'RIGHT_CENTER',
  'RIGHT_BOTTOM',
  'BOTTOM_RIGHT',
  'BOTTOM_CENTER',
  'BOTTOM_LEFT',
  'LEFT_BOTTOM',
  'LEFT_CENTER',
  'LEFT_TOP',
] as const;

export type RelationEndpoint = {
  classId: string;
  handle: DiagramRelationHandle;
  cardinality: DiagramCardinality | null;
};

export type RelationEndpointRead = {
  classId: string;
  handle: DiagramRelationHandle;
};

export type DiagramRelationBridge = {
  classId: string;
  handle: DiagramRelationHandle;
};

export type DiagramRelation = {
  id: string;
  projectId?: string;
  name: string;
  relationType: DiagramRelationType;
  source: RelationEndpoint;
  target: RelationEndpoint;
  bridge: DiagramRelationBridge | null;
};

export type RelationMaterializationStrategy =
  | 'FOREIGN_KEY'
  | 'SHARED_PRIMARY_KEY'
  | 'BRIDGE_CLASS';

export type RelationPreset = {
  id: string;
  label: string;
  badge?: string;
  relationType: DiagramRelationType;
  sourceCardinality: DiagramCardinality | null;
  targetCardinality: DiagramCardinality | null;
  description?: string;
};

export const RELATION_PRESETS: readonly RelationPreset[] = [
  {
    id: 'one-to-many',
    label: 'Uno a muchos (1..*)',
    badge: '1..*',
    relationType: 'ASSOCIATION',
    sourceCardinality: '1',
    targetCardinality: '0..*',
  },
  {
    id: 'many-to-many',
    label: 'Muchos a muchos (*..*)',
    badge: '*..*',
    relationType: 'ASSOCIATION',
    sourceCardinality: '0..*',
    targetCardinality: '0..*',
  },
  {
    id: 'one-to-one',
    label: 'Uno a uno (1..1)',
    badge: '1..1',
    relationType: 'ASSOCIATION',
    sourceCardinality: '1',
    targetCardinality: '1',
  },
  {
    id: 'zero-to-many',
    label: 'Cero a muchos (0..*)',
    badge: '0..*',
    relationType: 'ASSOCIATION',
    sourceCardinality: '0..1',
    targetCardinality: '0..*',
  },
  {
    id: 'zero-to-one',
    label: 'Cero a uno (0..1)',
    badge: '0..1',
    relationType: 'ASSOCIATION',
    sourceCardinality: '0..1',
    targetCardinality: '0..1',
  },
  {
    id: 'aggregation',
    label: 'Agregación',
    relationType: 'AGGREGATION',
    sourceCardinality: null,
    targetCardinality: null,
  },
  {
    id: 'composition',
    label: 'Composición',
    relationType: 'COMPOSITION',
    sourceCardinality: null,
    targetCardinality: null,
  },
  {
    id: 'generalization',
    label: 'Herencia / Generalización',
    relationType: 'GENERALIZATION',
    sourceCardinality: null,
    targetCardinality: null,
  },
  {
    id: 'realization',
    label: 'Realización / Implementación',
    relationType: 'REALIZATION',
    sourceCardinality: null,
    targetCardinality: null,
  },
  {
    id: 'dependency',
    label: 'Dependencia',
    relationType: 'DEPENDENCY',
    sourceCardinality: null,
    targetCardinality: null,
  },
] as const;

export function isManyToManyRelation(
  relationType: DiagramRelationType,
  sourceCardinality: DiagramCardinality | null,
  targetCardinality: DiagramCardinality | null
): boolean {
  if (relationType !== 'ASSOCIATION') return false;
  if (!sourceCardinality || !targetCardinality) return false;
  const sourceMany = sourceCardinality === '0..*' || sourceCardinality === '1..*';
  const targetMany = targetCardinality === '0..*' || targetCardinality === '1..*';
  return sourceMany && targetMany;
}

export function getDirectedRoles(
  relationType: DiagramRelationType
): { sourceRole: string; targetRole: string } | null {
  switch (relationType) {
    case 'AGGREGATION':
    case 'COMPOSITION':
      return { sourceRole: 'Todo', targetRole: 'Parte' };
    case 'GENERALIZATION':
      return { sourceRole: 'Subclase', targetRole: 'Superclase' };
    case 'REALIZATION':
      return { sourceRole: 'Implementador', targetRole: 'Interfaz/Contrato' };
    case 'DEPENDENCY':
      return { sourceRole: 'Cliente', targetRole: 'Proveedor' };
    default:
      return null;
  }
}

export function canBeSelfReferencing(relationType: DiagramRelationType): boolean {
  return relationType === 'ASSOCIATION';
}

export function isSelfReferencingRelation(relation: {
  source: { classId: string };
  target: { classId: string };
}): boolean {
  return relation.source.classId === relation.target.classId;
}
