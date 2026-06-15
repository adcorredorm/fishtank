import { Fish } from './Fish';
import { nearest } from '../utilities/vec';
import type { Inputs } from '../types';

export class Prey extends Fish {
  act(inputs: Inputs): void {
    const threat = nearest(inputs.seen.fish.filter(e => e.ref.canEat(this)));
    if (threat) {
      this.turn(threat.dir + Math.PI);
      this.thrust(1);
      return;
    }
    const food = nearest(inputs.seen.food.filter(e => this.canEat(e.ref)));
    if (food) {
      this.turn(food.dir);
      this.thrust(0.8);
      this.eat(food.ref);
      return;
    }
    this.thrust(0.3);
  }
}
