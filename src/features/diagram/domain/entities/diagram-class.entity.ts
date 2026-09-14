import type { DiagramAttribute } from './diagram-attribute.entity';
import type { DiagramRelation } from './diagram-relation.entity';

/**
 * Entidades del dominio de Diagrama para clases en el lienzo.
 */

export type DiagramClass = {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
};

export type DiagramClassWithAttributes = DiagramClass & {
  attributes: DiagramAttribute[];
};

export type DiagramSnapshot = {
  classes: DiagramClassWithAttributes[];
  relations: DiagramRelation[];
};
