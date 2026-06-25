import { Fish } from './Fish';
import { nearest } from '../utilities/vec';
import { randomGenome } from './genome';
import type { Inputs, Genome } from '../types';

export class Predator extends Fish {
  act(inputs: Inputs): void {
    if (this.energy > this.genome.reproductionCost) this.reproduce();
    const prey = nearest(inputs.seen.fish.filter(e => this.canEat(e.ref)));
    if (prey) {
      this.turn(prey.dir);
      this.thrust(1);
      this.eat(prey.ref);
      return;
    }
    this.thrust(0.3);
  }

  breed(_mate: Fish): Genome {
    return randomGenome(this.genome);
  }
}
