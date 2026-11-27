import {valueToSymbol} from './state';
import {
  BOX_SIZE,
  BoardConflict,
  BoardValidation,
  EMPTY_VALUE,
  GRID_SIZE,
  TOTAL_CELLS,
} from './types';

/**
 * Calcula una máscara de bits (16 bits) con los símbolos ya presentes
 * en la fila `row`, columna `col` y subregión 4x4 correspondiente.
 */
export function getUsedMaskForCell(
  board: Uint8Array,
  row: number,
  col: number
): number {
  let usedMask = 0;

  // Restricción de fila
  const rowOffset = row * GRID_SIZE;
  for (let c = 0; c < GRID_SIZE; c++) {
    const val = board[rowOffset + c];
    if (val !== EMPTY_VALUE) usedMask |= 1 << (val - 1);
  }

  // Restricción de columna
  for (let r = 0; r < GRID_SIZE; r++) {
    const val = board[r * GRID_SIZE + col];
    if (val !== EMPTY_VALUE) usedMask |= 1 << (val - 1);
  }

  // Restricción de región 4x4
  const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxColStart = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let dr = 0; dr < BOX_SIZE; dr++) {
    const base = (boxRowStart + dr) * GRID_SIZE + boxColStart;
    for (let dc = 0; dc < BOX_SIZE; dc++) {
      const val = board[base + dc];
      if (val !== EMPTY_VALUE) usedMask |= 1 << (val - 1);
    }
  }

  return usedMask;
}

/**
 * Obtiene la lista ordenada de candidatos válidos (1..16) para la casilla (row, col),
 * respetando fila, columna y subregión 4x4.
 */
export function getValidCandidates(
  board: Uint8Array,
  row: number,
  col: number
): number[] {
  if (board[row * GRID_SIZE + col] !== EMPTY_VALUE) return [];
  const usedMask = getUsedMaskForCell(board, row, col);
  const candidates: number[] = [];
  for (let val = 1; val <= GRID_SIZE; val++) {
    if ((usedMask & (1 << (val - 1))) === 0) {
      candidates.push(val);
    }
  }
  return candidates;
}

/**
 * Valida integralmente un tablero 16x16:
 * - Ninguna fila contiene símbolos repetidos.
 * - Ninguna columna contiene símbolos repetidos.
 * - Ninguna región 4x4 contiene símbolos repetidos.
 * - Contabiliza las casillas vacías para determinar si está completo.
 */
export function validateBoard(board: Uint8Array): BoardValidation {
  const conflicts: BoardConflict[] = [];
  if (board.length !== TOTAL_CELLS) {
    return {
      isValid: false,
      isComplete: false,
      emptyCount: TOTAL_CELLS,
      conflicts: [{type: 'row', index: 0, symbol: '?'}],
    };
  }

  let emptyCount = 0;

  // Validar filas
  for (let r = 0; r < GRID_SIZE; r++) {
    let seen = 0;
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = board[r * GRID_SIZE + c];
      if (val === EMPTY_VALUE) {
        emptyCount++;
        continue;
      }
      if (val < 1 || val > GRID_SIZE) {
        conflicts.push({type: 'row', index: r, symbol: String(val)});
        continue;
      }
      const bit = 1 << (val - 1);
      if ((seen & bit) !== 0) {
        conflicts.push({type: 'row', index: r, symbol: valueToSymbol(val)});
      }
      seen |= bit;
    }
  }

  // Validar columnas
  for (let c = 0; c < GRID_SIZE; c++) {
    let seen = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      const val = board[r * GRID_SIZE + c];
      if (val === EMPTY_VALUE || val < 1 || val > GRID_SIZE) continue;
      const bit = 1 << (val - 1);
      if ((seen & bit) !== 0) {
        conflicts.push({type: 'col', index: c, symbol: valueToSymbol(val)});
      }
      seen |= bit;
    }
  }

  // Validar 16 regiones de 4x4
  for (let boxIdx = 0; boxIdx < GRID_SIZE; boxIdx++) {
    const boxRowStart = Math.floor(boxIdx / BOX_SIZE) * BOX_SIZE;
    const boxColStart = (boxIdx % BOX_SIZE) * BOX_SIZE;
    let seen = 0;
    for (let dr = 0; dr < BOX_SIZE; dr++) {
      for (let dc = 0; dc < BOX_SIZE; dc++) {
        const val = board[(boxRowStart + dr) * GRID_SIZE + (boxColStart + dc)];
        if (val === EMPTY_VALUE || val < 1 || val > GRID_SIZE) continue;
        const bit = 1 << (val - 1);
        if ((seen & bit) !== 0) {
          conflicts.push({
            type: 'box',
            index: boxIdx,
            symbol: valueToSymbol(val),
          });
        }
        seen |= bit;
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    isComplete: emptyCount === 0,
    emptyCount,
    conflicts,
  };
}

/**
 * Comprueba que un tablero solución:
 * 1) No tenga casillas vacías.
 * 2) Cumpla todas las restricciones de filas, columnas y regiones 4x4.
 * 3) Conserve intactas todas las pistas del tablero inicial.
 */
export function validateSolutionAgainstInitial(
  initialBoard: Uint8Array,
  solutionBoard: Uint8Array
): boolean {
  const check = validateBoard(solutionBoard);
  if (!check.isValid || !check.isComplete) return false;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (
      initialBoard[i] !== EMPTY_VALUE &&
      initialBoard[i] !== solutionBoard[i]
    ) {
      return false;
    }
  }
  return true;
}
