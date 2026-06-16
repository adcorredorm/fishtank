import { Fish } from './Fish';
import { nearest } from '../utilities/vec';
import type { Inputs } from '../types';

export class Prey extends Fish {
  act(inputs: Inputs): void {
    // 1) huir de cualquier pez que pueda comerme
    const threat = nearest(inputs.seen.fish.filter(e => e.ref.canEat(this)));
    if (threat) {
      this.turn(threat.dir + Math.PI);
      this.thrust(1);
      return;
    }
    // 2) ir por la fuente de comida más cercana (planta o comida flotante)
    const meal = nearest([...inputs.seen.plants, ...inputs.seen.food].filter(e => this.canEat(e.ref)));
    if (meal) {
      this.turn(meal.dir);
      this.thrust(0.8);
      this.eat(meal.ref);
      return;
    }
    // 3) sin nada cerca: avanzar lento
    this.thrust(0.3);
  }
}
