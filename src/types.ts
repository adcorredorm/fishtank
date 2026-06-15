import type { Fish } from './agents/Fish';
import type { Food } from './world/Food';
import type { Wall } from './world/Wall';

export interface Vec { x: number; y: number; }

/** Constructor de una clase de entidad (comestible o pez); se usa para `diet` + `instanceof`. */
export type EntityClass = abstract new (...args: any[]) => object;

export interface Genome {
  maxSpeed: number; size: number; color: string; maxEnergy: number;
  /** Clases que esta especie puede comer, p. ej. [Food] o [Prey]. `canEat` usa instanceof. */
  diet: EntityClass[];
  vision: { range: number; angle: number };
  maxAge: number;
  baseCost: number; moveCost: number; eatGain: number;
}

/** Una entidad vista por el pez dentro de su cono de visión. */
export interface Perceived<T> {
  /** Dirección RELATIVA al rumbo del pez, en radianes: 0 = al frente; el signo indica el lado. */
  dir: number;
  /** Distancia a la entidad, en unidades de mundo. */
  dist: number;
  /** La instancia real percibida (para inspeccionarla: `ref.genome`, `ref.canEat(...)`, etc.). */
  ref: T;
}

/** Lo que percibe un pez en un tick — es el argumento que recibe `act(inputs)`. */
export interface Inputs {
  /** Energía propia normalizada a 0..1 (1 = `genome.maxEnergy`). */
  energy: number;
  /** Lo visible dentro del cono, agrupado por tipo. Cualquier lista puede venir vacía. */
  seen: {
    food: Perceived<Food>[];
    fish: Perceived<Fish>[];
    walls: Perceived<Wall>[];
  };
}

/** Lo que `sense()`/`#apply()` necesitan del mundo. El `Tank` implementa esta interfaz. */
export interface World {
  width: number; height: number;
  food: Food[]; fish: Fish[]; walls: Wall[];
  remove(entity: object): boolean;
}

export interface SpeciesSpec { type: new (...a: any[]) => Fish; count: number; genome: Genome; }
export interface Scenario {
  name: string; seed: number;
  tank: { width: number; height: number };
  food: { rate: number; value: number; max: number };
  species: SpeciesSpec[];
}
