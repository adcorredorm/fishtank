import { test, expect } from 'vitest';
import { Turtle } from '../src/world/Turtle';

const T = new Turtle({ angle: 90, stepLength: 10, lengthRatio: 0.75 });

test('un símbolo dibuja un segmento vertical hacia arriba', () => {
  const segments = T.interpret('F');
  expect(segments.length).toBe(1);
  expect(segments[0].x0).toBeCloseTo(0);
  expect(segments[0].y0).toBeCloseTo(0);
  expect(segments[0].x1).toBeCloseTo(0);
  expect(segments[0].y1).toBeCloseTo(-10);  // "arriba" es y menor (canvas y-abajo)
});

test('+ y - giran el rumbo por el ángulo', () => {
  const segments = T.interpret('F+F');  // el segundo tramo gira 90° hacia -x
  expect(segments.length).toBe(2);
  expect(segments[1].x1).toBeCloseTo(-10);
  expect(segments[1].y1).toBeCloseTo(-10);
});

test('[ y ] apilan y restauran el estado (la rama no mueve el tronco)', () => {
  const segments = T.interpret('F[+F]F');
  expect(segments.length).toBe(3);
  expect(segments[2].x0).toBeCloseTo(0);    // tras cerrar la rama, vuelve a (0,-10)
  expect(segments[2].y0).toBeCloseTo(-10);
  expect(segments[2].y1).toBeCloseTo(-20);
});
