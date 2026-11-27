import {NodeRegistry} from './nodeRegistry';
import {cloneBoard, findNextEmptyCell, valueToSymbol} from './state';
import {
  DEFAULT_SEARCH_CONFIG,
  SearchConfig,
  SearchResult,
  SearchStatus,
} from './types';
import {
  getValidCandidates,
  validateBoard,
  validateSolutionAgainstInitial,
} from './validator';

/**
 * Implementación auténtica de Breadth First Search (BFS / Búsqueda en Anchura)
 * para resolver Sudokus 16x16.
 *
 * Características clave:
 * - Utiliza una cola estrictamente FIFO (índice `head` sobre arreglo para dequeue O(1)).
 * - NO utiliza recursividad ni backtracking de DFS.
 * - Expande nivel por nivel: todos los nodos de profundidad `d` se exploran antes
 *   de explorar cualquier nodo de profundidad `d + 1`.
 * - Registra cada nodo generado, su padre, movimiento y estado en `NodeRegistry`.
 */
export function solveWithBFS(
  initialBoard: Uint8Array,
  config: SearchConfig = DEFAULT_SEARCH_CONFIG
): SearchResult {
  const startTime = performance.now();
  const initialCopy = cloneBoard(initialBoard);
  const registry = new NodeRegistry();

  // Validar que el estado inicial no contenga contradicciones previas
  const initialValidation = validateBoard(initialCopy);
  if (!initialValidation.isValid) {
    const root = registry.createRoot(initialCopy);
    registry.markExplored(root.id);
    return {
      algorithm: 'BFS',
      status: 'unsolvable',
      statusMessage: 'El tablero inicial contiene conflictos inválidos.',
      solved: false,
      validSolution: false,
      initialBoard: initialCopy,
      solutionBoard: null,
      solutionNodeId: null,
      solutionPathIds: [],
      nodes: registry.nodes,
      nodesGenerated: registry.nodes.length,
      nodesExplored: registry.explorationOrder.length,
      maxDepth: registry.maxDepth,
      solutionDepth: null,
      executionTimeMs: performance.now() - startTime,
      estimatedMemoryBytes: registry.getEstimatedMemoryBytes(),
      branchingFactorAvg: 0,
      explorationOrder: registry.explorationOrder,
    };
  }

  // Cola FIFO explícita (First-In, First-Out)
  const queue: number[] = [];
  let head = 0;

  const root = registry.createRoot(initialCopy);
  queue.push(root.id);

  let terminationStatus: SearchStatus = 'unsolvable';
  let statusMessage =
    'Espacio de búsqueda agotado sin encontrar una solución.';
  let solutionNodeId: number | null = null;
  let solutionBoard: Uint8Array | null = null;

  while (head < queue.length) {
    // Verificar límites de tiempo y memoria antes de expandir el siguiente nodo
    const elapsed = performance.now() - startTime;
    if (elapsed > config.maxTimeMs) {
      terminationStatus = 'limit_time';
      statusMessage = `Límite de tiempo alcanzado (${config.maxTimeMs.toLocaleString('es-MX')} ms).`;
      break;
    }

    if (registry.getEstimatedMemoryBytes() >= config.maxMemoryBytes) {
      terminationStatus = 'limit_memory';
      statusMessage = `Límite de memoria alcanzado (${Math.round(config.maxMemoryBytes / (1024 * 1024))} MB).`;
      break;
    }

    // Extraer el nodo más antiguo de la cola FIFO
    const currentId = queue[head++];
    const currentNode = registry.markExplored(currentId);

    // Política determinista: seleccionar la primera casilla vacía en orden por filas
    const nextCell = findNextEmptyCell(currentNode.board);

    // Prueba de objetivo: si no hay casillas vacías, verificar validez completa
    if (nextCell === null) {
      const check = validateBoard(currentNode.board);
      if (check.isValid && check.isComplete) {
        registry.markSolution(currentNode.id);
        solutionNodeId = currentNode.id;
        solutionBoard = currentNode.board;
        terminationStatus = 'solved';
        statusMessage = `Solución válida encontrada en profundidad ${currentNode.depth}.`;
        break;
      }
      continue;
    }

    // Generar todos los sucesores válidos para la casilla seleccionada
    const candidates = getValidCandidates(
      currentNode.board,
      nextCell.row,
      nextCell.col
    );

    let limitHit = false;
    for (const val of candidates) {
      if (registry.nodes.length >= config.maxNodes) {
        terminationStatus = 'limit_nodes';
        statusMessage = `Límite de nodos alcanzado (${config.maxNodes.toLocaleString('es-MX')} nodos).`;
        limitHit = true;
        break;
      }

      if (registry.getEstimatedMemoryBytes() >= config.maxMemoryBytes) {
        terminationStatus = 'limit_memory';
        statusMessage = `Límite de memoria alcanzado (${Math.round(config.maxMemoryBytes / (1024 * 1024))} MB).`;
        limitHit = true;
        break;
      }

      const nextBoard = cloneBoard(currentNode.board);
      nextBoard[nextCell.index] = val;

      const child = registry.createChild(
        currentNode.id,
        {
          row: nextCell.row,
          col: nextCell.col,
          value: val,
          symbol: valueToSymbol(val),
        },
        nextBoard
      );
      queue.push(child.id);
    }

    if (limitHit) break;
  }

  const executionTimeMs = performance.now() - startTime;
  const solved = terminationStatus === 'solved' && solutionBoard !== null;
  const validSolution =
    solved && solutionBoard !== null
      ? validateSolutionAgainstInitial(initialCopy, solutionBoard)
      : false;
  const solutionPathIds =
    solutionNodeId !== null ? registry.reconstructPath(solutionNodeId) : [];

  return {
    algorithm: 'BFS',
    status: terminationStatus,
    statusMessage,
    solved,
    validSolution,
    initialBoard: initialCopy,
    solutionBoard,
    solutionNodeId,
    solutionPathIds,
    nodes: registry.nodes,
    nodesGenerated: registry.nodes.length,
    nodesExplored: registry.explorationOrder.length,
    maxDepth: registry.maxDepth,
    solutionDepth:
      solutionNodeId !== null ? registry.nodes[solutionNodeId].depth : null,
    executionTimeMs,
    estimatedMemoryBytes: registry.getEstimatedMemoryBytes(),
    branchingFactorAvg: registry.getAverageBranchingFactor(),
    explorationOrder: registry.explorationOrder,
  };
}
