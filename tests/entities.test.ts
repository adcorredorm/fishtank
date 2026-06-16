import { test, expect } from 'vitest';
import { Food } from '../src/world/Food';
import { Wall } from '../src/world/Wall';

test('Food guarda posición y energía', () => {
  const f = new Food(10, 20, 8);
  expect(f.pos).toEqual({ x: 10, y: 20 });
  expect(f.energy).toBe(8);
  expect(f.size).toBeGreaterThan(0);
});

test('Wall.nearestPoint proyecta sobre el lado correcto', () => {
  const world = { width: 100, height: 50 } as any;
  expect(new Wall('left').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 0, y: 25 });
  expect(new Wall('right').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 100, y: 25 });
  expect(new Wall('top').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 30, y: 0 });
  expect(new Wall('bottom').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 30, y: 50 });
});

test('Food es Consumable: contactPoint/contactRadius y tryConsume marca eaten y rinde su energía', () => {
  const f = new Food(10, 20, 8);
  expect(f.contactPoint({ x: 0, y: 0 })).toEqual({ x: 10, y: 20 }); // puntual: ignora el observador
  expect(f.contactRadius).toBe(f.size);
  expect(f.eaten).toBe(false);
  expect(f.tryConsume()).toBe(8);
  expect(f.eaten).toBe(true);
});

test('Food.tryConsume rinde 0 la segunda vez (reclamación única)', () => {
  const f = new Food(0, 0, 8);
  expect(f.tryConsume()).toBe(8);
  expect(f.tryConsume()).toBe(0);
});
