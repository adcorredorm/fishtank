import { test, expect } from 'vitest';
import { pickEntity } from '../src/render/pickEntity';
import { Fish } from '../src/agents/Fish';
import { Plant } from '../src/world/Plant';
import { Turtle } from '../src/world/Turtle';
import type { Genome, PlantConfig } from '../src/types';
import type { Grammar } from '../src/world/Grammar';

// Gramática stub (deriveAll falso, no la solución del ejercicio) para probar sin la derivación.
const stubGrammar = {
  axiom: 'F', rules: {},
  deriveStep: (s: string) => s,
  deriveAll: (n: number) => Array.from({ length: n + 1 }, (_, i) => 'F'.repeat(i + 1)),
} as unknown as Grammar;

function genome(): Genome {
  return {
    maxSpeed: 2, size: 5, color: '#fff', maxEnergy: 100, diet: [],
    vision: { range: 100, angle: Math.PI }, maxAge: 1000, baseCost: 0.1, moveCost: 0.2, eatGain: 1,
  };
}
function plantCfg(): PlantConfig {
  return {
    count: 1, grammar: stubGrammar,
    turtle: new Turtle({ angle: 25, stepLength: 10, lengthRatio: 0.75 }),
    growthInterval: 1, maxGrowth: 3, energyPerLevel: 5, contactRadius: 4, color: '#0f0',
  };
}

test('clic sobre un pez lo selecciona', () => {
  const f = new Fish(100, 100, 0, 100, genome());
  expect(pickEntity({ x: 102, y: 101 }, { fish: [f], plants: [] }, 2)).toBe(f);
});

test('pez y planta solapados: gana el pez (prioridad por tipo)', () => {
  const f = new Fish(100, 100, 0, 100, genome());
  const p = new Plant({ x: 100, y: 100 }, plantCfg(), 2);
  expect(pickEntity({ x: 100, y: 100 }, { fish: [f], plants: [p] }, 2)).toBe(f);
});

test('clic en vacío devuelve null', () => {
  const f = new Fish(0, 0, 0, 100, genome());
  expect(pickEntity({ x: 500, y: 500 }, { fish: [f], plants: [] }, 2)).toBeNull();
});

test('clic fuera del umbral de una planta devuelve null', () => {
  const p = new Plant({ x: 100, y: 200 }, plantCfg(), 0); // base (100,200)
  expect(pickEntity({ x: 200, y: 200 }, { fish: [], plants: [p] }, 2)).toBeNull();
});
