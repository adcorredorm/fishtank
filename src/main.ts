// Une la UI con el motor: arma el Tank desde el escenario elegido, corre el bucle a la
// velocidad de tick configurada, y actualiza el HUD. Sin estado persistente: todo deriva
// del escenario + semilla, así que Reset reconstruye una corrida idéntica.
import './styles.css';
import { Tank } from './world/Tank';
import { Renderer } from './render/Renderer';
import { scenarios } from './world/config';
import { Fish } from './agents/Fish';
import type { Plant } from './world/Plant';
import { pickEntity } from './render/pickEntity';
import { describeEntity, type InspectorModel } from './render/describeEntity';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

let tank: Tank | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let playing = false;
let selected: Fish | Plant | null = null;
let justDied = false; // true si el pez seleccionado acaba de morir/ser comido (mensaje en el panel)

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
  selected = null;
  justDied = false;
  renderer.draw(tank, selected);
  updateHud();
  renderInspector();
}

function tickOnce(): void {
  if (!tank) return;
  tank.step();
  // si el pez seleccionado murió o fue comido, el Tank ya lo retiró → deseleccionar y avisar
  if (selected instanceof Fish && !tank.fish.includes(selected)) {
    selected = null;
    justDied = true;
  }
  renderer.draw(tank, selected);
  updateHud();
  renderInspector();
  if (tank.fish.length === 0) stop();
}

function updateHud(): void {
  if (!tank) return;
  const p = tank.population();
  const lines = [`tick: ${p.tick}`];
  for (const [name, n] of Object.entries(p.fish)) lines.push(`${name}: ${n}`);
  (document.getElementById('hud') as HTMLElement).textContent = lines.join('\n');
}

function renderInspector(): void {
  const body = document.getElementById('inspector-body') as HTMLElement;
  if (!tank || !selected) {
    body.className = 'muted';
    body.textContent = justDied ? 'el pez seleccionado murió' : 'clic en un pez o planta para inspeccionar';
    return;
  }
  body.className = '';
  body.innerHTML = '';
  const m: InspectorModel = describeEntity(selected, tank);

  const title = document.createElement('div');
  title.className = 'insp-section';
  title.textContent = m.title;
  body.appendChild(title);

  for (const r of m.rows) body.appendChild(rowEl(r.label, r.value, r.isColor));

  if (m.perceived) {
    const head = document.createElement('div');
    head.className = 'insp-section';
    head.textContent = 'percibe';
    body.appendChild(head);

    if (m.perceived.clickable.length === 0) {
      const none = document.createElement('div');
      none.className = 'muted';
      none.textContent = 'nada a la vista';
      body.appendChild(none);
    }
    for (const item of m.perceived.clickable) {
      const el = document.createElement('div');
      el.className = 'list-item';
      const name = item.kind === 'fish' ? item.ref.constructor.name : 'Planta';
      const heading = item.heading === undefined ? '' : ` h=${item.heading.toFixed(2)}`;
      el.innerHTML = `<span class="label">${name}</span>dir=${item.dir.toFixed(2)} dist=${item.dist.toFixed(0)}${heading}`;
      el.addEventListener('click', () => { selected = item.ref; justDied = false; renderer.draw(tank!, selected); renderInspector(); });
      body.appendChild(el);
    }

    const ctx = document.createElement('div');
    ctx.className = 'muted';
    ctx.style.marginTop = '6px';
    ctx.textContent = m.perceived.context;
    body.appendChild(ctx);
  }
}

function rowEl(label: string, value: string, isColor?: boolean): HTMLElement {
  const row = document.createElement('div');
  row.className = 'insp-row';
  const k = document.createElement('span');
  k.className = 'k';
  k.textContent = label;
  const v = document.createElement('span');
  v.className = 'v';
  if (isColor) {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = value;
    v.appendChild(sw);
    v.appendChild(document.createTextNode(value));
  } else {
    v.textContent = value;
  }
  row.appendChild(k);
  row.appendChild(v);
  return row;
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
canvas.addEventListener('click', (e) => {
  if (!tank) return;
  const rect = canvas.getBoundingClientRect();
  // de CSS px (evento) a píxeles reales del canvas (devicePixelRatio ya está en canvas.width)
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const world = renderer.canvasToWorld(px, py, tank);
  selected = pickEntity(world, tank, 6);
  justDied = false;
  renderer.draw(tank, selected);
  renderInspector();
});

reset();
