// Pez: agente ABSTRACTO de la pecera. La clase BASE es andamiaje (percepción, física, ciclo);
// las subclases (Prey/Predator) implementan act() y breed(). El estado físico está encapsulado
// en campos privados '#': el motor (esta clase base + el Tank) es el único que lo modifica.
import type { Genome, Inputs, World, Vec, Consumable, Perceived } from '../types';
import { dist, relativeBearing, fromAngle, vecAdd, vecScale, normalizeAngle } from '../utilities/vec';

export abstract class Fish implements Consumable {
  #pos: Vec;
  #heading: number;
  #energy: number;
  #age = 0;
  #eaten = false;
  #intent!: { turn: number; thrust: number; eat: object | null; reproduce: boolean };

  genome: Genome;

  constructor(x: number, y: number, heading: number, energy: number, genome: Genome) {
    this.#pos = { x, y };
    this.#heading = heading;
    this.#energy = energy;
    this.genome = genome;
    this.#resetIntent();
  }

  // Estado de SOLO LECTURA: los getters lo exponen; los setters son no-op a propósito.
  get x(): number { return this.#pos.x; }
  set x(_v: number) {}
  get y(): number { return this.#pos.y; }
  set y(_v: number) {}
  get pos(): Vec { return { x: this.#pos.x, y: this.#pos.y }; }
  set pos(_v: Vec) {}
  get heading(): number { return this.#heading; }
  set heading(_v: number) {}
  get energy(): number { return this.#energy; }
  set energy(_v: number) {}
  get age(): number { return this.#age; }
  set age(_v: number) {}
  get size(): number { return this.genome.size; }
  get isDead(): boolean { return this.#energy <= 0 || this.#age > this.genome.maxAge; }
  get eaten(): boolean { return this.#eaten; }
  get wantsToReproduce(): boolean { return this.#intent.reproduce; }

  // ── Consumable: un pez también es comida potencial (lo caza un depredador) ──
  contactPoint(_from: Vec): Vec { return this.pos; }
  get contactRadius(): number { return this.genome.size; }
  // Reclamación única: solo rinde energía el primer depredador que lo come en este tick.
  tryConsume(): number {
    if (this.#eaten) return 0;
    this.#eaten = true;
    return this.#energy;
  }
  canEat(target: object): boolean { return this.genome.diet.some(C => target instanceof C); }

  // ── Actuadores: encolan intención; NO tocan el estado físico ──
  turn(delta: number): void { this.#intent.turn += delta; }
  thrust(amount: number): void { this.#intent.thrust = Math.max(0, Math.min(1, amount)); }
  eat(target: object): void { this.#intent.eat = target; }
  reproduce(): void { this.#intent.reproduce = true; }
  spendOnReproduction(): void {
    this.#energy -= this.genome.reproductionCost;
    this.#intent.reproduce = false;
  }
  #resetIntent(): void { this.#intent = { turn: 0, thrust: 0, eat: null, reproduce: false }; }


  /** Decide la acción del pez en este tick vía los actuadores. Lo implementa cada especie. */
   abstract act(inputs: Inputs): void;
  /**
   * Produce el genoma de la cría a partir de este pez y `mate`. Cada especie decide CÓMO
   * (cruce, mutación, lo que sea): es responsabilidad de la subclase implementarlo.
   */
  abstract breed(mate: Fish): Genome;

  // ── Ciclo del pez (plantilla, NO sobre-escribir) ──
  tick(world: World): void {
    this.#resetIntent();
    const inputs = this.sense(world);
    this.act(inputs);
    this.#apply(world);
  }

  // ── Percepción: todo lo visible dentro del cono, agrupado por tipo ──
  // El cono está centrado en el rumbo; 'dir' es relativo (0 = al frente).
  sense(world: World): Inputs {
    const seen: Inputs['seen'] = { food: [], plants: [], fish: [], walls: [] };
    const halfAngle = this.genome.visionAngle / 2;
    const range = this.genome.visionRange;

    const consider = <T>(ref: T, point: Vec, bucket: Perceived<T>[]): void => {
      const d = dist(this.#pos, point);
      if (d > range) return;
      const dir = relativeBearing(this.#pos, this.#heading, point);
      if (Math.abs(dir) > halfAngle) return;
      bucket.push({ dir, dist: d, ref });
    };

    for (const f of world.food) consider(f, f.contactPoint(this.#pos), seen.food);
    // Las plantas en nivel 0 (brotes) no se perciben: no hay nada que comer todavía.
    for (const p of world.plants) if (p.level >= 1) consider(p, p.contactPoint(this.#pos), seen.plants);
    for (const other of world.fish) if (other !== this) consider(other, other.contactPoint(this.#pos), seen.fish);
    for (const e of seen.fish) {
      e.heading = normalizeAngle(e.ref.heading - this.#heading);
      e.reproducing = e.ref.wantsToReproduce;
    }
    for (const w of world.walls) {
      const wp = w.visiblePoint(this.#pos, this.#heading, halfAngle, range, world);
      if (wp) seen.walls.push({ dir: relativeBearing(this.#pos, this.#heading, wp), dist: dist(this.#pos, wp), ref: w });
    }

    return { energy: this.#energy / this.genome.maxEnergy, seen };
  }

  // ── Consolidación física (privada): ÚNICO lugar que escribe #pos / #energy ──
  #apply(world: World): void {
    // 1) giro (intención acumulada en el tick)
    this.#heading = normalizeAngle(this.#heading + this.#intent.turn);

    // 2) movimiento según empuje
    const speed = this.#intent.thrust * this.genome.maxSpeed;
    this.#pos = vecAdd(this.#pos, vecScale(fromAngle(this.#heading), speed));

    // 3) paredes: reflejar el rumbo y recortar dentro del tanque
    if (this.#pos.x < 0 || this.#pos.x > world.width) {
      this.#heading = normalizeAngle(Math.PI - this.#heading);
      this.#pos.x = Math.max(0, Math.min(world.width, this.#pos.x));
    }
    if (this.#pos.y < 0 || this.#pos.y > world.height) {
      this.#heading = normalizeAngle(-this.#heading);
      this.#pos.y = Math.max(0, Math.min(world.height, this.#pos.y));
    }

    // 4) metabolismo (coeficientes leídos del genoma)
    this.#energy -= this.genome.baseCost + this.genome.moveCost * this.#intent.thrust;

    // 5) comer: si marcó un objetivo comestible y está en contacto, lo consume.
    // tryConsume resuelve cada tipo: Food/Fish se retiran (reclamación única), Plant se muerde.
    const target = this.#intent.eat as Consumable | null;
    if (target && this.canEat(target) &&
        dist(this.#pos, target.contactPoint(this.#pos)) <= this.genome.size + target.contactRadius) {
      this.#energy += this.genome.eatGain * target.tryConsume();
    }

    // 6) envejecer
    this.#age += 1;
  }
}
