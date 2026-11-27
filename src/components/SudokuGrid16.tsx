import React from 'react';
import {valueToSymbol} from '../core/state';
import {EMPTY_VALUE, GRID_SIZE} from '../core/types';

interface SudokuGrid16Props {
  board: Uint8Array;
  initialBoard?: Uint8Array;
  highlightCell?: {row: number; col: number} | null;
  accent?: 'sky' | 'violet' | 'slate';
  compact?: boolean;
  ariaLabel?: string;
}

export const SudokuGrid16: React.FC<SudokuGrid16Props> = ({
  board,
  initialBoard,
  highlightCell = null,
  accent = 'sky',
  compact = false,
  ariaLabel = 'Tablero Sudoku 16 por 16',
}) => {
  const solvedCellClass =
    accent === 'violet'
      ? 'text-violet-700 bg-violet-50/70 font-semibold'
      : accent === 'sky'
        ? 'text-sky-700 bg-sky-50/70 font-semibold'
        : 'text-slate-900 font-semibold';

  const cellSizeClass = compact
    ? 'w-5 h-5 text-[10px] sm:w-5 sm:h-5'
    : 'w-6 h-6 text-[11px] sm:w-7 sm:h-7 sm:text-xs md:w-8 md:h-8 md:text-sm';

  return (
    <div
      className="inline-block overflow-x-auto max-w-full rounded-lg border-2 border-slate-800 bg-white shadow-xs"
      role="grid"
      aria-label={ariaLabel}
    >
      <div className="grid grid-cols-16 w-max">
        {Array.from({length: GRID_SIZE * GRID_SIZE}, (_, idx) => {
          const row = Math.floor(idx / GRID_SIZE);
          const col = idx % GRID_SIZE;
          const val = board[idx] ?? EMPTY_VALUE;
          const sym = valueToSymbol(val);
          const isInitial = initialBoard ? initialBoard[idx] !== EMPTY_VALUE : val !== EMPTY_VALUE;
          const isEmpty = val === EMPTY_VALUE;
          const isHighlighted =
            highlightCell !== null &&
            highlightCell.row === row &&
            highlightCell.col === col;

          // Bordes gruesos cada 4 filas y 4 columnas para delimitar las 16 regiones 4x4
          const borderRight =
            col === GRID_SIZE - 1
              ? ''
              : col % 4 === 3
                ? 'border-r-2 border-r-slate-800'
                : 'border-r border-r-slate-200';
          const borderBottom =
            row === GRID_SIZE - 1
              ? ''
              : row % 4 === 3
                ? 'border-b-2 border-b-slate-800'
                : 'border-b border-b-slate-200';

          let cellStyle = 'bg-white text-slate-400';
          if (isHighlighted) {
            cellStyle = 'bg-amber-100 text-amber-950 font-bold ring-2 ring-inset ring-amber-600';
          } else if (!isEmpty) {
            cellStyle = isInitial
              ? 'bg-slate-100/80 text-slate-900 font-semibold'
              : solvedCellClass;
          }

          return (
            <div
              key={idx}
              role="gridcell"
              title={`Fila ${row + 1}, Columna ${col + 1}: ${isEmpty ? 'Vacía (.)' : sym}`}
              className={`${cellSizeClass} flex items-center justify-center font-mono-tabular select-none ${borderRight} ${borderBottom} ${cellStyle}`}
            >
              {sym}
            </div>
          );
        })}
      </div>
    </div>
  );
};
