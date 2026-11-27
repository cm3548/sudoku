import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boardToMatrix,
  boardsEqual,
  cloneBoard,
  countEmptyCells,
} from '../state';
import {
  generateCompleteBoard,
  generateSudokuPuzzle,
} from '../generator';
import {
  validateBoard,
  validateSolutionAgainstInitial,
} from '../validator';
import {solveWithBFS} from '../bfs';
import {solveWithDFS} from '../dfs';
import {computeTreeLayout} from '../searchTree';
import {buildComparisonSummary} from '../comparison';
import {EMPTY_SYMBOL, GRID_SIZE, SYMBOLS} from '../types';

test('generateCompleteBoard creates a valid 16x16 Sudoku with 1..9 and A..G', () => {
  const board = generateCompleteBoard();
  const validation = validateBoard(board);
  assert.equal(validation.isValid, true);
  assert.equal(validation.isComplete, true);
  assert.equal(validation.emptyCount, 0);
  assert.equal(validation.conflicts.length, 0);

  const matrix = boardToMatrix(board);
  assert.equal(matrix.length, GRID_SIZE);
  for (const row of matrix) {
    assert.equal(row.length, GRID_SIZE);
    for (const sym of row) {
      assert.ok((SYMBOLS as readonly string[]).includes(sym));
    }
  }
});

test('validateBoard detects row, column, and 4x4 region conflicts', () => {
  const board = generateCompleteBoard();
  // Provocar conflicto en fila 0, columna 1 y caja 0 copiando (0,0) en (0,1)
  const broken = cloneBoard(board);
  broken[1] = broken[0];
  const validation = validateBoard(broken);
  assert.equal(validation.isValid, false);
  assert.ok(validation.conflicts.some((c) => c.type === 'row' && c.index === 0));
  assert.ok(validation.conflicts.some((c) => c.type === 'box' && c.index === 0));
});

test('generateSudokuPuzzle removes exact cells and guarantees unique solution', () => {
  const puzzle = generateSudokuPuzzle(14, 12345);
  assert.equal(puzzle.validation.isValid, true);
  assert.equal(puzzle.validation.isComplete, false);
  assert.equal(puzzle.emptyCountActual, 14);
  assert.equal(puzzle.isUnique, true);
  assert.equal(countEmptyCells(puzzle.initialBoard), 14);

  const matrix = boardToMatrix(puzzle.initialBoard);
  const dotCount = matrix.flat().filter((s) => s === EMPTY_SYMBOL).length;
  assert.equal(dotCount, 14);
});

test('BFS and DFS authentically solve the exact same 16x16 puzzle with valid trees', () => {
  const puzzle = generateSudokuPuzzle(12, 98765);
  const bfsResult = solveWithBFS(puzzle.initialBoard);
  const dfsResult = solveWithDFS(puzzle.initialBoard);

  assert.equal(bfsResult.solved, true);
  assert.equal(bfsResult.validSolution, true);
  assert.equal(dfsResult.solved, true);
  assert.equal(dfsResult.validSolution, true);

  // Ambos trabajaron exactamente sobre el mismo tablero inicial
  assert.equal(boardsEqual(bfsResult.initialBoard, dfsResult.initialBoard), true);
  assert.ok(bfsResult.solutionBoard);
  assert.ok(dfsResult.solutionBoard);
  assert.equal(
    validateSolutionAgainstInitial(puzzle.initialBoard, bfsResult.solutionBoard),
    true
  );
  assert.equal(
    validateSolutionAgainstInitial(puzzle.initialBoard, dfsResult.solutionBoard),
    true
  );
  // Al tener solución única, ambos encuentran exactamente la misma solución
  assert.equal(boardsEqual(bfsResult.solutionBoard, dfsResult.solutionBoard), true);

  // Propiedad matemática estricta de BFS: la profundidad de los nodos explorados
  // nunca disminuye (orden por niveles FIFO).
  let prevDepth = 0;
  for (const nodeId of bfsResult.explorationOrder) {
    const d = bfsResult.nodes[nodeId].depth;
    assert.ok(d >= prevDepth, `BFS depth decreased from ${prevDepth} to ${d}`);
    prevDepth = d;
  }

  // Verificar integridad del camino solución reconstruido en ambos árboles
  for (const res of [bfsResult, dfsResult]) {
    assert.equal(res.solutionPathIds[0], 0);
    assert.equal(
      res.solutionPathIds[res.solutionPathIds.length - 1],
      res.solutionNodeId
    );
    for (let i = 1; i < res.solutionPathIds.length; i++) {
      const child = res.nodes[res.solutionPathIds[i]];
      const parent = res.nodes[res.solutionPathIds[i - 1]];
      assert.equal(child.parentId, parent.id);
      assert.equal(child.depth, parent.depth + 1);
      assert.ok(child.move !== null);
    }
  }

  const comparison = buildComparisonSummary(bfsResult, dfsResult);
  assert.ok(comparison);
  assert.equal(comparison.sameInitialBoard, true);
});

test('BFS and DFS respect maxNodes limit and never fake a solution', () => {
  const puzzle = generateSudokuPuzzle(16, 4242);
  const tightConfig = {
    maxNodes: 3,
    maxTimeMs: 5000,
    maxMemoryBytes: 64 * 1024 * 1024,
  };
  const bfsLimited = solveWithBFS(puzzle.initialBoard, tightConfig);
  const dfsLimited = solveWithDFS(puzzle.initialBoard, tightConfig);

  assert.equal(bfsLimited.status, 'limit_nodes');
  assert.equal(bfsLimited.solved, false);
  assert.equal(bfsLimited.solutionBoard, null);
  assert.equal(bfsLimited.validSolution, false);

  assert.equal(dfsLimited.status, 'limit_nodes');
  assert.equal(dfsLimited.solved, false);
  assert.equal(dfsLimited.solutionBoard, null);
  assert.equal(dfsLimited.validSolution, false);
});

test('computeTreeLayout preserves solution path when sampling large trees', () => {
  const puzzle = generateSudokuPuzzle(12, 777);
  const bfsResult = solveWithBFS(puzzle.initialBoard);
  const layout = computeTreeLayout(
    bfsResult.nodes,
    bfsResult.solutionPathIds,
    6
  );
  assert.ok(layout.visibleCount <= Math.max(6, bfsResult.solutionPathIds.length));
  for (const pathId of bfsResult.solutionPathIds) {
    assert.ok(layout.nodeMap.has(pathId));
  }
});
