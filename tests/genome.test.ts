import { test, expect } from 'vitest';
import { Food } from '../src/world/Food';
import { seedRandom } from '../src/utilities/rng';
import { GENE_SCHEMA, flatten, unflatten, cloneGenome, randomGenome } from '../src/agents/genome';
import type { Genome } from '../src/types';

function makeGenome(over: Partial<Genome> = {}): Genome {
  return Object.assign({
    maxSpeed: 2, size: 5, color: '#fff', maxEnergy: 100,
    diet: [Food], visionRange: 100, visionAngle: Math.PI,
    maxAge: 1000, baseCost: 0.1, moveCost: 0.2, eatGain: 1,
    reproductionCost: 40, reproductionEfficiency: 0.75,
  } as Genome, over);
}

test('flatten normaliza cada gen a [0,1] usando min/max del esquema', () => {
  const g = makeGenome();
  const v = flatten(g);
  expect(v.length).toBe(GENE_SCHEMA.length);
  for (const x of v) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(1); }
  const spec = GENE_SCHEMA.find(s => s.key === 'maxSpeed')!;
  const i = GENE_SCHEMA.indexOf(spec);
  expect(flatten(makeGenome({ maxSpeed: spec.min }))[i]).toBeCloseTo(0, 9);
  expect(flatten(makeGenome({ maxSpeed: spec.max }))[i]).toBeCloseTo(1, 9);
  expect(flatten(makeGenome({ maxSpeed: (spec.min + spec.max) / 2 }))[i]).toBeCloseTo(0.5, 9);
});

test('flatten/unflatten es round-trip para los numéricos y preserva color/diet', () => {
  const g = makeGenome({ size: 7, visionRange: 123, visionAngle: 1.1 });
  const back = unflatten(flatten(g), g);
  for (const s of GENE_SCHEMA) expect(back[s.key]).toBeCloseTo(g[s.key], 6);
  expect(back.color).toBe(g.color);
  expect(back.diet).toEqual(g.diet);
});

test('unflatten clampea valores fuera de [0,1] al rango [min,max] del gen', () => {
  const g = makeGenome();
  const over = GENE_SCHEMA.map(() => 2);
  const under = GENE_SCHEMA.map(() => -1);
  const hi = unflatten(over, g);
  const lo = unflatten(under, g);
  for (const s of GENE_SCHEMA) {
    expect(hi[s.key]).toBeCloseTo(s.max, 6);
    expect(lo[s.key]).toBeCloseTo(s.min, 6);
  }
});

test('cloneGenome independiza la instancia (mutar el clon no toca el original)', () => {
  const g = makeGenome();
  const c = cloneGenome(g);
  c.size = 999; c.visionRange = 999;
  expect(g.size).toBe(5);
  expect(g.visionRange).toBe(100);
});

test('randomGenome produce genes dentro de [min,max] y conserva color/diet del ref', () => {
  seedRandom(123);
  const ref = makeGenome();
  const r = randomGenome(ref);
  for (const s of GENE_SCHEMA) {
    expect(r[s.key]).toBeGreaterThanOrEqual(s.min - 1e-9);
    expect(r[s.key]).toBeLessThanOrEqual(s.max + 1e-9);
  }
  expect(r.color).toBe(ref.color);
  expect(r.diet).toEqual(ref.diet);
});
