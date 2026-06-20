// Transformación entre coordenadas de MUNDO (unidades de simulación, tamaño fijo del escenario)
// y coordenadas de CANVAS (píxeles). Ajusta el mundo dentro del canvas conservando proporción
// y centrándolo (letterbox). Es la única fuente de la fórmula: la usan el Renderer (al dibujar)
// y la selección (al traducir un clic a mundo). Ver README › Coordenadas y escala.
import type { Vec } from '../types';

export interface FitTransform { scale: number; offsetX: number; offsetY: number; }

/**
 * Calcula la escala y el desplazamiento para encajar un mundo `tankW×tankH` dentro de un canvas
 * `canvasW×canvasH` conservando la proporción y centrándolo.
 */
export function fitTransform(canvasW: number, canvasH: number, tankW: number, tankH: number): FitTransform {
  const scale = Math.min(canvasW / tankW, canvasH / tankH);
  return { scale, offsetX: (canvasW - tankW * scale) / 2, offsetY: (canvasH - tankH * scale) / 2 };
}

/**
 * Convierte un punto en píxeles del canvas a coordenadas de mundo (inversa de `fitTransform`).
 * @param px Píxel X en el canvas (ya escalado por devicePixelRatio si aplica).
 * @param py Píxel Y en el canvas.
 * @param t  Transformación obtenida de `fitTransform`.
 */
export function screenToWorld(px: number, py: number, t: FitTransform): Vec {
  return { x: (px - t.offsetX) / t.scale, y: (py - t.offsetY) / t.scale };
}
