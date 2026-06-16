import { test, expect } from 'vitest';
import { seedRandom } from '../src/utilities/rng';
import { Grammar } from '../src/world/Grammar';

test('[EJERCICIO] deriveStep copia los símbolos sin regla (identidad)', () => {
  expect(new Grammar({ axiom: '', rules: {} }).deriveStep('AB+')).toBe('AB+');
});

test('[EJERCICIO] deriveStep expande según la regla', () => {
  expect(new Grammar({ axiom: 'F', rules: { F: [{ p: 1, successor: 'AF' }] } }).deriveStep('AF')).toBe('AAF');
});

test('[EJERCICIO] deriveAll devuelve n+1 strings empezando por el axioma', () => {
  expect(new Grammar({ axiom: 'F', rules: { F: [{ p: 1, successor: 'AF' }] } }).deriveAll(3))
    .toEqual(['F', 'AF', 'AAF', 'AAAF']);
});

test('[EJERCICIO] gramática estocástica: misma semilla = misma secuencia', () => {
  const g = new Grammar({ axiom: 'F', rules: { F: [{ p: 0.5, successor: 'A' }, { p: 0.5, successor: 'B' }] } });
  seedRandom(7);
  const a = g.deriveAll(5);
  seedRandom(7);
  const b = g.deriveAll(5);
  expect(b).toEqual(a);
  expect(a.length).toBe(6);
});
