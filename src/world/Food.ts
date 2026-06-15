import type { Vec } from '../types';

// Comida: unidad comestible con energía. En iter.2 dará paso a una planta que crece.
export class Food {
  pos: Vec;
  value: number;
  size = 3;
  constructor(x: number, y: number, value: number) {
    this.pos = { x, y };
    this.value = value;   // "nutrición": energía base que aporta al ser comida
  }
}
