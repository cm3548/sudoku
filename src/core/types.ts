/**
 * Tipos y constantes fundamentales para la representación del Sudoku 16x16
 * como problema de búsqueda en espacio de estados.
 */

export const GRID_SIZE = 16;
export const BOX_SIZE = 4;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; // 256 casillas

/**
 * Conjunto de 16 símbolos válidos del Sudoku 16x16:
 * índices internos 1..16 corresponden a '1'..'9' y 'A'..'G'.
 * El valor interno 0 representa una casilla vacía.
 */
export const SYMBOLS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
] as const;

export const EMPTY_VALUE = 0;
export const EMPTY_SYMBOL = '.';

export type AlgorithmType = 'BFS' | 'DFS';

export type NodeStatus = 'generated' | 'explored' | 'solution';

export interface Move {
  row: number; // 0..15
  col: number; // 0..15
  value: number; // 1..16
  symbol: string; // '1'..'G'
}

export interface SearchNode {
  id: number;
  parentId: number | null;
  depth: number;
  move: Move | null;
  board: Uint8Array;
  status: NodeStatus;
  orderGenerated: number;
  orderExplored: number | null;
  childrenIds: number[];
}

export interface SearchConfig {
  maxNodes: number;
  maxTimeMs: number;
  maxMemoryBytes: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxNodes: 50000,
  maxTimeMs: 10000,
  maxMemoryBytes: 64 * 1024 * 1024, // 64 MB
};

export type SearchStatus =
  | 'solved'
  | 'unsolvable'
  | 'limit_nodes'
  | 'limit_time'
  | 'limit_memory';

export interface SearchResult {
  algorithm: AlgorithmType;
  status: SearchStatus;
  statusMessage: string;
  solved: boolean;
  validSolution: boolean;
  initialBoard: Uint8Array;
  solutionBoard: Uint8Array | null;
  solutionNodeId: number | null;
  solutionPathIds: number[];
  nodes: SearchNode[];
  nodesGenerated: number;
  nodesExplored: number;
  maxDepth: number;
  solutionDepth: number | null;
  executionTimeMs: number;
  estimatedMemoryBytes: number;
  branchingFactorAvg: number;
  explorationOrder: number[];
}

export interface BoardConflict {
  type: 'row' | 'col' | 'box';
  index: number;
  symbol: string;
}

export interface BoardValidation {
  isValid: boolean;
  isComplete: boolean;
  emptyCount: number;
  conflicts: BoardConflict[];
}

export interface GeneratedPuzzle {
  initialBoard: Uint8Array;
  emptyCountRequested: number;
  emptyCountActual: number;
  isUnique: boolean;
  validation: BoardValidation;
  generationTimeMs: number;
}

export interface ComparisonRow {
  metric: string;
  bfsValue: string;
  dfsValue: string;
  winner?: 'BFS' | 'DFS' | 'Empate' | 'N/A';
}
