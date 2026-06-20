import type { Fish } from './agents/Fish';
import type { Food } from './world/Food';
import type { Plant } from './world/Plant';
import type { Wall } from './world/Wall';
import type { Grammar } from './world/Grammar';
import type { Turtle } from './world/Turtle';

export interface Vec { x: number; y: number; }

/** Un segmento dibujable (par de puntos). Lo produce la `Turtle` y lo dibuja el `Renderer`. */
export interface Segment { x0: number; y0: number; x1: number; y1: number; }

/** Constructor de una clase de entidad (comestible o pez); se usa para `diet` + `instanceof`. */
export type EntityClass = abstract new (...args: any[]) => object;

/** Una opción de reemplazo de una regla de L-system. */
export type Rule = { p: number; successor: string };
/** Reglas de una gramática: símbolo → opciones. Las `p` de cada array suman 1. */
export type Rules = Record<string, Rule[]>;

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

/** Un pez visto por otro: además de dir/dist, su rumbo RELATIVO al observador. */
export interface PerceivedFish extends Perceived<Fish> {
  /** Rumbo del otro pez relativo al mío, normalizado a (−π, π]. 0 = miramos igual. */
  heading: number;
}

/** Lo que percibe un pez en un tick — es el argumento que recibe `act(inputs)`. */
export interface Inputs {
  /** Energía propia normalizada a 0..1 (1 = `genome.maxEnergy`). */
  energy: number;
  /** Lo visible dentro del cono, agrupado por tipo. Cualquier lista puede venir vacía. */
  seen: {
    food: Perceived<Food>[];
    plants: Perceived<Plant>[];
    fish: PerceivedFish[];
    walls: Perceived<Wall>[];
  };
}

/** Lo que `sense()`/`#apply()` necesitan del mundo. El `Tank` implementa esta interfaz. */
export interface World {
  width: number; height: number;
  food: Food[]; plants: Plant[]; fish: Fish[]; walls: Wall[];
}

export interface SpeciesSpec { type: new (...a: any[]) => Fish; count: number; genome: Genome; }
export interface Scenario {
  name: string; seed: number;
  tank: { width: number; height: number };
  food: { rate: number; value: number; max: number };
  plants: PlantConfig;
  species: SpeciesSpec[];
}

/** Algo que un pez puede percibir y comer: comida, planta o presa. */
export interface Consumable {
  /**
   * Punto del cuerpo más cercano a `from` (el observador). En entidades puntuales (comida,
   * pez) es su posición; en entidades extensas (planta) es la parte que se tiene más cerca.
   * Se usa tanto para percibir como para el contacto al comer.
   */
  contactPoint(from: Vec): Vec;
  /** Radio de contacto para considerar que lo alcanzó. */
  readonly contactRadius: number;
  /**
   * Lo consume y devuelve la energía ganada (0 si ya no quedaba). La entidad maneja su propio
   * estado: comida/pez se marcan como comidos (reclamación única); la planta se muerde. El
   * mundo retira luego lo consumido en su `step()`.
   */
  tryConsume(): number;
}

/** Configuración de las plantas de un escenario. */
export interface PlantConfig {
  count: number;
  /** Gramática del L-system (símbolos → símbolos): produce el "plan de crecimiento". */
  grammar: Grammar;
  /** Tortuga (símbolos → geometría): convierte cada nivel en segmentos dibujables. */
  turtle: Turtle;
  /** Ticks que tarda en subir un nivel (política de crecimiento por defecto). */
  growthInterval: number;
  /** Nivel máximo de derivación por planta. */
  maxGrowth: number;
  energyPerLevel: number;
  contactRadius: number;
  color: string;
}
