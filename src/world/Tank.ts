// Mundo de la pecera. Conduce los ticks y resuelve lo inter-entidad (retirar comidos y
// muertos, aparecer comida). La física por-pez ocurre dentro de Fish.#apply().
// Toda la aleatoriedad sale de un único RNG sembrado → corridas reproducibles.
import { Food } from './Food';
import { Wall } from './Wall';
import { seedRandom, random } from '../utilities/rng';
import type { Scenario, SpeciesSpec, World } from '../types';
import type { Fish } from '../agents/Fish';

export class Tank implements World {
  width: number;
  height: number;
  foodConfig: Scenario['food'];
  tickCount = 0;
  walls: Wall[];
  food: Food[] = [];
  fish: Fish[] = [];
  speciesNames: string[];
  #toRemove = new Set<object>();

  constructor(scenario: Scenario) {
    seedRandom(scenario.seed);            // ← init único de la semilla; el resto usa random()
    this.width = scenario.tank.width;
    this.height = scenario.tank.height;
    this.foodConfig = scenario.food;
    this.walls = [new Wall('left'), new Wall('right'), new Wall('top'), new Wall('bottom')];
    this.speciesNames = scenario.species.map(s => s.type.name);
    this.#spawnFish(scenario.species);
  }

  #spawnFish(species: SpeciesSpec[]): void {
    for (const s of species) {
      for (let i = 0; i < s.count; i++) {
        const x = random() * this.width;
        const y = random() * this.height;
        const heading = random() * 2 * Math.PI - Math.PI;
        const genome = { ...s.genome, vision: { ...s.genome.vision } };
        this.fish.push(new s.type(x, y, heading, genome.maxEnergy, genome));
      }
    }
  }

  // Lo llama Fish.#apply() para reclamar una entidad comida. Devuelve true si la reclamó
  // este pez, o false si ya estaba reclamada en este tick (evita que dos peces coman lo
  // mismo y ganen energía dos veces).
  remove(entity: object): boolean {
    if (this.#toRemove.has(entity)) return false;
    this.#toRemove.add(entity);
    return true;
  }

  step(): void {
    // 1) aparece comida (posición desde el RNG sembrado), hasta un tope simultáneo
    if (this.food.length < this.foodConfig.max && random() < this.foodConfig.rate) {
      this.food.push(new Food(random() * this.width, random() * this.height, this.foodConfig.value));
    }
    // 2) cada pez percibe, decide y aplica su física
    for (const fish of this.fish) fish.tick(this);
    // 3) retirar comidos y muertos
    if (this.#toRemove.size > 0) this.food = this.food.filter(f => !this.#toRemove.has(f));
    this.fish = this.fish.filter(f => !this.#toRemove.has(f) && !f.isDead);
    this.#toRemove.clear();
    // 4) avanzar el reloj
    this.tickCount += 1;
  }

  population(): { tick: number; fish: Record<string, number> } {
    const counts: Record<string, number> = Object.fromEntries(this.speciesNames.map(n => [n, 0]));
    for (const f of this.fish) counts[f.constructor.name]++;
    return { tick: this.tickCount, fish: counts };
  }
}
