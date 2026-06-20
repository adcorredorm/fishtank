// Construye el MODELO del inspector (objeto plano) para una entidad seleccionada. No toca el
// DOM: separa el "qué se muestra" (aquí, testeable) del "cómo se pinta" (en main.ts). Para un
// pez incluye su percepción actual (vía sense()), con los peces/plantas como ítems navegables.
import type { World } from '../types';
import { Fish } from '../agents/Fish';
import { Plant } from '../world/Plant';
import { nearest } from '../utilities/vec';

export interface InspectorRow { label: string; value: string; isColor?: boolean; }
export interface PerceivedItem {
  kind: 'fish' | 'plant';
  ref: Fish | Plant;
  dir: number;
  dist: number;
  heading?: number; // solo para peces (rumbo relativo)
}
export interface InspectorModel {
  kind: 'fish' | 'plant';
  title: string;
  rows: InspectorRow[];
  /** Solo para peces: lo que percibe ahora. `clickable` = peces y plantas; `context` = resumen. */
  perceived?: { clickable: PerceivedItem[]; context: string };
}

export function describeEntity(entity: Fish | Plant, world: World): InspectorModel {
  return entity instanceof Fish ? describeFish(entity, world) : describePlant(entity);
}

function describeFish(fish: Fish, world: World): InspectorModel {
  const g = fish.genome;
  const rows: InspectorRow[] = [
    { label: 'pos', value: `(${fish.x.toFixed(0)}, ${fish.y.toFixed(0)})` },
    { label: 'rumbo', value: `${fish.heading.toFixed(2)} rad` },
    { label: 'energía', value: `${fish.energy.toFixed(1)} / ${g.maxEnergy}` },
    { label: 'edad', value: `${fish.age} / ${g.maxAge}` },
    { label: 'maxSpeed', value: `${g.maxSpeed}` },
    { label: 'size', value: `${g.size}` },
    { label: 'color', value: g.color, isColor: true },
    { label: 'diet', value: g.diet.map(C => C.name).join(', ') || '—' },
    { label: 'visión', value: `range=${g.vision.range} angle=${g.vision.angle.toFixed(2)}` },
    { label: 'baseCost', value: `${g.baseCost}` },
    { label: 'moveCost', value: `${g.moveCost}` },
    { label: 'eatGain', value: `${g.eatGain}` },
  ];

  const seen = fish.sense(world).seen;
  const clickable: PerceivedItem[] = [
    ...seen.fish.map((e): PerceivedItem => ({ kind: 'fish', ref: e.ref, dir: e.dir, dist: e.dist, heading: e.heading })),
    ...seen.plants.map((e): PerceivedItem => ({ kind: 'plant', ref: e.ref, dir: e.dir, dist: e.dist })),
  ].sort((a, b) => a.dist - b.dist);

  const wall = nearest(seen.walls);
  const context = `comida: ${seen.food.length}`
    + (wall ? ` · pared más cercana: ${wall.ref.side} a ${wall.dist.toFixed(0)}` : '');

  return { kind: 'fish', title: fish.constructor.name, rows, perceived: { clickable, context } };
}

function describePlant(plant: Plant): InspectorModel {
  const rows: InspectorRow[] = [
    { label: 'base', value: `(${plant.base.x.toFixed(0)}, ${plant.base.y.toFixed(0)})` },
    { label: 'nivel', value: `${plant.level} / ${plant.maxGrowth}` },
    { label: 'energía', value: `${plant.energy}` },
    { label: 'crecimiento', value: `${plant.growthTicks} / ${plant.growthInterval} ticks` },
    { label: 'color', value: plant.color, isColor: true },
  ];
  return { kind: 'plant', title: 'Planta', rows };
}
