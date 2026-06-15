# fishtank — pecera artificial (Alife)

Pecera artificial didáctica del semillero de Vida Artificial. Esta es la **Iteración 1**:
la plataforma viva (presa/depredador con energía), base sobre la que se construirán las
demás líneas (plantas L-system, genoma/comportamiento programable, evolución, pieles por
reacción-difusión).

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

> Sin reproducción todavía: la pecera corre hasta extinguirse. La reproducción/evolución
> llegan en una iteración posterior.

## Estructura

```
src/
├── utilities/   rng.ts (singleton RNG sembrado), vec.ts (vectores 2D y geometría angular)
├── world/       Food.ts, Wall.ts, config.ts (escenarios), Tank.ts (mundo y ecología)
├── agents/      Fish.ts (base), Prey.ts, Predator.ts  ← aquí se programa el comportamiento (act)
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
