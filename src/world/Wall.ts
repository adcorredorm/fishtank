import type { Vec, World } from '../types';
import { dist, relativeBearing } from '../utilities/vec';

// Pared del tanque. Es una entidad percibible: el pez la "ve" como cualquier otra cosa.
export class Wall {
  constructor(public side: 'left' | 'right' | 'top' | 'bottom') {}

  // Punto de la pared más cercano al pez (proyección perpendicular, recortada al segmento).
  nearestPoint(pos: Vec, world: World): Vec {
    switch (this.side) {
      case 'left':   return { x: 0,           y: pos.y };
      case 'right':  return { x: world.width, y: pos.y };
      case 'top':    return { x: pos.x,       y: 0 };
      case 'bottom': return { x: pos.x,       y: world.height };
    }
  }

  // Punto de la pared más cercano que cae DENTRO del cono de visión (o null si no es
  // visible). A diferencia de un objeto puntual (comida/pez), la pared es una línea: si su
  // proyección perpendicular queda fuera del cono, se devuelve el punto donde el borde del
  // cono corta la pared. Así 'dir' apunta a la porción de pared que el pez realmente ve.
  visiblePoint(pos: Vec, heading: number, halfAngle: number, range: number, world: World): Vec | null {
    const foot = this.nearestPoint(pos, world);
    const footBearing = relativeBearing(pos, heading, foot);
    let point: Vec;
    if (Math.abs(footBearing) <= halfAngle) {
      point = foot;                              // el más cercano ya está dentro del cono
    } else {
      const edge = heading + Math.sign(footBearing) * halfAngle;
      point = this.#rayHit(pos, edge, world)!;  // dónde corta el borde del cono la pared
      if (!point) return null;
    }
    return dist(pos, point) <= range ? point : null;
  }

  // Intersección de un rayo (desde pos, ángulo absoluto) con la línea de esta pared,
  // recortada al segmento. null si el rayo no la cruza hacia adelante.
  #rayHit(pos: Vec, angle: number, world: World): Vec | null {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    if (this.side === 'left' || this.side === 'right') {
      const wx = this.side === 'left' ? 0 : world.width;
      if (dx === 0) return null;
      const t = (wx - pos.x) / dx;
      if (t <= 0) return null;
      const y = Math.max(0, Math.min(world.height, pos.y + dy * t));
      return { x: wx, y };
    } else {
      const wy = this.side === 'top' ? 0 : world.height;
      if (dy === 0) return null;
      const t = (wy - pos.y) / dy;
      if (t <= 0) return null;
      const x = Math.max(0, Math.min(world.width, pos.x + dx * t));
      return { x, y: wy };
    }
  }
}
