// Decide qué entidad cae bajo un punto de MUNDO (para el inspector). Prioridad por tipo:
// si un pez y una planta califican, gana el pez (suele ser lo que se quiere inspeccionar).
// Función pura: no toca el DOM ni el canvas. El umbral es holgura extra sobre el radio.
import type { Vec, World } from '../types';
import type { Fish } from '../agents/Fish';
import type { Plant } from '../world/Plant';
import { dist } from '../utilities/vec';

/**
 * Devuelve la entidad del mundo que cae bajo el punto dado, con prioridad pez > planta.
 *
 * @param point Punto en coordenadas de MUNDO (no píxeles).
 * @param world Mundo con peces y plantas (el `Tank` lo cumple).
 * @param threshold Holgura extra, en unidades de mundo, sumada al radio de cada entidad.
 * @returns El pez más cercano dentro de su radio; si ninguno, la planta más cercana dentro del
 *          suyo; si nada califica, `null`.
 */
export function pickEntity(
  point: Vec,
  world: Pick<World, 'fish' | 'plants'>,
  threshold: number,
): Fish | Plant | null {
  // Primero buscamos peces (mayor prioridad)
  let bestFish: Fish | null = null;
  let bestFishDist = Infinity;
  for (const f of world.fish) {
    const d = dist(point, f.pos);
    if (d <= f.size + threshold && d < bestFishDist) {
      bestFishDist = d;
      bestFish = f;
    }
  }
  if (bestFish) return bestFish;

  // Si no hay pez, buscamos la planta más cercana al punto de contacto
  let bestPlant: Plant | null = null;
  let bestPlantDist = Infinity;
  for (const p of world.plants) {
    const d = dist(point, p.contactPoint(point));
    if (d <= p.contactRadius + threshold && d < bestPlantDist) {
      bestPlantDist = d;
      bestPlant = p;
    }
  }
  return bestPlant;
}
