// Pez: agente de la pecera. La clase BASE es andamiaje; las subclases (Prey/Predator) solo
// sobre-escriben act(). El estado físico está encapsulado en campos privados '#': el motor
// (esta clase base + el Tank) es el único que lo modifica. 
import type { Genome, Inputs, World, Vec } from '../types';
import { dist, relativeBearing, fromAngle, vecAdd, vecScale, normalizeAngle } from '../utilities/vec';

export class Fish {
  #pos: Vec;
  #heading: number;
  #energy: number;
  #age = 0;
  #intent!: { turn: number; thrust: number; eat: object | null };

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

  // ── Actuadores: encolan intención; NO tocan el estado físico ──
  turn(delta: number): void { this.#intent.turn += delta; }
  thrust(amount: number): void { this.#intent.thrust = Math.max(0, Math.min(1, amount)); }
  eat(target: object): void { this.#intent.eat = target; }

  // ── Inspección ──
  canEat(target: object): boolean { return this.genome.diet.some(C => target instanceof C); }

  act(_inputs: Inputs): void { /* las subclases deciden */ }

  // ── Ciclo del pez (plantilla, NO sobre-escribir) ──
  tick(world: World): void {
    const inputs = this.sense(world);
    this.act(inputs);
    this.#apply(world);
  }

  // ── Percepción: todo lo visible dentro del cono, agrupado por tipo ──
  // El cono está centrado en el rumbo; 'dir' es relativo (0 = al frente).
  sense(world: World): Inputs {
    const seen = { food: [] as any[], fish: [] as any[], walls: [] as any[] };
    const halfAngle = this.genome.vision.angle / 2;
    const range = this.genome.vision.range;

    const consider = (ref: object, point: Vec, bucket: any[]): void => {
      const d = dist(this.#pos, point);
      if (d > range) return;
      const dir = relativeBearing(this.#pos, this.#heading, point);
      if (Math.abs(dir) > halfAngle) return;
      bucket.push({ dir, dist: d, ref });
    };

    for (const f of world.food) consider(f, f.pos, seen.food);
    for (const other of world.fish) if (other !== this) consider(other, other.pos, seen.fish);
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

    // 5) comer: si marcó objetivo comestible y está en contacto
    const target = this.#intent.eat;
    if (target && this.canEat(target)) {
      const t = target as any;
      const targetSize: number = t.genome ? t.genome.size : t.size;
      // solo gana energía quien reclama el objetivo primero (world.remove devuelve false
      // si otro pez ya lo comió en este mismo tick)
      if (dist(this.#pos, t.pos) <= this.genome.size + targetSize && world.remove(target)) {
        const nutrition: number = t.genome ? t.energy : t.value;
        this.#energy += this.genome.eatGain * nutrition;
      }
    }

    // 6) envejecer y limpiar la intención para el próximo tick
    this.#age += 1;
    this.#resetIntent();
  }

  #resetIntent(): void { this.#intent = { turn: 0, thrust: 0, eat: null }; }
}
