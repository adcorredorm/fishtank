// Dibuja la pecera en un canvas 2D (vista lateral). La gráfica es plataforma: formas
// simples. El pez se dibuja con forma de pez (cuerpo elíptico + cola) para que escale bien.
import type { Tank } from '../world/Tank';
import { Fish } from '../agents/Fish';
import { Plant } from '../world/Plant';
import type { Vec } from '../types';
import { fitTransform, screenToWorld } from './transform';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  showVision = false; // toggle de depuración del cono

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  draw(tank: Tank, selected: Fish | Plant | null = null): void {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Escala el mundo (tamaño fijo del escenario) para ajustarlo al canvas conservando la
    // proporción y centrándolo (letterbox). Dentro del save/restore se dibuja en COORDENADAS
    // DE MUNDO. Detalle: README › Coordenadas y escala.
    const { scale, offsetX, offsetY } = fitTransform(cw, ch, tank.width, tank.height);

    // fondo detrás del mundo (cubre las franjas del letterbox)
    ctx.fillStyle = '#061219';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // De aquí en adelante: coordenadas de mundo (0..tank.width, 0..tank.height).
    // fondo de agua
    const grad = ctx.createLinearGradient(0, 0, 0, tank.height);
    grad.addColorStop(0, '#0d2436');
    grad.addColorStop(1, '#08161f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, tank.width, tank.height);

    // plantas (ancladas al fondo; polilínea de sus segmentos en coords de mundo)
    for (const plant of tank.plants) {
      ctx.strokeStyle = plant.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const s of plant.segments) {
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(s.x1, s.y1);
      }
      ctx.stroke();
    }

    // comida flotante (secundaria → tenue)
    ctx.fillStyle = 'rgba(155,211,98,0.55)';
    for (const f of tank.food) {
      ctx.beginPath();
      ctx.arc(f.pos.x, f.pos.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // peces
    for (const fish of tank.fish) this.#drawFish(fish);

    // realce de la entidad seleccionada por el inspector (anillo de acento, en coords de mundo)
    if (selected) {
      ctx.strokeStyle = '#4a90c4'; // --accent-2
      ctx.lineWidth = 2 / scale;   // grosor constante en píxeles pese a la escala del mundo
      ctx.beginPath();
      if (selected instanceof Fish) {
        ctx.arc(selected.x, selected.y, selected.size * 2.2, 0, Math.PI * 2);
      } else if (selected instanceof Plant) {
        ctx.arc(selected.base.x, selected.base.y, selected.contactRadius * 2.5, 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /** Convierte un punto en píxeles del canvas a coordenadas de mundo (para la selección). */
  canvasToWorld(px: number, py: number, tank: Tank): Vec {
    return screenToWorld(px, py, fitTransform(this.canvas.width, this.canvas.height, tank.width, tank.height));
  }

  #drawFish(fish: Fish): void {
    const ctx = this.ctx;
    const s = fish.size;
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(fish.heading);

    if (this.showVision) {
      const v = fish.genome.vision;
      ctx.fillStyle = 'rgba(74,144,196,0.12)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, v.range, -v.angle / 2, v.angle / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = fish.genome.color;
    // cuerpo
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.6, s, 0, 0, Math.PI * 2);
    ctx.fill();
    // cola (triángulo hacia atrás)
    ctx.beginPath();
    ctx.moveTo(-s * 1.6, 0);
    ctx.lineTo(-s * 2.6, -s * 0.8);
    ctx.lineTo(-s * 2.6, s * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
