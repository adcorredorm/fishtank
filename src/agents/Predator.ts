import { Fish } from './Fish';
import { nearest } from '../utilities/vec';
import type { Inputs } from '../types';

export class Predator extends Fish {
  act(inputs: Inputs): void {
    const prey = nearest(inputs.seen.fish.filter(e => this.canEat(e.ref)));
    if (prey) {
      this.turn(prey.dir);
      this.thrust(1);
      this.eat(prey.ref);
      return;
    }
    this.thrust(0.3);
  }
}
