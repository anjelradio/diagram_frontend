/**
 * Tipos de datos permitidos para un atributo en el diagrama.
 */
export type DiagramAttributeDataType =
  | 'UUID'
  | 'TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIMESTAMP';

/**
 * Entidad de dominio puro para un atributo de clase en el diagrama.
 */
export type DiagramAttribute = {
  id: string;
  classId?: string;
  name: string;
  dataType: DiagramAttributeDataType | null;
  position: number;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isForeignKey?: boolean;
  referencedClassId?: string | null;
  relationId?: string | null;
};
