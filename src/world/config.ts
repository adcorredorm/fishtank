// Escenarios reproducibles de la pecera. Cada escenario define tanque, semilla, parámetros
// de comida y las especies (con su genoma). 'type' y 'diet' referencian CLASES (no strings).
// La economía energética vive en el genoma para que un gen pueda alterarla en iter.4.
import { Food } from './Food';
import { Prey } from '../agents/Prey';
import { Predator } from '../agents/Predator';
import type { Scenario } from '../types';

// Visión de la presa; la del depredador se deriva de ella: 20% más lejana pero 30% más angosta.
const preyVision = { range: 120, angle: 1.5 * Math.PI };
const predatorVision = { range: preyVision.range * 1.5, angle: preyVision.angle * 0.25 };

export const scenarios: Scenario[] = [
  {
    name: 'presa-depredador',
    seed: 42,
    tank: { width: 800, height: 500 }, // tamaño del MUNDO en unidades de simulación, no píxeles (README › Coordenadas y escala)
    food: { rate: 0.8, value: 8, max: 60 }, // rate = prob. por tick; max = tope de comida simultánea
    species: [
      {
        type: Prey, count: 40,
        genome: {
          maxSpeed: 2.2, size: 6, color: '#7fd1a0', maxEnergy: 100,
          diet: [Food], vision: preyVision,
          maxAge: 1800, baseCost: 0.04, moveCost: 0.08, eatGain: 1.0,
        },
      },
      {
        type: Predator, count: 6,
        genome: {
          maxSpeed: 2.4, size: 10, color: '#d98b5f', maxEnergy: 160,
          diet: [Prey], vision: predatorVision,
          maxAge: 3000, baseCost: 0.08, moveCost: 0.30, eatGain: 0.5,
        },
      },
    ],
  },
];
