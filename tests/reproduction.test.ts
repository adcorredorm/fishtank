import { test, expect } from 'vitest';
import { Tank } from '../src/world/Tank';
import { Fish } from '../src/agents/Fish';
import { Food } from '../src/world/Food';
import { Turtle } from '../src/world/Turtle';
import { cloneGenome } from '../src/agents/genome';
import type { Scenario, Genome } from '../src/types';
import type { Grammar } from '../src/world/Grammar';

// Subclase de prueba: SIEMPRE quiere reproducirse y clona al cruzar (determinista).
class Eager extends Fish {
  act(): void { this.reproduce(); }
  breed(_mate: Fish): Genome { return cloneGenome(this.genome); }
}
// Otra "especie" para el test de distinta-especie.
class EagerB extends Fish {
  act(): void { this.reproduce(); }
  breed(_mate: Fish): Genome { return cloneGenome(this.genome); }
}
// No quiere reproducirse (para el test de voluntad de uno solo).
class Calm extends Fish {
  act(): void {}
  breed(_mate: Fish): Genome { return cloneGenome(this.genome); }
}

const stubGrammar = {
  axiom: 'F', rules: {},
  deriveStep: (s: string) => s,
  deriveAll: (n: number) => Array.from({ length: n + 1 }, (_, i) => 'F'.repeat(i + 1)),
} as unknown as Grammar;

function genome(over: Partial<Genome> = {}): Genome {
  return Object.assign({
    maxSpeed: 0, size: 10, color: '#fff', maxEnergy: 100,
    diet: [Food], visionRange: 100, visionAngle: Math.PI,
    maxAge: 100000, baseCost: 0, moveCost: 0, eatGain: 1,
    reproductionCost: 40, reproductionEfficiency: 0.5,
  } as Genome, over);
}

// Escenario sin especies ni plantas: poblamos t.fish a mano en cada test.
function emptyScenario(): Scenario {
  return {
    name: 'test', seed: 1,
    tank: { width: 500, height: 500 },
    food: { rate: 0, value: 0, max: 0 },
    plants: {
      count: 0, grammar: stubGrammar, turtle: new Turtle({ angle: 25, stepLength: 10, lengthRatio: 0.75 }),
      growthInterval: 1, maxGrowth: 1, energyPerLevel: 1, contactRadius: 1, color: '#0f0',
    },
    species: [],
  };
}

test('par válido (dispuestos, misma especie, en contacto, solventes) → nace 1 cría', () => {
  const t = new Tank(emptyScenario());
  t.fish = [new Eager(100, 100, 0, 100, genome()), new Eager(105, 100, 0, 100, genome())];
  t.step();
  expect(t.fish.length).toBe(3); // 2 padres + 1 cría
});

test('la cría nace con effA·costA + effB·costB y cada padre paga su costo', () => {
  const t = new Tank(emptyScenario());
  const a = new Eager(100, 100, 0, 100, genome({ reproductionCost: 40, reproductionEfficiency: 0.5 }));
  const b = new Eager(105, 100, 0, 100, genome({ reproductionCost: 60, reproductionEfficiency: 0.5 }));
  t.fish = [a, b];
  t.step();
  expect(a.energy).toBe(60);  // 100 - 40
  expect(b.energy).toBe(40);  // 100 - 60
  const child = t.fish.find(f => f !== a && f !== b)!;
  expect(child.energy).toBeCloseTo(40 * 0.5 + 60 * 0.5, 9); // 50
});

test('sin energía para pagar el costo, no hay cría aunque haya voluntad', () => {
  const t = new Tank(emptyScenario());
  t.fish = [new Eager(100, 100, 0, 30, genome({ reproductionCost: 40 })),
            new Eager(105, 100, 0, 30, genome({ reproductionCost: 40 }))];
  t.step();
  expect(t.fish.length).toBe(2); // no nació nadie
});

test('un pez no se reproduce dos veces en el mismo tick', () => {
  const t = new Tank(emptyScenario());
  t.fish = [new Eager(100, 100, 0, 100, genome()),
            new Eager(104, 100, 0, 100, genome()),
            new Eager(108, 100, 0, 100, genome())];
  t.step();
  expect(t.fish.length).toBe(4); // 3 padres + 1 cría (el tercero queda sin pareja este tick)
});

test('tras reproducirse, el flag de voluntad queda en false', () => {
  const t = new Tank(emptyScenario());
  const a = new Eager(100, 100, 0, 100, genome());
  const b = new Eager(105, 100, 0, 100, genome());
  t.fish = [a, b];
  t.step();
  expect(a.wantsToReproduce).toBe(false);
  expect(b.wantsToReproduce).toBe(false);
});

test('distinta especie no se cruza', () => {
  const t = new Tank(emptyScenario());
  t.fish = [new Eager(100, 100, 0, 100, genome()), new EagerB(105, 100, 0, 100, genome())];
  t.step();
  expect(t.fish.length).toBe(2);
});

test('sin contacto (lejos) no se cruza', () => {
  const t = new Tank(emptyScenario());
  t.fish = [new Eager(100, 100, 0, 100, genome()), new Eager(400, 100, 0, 100, genome())];
  t.step();
  expect(t.fish.length).toBe(2);
});

test('si solo uno está dispuesto, no hay cría', () => {
  const t = new Tank(emptyScenario());
  t.fish = [new Eager(100, 100, 0, 100, genome()), new Calm(105, 100, 0, 100, genome())];
  t.step();
  expect(t.fish.length).toBe(2);
});
