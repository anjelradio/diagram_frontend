/**
 * Fixtures de prueba para clases, atributos, relaciones, claves foráneas y puentes.
 */

export const FIXTURE_PROJECT_ID = "11111111-1111-4111-8111-111111111111";
export const FIXTURE_VIEWER_ID = "viewer-user-123";

export const FIXTURE_SOURCE_CLASS_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const FIXTURE_TARGET_CLASS_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const FIXTURE_BRIDGE_CLASS_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

export const FIXTURE_RELATION_1N_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export const FIXTURE_RELATION_NM_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
export const FIXTURE_RELATION_GEN_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

export const fixtureSourceClass = {
  id: FIXTURE_SOURCE_CLASS_ID,
  projectId: FIXTURE_PROJECT_ID,
  name: "Usuario",
  positionX: 100,
  positionY: 100,
  attributes: [
    {
      id: "a1111111-1111-4111-8111-111111111111",
      classId: FIXTURE_SOURCE_CLASS_ID,
      name: "id",
      dataType: "UUID" as const,
      position: 0,
      isPrimaryKey: true,
      isNullable: false,
      isForeignKey: false,
      referencedClassId: null,
      relationId: null,
    },
    {
      id: "a2222222-2222-4222-8222-222222222222",
      classId: FIXTURE_SOURCE_CLASS_ID,
      name: "email",
      dataType: "TEXT" as const,
      position: 1,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: false,
      referencedClassId: null,
      relationId: null,
    },
  ],
};

export const fixtureTargetClass = {
  id: FIXTURE_TARGET_CLASS_ID,
  projectId: FIXTURE_PROJECT_ID,
  name: "Pedido",
  positionX: 500,
  positionY: 100,
  attributes: [
    {
      id: "b1111111-1111-4111-8111-111111111111",
      classId: FIXTURE_TARGET_CLASS_ID,
      name: "id",
      dataType: "UUID" as const,
      position: 0,
      isPrimaryKey: true,
      isNullable: false,
      isForeignKey: false,
      referencedClassId: null,
      relationId: null,
    },
    {
      id: "b2222222-2222-4222-8222-222222222222",
      classId: FIXTURE_TARGET_CLASS_ID,
      name: "total",
      dataType: "DECIMAL" as const,
      position: 1,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: false,
      referencedClassId: null,
      relationId: null,
    },
    {
      id: "b3333333-3333-4333-8333-333333333333",
      classId: FIXTURE_TARGET_CLASS_ID,
      name: "usuario_id",
      dataType: "UUID" as const,
      position: 2,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: true,
      referencedClassId: FIXTURE_SOURCE_CLASS_ID,
      relationId: FIXTURE_RELATION_1N_ID,
    },
  ],
};

export const fixtureBridgeClass = {
  id: FIXTURE_BRIDGE_CLASS_ID,
  projectId: FIXTURE_PROJECT_ID,
  name: "UsuarioPedido",
  positionX: 300,
  positionY: 280,
  attributes: [
    {
      id: "c1111111-1111-4111-8111-111111111111",
      classId: FIXTURE_BRIDGE_CLASS_ID,
      name: "id",
      dataType: "UUID" as const,
      position: 0,
      isPrimaryKey: true,
      isNullable: false,
      isForeignKey: false,
      referencedClassId: null,
      relationId: null,
    },
    {
      id: "c2222222-2222-4222-8222-222222222222",
      classId: FIXTURE_BRIDGE_CLASS_ID,
      name: "usuario_id",
      dataType: "UUID" as const,
      position: 1,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: true,
      referencedClassId: FIXTURE_SOURCE_CLASS_ID,
      relationId: FIXTURE_RELATION_NM_ID,
    },
    {
      id: "c3333333-3333-4333-8333-333333333333",
      classId: FIXTURE_BRIDGE_CLASS_ID,
      name: "pedido_id",
      dataType: "UUID" as const,
      position: 2,
      isPrimaryKey: false,
      isNullable: false,
      isForeignKey: true,
      referencedClassId: FIXTURE_TARGET_CLASS_ID,
      relationId: FIXTURE_RELATION_NM_ID,
    },
  ],
};

export const fixtureRelation1N = {
  id: FIXTURE_RELATION_1N_ID,
  name: "realiza",
  relationType: "ASSOCIATION" as const,
  source: {
    classId: FIXTURE_SOURCE_CLASS_ID,
    handle: "RIGHT_CENTER" as const,
    cardinality: "1" as const,
  },
  target: {
    classId: FIXTURE_TARGET_CLASS_ID,
    handle: "LEFT_CENTER" as const,
    cardinality: "0..*" as const,
  },
  bridge: null,
};

export const fixtureRelationNM = {
  id: FIXTURE_RELATION_NM_ID,
  name: "",
  relationType: "ASSOCIATION" as const,
  source: {
    classId: FIXTURE_SOURCE_CLASS_ID,
    handle: "BOTTOM_CENTER" as const,
    cardinality: "0..*" as const,
  },
  target: {
    classId: FIXTURE_TARGET_CLASS_ID,
    handle: "BOTTOM_CENTER" as const,
    cardinality: "1..*" as const,
  },
  bridge: {
    classId: FIXTURE_BRIDGE_CLASS_ID,
    handle: "TOP_CENTER" as const,
  },
};

export const fixtureRelationGeneralization = {
  id: FIXTURE_RELATION_GEN_ID,
  name: "es_un",
  relationType: "GENERALIZATION" as const,
  source: {
    classId: FIXTURE_TARGET_CLASS_ID,
    handle: "TOP_CENTER" as const,
    cardinality: null,
  },
  target: {
    classId: FIXTURE_SOURCE_CLASS_ID,
    handle: "BOTTOM_CENTER" as const,
    cardinality: null,
  },
  bridge: null,
};
