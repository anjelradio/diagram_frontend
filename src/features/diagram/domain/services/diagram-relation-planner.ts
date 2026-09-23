import type { DiagramAttribute } from "../entities/diagram-attribute.entity.ts";
import type {
  DiagramClass,
  DiagramClassWithAttributes,
} from "../entities/diagram-class.entity.ts";
import type {
  BridgeClassPayload,
  CreateRelationPayload,
  ForeignAttributePayload,
  PrimaryAttributePayload,
  SharedPrimaryKeyPayload,
} from "../entities/diagram-operation.entity.ts";
import {
  isManyToManyRelation,
  type DiagramCardinality,
  type DiagramRelation,
  type DiagramRelationHandle,
  type DiagramRelationType,
  type RelationMaterializationStrategy,
} from "../entities/diagram-relation.entity.ts";

export type PlanRelationParams = {
  relationId?: string;
  name?: string;
  relationType: DiagramRelationType;
  sourceClass: DiagramClassWithAttributes;
  targetClass: DiagramClassWithAttributes;
  sourceHandle: DiagramRelationHandle;
  targetHandle: DiagramRelationHandle;
  sourceCardinality?: DiagramCardinality | null;
  targetCardinality?: DiagramCardinality | null;
  existingClasses?: DiagramClass[];
  idGenerator?: () => string;
};

export type PlannedRelationAggregate = {
  relation: DiagramRelation;
  materialization: CreateRelationPayload["materialization"];
  createRelationPayload: CreateRelationPayload;
  bridgeClass?: DiagramClassWithAttributes;
  foreignKeyAttribute?: DiagramAttribute;
  sharedPrimaryKeyAttribute?: DiagramAttribute;
};

/**
 * Genera el nombre en PascalCase para una clase puente N:M resolviendo colisiones.
 */
export function generateBridgeClassName(
  sourceName: string,
  targetName: string,
  existingClassNames: string[] | Set<string>
): string {
  const cleanPart = (name: string, fallback: string) => {
    const parts = name
      .trim()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    return parts.length > 0 ? parts.join("") : fallback;
  };

  const cleanSource = cleanPart(sourceName, "Source");
  const cleanTarget = cleanPart(targetName, "Target");
  const baseName = `${cleanSource}${cleanTarget}`;

  const existingSet = new Set(
    Array.from(existingClassNames).map((n) => n.toLowerCase())
  );

  if (!existingSet.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (existingSet.has(`${baseName.toLowerCase()}${suffix}`)) {
    suffix++;
  }
  return `${baseName}${suffix}`;
}

/**
 * Calcula la posición de la clase puente N:M (centro horizontal, +180px vertical).
 */
export function calculateBridgeClassPosition(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { x: number; y: number } {
  const x = (sourcePos.x + targetPos.x) / 2;
  const y = (sourcePos.y + targetPos.y) / 2 + 180;
  return { x, y };
}

/**
 * Genera el nombre snake_case terminado en _id para una FK resolviendo colisiones.
 */
export function generateForeignKeyName(
  referencedClassName: string,
  existingAttributeNames: string[] | Set<string>
): string {
  const snake = referencedClassName
    .trim()
    .replace(/([A-Z])/g, "_$1")
    .replace(/[\s-]+/g, "_")
    .toLowerCase()
    .replace(/^_+/, "")
    .replace(/_+/g, "_");

  const baseFk = snake.endsWith("_id") ? snake : `${snake || "ref"}_id`;
  const existingSet = new Set(
    Array.from(existingAttributeNames).map((n) => n.toLowerCase())
  );

  if (!existingSet.has(baseFk.toLowerCase())) {
    return baseFk;
  }

  let suffix = 2;
  while (existingSet.has(`${baseFk.toLowerCase()}_${suffix}`)) {
    suffix++;
  }
  return `${baseFk}_${suffix}`;
}

/**
 * Determina la estrategia de materialización según el tipo de relación y cardinalidades.
 */
export function determineRelationMaterializationStrategy(
  relationType: DiagramRelationType,
  sourceCardinality: DiagramCardinality | null,
  targetCardinality: DiagramCardinality | null
): RelationMaterializationStrategy {
  if (relationType === "GENERALIZATION") {
    return "SHARED_PRIMARY_KEY";
  }
  if (
    relationType === "ASSOCIATION" &&
    isManyToManyRelation(relationType, sourceCardinality, targetCardinality)
  ) {
    return "BRIDGE_CLASS";
  }
  return "FOREIGN_KEY";
}

/**
 * Planificador puro de agregados relacionales UML.
 * Genera relación, metadatos FK, PK compartida o clase puente listos para persistencia y Zustand.
 */
export function planRelationCreation(
  params: PlanRelationParams
): PlannedRelationAggregate {
  const idGen = params.idGenerator ?? (() => crypto.randomUUID());
  const relationId = params.relationId ?? idGen();
  const strategy = determineRelationMaterializationStrategy(
    params.relationType,
    params.sourceCardinality ?? null,
    params.targetCardinality ?? null
  );

  // RF-021: Solo las relaciones de tipo asociación tienen nombre por defecto y editable.
  // Las no asociativas deben conservar siempre el nombre vacío.
  const resolvedRelationName =
    params.relationType === "ASSOCIATION"
      ? params.name?.trim() || "Nueva relación"
      : "";

  if (strategy === "BRIDGE_CLASS") {
    const bridgeId = idGen();
    const bridgePkId = idGen();
    const fk1Id = idGen();
    const fk2Id = idGen();

    const existingNames = (params.existingClasses ?? []).map((c) => c.name);
    const bridgeName = generateBridgeClassName(
      params.sourceClass.name,
      params.targetClass.name,
      existingNames
    );

    const bridgePos = calculateBridgeClassPosition(
      { x: params.sourceClass.positionX, y: params.sourceClass.positionY },
      { x: params.targetClass.positionX, y: params.targetClass.positionY }
    );

    const bridgeHandle: DiagramRelationHandle = "TOP_CENTER";

    const primaryAttribute: PrimaryAttributePayload = {
      id: bridgePkId,
      name: "id",
      dataType: "UUID",
      position: 0,
      isPrimaryKey: true,
      isNullable: false,
    };

    const isSelfRelation = params.sourceClass.id === params.targetClass.id;
    const baseSnake = params.sourceClass.name
      .trim()
      .replace(/([A-Z])/g, "_$1")
      .replace(/[\s-]+/g, "_")
      .toLowerCase()
      .replace(/^_+/, "")
      .replace(/_+/g, "_");
    const cleanBase = baseSnake.endsWith("_id") ? baseSnake.slice(0, -3) : baseSnake;

    const fk1Name = isSelfRelation
      ? `${cleanBase}_a_id`
      : generateForeignKeyName(params.sourceClass.name, []);
    const fk1: ForeignAttributePayload = {
      id: fk1Id,
      classId: bridgeId,
      name: fk1Name,
      dataType: "UUID",
      position: 1,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: true,
      referencedClassId: params.sourceClass.id,
      relationId,
    };

    const fk2Name = isSelfRelation
      ? `${cleanBase}_b_id`
      : generateForeignKeyName(params.targetClass.name, [fk1Name]);
    const fk2: ForeignAttributePayload = {
      id: fk2Id,
      classId: bridgeId,
      name: fk2Name,
      dataType: "UUID",
      position: 2,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: true,
      referencedClassId: params.targetClass.id,
      relationId,
    };

    const bridgePayload: BridgeClassPayload = {
      id: bridgeId,
      name: bridgeName,
      positionX: bridgePos.x,
      positionY: bridgePos.y,
      handle: bridgeHandle,
      primaryAttribute,
      foreignAttributes: [fk1, fk2],
    };

    const materialization: CreateRelationPayload["materialization"] = {
      strategy: "BRIDGE_CLASS",
      foreignAttributes: [],
      sharedPrimaryKey: null,
      bridgeClass: bridgePayload,
    };

    const relation: DiagramRelation = {
      id: relationId,
      name: resolvedRelationName,
      relationType: params.relationType,
      source: {
        classId: params.sourceClass.id,
        handle: params.sourceHandle,
        cardinality: params.sourceCardinality ?? null,
      },
      target: {
        classId: params.targetClass.id,
        handle: params.targetHandle,
        cardinality: params.targetCardinality ?? null,
      },
      bridge: {
        classId: bridgeId,
        handle: bridgeHandle,
      },
    };

    const createRelationPayload: CreateRelationPayload = {
      id: relationId,
      name: resolvedRelationName,
      relationType: params.relationType,
      source: {
        classId: params.sourceClass.id,
        handle: params.sourceHandle,
        cardinality: params.sourceCardinality ?? null,
      },
      target: {
        classId: params.targetClass.id,
        handle: params.targetHandle,
        cardinality: params.targetCardinality ?? null,
      },
      materialization,
    };

    const bridgeClass: DiagramClassWithAttributes = {
      id: bridgeId,
      name: bridgeName,
      positionX: bridgePos.x,
      positionY: bridgePos.y,
      attributes: [
        {
          id: bridgePkId,
          classId: bridgeId,
          name: "id",
          dataType: "UUID",
          position: 0,
          isPrimaryKey: true,
          isNullable: false,
          isForeignKey: false,
        },
        {
          id: fk1Id,
          classId: bridgeId,
          name: fk1Name,
          dataType: "UUID",
          position: 1,
          isPrimaryKey: false,
          isNullable: false,
          isForeignKey: true,
          referencedClassId: params.sourceClass.id,
          relationId,
        },
        {
          id: fk2Id,
          classId: bridgeId,
          name: fk2Name,
          dataType: "UUID",
          position: 2,
          isPrimaryKey: false,
          isNullable: false,
          isForeignKey: true,
          referencedClassId: params.targetClass.id,
          relationId,
        },
      ],
    };

    return {
      relation,
      materialization,
      createRelationPayload,
      bridgeClass,
    };
  }

  if (strategy === "SHARED_PRIMARY_KEY") {
    const relationName = resolvedRelationName;
    const subclassPk = params.sourceClass.attributes.find((a) => a.isPrimaryKey);
    if (!subclassPk) {
      throw new Error(
        `Subclass ${params.sourceClass.name} does not have a primary key for generalization`
      );
    }

    const sharedPrimaryKey: SharedPrimaryKeyPayload = {
      attributeId: subclassPk.id,
      classId: params.sourceClass.id,
      referencedClassId: params.targetClass.id,
      relationId,
    };

    const materialization: CreateRelationPayload["materialization"] = {
      strategy: "SHARED_PRIMARY_KEY",
      foreignAttributes: [],
      sharedPrimaryKey,
      bridgeClass: null,
    };

    const relation: DiagramRelation = {
      id: relationId,
      name: relationName,
      relationType: params.relationType,
      source: {
        classId: params.sourceClass.id,
        handle: params.sourceHandle,
        cardinality: null,
      },
      target: {
        classId: params.targetClass.id,
        handle: params.targetHandle,
        cardinality: null,
      },
      bridge: null,
    };

    const createRelationPayload: CreateRelationPayload = {
      id: relationId,
      name: relationName,
      relationType: params.relationType,
      source: {
        classId: params.sourceClass.id,
        handle: params.sourceHandle,
        cardinality: null,
      },
      target: {
        classId: params.targetClass.id,
        handle: params.targetHandle,
        cardinality: null,
      },
      materialization,
    };

    const sharedPrimaryKeyAttribute: DiagramAttribute = {
      ...subclassPk,
      isForeignKey: true,
      referencedClassId: params.targetClass.id,
      relationId,
    };

    return {
      relation,
      materialization,
      createRelationPayload,
      sharedPrimaryKeyAttribute,
    };
  }

  // Strategy === 'FOREIGN_KEY'
  const relationName = resolvedRelationName;
  let receivingClass: DiagramClassWithAttributes;
  let referencedClass: DiagramClassWithAttributes;
  let isNullable = false;

  if (params.relationType === "AGGREGATION") {
    receivingClass = params.targetClass;
    referencedClass = params.sourceClass;
    isNullable = true;
  } else if (params.relationType === "COMPOSITION") {
    receivingClass = params.targetClass;
    referencedClass = params.sourceClass;
    isNullable = false;
  } else if (params.relationType === "REALIZATION") {
    receivingClass = params.sourceClass;
    referencedClass = params.targetClass;
    isNullable = false;
  } else if (params.relationType === "DEPENDENCY") {
    receivingClass = params.sourceClass;
    referencedClass = params.targetClass;
    isNullable = true;
  } else if (params.relationType === "ASSOCIATION") {
    if (params.sourceClass.id === params.targetClass.id) {
      receivingClass = params.sourceClass;
      referencedClass = params.sourceClass;
      isNullable = true;
    } else {
      const srcMany =
        params.sourceCardinality === "0..*" || params.sourceCardinality === "1..*";
      const tgtMany =
        params.targetCardinality === "0..*" || params.targetCardinality === "1..*";

      if (srcMany && !tgtMany) {
        receivingClass = params.sourceClass;
        referencedClass = params.targetClass;
        isNullable = params.targetCardinality === "0..1";
      } else if (tgtMany && !srcMany) {
        receivingClass = params.targetClass;
        referencedClass = params.sourceClass;
        isNullable = params.sourceCardinality === "0..1";
      } else {
        // 1:1
        if (params.sourceClass.attributes.length > params.targetClass.attributes.length) {
          receivingClass = params.sourceClass;
          referencedClass = params.targetClass;
          isNullable = params.targetCardinality === "0..1";
        } else {
          receivingClass = params.targetClass;
          referencedClass = params.sourceClass;
          isNullable = params.sourceCardinality === "0..1";
        }
      }
    }
  } else {
    receivingClass = params.targetClass;
    referencedClass = params.sourceClass;
  }

  const existingPositions = receivingClass.attributes.map((a) => a.position);
  const position =
    existingPositions.length > 0 ? Math.max(...existingPositions) + 1 : 1;

  const existingAttrNames = receivingClass.attributes.map((a) => a.name);
  const fkName = generateForeignKeyName(referencedClass.name, existingAttrNames);

  const fkAttributePayload: ForeignAttributePayload = {
    id: idGen(),
    classId: receivingClass.id,
    name: fkName,
    dataType: "UUID",
    position,
    isPrimaryKey: false,
    isNullable,
    isForeignKey: true,
    referencedClassId: referencedClass.id,
    relationId,
  };

  const materialization: CreateRelationPayload["materialization"] = {
    strategy: "FOREIGN_KEY",
    foreignAttributes: [fkAttributePayload],
    sharedPrimaryKey: null,
    bridgeClass: null,
  };

  const relation: DiagramRelation = {
    id: relationId,
    name: relationName,
    relationType: params.relationType,
    source: {
      classId: params.sourceClass.id,
      handle: params.sourceHandle,
      cardinality: params.sourceCardinality ?? null,
    },
    target: {
      classId: params.targetClass.id,
      handle: params.targetHandle,
      cardinality: params.targetCardinality ?? null,
    },
    bridge: null,
  };

  const createRelationPayload: CreateRelationPayload = {
    id: relationId,
    name: relationName,
    relationType: params.relationType,
    source: {
      classId: params.sourceClass.id,
      handle: params.sourceHandle,
      cardinality: params.sourceCardinality ?? null,
    },
    target: {
      classId: params.targetClass.id,
      handle: params.targetHandle,
      cardinality: params.targetCardinality ?? null,
    },
    materialization,
  };

  const foreignKeyAttribute: DiagramAttribute = {
    id: fkAttributePayload.id,
    classId: receivingClass.id,
    name: fkName,
    dataType: "UUID",
    position,
    isPrimaryKey: false,
    isNullable,
    isForeignKey: true,
    referencedClassId: referencedClass.id,
    relationId,
  };

  return {
    relation,
    materialization,
    createRelationPayload,
    foreignKeyAttribute,
  };
}

/**
 * Calcula los handles direccionales óptimos entre dos clases evitando colisiones y sobrecarga.
 */
export function resolveOptimalHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  existingRelations?: DiagramRelation[],
  sourceClassId?: string,
  targetClassId?: string
): { sourceHandle: DiagramRelationHandle; targetHandle: DiagramRelationHandle } {
  const usage = new Map<string, number>();

  if (existingRelations) {
    for (const rel of existingRelations) {
      const srcKey = `${rel.source.classId}:${rel.source.handle}`;
      usage.set(srcKey, (usage.get(srcKey) ?? 0) + 1);

      const tgtKey = `${rel.target.classId}:${rel.target.handle}`;
      usage.set(tgtKey, (usage.get(tgtKey) ?? 0) + 1);

      if (rel.bridge) {
        const brKey = `${rel.bridge.classId}:${rel.bridge.handle}`;
        usage.set(brKey, (usage.get(brKey) ?? 0) + 1);
      }
    }
  }

  // Caso auto-referenciado: seleccionar dos handles distintos de la misma clase con mínima ocupación
  if (sourceClassId && targetClassId && sourceClassId === targetClassId) {
    const pairCandidates: Array<[DiagramRelationHandle, DiagramRelationHandle]> = [
      ["RIGHT_TOP", "RIGHT_BOTTOM"],
      ["TOP_LEFT", "TOP_RIGHT"],
      ["LEFT_TOP", "LEFT_BOTTOM"],
      ["BOTTOM_LEFT", "BOTTOM_RIGHT"],
      ["TOP_RIGHT", "RIGHT_TOP"],
      ["RIGHT_BOTTOM", "BOTTOM_RIGHT"],
      ["BOTTOM_LEFT", "LEFT_BOTTOM"],
      ["LEFT_TOP", "TOP_LEFT"],
    ];

    let bestPair = pairCandidates[0];
    let minCombinedUsage = Infinity;

    for (const [h1, h2] of pairCandidates) {
      const u1 = usage.get(`${sourceClassId}:${h1}`) ?? 0;
      const u2 = usage.get(`${sourceClassId}:${h2}`) ?? 0;
      const combined = u1 + u2;
      if (combined === 0) {
        return { sourceHandle: h1, targetHandle: h2 };
      }
      if (combined < minCombinedUsage) {
        minCombinedUsage = combined;
        bestPair = [h1, h2];
      }
    }
    return { sourceHandle: bestPair[0], targetHandle: bestPair[1] };
  }

  // Centros aproximados asumiendo tarjetas de 240x140px
  const srcCx = sourcePos.x + 120;
  const srcCy = sourcePos.y + 70;
  const tgtCx = targetPos.x + 120;
  const tgtCy = targetPos.y + 70;

  const dx = tgtCx - srcCx;
  const dy = tgtCy - srcCy;

  const pickBestHandle = (
    classId: string | undefined,
    relDx: number,
    relDy: number
  ): DiagramRelationHandle => {
    let primaryCandidates: DiagramRelationHandle[];
    let adjacentCandidate: DiagramRelationHandle | null = null;

    if (Math.abs(relDy) > Math.abs(relDx)) {
      if (relDy > 0) {
        // Objetivo abajo -> Lado BOTTOM
        if (relDx > 40) {
          primaryCandidates = ["BOTTOM_RIGHT", "BOTTOM_CENTER", "BOTTOM_LEFT"];
          adjacentCandidate = "RIGHT_BOTTOM";
        } else if (relDx < -40) {
          primaryCandidates = ["BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"];
          adjacentCandidate = "LEFT_BOTTOM";
        } else {
          primaryCandidates = ["BOTTOM_CENTER", "BOTTOM_RIGHT", "BOTTOM_LEFT"];
          adjacentCandidate = "RIGHT_BOTTOM";
        }
      } else {
        // Objetivo arriba -> Lado TOP
        if (relDx > 40) {
          primaryCandidates = ["TOP_RIGHT", "TOP_CENTER", "TOP_LEFT"];
          adjacentCandidate = "RIGHT_TOP";
        } else if (relDx < -40) {
          primaryCandidates = ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT"];
          adjacentCandidate = "LEFT_TOP";
        } else {
          primaryCandidates = ["TOP_CENTER", "TOP_RIGHT", "TOP_LEFT"];
          adjacentCandidate = "RIGHT_TOP";
        }
      }
    } else {
      if (relDx > 0) {
        // Objetivo a la derecha -> Lado RIGHT
        if (relDy > 30) {
          primaryCandidates = ["RIGHT_BOTTOM", "RIGHT_CENTER", "RIGHT_TOP"];
          adjacentCandidate = "BOTTOM_RIGHT";
        } else if (relDy < -30) {
          primaryCandidates = ["RIGHT_TOP", "RIGHT_CENTER", "RIGHT_BOTTOM"];
          adjacentCandidate = "TOP_RIGHT";
        } else {
          primaryCandidates = ["RIGHT_CENTER", "RIGHT_BOTTOM", "RIGHT_TOP"];
          adjacentCandidate = "BOTTOM_RIGHT";
        }
      } else {
        // Objetivo a la izquierda -> Lado LEFT
        if (relDy > 30) {
          primaryCandidates = ["LEFT_BOTTOM", "LEFT_CENTER", "LEFT_TOP"];
          adjacentCandidate = "BOTTOM_LEFT";
        } else if (relDy < -30) {
          primaryCandidates = ["LEFT_TOP", "LEFT_CENTER", "LEFT_BOTTOM"];
          adjacentCandidate = "TOP_LEFT";
        } else {
          primaryCandidates = ["LEFT_CENTER", "LEFT_BOTTOM", "LEFT_TOP"];
          adjacentCandidate = "BOTTOM_LEFT";
        }
      }
    }

    if (!classId) {
      return primaryCandidates[0];
    }

    // 1. Buscar candidato con usage 0 en lado primario
    for (const cand of primaryCandidates) {
      if ((usage.get(`${classId}:${cand}`) ?? 0) === 0) {
        return cand;
      }
    }

    // 2. Intentar con esquina adyacente desocupada
    if (adjacentCandidate && (usage.get(`${classId}:${adjacentCandidate}`) ?? 0) === 0) {
      return adjacentCandidate;
    }

    // 3. Menor ocupación
    let best = primaryCandidates[0];
    let minOcc = usage.get(`${classId}:${best}`) ?? 0;
    for (let i = 1; i < primaryCandidates.length; i++) {
      const occ = usage.get(`${classId}:${primaryCandidates[i]}`) ?? 0;
      if (occ < minOcc) {
        best = primaryCandidates[i];
        minOcc = occ;
      }
    }
    return best;
  };

  const sourceHandle = pickBestHandle(sourceClassId, dx, dy);
  if (sourceClassId) {
    usage.set(`${sourceClassId}:${sourceHandle}`, (usage.get(`${sourceClassId}:${sourceHandle}`) ?? 0) + 1);
  }

  const targetHandle = pickBestHandle(targetClassId, -dx, -dy);
  if (targetClassId) {
    usage.set(`${targetClassId}:${targetHandle}`, (usage.get(`${targetClassId}:${targetHandle}`) ?? 0) + 1);
  }

  return { sourceHandle, targetHandle };
}

