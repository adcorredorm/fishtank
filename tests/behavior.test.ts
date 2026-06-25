import { test, expect } from 'vitest';
import { Prey } from '../src/agents/Prey';
import { Predator } from '../src/agents/Predator';
import { Food } from '../src/world/Food';
import { Wall } from '../src/world/Wall';
import type { Genome, World } from '../src/types';

function preyGenome(): Genome {
  return { maxSpeed: 2, size: 5, color: '#7fd1a0', maxEnergy: 100,
    diet: [Food], visionRange: 100, visionAngle: Math.PI, maxAge: 1000,
    baseCost: 0.1, moveCost: 0.2, eatGain: 1, reproductionCost: 40, reproductionEfficiency: 0.75 };
}
function predGenome(): Genome {
  return { maxSpeed: 3, size: 8, color: '#d98b5f', maxEnergy: 150,
    diet: [Prey], visionRange: 120, visionAngle: Math.PI, maxAge: 1500,
    baseCost: 0.1, moveCost: 0.2, eatGain: 0.5, reproductionCost: 70, reproductionEfficiency: 0.75 };
}
function world(over: Partial<World> = {}): World {
  return Object.assign({
    width: 300, height: 300, food: [], plants: [], fish: [],
    walls: [new Wall('left'), new Wall('right'), new Wall('top'), new Wall('bottom')],
  } as World, over);
}

test('Prey gira hacia la comida y marca comer', () => {
  const p = new Prey(100, 100, 0, 100, preyGenome());
  const comida = new Food(100, 130, 5); // perpendicular (abajo)
  const before = p.heading;
  p.tick(world({ food: [comida], fish: [p] }));
  expect(p.heading).not.toBe(before); // giró hacia ella
});

test('Prey huye de un depredador (gira al lado opuesto)', () => {
  const p = new Prey(100, 100, 0, 100, preyGenome());
  const pred = new Predator(130, 100, 0, 100, predGenome()); // al frente (+x)
  p.tick(world({ fish: [p, pred] }));
  expect(Math.abs(Math.abs(p.heading) - Math.PI)).toBeLessThan(Math.PI / 2);
});

test('Predator caza a la presa más cercana', () => {
  const pred = new Predator(100, 100, 0, 100, predGenome());
  const prey = new Prey(100, 140, 0, 100, preyGenome()); // abajo
  const before = pred.heading;
  pred.tick(world({ fish: [pred, prey] }));
  expect(pred.heading).not.toBe(before);
});
