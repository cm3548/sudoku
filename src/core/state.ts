import {
  EMPTY_SYMBOL,
  EMPTY_VALUE,
  GRID_SIZE,
  SYMBOLS,
  TOTAL_CELLS,
} from './types';

/**
 * Crea un tablero 16x16 vacío (256 ceros en un Uint8Array compacto).
 */
export function createEmptyBoard(): Uint8Array {
  return new Uint8Array(TOTAL_CELLS);
}

/**
 * Realiza una copia independiente del tablero para evitar mutaciones cruzadas
 * entre nodos del árbol o entre los algoritmos BFS y DFS.
 */
export function cloneBoard(board: Uint8Array): Uint8Array {
  return new Uint8Array(board);
}

/**
 * Compara dos tableros celda a celda para verificar que sean idénticos.
 */
export function boardsEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Convierte un valor numérico interno (0..16) a su representación simbólica ('.', '1'..'G').
 */
export function valueToSymbol(value: number): string {
  if (value === EMPTY_VALUE) return EMPTY_SYMBOL;
  return SYMBOLS[value - 1] ?? EMPTY_SYMBOL;
}

/**
 * Convierte un símbolo ('1'..'G' o '.') a su valor interno (0..16).
 */
export function symbolToValue(symbol: string): number {
  const normalized = symbol.trim().toUpperCase();
  if (normalized === EMPTY_SYMBOL || normalized === '-' || normalized === '0') {
    return EMPTY_VALUE;
  }
  const idx = SYMBOLS.indexOf(normalized as (typeof SYMBOLS)[number]);
  return idx >= 0 ? idx + 1 : EMPTY_VALUE;
}

/**
 * Cuenta cuántas casillas vacías existen actualmente en el tablero.
 */
export function countEmptyCells(board: Uint8Array): number {
  let empty = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY_VALUE) empty++;
  }
  return empty;
}

/**
 * Política determinista de selección de siguiente casilla vacía:
 * orden por filas (row-major: de arriba a abajo, de izquierda a derecha).
 * Se aplica exactamente igual en BFS y DFS para garantizar una comparación justa
 * sin heurísticas que alteren el orden de expansión.
 */
export function findNextEmptyCell(
  board: Uint8Array
): {row: number; col: number; index: number} | null {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] === EMPTY_VALUE) {
      return {
        row: Math.floor(i / GRID_SIZE),
        col: i % GRID_SIZE,
        index: i,
      };
    }
  }
  return null;
}

/**
 * Convierte el arreglo plano de 256 posiciones en una matriz 16x16 de símbolos legibles.
 */
export function boardToMatrix(board: Uint8Array): string[][] {
  const matrix: string[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: string[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push(valueToSymbol(board[r * GRID_SIZE + c]));
    }
    matrix.push(row);
  }
  return matrix;
}
