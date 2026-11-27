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
 * Implementación auténtica de Depth First Search (DFS / Búsqueda en Profundidad)
 * para resolver Sudokus 16x16.
 *
 * Características clave:
 * - Utiliza una pila explícita LIFO (Last-In, First-Out) para evitar desbordamiento
 *   de pila de llamadas en tableros profundos.
 * - Parte exactamente del mismo tablero inicial y usa la misma política de selección
 *   de casillas y orden de candidatos ('1'..'G') que BFS.
 * - Profundiza por una rama hasta alcanzar solución o contradicción (0 candidatos),
 *   retrocediendo automáticamente (backtracking) al siguiente nodo pendiente en la pila.
 */
export function solveWithDFS(
  initialBoard: Uint8Array,
  config: SearchConfig = DEFAULT_SEARCH_CONFIG
): SearchResult {
  const startTime = performance.now();
  const initialCopy = cloneBoard(initialBoard);
  const registry = new NodeRegistry();

  const initialValidation = validateBoard(initialCopy);
  if (!initialValidation.isValid) {
    const root = registry.createRoot(initialCopy);
    registry.markExplored(root.id);
    return {
      algorithm: 'DFS',
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

  // Pila LIFO explícita (Last-In, First-Out)
  const stack: number[] = [];
  const root = registry.createRoot(initialCopy);
  stack.push(root.id);

  let terminationStatus: SearchStatus = 'unsolvable';
  let statusMessage =
    'Espacio de búsqueda agotado sin encontrar una solución.';
  let solutionNodeId: number | null = null;
  let solutionBoard: Uint8Array | null = null;

  while (stack.length > 0) {
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

    // Extraer el nodo en el tope de la pila LIFO
    const currentId = stack.pop()!;
    const currentNode = registry.markExplored(currentId);

    // Misma política determinista de selección de casilla que BFS
    const nextCell = findNextEmptyCell(currentNode.board);

    // Prueba de objetivo
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

    const candidates = getValidCandidates(
      currentNode.board,
      nextCell.row,
      nextCell.col
    );

    // Si candidates.length === 0, esta rama es una contradicción:
    // no se apilan hijos y la siguiente iteración retrocede (backtracking) en la pila.
    const generatedChildren: number[] = [];
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
      generatedChildren.push(child.id);
    }

    // Apilar en orden inverso para que la pila LIFO explore primero el candidato menor ('1'..'G')
    for (let i = generatedChildren.length - 1; i >= 0; i--) {
      stack.push(generatedChildren[i]);
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
    algorithm: 'DFS',
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
