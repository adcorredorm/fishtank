import { test, expect } from 'vitest';
import { Food } from '../src/world/Food';
import { Wall } from '../src/world/Wall';

test('Food guarda posición y valor', () => {
  const f = new Food(10, 20, 8);
  expect(f.pos).toEqual({ x: 10, y: 20 });
  expect(f.value).toBe(8);
  expect(f.size).toBeGreaterThan(0);
});

test('Wall.nearestPoint proyecta sobre el lado correcto', () => {
  const world = { width: 100, height: 50 } as any;
  expect(new Wall('left').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 0, y: 25 });
  expect(new Wall('right').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 100, y: 25 });
  expect(new Wall('top').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 30, y: 0 });
  expect(new Wall('bottom').nearestPoint({ x: 30, y: 25 }, world)).toEqual({ x: 30, y: 50 });
});
