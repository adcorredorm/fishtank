# fishtank — pecera artificial (Alife)

Pecera artificial didáctica del semillero de Vida Artificial. Va por la **Iteración 2**:
sobre la plataforma viva (presa/depredador con energía) ya crecen **plantas como L-systems**
ancladas al fondo, que son la base renovable de la cadena alimenticia. Quedan por delante
las demás líneas (genoma/comportamiento programable, evolución, pieles por reacción-difusión).

## Requisitos

**Node.js ≥ 18** (incluye `npm`). 
[nodejs.org/en/download](https://nodejs.org/en/download).

## Cómo iniciar

```bash
node -v             # Verifica la version de node e.g v25.6.1
npm -v              # Verifica la version de npm e.g 11.9.0
npm install         # Instala dependencias del proyecto como Typescrpy, Vite, etc
npm run dev         # Abre el servidor de desarrollo e.g http://localhost:5173
```

### Otros comandos
```bash
npm run build       # empaqueta la aplicación a dist/
npm run test        # corre las pruebas con Vitest
npm run typecheck   # chequea los tipos sin compilar (tsc --noEmit)
```

> Nota: la app compilada (`dist/`) es HTML/CSS/JS **estático**: para *servirla* no se necesita
> ninguna dependencia. Vite, TypeScript y Vitest son herramientas de desarrollo.

## Uso

- **Escenario:** elige un preset (define el tanque, las especies y la semilla por defecto).
- **Animar / Pausar / Reset.** Reset reconstruye la corrida desde cero (reproducible por semilla).
- **Semilla:** misma semilla + mismo escenario = misma corrida exacta.
- **Velocidad:** ritmo de simulación (ticks por segundo).
- **Cono de visión:** muestra lo que cada pez puede percibir (útil para depurar `act()`).
- **Inspector:** haz clic en un pez o una planta para seleccionarlo; el panel lateral muestra
  sus valores en vivo (genoma, energía, edad; nivel y crecimiento si es planta). Para un pez,
  lista además lo que percibe en ese tick: cada pez o planta de esa lista es seleccionable.

> Sin reproducción todavía: la pecera corre hasta extinguirse. La reproducción/evolución
> llegan en una iteración posterior.

## Ejercicios

En esta iteración hay **un ejercicio** que se entrega en blanco (la solución no está en el
repo). El archivo y las funciones a implementar:

- **Archivo:** `src/world/Grammar.ts` (la clase `Grammar`)
- **Métodos a implementar:**
  - `deriveStep(string)` — aplica un paso de derivación del L-system: reemplaza cada símbolo
    por el sucesor de su regla (identidad si no tiene; elección por probabilidad `p` con
    varias opciones). Lee las reglas de `this.rules`.
  - `deriveAll(n)` — aplica `n` pasos desde `this.axiom` y devuelve `[axiom, paso1, …, pasoN]`.
- **Aleatoriedad:** Se sugiere importar el singleton del repo:
  `import { random } from '../utilities/rng'`.
- **Cómo verificar:** `npm run test`. Las pruebas marcadas `[EJERCICIO]` (en
  `tests/grammar.test.ts`) están **rojas a propósito** y se ponen verdes al implementar la
  derivación. Mientras tanto, las plantas se ven como brotes que no crecen.

### Seams para experimentar (sin solución requerida)

- **Política de crecimiento:** `Plant.grow()` en `src/world/Plant.ts` (por defecto sube un
  nivel cada `growthInterval` ticks). Cámbiala para crecer al azar o con otra distribución.
- **Gramática y color:** en `src/world/config.ts`, `plants.grammar` (axioma + reglas) y
  `plants.color`. La gramática por defecto es vertical sin ramas (`F → AF`); agrega `[`, `]`,
  `+`, `-` para ramificar.

## Estructura

```
src/
├── utilities/   rng.ts (singleton RNG sembrado), vec.ts (vectores 2D y geometría angular)
├── world/       Food.ts, Plant.ts (planta L-system), Grammar.ts (EJERCICIO: derivación),
│                Turtle.ts (interpretación geométrica), Wall.ts, config.ts, Tank.ts
├── agents/      Fish.ts (base, Consumable), Prey.ts, Predator.ts  ← comportamiento (act)
├── render/      Renderer.ts (dibujo del canvas)
├── main.ts      punto de entrada y UI
└── types.ts     interfaces (Vec, Genome, Inputs, World, Scenario…)
```

## Coordenadas y escala

Hay que distinguir dos espacios:

- **Mundo** — el tanque tiene un tamaño *fijo* en unidades de simulación (lo define
  `tank` en el escenario, p. ej. `800×500`). Las posiciones de los peces (`x`, `y`) viven
  aquí. Es fijo a propósito: **no depende de la pantalla**, así la misma semilla produce la
  misma corrida en cualquier monitor y la densidad de población es siempre la misma.
- **Canvas** — los píxeles reales en pantalla. Ocupa todo el contenedor disponible.

`Renderer.draw()` calcula un único factor de escala para **ajustar el mundo dentro del
canvas** conservando la proporción y centrándolo (si las proporciones no coinciden, quedan
franjas tipo *letterbox*). Todo el dibujo ocurre en **coordenadas de mundo**; la
transformación lo lleva a píxeles. Por eso el resto del código usa `fish.x`/`fish.y` sin
saber el tamaño real del canvas.

## Cómo extender

- **Nueva especie:** crea una subclase de `Fish` en `src/agents/` con su `act()`, y
  agrégala a un escenario en `src/world/config.ts` (con su `genome` y `diet`).
- **Nuevo escenario:** añade un objeto al array `scenarios` en `src/world/config.ts`.
