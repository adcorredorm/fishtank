import type { Vec, Consumable } from '../types';

export class Food implements Consumable {
  pos: Vec;
  energy: number;
  size = 3;
  #eaten = false;
  constructor(x: number, y: number, energy: number) {
    this.pos = { x, y };
    this.energy = energy;
  }

  get eaten(): boolean { return this.#eaten; }
  contactPoint(_from: Vec): Vec { return this.pos; }
  get contactRadius(): number { return this.size; }
  tryConsume(): number {
    if (this.#eaten) return 0;
    this.#eaten = true;
    return this.energy;
  }
}
