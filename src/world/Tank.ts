// Mundo de la pecera. Conduce los ticks y resuelve lo inter-entidad (retirar comidos y
// muertos, aparecer comida). La física por-pez ocurre dentro de Fish.#apply().
// Toda la aleatoriedad sale de un único RNG sembrado → corridas reproducibles.
import { Food } from './Food';
import { Plant } from './Plant';
import { Wall } from './Wall';
import { seedRandom, random, randomInt } from '../utilities/rng';
import { dist } from '../utilities/vec';
import { cloneGenome } from '../agents/genome';
import type { Scenario, SpeciesSpec, World, PlantConfig, Genome } from '../types';
import type { Fish } from '../agents/Fish';

export class Tank implements World {
  width: number;
  height: number;
  foodConfig: Scenario['food'];
  plantsConfig: PlantConfig;
  tickCount = 0;
  walls: Wall[];
  food: Food[] = [];
  plants: Plant[] = [];
  fish: Fish[] = [];
  speciesNames: string[];

  constructor(scenario: Scenario) {
    seedRandom(scenario.seed);            // ← init único de la semilla; el resto usa random()
    this.width = scenario.tank.width;
    this.height = scenario.tank.height;
    this.foodConfig = scenario.food;
    this.plantsConfig = scenario.plants;
    this.walls = [new Wall('left'), new Wall('right'), new Wall('top'), new Wall('bottom')];
    this.speciesNames = scenario.species.map(s => s.type.name);
    this.#spawnFish(scenario.species);
    this.#spawnPlants(scenario.plants);
  }

  #spawnFish(species: SpeciesSpec[]): void {
    for (const s of species) {
      for (let i = 0; i < s.count; i++) {
        const x = random() * this.width;
        const y = random() * this.height;
        const heading = random() * 2 * Math.PI - Math.PI;
        const genome = cloneGenome(s.genome);
        this.fish.push(new s.type(x, y, heading, genome.maxEnergy, genome));
      }
    }
  }

  #spawnPlants(cfg: PlantConfig): void {
    for (let i = 0; i < cfg.count; i++) {
      const x = random() * this.width;
      const level = randomInt(0, cfg.maxGrowth);
      this.plants.push(new Plant({ x, y: this.height }, cfg, level));
    }
  }

  step(): void {
    // 1) aparece comida flotante (secundaria), hasta un tope simultáneo
    if (this.food.length < this.foodConfig.max && random() < this.foodConfig.rate) {
      this.food.push(new Food(random() * this.width, random() * this.height, this.foodConfig.value));
    }
    // 2) las plantas crecen (renovables; nunca se eliminan)
    for (const plant of this.plants) plant.grow();
    // 3) cada pez percibe, decide y aplica su física
    for (const fish of this.fish) fish.tick(this);
    // 4) reproducción inter-entidad: empareja peces dispuestos y agrega las crías
    this.#reproduce();
    // 5) el mundo retira lo consumido: comida y peces comidos o muertos
    this.food = this.food.filter(f => !f.eaten);
    this.fish = this.fish.filter(f => !f.eaten && !f.isDead);
    // 6) avanzar el reloj
    this.tickCount += 1;
  }

  #reproduce(): void {
    const willing = this.fish.filter(f => f.wantsToReproduce);
    const paired = new Set<Fish>();
    const newborns: Fish[] = [];
    for (let i = 0; i < willing.length; i++) {
      const parentA = willing[i];
      if (paired.has(parentA) || parentA.energy < parentA.genome.reproductionCost) continue;
      for (let j = i + 1; j < willing.length; j++) {
        const parentB = willing[j];
        if (paired.has(parentB)) continue;
        if (parentA.constructor !== parentB.constructor) continue;
        if (parentB.energy < parentB.genome.reproductionCost) continue;
        if (dist(parentA.pos, parentB.pos) > parentA.genome.size + parentB.genome.size) continue; // en contacto
        const childEnergy = parentA.genome.reproductionCost * parentA.genome.reproductionEfficiency
                          + parentB.genome.reproductionCost * parentB.genome.reproductionEfficiency;
        const childGenome = parentA.breed(parentB);
        parentA.spendOnReproduction();
        parentB.spendOnReproduction();
        const heading = random() * 2 * Math.PI - Math.PI;
        const Species = parentA.constructor as new (x: number, y: number, h: number, e: number, g: Genome) => Fish;
        newborns.push(new Species(parentA.x, parentA.y, heading, childEnergy, childGenome));
        paired.add(parentA);
        paired.add(parentB);
        break;
      }
    }
    this.fish.push(...newborns);
  }

  population(): { tick: number; fish: Record<string, number> } {
    const counts: Record<string, number> = Object.fromEntries(this.speciesNames.map(n => [n, 0]));
    for (const f of this.fish) counts[f.constructor.name]++;
    return { tick: this.tickCount, fish: counts };
  }
}
