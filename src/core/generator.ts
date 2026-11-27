import {cloneBoard, countEmptyCells, createEmptyBoard} from './state';
import {validateBoard} from './validator';
import {
  BOX_SIZE,
  EMPTY_VALUE,
  GeneratedPuzzle,
  GRID_SIZE,
  TOTAL_CELLS,
} from './types';

/**
 * Generador pseudoaleatorio Mulberry32 para pruebas reproducibles cuando se provee semilla.
 */
function createRng(seed?: number): () => number {
  if (seed === undefined) {
    return () => Math.random();
  }
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function countBits16(mask: number): number {
  let n = mask;
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}

const ALL_16_MASK = (1 << GRID_SIZE) - 1;

/**
 * Genera un tablero completo válido 16x16 de forma aleatoria.
 * Estrategia:
 * 1) Rellena aleatoriamente las 4 cajas diagonales 4x4 (independientes entre sí).
 * 2) Completa las 192 casillas restantes mediante restricciones por máscaras de bits.
 */
export function generateCompleteBoard(rng: () => number = Math.random): Uint8Array {
  for (let attempt = 0; attempt < 25; attempt++) {
    const board = createEmptyBoard();
    const rowMask = new Uint16Array(GRID_SIZE);
    const colMask = new Uint16Array(GRID_SIZE);
    const boxMask = new Uint16Array(GRID_SIZE);

    // Llenar las 4 cajas diagonales 4x4 sin conflictos mutuos
    for (let d = 0; d < BOX_SIZE; d++) {
      const vals = shuffleInPlace(
        Array.from({length: GRID_SIZE}, (_, i) => i + 1),
        rng
      );
      const startRow = d * BOX_SIZE;
      const startCol = d * BOX_SIZE;
      const boxIdx = d * BOX_SIZE + d;
      let k = 0;
      for (let dr = 0; dr < BOX_SIZE; dr++) {
        for (let dc = 0; dc < BOX_SIZE; dc++) {
          const r = startRow + dr;
          const c = startCol + dc;
          const val = vals[k++];
          const bit = 1 << (val - 1);
          board[r * GRID_SIZE + c] = val;
          rowMask[r] |= bit;
          colMask[c] |= bit;
          boxMask[boxIdx] |= bit;
        }
      }
    }

    let steps = 0;
    const maxSteps = 8000;

    const fillRemaining = (): boolean => {
      if (++steps > maxSteps) return false;

      let bestIdx = -1;
      let bestCandidatesMask = 0;
      let minCount = GRID_SIZE + 1;

      for (let i = 0; i < TOTAL_CELLS; i++) {
        if (board[i] !== EMPTY_VALUE) continue;
        const r = Math.floor(i / GRID_SIZE);
        const c = i % GRID_SIZE;
        const b = Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);
        const availMask =
          ALL_16_MASK & ~(rowMask[r] | colMask[c] | boxMask[b]);
        const count = countBits16(availMask);
        if (count === 0) return false;
        if (count < minCount) {
          minCount = count;
          bestIdx = i;
          bestCandidatesMask = availMask;
          if (count === 1) break;
        }
      }

      if (bestIdx === -1) return true;

      const r = Math.floor(bestIdx / GRID_SIZE);
      const c = bestIdx % GRID_SIZE;
      const b = Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);

      const candidates: number[] = [];
      for (let val = 1; val <= GRID_SIZE; val++) {
        if ((bestCandidatesMask & (1 << (val - 1))) !== 0) {
          candidates.push(val);
        }
      }
      if (candidates.length > 1) shuffleInPlace(candidates, rng);

      for (const val of candidates) {
        const bit = 1 << (val - 1);
        board[bestIdx] = val;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[b] |= bit;

        if (fillRemaining()) return true;

        board[bestIdx] = EMPTY_VALUE;
        rowMask[r] &= ~bit;
        colMask[c] &= ~bit;
        boxMask[b] &= ~bit;
      }
      return false;
    };

    if (fillRemaining()) {
      return board;
    }
  }

  throw new Error('No fue posible generar un tablero completo 16x16 válido.');
}

/**
 * Contador interno exclusivo del generador para verificar unicidad de solución.
 * Se detiene inmediatamente al detectar 2 soluciones distintas.
 * NO se utiliza para simular ni sustituir a BFS o DFS.
 */
export function countSolutionsUpToTwo(
  board: Uint8Array,
  maxSteps = 40000
): {count: number; aborted: boolean} {
  const work = cloneBoard(board);
  const rowMask = new Uint16Array(GRID_SIZE);
  const colMask = new Uint16Array(GRID_SIZE);
  const boxMask = new Uint16Array(GRID_SIZE);

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const val = work[i];
    if (val === EMPTY_VALUE) continue;
    const r = Math.floor(i / GRID_SIZE);
    const c = i % GRID_SIZE;
    const b = Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);
    const bit = 1 << (val - 1);
    if (
      (rowMask[r] & bit) !== 0 ||
      (colMask[c] & bit) !== 0 ||
      (boxMask[b] & bit) !== 0
    ) {
      return {count: 0, aborted: false};
    }
    rowMask[r] |= bit;
    colMask[c] |= bit;
    boxMask[b] |= bit;
  }

  let solutions = 0;
  let steps = 0;
  let aborted = false;

  const search = (): void => {
    if (solutions >= 2 || aborted) return;
    if (++steps > maxSteps) {
      aborted = true;
      return;
    }

    let bestIdx = -1;
    let bestMask = 0;
    let minCount = GRID_SIZE + 1;

    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (work[i] !== EMPTY_VALUE) continue;
      const r = Math.floor(i / GRID_SIZE);
      const c = i % GRID_SIZE;
      const b = Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);
      const avail = ALL_16_MASK & ~(rowMask[r] | colMask[c] | boxMask[b]);
      const cnt = countBits16(avail);
      if (cnt === 0) return;
      if (cnt < minCount) {
        minCount = cnt;
        bestIdx = i;
        bestMask = avail;
        if (cnt === 1) break;
      }
    }

    if (bestIdx === -1) {
      solutions++;
      return;
    }

    const r = Math.floor(bestIdx / GRID_SIZE);
    const c = bestIdx % GRID_SIZE;
    const b = Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);

    for (let val = 1; val <= GRID_SIZE; val++) {
      const bit = 1 << (val - 1);
      if ((bestMask & bit) === 0) continue;

      work[bestIdx] = val;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;

      search();

      work[bestIdx] = EMPTY_VALUE;
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      boxMask[b] &= ~bit;

      if (solutions >= 2 || aborted) return;
    }
  };

  search();
  return {count: solutions, aborted};
}

/**
 * Genera un problema de Sudoku 16x16:
 * 1. Crea un tablero completo válido aleatorio.
 * 2. Elimina la cantidad solicitada de casillas en orden aleatorio.
 * 3. Verifica en cada eliminación que la solución siga siendo única.
 * 4. Devuelve únicamente el tablero inicial enmascarado (sin solución precalculada).
 */
export function generateSudokuPuzzle(
  emptyCountRequested: number,
  seed?: number
): GeneratedPuzzle {
  const start = performance.now();
  const rng = createRng(seed);
  const clampedTarget = Math.max(1, Math.min(140, Math.floor(emptyCountRequested)));

  const puzzle = generateCompleteBoard(rng);
  const indices = shuffleInPlace(
    Array.from({length: TOTAL_CELLS}, (_, i) => i),
    rng
  );

  let removed = 0;
  for (const idx of indices) {
    if (removed >= clampedTarget) break;
    const saved = puzzle[idx];
    puzzle[idx] = EMPTY_VALUE;

    const uniqueness = countSolutionsUpToTwo(puzzle);
    if (!uniqueness.aborted && uniqueness.count === 1) {
      removed++;
    } else {
      // Restaurar si se pierde la unicidad de la solución
      puzzle[idx] = saved;
    }
  }

  const finalCheck = countSolutionsUpToTwo(puzzle);
  const validation = validateBoard(puzzle);
  const generationTimeMs = performance.now() - start;

  return {
    initialBoard: puzzle,
    emptyCountRequested: clampedTarget,
    emptyCountActual: countEmptyCells(puzzle),
    isUnique: !finalCheck.aborted && finalCheck.count === 1,
    validation,
    generationTimeMs,
  };
}
