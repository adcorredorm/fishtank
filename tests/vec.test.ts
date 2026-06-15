import { test, expect } from 'vitest';
import { dist, normalizeAngle, relativeBearing, nearest } from '../src/utilities/vec';

test('dist 3-4-5', () => { expect(dist({x:0,y:0},{x:3,y:4})).toBe(5); });

test('normalizeAngle a (-π, π]', () => {
  expect(Math.abs(normalizeAngle(3*Math.PI) - Math.PI)).toBeLessThan(1e-9);
  expect(Math.abs(normalizeAngle(-3*Math.PI) - Math.PI)).toBeLessThan(1e-9);
});

test('relativeBearing al frente da 0', () => {
  expect(Math.abs(relativeBearing({x:0,y:0},0,{x:10,y:0}))).toBeLessThan(1e-9);
});

test('relativeBearing perpendicular da ±π/2', () => {
  expect(Math.abs(Math.abs(relativeBearing({x:0,y:0},0,{x:0,y:10})) - Math.PI/2)).toBeLessThan(1e-9);
});

test('nearest devuelve el de menor dist o null', () => {
  expect(nearest([])).toBe(null);
  const b = { dist: 2 };
  expect(nearest([{dist:5}, b, {dist:9}])).toBe(b);
});
