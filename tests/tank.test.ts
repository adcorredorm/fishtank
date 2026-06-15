import { test, expect } from 'vitest';
import { Tank } from '../src/world/Tank';
import { scenarios } from '../src/world/config';

const scn = scenarios[0];

function snapshot(steps: number) {
  const t = new Tank(scn);            // el ctor re-siembra desde scn.seed
  for (let i = 0; i < steps; i++) t.step();
  return t.fish.map(f => ({ x: f.x, y: f.y }));
}

test('construye población inicial y 4 paredes', () => {
  const t = new Tank(scn);
  expect(t.fish.length).toBe(40 + 6);
  expect(t.walls.length).toBe(4);
  expect(t.tickCount).toBe(0);
});

test('step avanza el reloj y mantiene los peces dentro del tanque', () => {
  const t = new Tank(scn);
  for (let i = 0; i < 50; i++) t.step();
  expect(t.tickCount).toBe(50);
  for (const f of t.fish) {
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.x).toBeLessThanOrEqual(t.width);
    expect(f.y).toBeGreaterThanOrEqual(0);
    expect(f.y).toBeLessThanOrEqual(t.height);
  }
});

test('DETERMINISMO: misma semilla + misma config = misma corrida (secuencial)', () => {
  const a = snapshot(100);
  const b = snapshot(100);            // re-construir vuelve a sembrar → idéntico
  expect(b.length).toBe(a.length);
  for (let i = 0; i < a.length; i++) {
    expect(Math.abs(a[i].x - b[i].x)).toBeLessThan(1e-9);
    expect(Math.abs(a[i].y - b[i].y)).toBeLessThan(1e-9);
  }
});

test('population() reporta tick y conteos por especie (sin comida)', () => {
  const t = new Tank(scn);
  const p = t.population();
  expect(p.tick).toBe(0);
  expect(p.fish.Prey).toBe(40);
  expect(p.fish.Predator).toBe(6);
  expect((p as any).food).toBeUndefined(); // la comida ya no se reporta en el HUD
});

test('una especie extinta sigue apareciendo como 0', () => {
  const t = new Tank(scn);
  t.fish = t.fish.filter(f => f.constructor.name !== 'Predator'); // extinguir depredadores
  const p = t.population();
  expect(p.fish.Predator).toBe(0);
  expect(p.fish.Prey).toBe(40);
});

test('la comida no supera el tope configurado (food.max)', () => {
  const t = new Tank(scn);
  for (let i = 0; i < 2000; i++) t.step();
  expect(t.food.length).toBeLessThanOrEqual(scn.food.max);
});
