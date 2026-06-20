import { test, expect } from 'vitest';
import { fitTransform, screenToWorld } from '../src/render/transform';

test('fitTransform escala y centra (canvas cuadrado, sin letterbox)', () => {
  const t = fitTransform(200, 200, 100, 100); // canvas 200, mundo 100 → escala 2, sin offset
  expect(t.scale).toBeCloseTo(2);
  expect(t.offsetX).toBeCloseTo(0);
  expect(t.offsetY).toBeCloseTo(0);
});

test('fitTransform aplica letterbox cuando las proporciones no coinciden', () => {
  const t = fitTransform(200, 100, 100, 100); // limita por alto → escala 1, franjas a los lados
  expect(t.scale).toBeCloseTo(1);
  expect(t.offsetX).toBeCloseTo(50);
  expect(t.offsetY).toBeCloseTo(0);
});

test('screenToWorld invierte la transformación', () => {
  const t = fitTransform(200, 100, 100, 100); // escala 1, offsetX 50
  expect(screenToWorld(150, 50, t)).toEqual({ x: 100, y: 50 });
  expect(screenToWorld(50, 0, t)).toEqual({ x: 0, y: 0 });
});
