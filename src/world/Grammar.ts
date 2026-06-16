// Gramática de un L-system (reescritura de strings).
import type { Rules } from '../types';

export class Grammar {
  readonly axiom: string;
  readonly rules: Rules;
  /**
   * @param axiom String inicial (nivel 0 de la derivación).
   * @param rules Reglas de reescritura ({@link Rules}); las `p` de cada símbolo suman 1.
   */
  constructor({ axiom, rules }: { axiom: string; rules: Rules }) {
    this.axiom = axiom;
    this.rules = rules;
  }

  /**
   * Aplica un paso de derivación a `string`: reemplaza cada símbolo por el `successor` de su
   * regla en `this.rules`. Los símbolos sin regla se copian igual (identidad). Cuando un
   * símbolo tiene varias opciones, se elige una según su probabilidad `p` usando `random()`.
   * @param string String a derivar (no necesariamente el axioma).
   * @returns Nuevo string con cada símbolo expandido.
   */
  deriveStep(string: string): string {
    // TODO:
    return string;
  }

  /**
   * Aplica `n` pasos de {@link deriveStep} desde el axioma y devuelve TODOS los strings
   * intermedios: `[axiom, paso1, …, pasoN]` (n+1 elementos).
   * @param n Cantidad de pasos a derivar.
   * @returns Arreglo de n+1 strings.
   */
  deriveAll(n: number): string[] {
    // TODO: partir de [this.axiom] y aplicar deriveStep n veces, acumulando cada resultado.
    return [this.axiom];
  }
}
