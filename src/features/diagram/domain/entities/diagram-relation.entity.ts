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

export type DiagramCardinality = '1..1' | '0..1' | '0..*' | '1..*' | '1';

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

export type RelationCreationPhase =
  | 'idle'
  | 'source_popover_open'
  | 'tracking_cursor'
  | 'target_popover_open';

export type VertexAnchor = {
  classId: string;
  handle: DiagramRelationHandle;
  flowPosition: { x: number; y: number };
};

export type VertexPopoverAnchor = {
  classId: string;
  handleId: DiagramRelationHandle;
  step: 'source' | 'target';
  screenPosition: { x: number; y: number };
  flowPosition: { x: number; y: number };
};

export type RelationCreationDraft = {
  phase: RelationCreationPhase;
  source: VertexAnchor | null;
  selectedRelationType: DiagramRelationType | null;
  sourceCardinality: DiagramCardinality | null;
  target: VertexAnchor | null;
  targetCardinality: DiagramCardinality | null;
  currentCursorPosition: { x: number; y: number } | null;
  activePopover: VertexPopoverAnchor | null;
};

export type VertexOptionCategory = 'cardinality' | 'structural_head';

export type VertexOptionIconType =
  | 'rombo_relleno'
  | 'rombo_vacio'
  | 'flecha_triangular'
  | 'flecha_discontinua'
  | 'flecha_abierta';

export type VertexOptionItem = {
  id: string;
  category: VertexOptionCategory;
  label: string;
  badge?: string;
  relationType: DiagramRelationType;
  cardinality?: DiagramCardinality;
  iconType?: VertexOptionIconType;
};

export const TARGET_CARDINALITY_OPTIONS: readonly VertexOptionItem[] = [
  {
    id: 'card_1',
    category: 'cardinality',
    label: 'Uno a uno',
    badge: '1..1',
    relationType: 'ASSOCIATION',
    cardinality: '1',
  },
  {
    id: 'card_0_1',
    category: 'cardinality',
    label: 'Cero a uno',
    badge: '0..1',
    relationType: 'ASSOCIATION',
    cardinality: '0..1',
  },
  {
    id: 'card_0_many',
    category: 'cardinality',
    label: 'Cero a muchos',
    badge: '0..*',
    relationType: 'ASSOCIATION',
    cardinality: '0..*',
  },
  {
    id: 'card_1_many',
    category: 'cardinality',
    label: 'Uno a muchos',
    badge: '1..*',
    relationType: 'ASSOCIATION',
    cardinality: '1..*',
  },
] as const;

export const SOURCE_VERTEX_OPTIONS: readonly VertexOptionItem[] = [
  ...TARGET_CARDINALITY_OPTIONS,
  {
    id: 'head_composition',
    category: 'structural_head',
    label: 'Composición',
    relationType: 'COMPOSITION',
    iconType: 'rombo_relleno',
  },
  {
    id: 'head_aggregation',
    category: 'structural_head',
    label: 'Agregación',
    relationType: 'AGGREGATION',
    iconType: 'rombo_vacio',
  },
  {
    id: 'head_generalization',
    category: 'structural_head',
    label: 'Herencia',
    relationType: 'GENERALIZATION',
    iconType: 'flecha_triangular',
  },
  {
    id: 'head_realization',
    category: 'structural_head',
    label: 'Realización',
    relationType: 'REALIZATION',
    iconType: 'flecha_discontinua',
  },
  {
    id: 'head_dependency',
    category: 'structural_head',
    label: 'Dependencia',
    relationType: 'DEPENDENCY',
    iconType: 'flecha_abierta',
  },
] as const;

export function isStructuralRelationType(relationType: DiagramRelationType): boolean {
  return relationType !== 'ASSOCIATION';
}

