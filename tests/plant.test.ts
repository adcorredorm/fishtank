import { test, expect } from 'vitest';
import { Plant } from '../src/world/Plant';
import { Turtle } from '../src/world/Turtle';
import type { PlantConfig } from '../src/types';
import type { Grammar } from '../src/world/Grammar';

// Gramática de prueba: un deriveAll funcional pero deliberadamente FALSO (no es la solución
// real del ejercicio), solo para probar Plant aislada de la derivación. deriveAll(3) →
// ['F','FF','FFF','FFFF'] (cada nivel un segmento vertical más alto).
const stubGrammar = {
  axiom: 'F',
  rules: {},
  deriveStep: (s: string) => s,
  deriveAll: (n: number) => Array.from({ length: n + 1 }, (_, i) => 'F'.repeat(i + 1)),
} as unknown as Grammar;

function cfg(over: Partial<PlantConfig> = {}): PlantConfig {
  return Object.assign({
    count: 1,
    grammar: stubGrammar,
    turtle: new Turtle({ angle: 25, stepLength: 10, lengthRatio: 0.75 }),
    growthInterval: 3, maxGrowth: 3, energyPerLevel: 5,
    contactRadius: 4, color: '#0f0',
  } as PlantConfig, over);
}

test('[ANDAMIAJE] se ancla en la base dada', () => {
  const p = new Plant({ x: 50, y: 200 }, cfg(), 0);
  expect(p.base).toEqual({ x: 50, y: 200 });
});

test('[ANDAMIAJE] bite en nivel 0 devuelve 0 y no baja', () => {
  const p = new Plant({ x: 0, y: 0 }, cfg(), 0);
  expect(p.bite()).toBe(0);
  expect(p.level).toBe(0);
});

test('[ANDAMIAJE] contactPoint es el vértice más cercano al observador (en mundo)', () => {
  const p = new Plant({ x: 50, y: 200 }, cfg(), 0);   // nivel 0 = "F": base (50,200) → punta (50,190)
  const desdeArriba = p.contactPoint({ x: 50, y: 0 });   // observador arriba → la punta es lo más cercano
  expect(desdeArriba.x).toBeCloseTo(50);
  expect(desdeArriba.y).toBeCloseTo(190);
  const desdeAbajo = p.contactPoint({ x: 50, y: 400 });  // observador abajo → la base es lo más cercano
  expect(desdeAbajo.x).toBeCloseTo(50);
  expect(desdeAbajo.y).toBeCloseTo(200);
});

test('[ANDAMIAJE] el nivel inicial se acota al tope', () => {
  const p = new Plant({ x: 0, y: 0 }, cfg({ maxGrowth: 3 }), 99);
  expect(p.level).toBe(3);
});

test('[ANDAMIAJE] energy = energyPerLevel * level', () => {
  const p = new Plant({ x: 0, y: 0 }, cfg(), 2);
  expect(p.energy).toBe(10);
});

test('[ANDAMIAJE] grow sube un nivel cada growthInterval ticks, sin pasar del tope', () => {
  const p = new Plant({ x: 0, y: 0 }, cfg({ growthInterval: 2, maxGrowth: 2 }), 0);
  p.grow(); expect(p.level).toBe(0);
  p.grow(); expect(p.level).toBe(1);
  p.grow(); p.grow(); expect(p.level).toBe(2);
  p.grow(); p.grow(); expect(p.level).toBe(2);   // tope
});

test('[ANDAMIAJE] bite baja un nivel y rinde energyPerLevel; tryConsume delega en bite', () => {
  const p = new Plant({ x: 0, y: 0 }, cfg(), 3);
  expect(p.tryConsume()).toBe(5);
  expect(p.level).toBe(2);
});

test('[ANDAMIAJE] crece más alto al subir de nivel (la punta sube = menor y)', () => {
  const arriba = { x: 0, y: -10000 };   // observador muy por encima → su vértice más cercano es el más alto
  const p1 = new Plant({ x: 0, y: 200 }, cfg(), 1);
  const p3 = new Plant({ x: 0, y: 200 }, cfg(), 3);
  expect(p3.contactPoint(arriba).y).toBeLessThan(p1.contactPoint(arriba).y);
});
