import { test, expect } from 'vitest';
import { Fish } from '../src/agents/Fish';
import { Food } from '../src/world/Food';
import { Wall } from '../src/world/Wall';
import { Plant } from '../src/world/Plant';
import { Turtle } from '../src/world/Turtle';
import type { Grammar } from '../src/world/Grammar';

// Gramática de prueba (deriveAll funcional pero falso, no la solución del ejercicio): permite
// probar la percepción de plantas sin depender de la derivación real.
const stubGrammar = {
  axiom: 'F', rules: {},
  deriveStep: (s: string) => s,
  deriveAll: (n: number) => Array.from({ length: n + 1 }, (_, i) => 'F'.repeat(i + 1)),
} as unknown as Grammar;
import type { Genome, World, PlantConfig, Inputs } from '../src/types';
import { cloneGenome } from '../src/agents/genome';

function makeGenome(over: Partial<Genome> = {}): Genome {
  return Object.assign({
    maxSpeed: 2, size: 5, color: '#fff', maxEnergy: 100,
    diet: [Food], visionRange: 100, visionAngle: Math.PI, // cono de 180°
    maxAge: 1000, baseCost: 0.1, moveCost: 0.2, eatGain: 1,
    reproductionCost: 40, reproductionEfficiency: 0.75,
  } as Genome, over);
}

// Mundo mínimo de prueba para sense(): solo necesita food, fish, walls y dimensiones.
function makeWorld(over: Partial<World> = {}): World {
  return Object.assign({
    width: 200, height: 200,
    food: [], plants: [], fish: [],
    walls: [new Wall('left'), new Wall('right'), new Wall('top'), new Wall('bottom')],
  } as World, over);
}

// Fish es abstracta (act y breed sin implementar). Subclase mínima concreta para probar el motor.
class TestFish extends Fish {
  act(_inputs: Inputs): void {}
  breed(_mate: Fish): Genome { return cloneGenome(this.genome); }
}

test('getters exponen estado, energía inicial = maxEnergy', () => {
  const f = new TestFish(10, 20, 0, 100, makeGenome());
  expect(f.x).toBe(10);
  expect(f.y).toBe(20);
  expect(f.energy).toBe(100);
  expect(f.age).toBe(0);
  expect(f.heading).toBe(0);
  expect(f.isDead).toBe(false);
});

test('act() de una subclase NO puede mutar el estado físico (encapsulado)', () => {
  class Cheater extends TestFish {
    act(): void { this.pos = { x: 999, y: 999 }; this.energy = 999999; }
  }
  const f = new Cheater(10, 20, 0, 100, makeGenome());
  f.act();
  expect(f.x).toBe(10);
  expect(f.y).toBe(20);
  expect(f.energy).toBe(100);
});

test('escribir x/y/heading/age desde una subclase es inerte (no lanza, no cambia)', () => {
  class Cheater extends TestFish {
    act(): void { this.x = 999; this.y = 999; this.heading = 1.23; this.age = 9999; }
  }
  const f = new Cheater(10, 20, 0, 100, makeGenome());
  expect(() => f.act()).not.toThrow();
  expect(f.x).toBe(10);
  expect(f.y).toBe(20);
  expect(f.heading).toBe(0);
  expect(f.age).toBe(0);
});

test('canEat respeta la dieta por clases', () => {
  const prey = new TestFish(0, 0, 0, 100, makeGenome({ diet: [Food] }));
  expect(prey.canEat(new Food(0, 0, 1))).toBe(true);
  expect(prey.canEat(new TestFish(0, 0, 0, 100, makeGenome()))).toBe(false);
});

test('el genoma es mutable (creatividad del estudiante)', () => {
  const f = new TestFish(0, 0, 0, 100, makeGenome());
  f.genome.color = '#abcdef';
  expect(f.genome.color).toBe('#abcdef');
});

test('sense ve comida dentro del rango y la ignora fuera', () => {
  const f = new TestFish(100, 100, 0, 100, makeGenome({ visionRange: 50, visionAngle: Math.PI }));
  const cerca = new Food(130, 100, 1); // a 30 px, al frente
  const lejos = new Food(190, 100, 1); // a 90 px, fuera de rango
  const world = makeWorld({ food: [cerca, lejos] });
  const seen = f.sense(world).seen;
  expect(seen.food.length).toBe(1);
  expect(seen.food[0].ref).toBe(cerca);
  expect(Math.abs(seen.food[0].dir)).toBeLessThan(1e-9); // justo al frente
});

test('sense respeta el ángulo del cono (no ve lo que queda detrás)', () => {
  const f = new TestFish(100, 100, 0, 100, makeGenome({ visionRange: 100, visionAngle: Math.PI / 3 }));
  const detras = new Food(40, 100, 1);
  const seen = f.sense(makeWorld({ food: [detras] })).seen;
  expect(seen.food.length).toBe(0);
});

test('sense no se ve a sí mismo pero sí a otros peces', () => {
  const f = new TestFish(100, 100, 0, 100, makeGenome({ visionRange: 100, visionAngle: Math.PI }));
  const otro = new TestFish(120, 100, 0, 100, makeGenome());
  const seen = f.sense(makeWorld({ fish: [f, otro] })).seen;
  expect(seen.fish.length).toBe(1);
  expect(seen.fish[0].ref).toBe(otro);
});

test('sense incluye las paredes como entidades', () => {
  const f = new TestFish(20, 100, 0, 100, makeGenome({ visionRange: 100, visionAngle: 2 * Math.PI }));
  const seen = f.sense(makeWorld({ width: 200, height: 200 })).seen;
  expect(seen.walls.some((w: any) => w.ref.side === 'left')).toBeTruthy();
});

test('thrust mueve el pez en su rumbo y cobra metabolismo', () => {
  class Pusher extends TestFish { act(): void { this.thrust(1); } }
  const g = new Pusher(100, 100, 0, 100, makeGenome({ maxSpeed: 10, baseCost: 1, moveCost: 2 }));
  g.tick(makeWorld());
  expect(Math.abs(g.x - 110)).toBeLessThan(1e-9); // se movió 10 px hacia +x
  expect(Math.abs(g.y - 100)).toBeLessThan(1e-9);
  expect(g.energy).toBe(100 - (1 + 2 * 1)); // baseCost + moveCost*thrust = 3
});

test('turn cambia el rumbo (relativo)', () => {
  class Turner extends TestFish { act(): void { this.turn(Math.PI / 2); this.thrust(0); } }
  const g = new Turner(100, 100, 0, 100, makeGenome());
  g.tick(makeWorld());
  expect(Math.abs(g.heading - Math.PI / 2)).toBeLessThan(1e-9);
});

test('rebota y se mantiene dentro de las paredes', () => {
  class Pusher extends TestFish { act(): void { this.thrust(1); } }
  const g = new Pusher(195, 100, 0, 100, makeGenome({ maxSpeed: 20 })); // hacia +x, pegado al borde derecho
  g.tick(makeWorld({ width: 200, height: 200 }));
  expect(g.x).toBeLessThanOrEqual(200);
  expect(g.x).toBeGreaterThanOrEqual(0);
});

test('comer en contacto suma energía y marca la comida como comida', () => {
  const world = makeWorld();
  const comida = new Food(102, 100, 8);
  world.food = [comida];
  class Eater extends TestFish { act(inputs: any): void { this.eat(inputs.seen.food[0].ref); } }
  const g = new Eater(100, 100, 0, 100, makeGenome({ size: 10, eatGain: 1, baseCost: 0, moveCost: 0, visionRange: 50, visionAngle: Math.PI }));
  g.tick(world);
  expect(comida.eaten).toBe(true);
  expect(g.energy).toBe(100 + 1 * 8); // eatGain * food.energy
});

test('muere por energía agotada', () => {
  class Pusher extends TestFish { act(): void { this.thrust(1); } }
  const g = new Pusher(100, 100, 0, 1, makeGenome({ baseCost: 1, moveCost: 1 }));
  g.tick(makeWorld());
  expect(g.isDead).toBeTruthy();
});

test('una pared se percibe en su punto visible dentro del cono, no en la perpendicular', () => {
  // pez en (50,100) mirando arriba-izquierda (3π/4), cono estrecho (±π/6).
  // La perpendicular a la pared izquierda cae fuera del cono, pero la pared SÍ es visible
  // por el borde del cono → debe aparecer con |dir| ≤ medio-ángulo.
  const half = Math.PI / 6;
  const f = new TestFish(50, 100, 3 * Math.PI / 4, 100, makeGenome({ visionRange: 100, visionAngle: 2 * half }));
  const seen = f.sense(makeWorld({ width: 400, height: 400 })).seen;
  const left = seen.walls.find((w: any) => w.ref.side === 'left');
  expect(left).toBeTruthy(); // la pared izquierda debería ser visible por el borde del cono
  // left está garantizado por el expect anterior; el cast evita el error TS18048
  expect(Math.abs((left as any).dir)).toBeLessThanOrEqual(half + 1e-9); // dir fuera del cono
});

test('dos peces no pueden comer el mismo objetivo dos veces (reclamación única)', () => {
  const world = makeWorld();
  const comida = new Food(100, 100, 8);
  world.food = [comida];
  class Eater extends TestFish { act(): void { this.eat(comida); } }
  const g = makeGenome({ size: 20, eatGain: 1, baseCost: 0, moveCost: 0 });
  const a = new Eater(100, 100, 0, 100, g);
  const b = new Eater(100, 100, 0, 100, g);
  a.tick(world);
  b.tick(world);
  expect(a.energy).toBe(108); // el primero gana
  expect(b.energy).toBe(100); // el segundo no (ya estaba reclamada)
});

function plantCfg(): PlantConfig {
  return {
    count: 1, grammar: stubGrammar,
    turtle: new Turtle({ angle: 25, stepLength: 10, lengthRatio: 0.75 }),
    growthInterval: 1, maxGrowth: 3, energyPerLevel: 5, contactRadius: 4, color: '#0f0',
  };
}

test('[ANDAMIAJE] sense ignora las plantas en nivel 0', () => {
  const f = new TestFish(100, 100, -Math.PI / 2, 100, makeGenome({ visionRange: 200, visionAngle: 2 * Math.PI }));
  const brote = new Plant({ x: 100, y: 60 }, plantCfg(), 0); // arriba del pez, pero nivel 0
  const seen = f.sense(makeWorld({ plants: [brote] })).seen;
  expect(seen.plants.length).toBe(0);
});

test('[ANDAMIAJE] sense ve una planta en nivel >= 1 por su vértice más cercano', () => {
  const f = new TestFish(100, 100, -Math.PI / 2, 100, makeGenome({ visionRange: 200, visionAngle: 2 * Math.PI }));
  const planta = new Plant({ x: 100, y: 60 }, plantCfg(), 2); // crecida, arriba del pez
  const seen = f.sense(makeWorld({ plants: [planta] })).seen;
  expect(seen.plants.length).toBe(1);
  expect(seen.plants[0].ref).toBe(planta);
});

test('sense reporta el rumbo del otro pez relativo al observador', () => {
  // observador en (100,100) mirando +x (heading 0); otro pez justo al frente, mirando +y (π/2)
  const me = new TestFish(100, 100, 0, 100, makeGenome({ visionRange: 200, visionAngle: 2 * Math.PI }));
  const other = new TestFish(130, 100, Math.PI / 2, 100, makeGenome());
  const seen = me.sense(makeWorld({ fish: [me, other] })).seen;
  expect(seen.fish.length).toBe(1);
  expect(seen.fish[0].ref).toBe(other);
  expect(Math.abs(seen.fish[0].heading - Math.PI / 2)).toBeLessThan(1e-9); // rumbo relativo
});

test('reproduce() marca la voluntad; arranca en false y se limpia al inicio del siguiente tick', () => {
  class Breeder extends TestFish { act(): void { this.reproduce(); } }
  const f = new Breeder(100, 100, 0, 100, makeGenome());
  expect(f.wantsToReproduce).toBe(false);     // antes de actuar
  f.tick(makeWorld());
  expect(f.wantsToReproduce).toBe(true);       // act() la marcó este tick
});

test('reproduce() se vuelve a evaluar cada tick (no act() ⇒ false)', () => {
  let on = true;
  class Maybe extends TestFish { act(): void { if (on) this.reproduce(); } }
  const f = new Maybe(100, 100, 0, 100, makeGenome({ baseCost: 0, moveCost: 0 }));
  f.tick(makeWorld());
  expect(f.wantsToReproduce).toBe(true);
  on = false;
  f.tick(makeWorld());                         // el reset al inicio del tick la baja y act() no la sube
  expect(f.wantsToReproduce).toBe(false);
});

test('spendOnReproduction cobra el costo y baja el flag', () => {
  class Breeder extends TestFish { act(): void { this.reproduce(); } }
  const f = new Breeder(100, 100, 0, 100, makeGenome({ reproductionCost: 30, baseCost: 0, moveCost: 0 }));
  f.tick(makeWorld());
  expect(f.wantsToReproduce).toBe(true);
  f.spendOnReproduction();
  expect(f.energy).toBe(70);                   // 100 - 30
  expect(f.wantsToReproduce).toBe(false);
});

test('sense expone si el otro pez está dispuesto a reproducirse (reproducing)', () => {
  class Breeder extends TestFish { act(): void { this.reproduce(); } }
  const me = new TestFish(100, 100, 0, 100, makeGenome({ visionRange: 200, visionAngle: 2 * Math.PI }));
  const willing = new Breeder(130, 100, 0, 100, makeGenome());
  willing.tick(makeWorld());                   // pone su voluntad en true
  const seen = me.sense(makeWorld({ fish: [me, willing] })).seen;
  expect(seen.fish.length).toBe(1);
  expect(seen.fish[0].reproducing).toBe(true);
});
