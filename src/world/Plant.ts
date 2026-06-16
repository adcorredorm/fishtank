import { dist } from '../utilities/vec';
import type { Vec, Segment, Consumable, PlantConfig } from '../types';

export class Plant implements Consumable {
  readonly base: Vec;
  level: number;
  #cfg: PlantConfig;
  #chain: string[];
  #maxLevel: number;
  #ticksSinceGrowth = 0;

  constructor(base: Vec, cfg: PlantConfig, level: number) {
    this.base = base;
    this.#cfg = cfg;
    this.#chain = cfg.grammar.deriveAll(cfg.maxGrowth);
    this.#maxLevel = this.#chain.length - 1;
    this.level = Math.max(0, Math.min(level, this.#maxLevel));
  }

  // Se llama una vez por tick (desde Tank.step)
  grow(): void {
    if (this.level >= this.#maxLevel) return;
    this.#ticksSinceGrowth += 1;
    if (this.#ticksSinceGrowth >= this.#cfg.growthInterval) {
      this.level += 1;
      this.#ticksSinceGrowth = 0;
    }
  }

  bite(): number {
    if (this.level <= 0) return 0;
    this.level -= 1;
    return this.#cfg.energyPerLevel;
  }

  get energy(): number { return this.#cfg.energyPerLevel * this.level; }
  get color(): string { return this.#cfg.color; }

  get segments(): Segment[] {
    return this.#cfg.turtle.interpret(this.#chain[this.level]).map(s => ({
      x0: this.base.x + s.x0, y0: this.base.y + s.y0,
      x1: this.base.x + s.x1, y1: this.base.y + s.y1,
    }));
  }

  // ── Consumable ──
  // La planta es un cuerpo extenso (varios segmentos), no un punto: el pez la percibe y la
  // muerde por el vértice que tiene más cerca, no por una punta fija. Así, si cualquier parte
  // del arbusto cae en su cono de visión, la "ve" (mismo criterio que las paredes).
  contactPoint(from: Vec): Vec {
    let best: Vec = this.base;
    let bestDist = dist(from, this.base);
    for (const s of this.segments) {     // extremos de los segmentos, ya en coords de mundo
      const end = { x: s.x1, y: s.y1 };
      const d = dist(from, end);
      if (d < bestDist) { bestDist = d; best = end; }
    }
    return best;
  }
  get contactRadius(): number { return this.#cfg.contactRadius; }
  tryConsume(): number { return this.bite(); }
}
