// Escenarios reproducibles de la pecera. Cada escenario define tanque, semilla, comida,
// plantas y especies. 'type' y 'diet' referencian CLASES (no strings).
import { Food } from './Food';
import { Plant } from './Plant';
import { Grammar } from './Grammar';
import { Turtle } from './Turtle';
import { Prey } from '../agents/Prey';
import { Predator } from '../agents/Predator';
import type { Scenario } from '../types';

const preyVision = { range: 120, angle: Math.PI };
const predatorVision = { range: preyVision.range * 1.5, angle: preyVision.angle * 0.25 };

export const scenarios: Scenario[] = [
  {
    name: 'presa-depredador',
    seed: 42,
    tank: { width: 800, height: 500 }, // tamaño del MUNDO en unidades de simulación, no píxeles
    food: { rate: 0.2, value: 3, max: 20 },
    plants: {
      count: 12,
      grammar: new Grammar({ axiom: 'F', rules: { F: [{ p: 1, successor: 'AAF' }] } }),
      turtle: new Turtle({ angle: 25.7, stepLength: 14, lengthRatio: 0.75 }),
      growthInterval: 150,
      maxGrowth: 3,
      energyPerLevel: 6,
      contactRadius: 6,
      color: '#4caf50',
    },
    species: [
      {
        type: Prey, count: 40,
        genome: {
          maxSpeed: 2.2, size: 6, color: '#7fd1a0', maxEnergy: 100,
          diet: [Plant, Food], vision: preyVision,
          maxAge: 1800, baseCost: 0.04, moveCost: 0.08, eatGain: 1.0,
        },
      },
      {
        type: Predator, count: 6,
        genome: {
          maxSpeed: 3, size: 10, color: '#d98b5f', maxEnergy: 160,
          diet: [Prey], vision: predatorVision,
          maxAge: 3000, baseCost: 0.08, moveCost: 0.30, eatGain: 0.5,
        },
      },
    ],
  },
];
