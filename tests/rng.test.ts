import { test, expect } from 'vitest';
import { seedRandom, random, randomRange, randomInt, pick } from '../src/utilities/rng';

test('random es determinista por semilla', () => {
  seedRandom(42); const a = random();
  seedRandom(42); const b = random();
  expect(a).toBe(b);
});

test('random avanza la secuencia', () => {
  seedRandom(42); const a = random(); const b = random();
  expect(a).not.toBe(b);
  expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThan(1);
});

test('randomRange dentro de rango y pick devuelve un elemento', () => {
  seedRandom(1);
  const r = randomRange(10, 20); expect(r).toBeGreaterThanOrEqual(10); expect(r).toBeLessThan(20);
  expect([1,2,3]).toContain(pick([1,2,3]));
});

test('randomInt da enteros dentro de [min, max] (ambos incluidos)', () => {
  seedRandom(7);
  const vistos = new Set<number>();
  for (let i = 0; i < 500; i++) {
    const n = randomInt(1, 6);
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(6);
    vistos.add(n);
  }
  // con 500 tiradas deberían salir los dos extremos (1 y 6), confirmando que son inclusivos
  expect(vistos.has(1)).toBe(true);
  expect(vistos.has(6)).toBe(true);
});
