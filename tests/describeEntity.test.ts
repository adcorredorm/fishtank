import { test, expect } from 'vitest';
import { describeEntity } from '../src/render/describeEntity';
import { Fish } from '../src/agents/Fish';
import { Plant } from '../src/world/Plant';
import { Wall } from '../src/world/Wall';
import { Turtle } from '../src/world/Turtle';
import type { Genome, World, PlantConfig } from '../src/types';
import type { Grammar } from '../src/world/Grammar';

const stubGrammar = {
  axiom: 'F', rules: {},
  deriveStep: (s: string) => s,
  deriveAll: (n: number) => Array.from({ length: n + 1 }, (_, i) => 'F'.repeat(i + 1)),
} as unknown as Grammar;

function genome(over: Partial<Genome> = {}): Genome {
  return Object.assign({
    maxSpeed: 2, size: 5, color: '#fff', maxEnergy: 100, diet: [],
    vision: { range: 100, angle: Math.PI }, maxAge: 1000, baseCost: 0.1, moveCost: 0.2, eatGain: 1,
  } as Genome, over);
}
function plantCfg(): PlantConfig {
  return {
    count: 1, grammar: stubGrammar,
    turtle: new Turtle({ angle: 25, stepLength: 10, lengthRatio: 0.75 }),
    growthInterval: 3, maxGrowth: 3, energyPerLevel: 5, contactRadius: 4, color: '#0f0',
  };
}
function makeWorld(over: Partial<World> = {}): World {
  return Object.assign({
    width: 200, height: 200, food: [], plants: [], fish: [],
    walls: [new Wall('left'), new Wall('right'), new Wall('top'), new Wall('bottom')],
  } as World, over);
}

test('describe de un pez: estado, genoma y percepción navegable', () => {
  const me = new Fish(100, 100, 0, 100, genome({ vision: { range: 200, angle: 2 * Math.PI } }));
  const other = new Fish(120, 100, Math.PI / 2, 100, genome());
  const plant = new Plant({ x: 100, y: 60 }, plantCfg(), 2);
  const m = describeEntity(me, makeWorld({ fish: [me, other], plants: [plant] }));

  expect(m.kind).toBe('fish');
  expect(m.rows.some(r => r.label === 'energía')).toBe(true);
  expect(m.perceived).toBeDefined();
  const refs = m.perceived!.clickable.map(i => i.ref);
  expect(refs).toContain(other);
  expect(refs).toContain(plant);
  const fishItem = m.perceived!.clickable.find(i => i.ref === other)!;
  expect(fishItem.kind).toBe('fish');
  expect(typeof fishItem.heading).toBe('number'); // estrena PerceivedFish.heading
});

test('describe de una planta: nivel y crecimiento, sin sección de percepción', () => {
  const plant = new Plant({ x: 0, y: 0 }, plantCfg(), 2);
  const m = describeEntity(plant, makeWorld());
  expect(m.kind).toBe('plant');
  expect(m.rows.some(r => r.label === 'nivel')).toBe(true);
  expect(m.rows.some(r => r.label === 'crecimiento')).toBe(true);
  expect(m.perceived).toBeUndefined();
});
