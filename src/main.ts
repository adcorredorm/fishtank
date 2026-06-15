// Une la UI con el motor: arma el Tank desde el escenario elegido, corre el bucle a la
// velocidad de tick configurada, y actualiza el HUD. Sin estado persistente: todo deriva
// del escenario + semilla, así que Reset reconstruye una corrida idéntica.
import './styles.css';
import { Tank } from './world/Tank';
import { Renderer } from './render/Renderer';
import { scenarios } from './world/config';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

let tank: Tank | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let playing = false;

function buildScenario() {
  const base = scenarios[Number((document.getElementById('scenario-select') as HTMLSelectElement).value)];
  // Solo sobreescribimos la semilla; el tamaño del mundo lo fija el escenario. (README › Coordenadas y escala)
  return Object.assign({}, base, {
    seed: Number((document.getElementById('seed') as HTMLInputElement).value),
  });
}

function reset(): void {
  stop();
  const scenario = buildScenario();
  // Canvas = píxeles del contenedor × devicePixelRatio (nitidez en HiDPI). (README › Coordenadas y escala)
  const stage = document.getElementById('stage') as HTMLElement;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(stage.clientWidth * dpr));
  canvas.height = Math.max(1, Math.floor(stage.clientHeight * dpr));
  tank = new Tank(scenario);
  renderer.draw(tank);
  updateHud();
}

function tickOnce(): void {
  if (!tank) return;
  tank.step();
  renderer.draw(tank);
  updateHud();
  if (tank.fish.length === 0) stop();
}

function updateHud(): void {
  if (!tank) return;
  const p = tank.population();
  const lines = [`tick: ${p.tick}`];
  for (const [name, n] of Object.entries(p.fish)) lines.push(`${name}: ${n}`);
  (document.getElementById('hud') as HTMLElement).textContent = lines.join('\n');
}

function play(): void {
  if (playing) return;
  playing = true;
  (document.getElementById('btn-play') as HTMLButtonElement).textContent = '⏸ Pausar';
  const fps = Number((document.getElementById('speed') as HTMLInputElement).value);
  timer = setInterval(tickOnce, 1000 / fps);
}

function stop(): void {
  playing = false;
  (document.getElementById('btn-play') as HTMLButtonElement).textContent = '▶ Animar';
  if (timer) { clearInterval(timer); timer = null; }
}

function togglePlay(): void { playing ? stop() : play(); }

// ── wiring ──
scenarios.forEach((s, i) => {
  const opt = document.createElement('option');
  opt.value = String(i); opt.textContent = s.name;
  (document.getElementById('scenario-select') as HTMLSelectElement).appendChild(opt);
});
(document.getElementById('btn-play') as HTMLButtonElement).addEventListener('click', togglePlay);
(document.getElementById('btn-reset') as HTMLButtonElement).addEventListener('click', reset);
(document.getElementById('scenario-select') as HTMLSelectElement).addEventListener('change', reset);
(document.getElementById('seed') as HTMLInputElement).addEventListener('change', reset);
(document.getElementById('speed') as HTMLInputElement).addEventListener('input', () => {
  const speedEl = document.getElementById('speed') as HTMLInputElement;
  (document.getElementById('speed-out') as HTMLOutputElement).value = speedEl.value;
  if (playing) { stop(); play(); } // re-temporizar a la nueva velocidad
});
(document.getElementById('show-vision') as HTMLInputElement).addEventListener('change', (e) => {
  renderer.showVision = (e.target as HTMLInputElement).checked;
  if (!playing && tank) renderer.draw(tank);
});
window.addEventListener('resize', reset);

reset();
