import { random } from '../utilities/rng';
import type { Genome } from '../types';

/** Claves numéricas del genoma (las que el GA muta). Excluye color y diet (no numéricos). */
export type GeneKey =
  | 'maxSpeed' | 'size' | 'maxEnergy' | 'visionRange' | 'visionAngle'
  | 'maxAge' | 'baseCost' | 'moveCost' | 'eatGain'
  | 'reproductionCost' | 'reproductionEfficiency';

/** Gen numérico: su clave en el genoma plano y su rango físico válido. */
export interface GeneSpec { key: GeneKey; min: number; max: number; }

// Orden FIJO de los genes numéricos y su rango físico válido.
export const GENE_SCHEMA: GeneSpec[] = [
  { key: 'maxSpeed',               min: 0,   max: 6 },
  { key: 'size',                   min: 2,   max: 20 },
  { key: 'maxEnergy',              min: 20,  max: 300 },
  { key: 'visionRange',            min: 20,  max: 300 },
  { key: 'visionAngle',            min: 0,   max: 2 * Math.PI },
  { key: 'maxAge',                 min: 100, max: 5000 },
  { key: 'baseCost',               min: 0,   max: 1 },
  { key: 'moveCost',               min: 0,   max: 1 },
  { key: 'eatGain',                min: 0,   max: 2 },
  { key: 'reproductionCost',       min: 0,   max: 100 },
  { key: 'reproductionEfficiency', min: 0,   max: 1 },
];

const clampNormalized = (v: number): number => Math.max(0, Math.min(1, v));

/** Aplana el genoma a un vector normalizado [0,1], en el orden de GENE_SCHEMA. */
export function flatten(genome: Genome): number[] {
  return GENE_SCHEMA.map(s => (genome[s.key] - s.min) / (s.max - s.min));
}

/**
 * Reconstruye un Genome desde un vector normalizado: clampea cada componente a [0,1], la
 * desnormaliza a su rango y la escribe. color/diet se copian de `ref` (constantes de especie).
 */
export function unflatten(vector: number[], ref: Genome): Genome {
  const g = { color: ref.color, diet: [...ref.diet] } as Genome;
  GENE_SCHEMA.forEach((s, i) => {
    g[s.key] = s.min + clampNormalized(vector[i]) * (s.max - s.min);
  });
  return g;
}

/* Copia profunda de un genoma.*/
export function cloneGenome(g: Genome): Genome {
  return { ...g, diet: [...g.diet] };
}

/** Genoma aleatorio: cada gen uniforme en [0,1] (RNG sembrado), desnormalizado; color/diet de `ref`. */
export function randomGenome(ref: Genome): Genome {
  return unflatten(GENE_SCHEMA.map(() => random()), ref);
}
