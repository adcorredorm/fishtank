// Helpers de vectores 2D (sobre objetos {x, y}) y de ángulos. Funciones libres.
// CONVENCIÓN: todos los ángulos están en RADIANES (no grados).
import type { Vec } from '../types';

export function vecAdd(a: Vec, b: Vec): Vec { return { x: a.x + b.x, y: a.y + b.y }; }
export function vecSub(a: Vec, b: Vec): Vec { return { x: a.x - b.x, y: a.y - b.y }; }
export function vecScale(a: Vec, s: number): Vec { return { x: a.x * s, y: a.y * s }; }

/**
 * Distancia euclidiana entre dos puntos.
 * @param a Primer punto {x, y}.
 * @param b Segundo punto {x, y}.
 * @returns La distancia (≥ 0).
 */
export function dist(a: Vec, b: Vec): number { return Math.hypot(a.x - b.x, a.y - b.y); }

/**
 * Vector unitario que apunta en la dirección de un ángulo (convención y-abajo, como el canvas).
 * @param h Ángulo en RADIANES.
 * @returns Vector {x, y} de longitud 1 en esa dirección.
 */
export function fromAngle(h: number): Vec { return { x: Math.cos(h), y: Math.sin(h) }; }

/**
 * Ángulo de un vector respecto al eje +x (convención y-abajo).
 * @param v Vector {x, y}.
 * @returns Ángulo en RADIANES, en el rango (-π, π] (devuelto por Math.atan2).
 */
export function angleOf(v: Vec): number { return Math.atan2(v.y, v.x); }

/**
 * Lleva un ángulo a su equivalente en el rango (-π, π].
 * @param a Ángulo en RADIANES (cualquier valor, p. ej. 3.5π o -10).
 * @returns El mismo ángulo en radianes pero dentro de (-π, π] (p. ej. 1.5π → -0.5π).
 */
export function normalizeAngle(a: number): number {
  while (a <= -Math.PI) a += 2 * Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  return a;
}

/**
 * Rumbo relativo: hacia dónde queda `to` visto desde un observador en `from` que mira hacia
 * `heading`. Es la base de la percepción del pez (su cono de visión está centrado en su rumbo).
 * @param from Posición del observador {x, y}.
 * @param heading Rumbo del observador en RADIANES (hacia dónde mira).
 * @param to Posición del objetivo {x, y}.
 * @returns Ángulo relativo en RADIANES dentro de (-π, π]: 0 = al frente; el signo indica el lado.
 */
export function relativeBearing(from: Vec, heading: number, to: Vec): number {
  return normalizeAngle(angleOf(vecSub(to, from)) - heading);
}

/**
 * La entidad más cercana de una lista de percibidos, comparando su campo `dist`.
 * @param list Lista de objetos con `dist` (p. ej. lo que entrega `sense()`: {dir, dist, ref}).
 * @returns El elemento de menor `dist`, o `null` si la lista está vacía.
 */
export function nearest<T extends { dist: number }>(list: T[]): T | null {
  let best: T | null = null;
  for (const e of list) if (best === null || e.dist < best.dist) best = e;
  return best;
}
