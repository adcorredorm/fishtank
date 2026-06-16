// Tortuga: interpreta geométricamente un string de L-system. Recorre el string y produce
// segmentos en COORDENADAS LOCALES con la base en el origen (0,0) y crecimiento hacia ARRIBA.
// Es la otra mitad del L-system: la Grammar produce el string (símbolos), la Turtle lo
// convierte en geometría.
import type { Segment } from '../types';

const UP = Math.PI / 2;

function isUpper(ch: string): boolean { return ch >= 'A' && ch <= 'Z'; }

export class Turtle {
  #angleRad: number;
  #stepLength: number;
  #lengthRatio: number;

  /**
   * @param angle       Ángulo de giro de `+`/`-` en GRADOS.
   * @param stepLength  Largo de cada segmento dibujado.
   * @param lengthRatio Factor (<1) por el que se acorta el paso al entrar en una rama `[`.
   */
  constructor({ angle, stepLength, lengthRatio }: { angle: number; stepLength: number; lengthRatio: number }) {
    this.#angleRad = angle * Math.PI / 180;
    this.#stepLength = stepLength;
    this.#lengthRatio = lengthRatio;
  }

  /**
   * Recorre `string` y devuelve los segmentos dibujados en coordenadas locales (base en el
   * origen, crecimiento hacia arriba).
   * - Mayúsculas (F, A, …): avanzan dibujando un segmento de largo `stepLength`.
   * - `+` / `-`: giran el rumbo ±`angle`.
   * - `[` / `]`: apilan / restauran estado; `[` acorta el paso por `lengthRatio` (ramas).
   * - Cualquier otro símbolo se ignora.
   */
  interpret(string: string): Segment[] {
    let x = 0, y = 0, heading = UP, len = this.#stepLength;
    const stack: { x: number; y: number; heading: number; len: number }[] = [];
    const segments: Segment[] = [];

    for (const ch of string) {
      if (isUpper(ch)) {
        const nx = x + Math.cos(heading) * len;
        const ny = y - Math.sin(heading) * len;
        segments.push({ x0: x, y0: y, x1: nx, y1: ny });
        x = nx; y = ny;
      } else if (ch === '+') {
        heading += this.#angleRad;
      } else if (ch === '-') {
        heading -= this.#angleRad;
      } else if (ch === '[') {
        stack.push({ x, y, heading, len });
        len *= this.#lengthRatio;
      } else if (ch === ']') {
        const s = stack.pop();
        if (s) { x = s.x; y = s.y; heading = s.heading; len = s.len; }
      }
    }
    return segments;
  }
}
