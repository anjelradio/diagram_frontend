import type { DiagramAttribute } from "../../domain/entities/diagram-attribute.entity.ts";
import type {
  DiagramClassWithAttributes,
  DiagramSnapshot,
} from "../../domain/entities/diagram-class.entity.ts";
import type {
  CreateAttributePayload,
  CreateClassPayload,
  CreateRelationPayload,
  DeleteAttributePayload,
  DiagramOperation,
  MoveClassPayload,
  RenameClassPayload,
  RenameRelationPayload,
  RepositionAttributePayload,
  UpdateAttributePayload,
} from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramRelation } from "../../domain/entities/diagram-relation.entity.ts";

/**
 * Compacta las posiciones de los atributos secundarios de una clase a 1..N
 * preservando la PK en la posición 0.
 */
function compactClassAttributes(
  attributes: DiagramAttribute[]
): DiagramAttribute[] {
  const pk = attributes.find((a) => a.isPrimaryKey);
  const secondaries = attributes
    .filter((a) => !a.isPrimaryKey)
    .sort((a, b) => a.position - b.position)
    .map((attr, idx) => ({
      ...attr,
      position: idx + 1,
    }));

  return pk ? [pk, ...secondaries] : secondaries;
}

/**
 * Proyecta una única operación de diagrama sobre el snapshot de forma pura e inmutable.
 */
export function projectDiagramOperation(
  snapshot: DiagramSnapshot,
  op: DiagramOperation
): DiagramSnapshot {
  const classes: DiagramClassWithAttributes[] = snapshot.classes.map((c) => ({
    ...c,
    attributes: (c.attributes || []).map((a) => ({ ...a })),
  }));
  let relations: DiagramRelation[] = snapshot.relations.map((r) => ({
    ...r,
    source: { ...r.source },
    target: { ...r.target },
    bridge: r.bridge ? { ...r.bridge } : null,
  }));

  if (op.kind === "CREATE" || op.kind === "CREATE_CLASS") {
    const p = op.payload as CreateClassPayload;
    const pk = p.primaryAttribute || {
      id: crypto.randomUUID(),
      name: "id",
      dataType: "UUID",
      position: 0,
      isPrimaryKey: true,
      isNullable: false,
    };
    const pkAttr: DiagramAttribute = {
      id: pk.id,
      classId: p.id,
      name: pk.name,
      dataType: pk.dataType,
      position: pk.position,
      isPrimaryKey: pk.isPrimaryKey,
      isNullable: pk.isNullable,
      isForeignKey: false,
    };
    classes.push({
      id: p.id,
      name: p.name,
      positionX: p.positionX,
      positionY: p.positionY,
      attributes: [pkAttr],
    });
  } else if (op.kind === "RENAME" || op.kind === "RENAME_CLASS") {
    const p = op.payload as RenameClassPayload;
    const targetClass = classes.find((c) => c.id === op.classId);
    if (targetClass) {
      targetClass.name = p.name;
    }
  } else if (op.kind === "MOVE" || op.kind === "MOVE_CLASS") {
    const p = op.payload as MoveClassPayload;
    const targetClass = classes.find((c) => c.id === op.classId);
    if (targetClass) {
      targetClass.positionX = p.positionX;
      targetClass.positionY = p.positionY;
    }
  } else if (op.kind === "DELETE" || op.kind === "DELETE_CLASS") {
    const classId = op.classId;
    const classIdx = classes.findIndex((c) => c.id === classId);
    if (classIdx !== -1) {
      classes.splice(classIdx, 1);
    }

    // Cascada: remover relaciones asociadas y puentes
    const relationsToRemove = relations.filter(
      (r) =>
        r.source.classId === classId ||
        r.target.classId === classId ||
        r.bridge?.classId === classId
    );

    for (const rel of relationsToRemove) {
      if (rel.bridge) {
        const bridgeIdx = classes.findIndex((c) => c.id === rel.bridge?.classId);
        if (bridgeIdx !== -1) {
          classes.splice(bridgeIdx, 1);
        }
      }
      // Limpiar FKs y restaurar PKs asociadas a estas relaciones
      for (const cls of classes) {
        cls.attributes = cls.attributes.map((a) => {
          if (a.relationId === rel.id && a.isPrimaryKey) {
            return {
              ...a,
              isForeignKey: false,
              referencedClassId: null,
              relationId: null,
            };
          }
          return a;
        });
        cls.attributes = compactClassAttributes(
          cls.attributes.filter((a) => a.relationId !== rel.id || a.isPrimaryKey)
        );
      }
    }

    relations = relations.filter(
      (r) =>
        r.source.classId !== classId &&
        r.target.classId !== classId &&
        r.bridge?.classId !== classId
    );
  } else if (op.kind === "CREATE_ATTRIBUTE") {
    const p = op.payload as CreateAttributePayload;
    const targetClass = classes.find((c) => c.id === op.classId);
    if (targetClass) {
      const newAttr: DiagramAttribute = {
        id: p.id,
        classId: op.classId,
        name: p.name,
        dataType: null,
        position: p.position,
        isPrimaryKey: false,
        isNullable: true,
      };
      targetClass.attributes = compactClassAttributes([
        ...targetClass.attributes,
        newAttr,
      ]);
    }
  } else if (op.kind === "UPDATE_ATTRIBUTE") {
    const p = op.payload as UpdateAttributePayload;
    const targetClass = classes.find((c) => c.id === op.classId);
    if (targetClass) {
      targetClass.attributes = targetClass.attributes.map((a) => {
        if (a.id === p.attributeId) {
          // PK inmutable
          if (a.isPrimaryKey) return a;
          // FK solo admite renombrado
          if (a.isForeignKey) {
            return p.name !== undefined ? { ...a, name: p.name } : a;
          }
          return {
            ...a,
            ...(p.name !== undefined ? { name: p.name } : {}),
            ...(p.dataType !== undefined ? { dataType: p.dataType } : {}),
            ...(p.isNullable !== undefined ? { isNullable: p.isNullable } : {}),
          };
        }
        return a;
      });
    }
  } else if (op.kind === "REPOSITION_ATTRIBUTE") {
    const p = op.payload as RepositionAttributePayload;
    const targetClass = classes.find((c) => c.id === op.classId);
    if (targetClass) {
      const pk = targetClass.attributes.find((a) => a.isPrimaryKey);
      const moving = targetClass.attributes.find((a) => a.id === p.attributeId);
      if (moving && !moving.isPrimaryKey && !moving.isForeignKey) {
        const others = targetClass.attributes.filter(
          (a) => !a.isPrimaryKey && a.id !== p.attributeId
        );
        const targetIndex = Math.max(0, Math.min(p.position - 1, others.length));
        others.splice(targetIndex, 0, moving);
        const updated = others.map((attr, idx) => ({
          ...attr,
          position: idx + 1,
        }));
        targetClass.attributes = pk ? [pk, ...updated] : updated;
      }
    }
  } else if (op.kind === "DELETE_ATTRIBUTE") {
    const p = op.payload as DeleteAttributePayload;
    const targetClass = classes.find((c) => c.id === op.classId);
    if (targetClass) {
      targetClass.attributes = compactClassAttributes(
        targetClass.attributes.filter(
          (a) => a.isPrimaryKey || a.isForeignKey || a.id !== p.attributeId
        )
      );
    }
  } else if (op.kind === "CREATE_RELATION") {
    const p = op.payload as CreateRelationPayload;
    const relation: DiagramRelation = {
      id: p.id,
      name: p.name,
      relationType: p.relationType,
      source: {
        classId: p.source.classId,
        handle: p.source.handle,
        cardinality: p.source.cardinality ?? null,
      },
      target: {
        classId: p.target.classId,
        handle: p.target.handle,
        cardinality: p.target.cardinality ?? null,
      },
      bridge: p.materialization.bridgeClass
        ? {
            classId: p.materialization.bridgeClass.id,
            handle: p.materialization.bridgeClass.handle,
          }
        : null,
    };
    relations.push(relation);

    if (
      p.materialization.strategy === "BRIDGE_CLASS" &&
      p.materialization.bridgeClass
    ) {
      const bc = p.materialization.bridgeClass;
      const bridgeClassAttrs: DiagramAttribute[] = [
        {
          id: bc.primaryAttribute.id,
          classId: bc.id,
          name: bc.primaryAttribute.name,
          dataType: bc.primaryAttribute.dataType,
          position: bc.primaryAttribute.position,
          isPrimaryKey: true,
          isNullable: false,
          isForeignKey: false,
        },
        ...bc.foreignAttributes.map((fa) => ({
          id: fa.id,
          classId: bc.id,
          name: fa.name,
          dataType: fa.dataType,
          position: fa.position,
          isPrimaryKey: false,
          isNullable: fa.isNullable,
          isForeignKey: true,
          referencedClassId: fa.referencedClassId,
          relationId: p.id,
        })),
      ];

      classes.push({
        id: bc.id,
        name: bc.name,
        positionX: bc.positionX,
        positionY: bc.positionY,
        attributes: bridgeClassAttrs,
      });
    } else if (
      p.materialization.strategy === "SHARED_PRIMARY_KEY" &&
      p.materialization.sharedPrimaryKey
    ) {
      const spk = p.materialization.sharedPrimaryKey;
      const subclass = classes.find((c) => c.id === spk.classId);
      if (subclass) {
        subclass.attributes = subclass.attributes.map((a) => {
          if (a.id === spk.attributeId) {
            return {
              ...a,
              isForeignKey: true,
              referencedClassId: spk.referencedClassId,
              relationId: p.id,
            };
          }
          return a;
        });
      }
    } else if (p.materialization.strategy === "FOREIGN_KEY") {
      for (const fa of p.materialization.foreignAttributes) {
        const receivingClass = classes.find((c) => c.id === fa.classId);
        if (receivingClass) {
          const newFk: DiagramAttribute = {
            id: fa.id,
            classId: fa.classId,
            name: fa.name,
            dataType: fa.dataType,
            position: fa.position,
            isPrimaryKey: false,
            isNullable: fa.isNullable,
            isForeignKey: true,
            referencedClassId: fa.referencedClassId,
            relationId: p.id,
          };
          receivingClass.attributes = compactClassAttributes([
            ...receivingClass.attributes,
            newFk,
          ]);
        }
      }
    }
  } else if (op.kind === "RENAME_RELATION") {
    const p = op.payload as RenameRelationPayload;
    const relId = op.relationId || p.relationId;
    const targetRel = relations.find((r) => r.id === relId);
    if (targetRel && !targetRel.bridge && targetRel.relationType === "ASSOCIATION") {
      targetRel.name = p.name;
    }
  } else if (op.kind === "DELETE_RELATION") {
    const relId = op.relationId || (op.payload as { relationId?: string })?.relationId;
    const targetRel = relations.find((r) => r.id === relId);
    if (targetRel) {
      // Eliminar clase puente si existía
      if (targetRel.bridge) {
        const bridgeIdx = classes.findIndex((c) => c.id === targetRel.bridge?.classId);
        if (bridgeIdx !== -1) {
          classes.splice(bridgeIdx, 1);
        }
      }

      // Revertir FKs y restaurar PKs compartidas
      for (const cls of classes) {
        cls.attributes = cls.attributes.map((a) => {
          if (a.relationId === relId && a.isPrimaryKey) {
            return {
              ...a,
              isForeignKey: false,
              referencedClassId: null,
              relationId: null,
            };
          }
          return a;
        });
        cls.attributes = compactClassAttributes(
          cls.attributes.filter((a) => a.relationId !== relId || a.isPrimaryKey)
        );
      }

      relations = relations.filter((r) => r.id !== relId);
    }
  }

  return {
    classes,
    relations,
  };
}

/**
 * Proyecta una lista ordenada de operaciones sobre el snapshot.
 */
export function projectDiagramOperations(
  snapshot: DiagramSnapshot,
  operations: DiagramOperation[]
): DiagramSnapshot {
  const sorted = [...operations].sort((a, b) => a.sequence - b.sequence);
  let current = snapshot;
  for (const op of sorted) {
    current = projectDiagramOperation(current, op);
  }
  return current;
}
