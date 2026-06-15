// RNG sembrado (mulberry32) como singleton de módulo: se inicializa UNA vez con la semilla
// (seedRandom) y luego cualquier módulo usa random()/… sin pasar nada. Determinista.
let state = 0;
export function seedRandom(seed: number): void { state = seed >>> 0; }
export function random(): number {
  state = (state + 0x9e3779b9) >>> 0;
  let t = Math.imul(state ^ (state >>> 16), 0x21f0aaad);
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
  return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
}
/**
 * Número real aleatorio en el rango [min, max) — incluye min, excluye max.
 * @param min Límite inferior (inclusive).
 * @param max Límite superior (exclusive).
 * @returns Un real en [min, max).
 */
export function randomRange(min: number, max: number): number { return min + random() * (max - min); }

/**
 * Entero aleatorio entre min y max, AMBOS incluidos. P. ej. randomInt(1, 6) → 1..6 (un dado).
 * @param min Límite inferior (inclusive).
 * @param max Límite superior (inclusive).
 * @returns Un entero en [min, max].
 */
export function randomInt(min: number, max: number): number { return min + Math.floor(random() * (max - min + 1)); }

/**
 * Elige un elemento al azar de un array (todos con igual probabilidad).
 * @param arr Array no vacío.
 * @returns Un elemento del array.
 */
export function pick<T>(arr: T[]): T { return arr[randomInt(0, arr.length - 1)]; }
