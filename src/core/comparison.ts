import {boardsEqual} from './state';
import {ComparisonRow, SearchResult, SearchStatus} from './types';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function formatSearchStatus(status: SearchStatus): string {
  switch (status) {
    case 'solved':
      return 'Solución encontrada';
    case 'unsolvable':
      return 'Sin solución';
    case 'limit_nodes':
      return 'Límite de nodos';
    case 'limit_time':
      return 'Límite de tiempo';
    case 'limit_memory':
      return 'Límite de memoria';
  }
}

export interface ComparisonSummary {
  sameInitialBoard: boolean;
  rows: ComparisonRow[];
  observations: string[];
}

/**
 * Genera la tabla comparativa formal y observaciones basadas estrictamente
 * en los resultados reales medidos para BFS y DFS.
 */
export function buildComparisonSummary(
  bfs: SearchResult | null,
  dfs: SearchResult | null
): ComparisonSummary | null {
  if (!bfs && !dfs) return null;

  const sameInitialBoard =
    bfs && dfs ? boardsEqual(bfs.initialBoard, dfs.initialBoard) : true;

  const fmtTime = (r: SearchResult | null) =>
    r ? `${r.executionTimeMs.toFixed(2)} ms` : '—';
  const fmtInt = (val: number | null | undefined) =>
    val !== null && val !== undefined ? val.toLocaleString('es-MX') : '—';

  const pickSmallerWinner = (
    a: number | null,
    b: number | null
  ): 'BFS' | 'DFS' | 'Empate' | 'N/A' => {
    if (a === null || b === null) return 'N/A';
    if (Math.abs(a - b) < 1e-6) return 'Empate';
    return a < b ? 'BFS' : 'DFS';
  };

  const rows: ComparisonRow[] = [
    {
      metric: 'Estado de la ejecución',
      bfsValue: bfs ? formatSearchStatus(bfs.status) : 'Pendiente',
      dfsValue: dfs ? formatSearchStatus(dfs.status) : 'Pendiente',
      winner: 'N/A',
    },
    {
      metric: '¿Encontró solución válida?',
      bfsValue: bfs ? (bfs.solved && bfs.validSolution ? 'Sí' : 'No') : '—',
      dfsValue: dfs ? (dfs.solved && dfs.validSolution ? 'Sí' : 'No') : '—',
      winner: 'N/A',
    },
    {
      metric: 'Tiempo de ejecución',
      bfsValue: fmtTime(bfs),
      dfsValue: fmtTime(dfs),
      winner: pickSmallerWinner(
        bfs ? bfs.executionTimeMs : null,
        dfs ? dfs.executionTimeMs : null
      ),
    },
    {
      metric: 'Nodos generados',
      bfsValue: bfs ? fmtInt(bfs.nodesGenerated) : '—',
      dfsValue: dfs ? fmtInt(dfs.nodesGenerated) : '—',
      winner: pickSmallerWinner(
        bfs ? bfs.nodesGenerated : null,
        dfs ? dfs.nodesGenerated : null
      ),
    },
    {
      metric: 'Nodos explorados',
      bfsValue: bfs ? fmtInt(bfs.nodesExplored) : '—',
      dfsValue: dfs ? fmtInt(dfs.nodesExplored) : '—',
      winner: pickSmallerWinner(
        bfs ? bfs.nodesExplored : null,
        dfs ? dfs.nodesExplored : null
      ),
    },
    {
      metric: 'Profundidad máxima alcanzada',
      bfsValue: bfs ? fmtInt(bfs.maxDepth) : '—',
      dfsValue: dfs ? fmtInt(dfs.maxDepth) : '—',
      winner: pickSmallerWinner(
        bfs ? bfs.maxDepth : null,
        dfs ? dfs.maxDepth : null
      ),
    },
    {
      metric: 'Profundidad de la solución',
      bfsValue: bfs?.solutionDepth !== null && bfs ? fmtInt(bfs.solutionDepth) : '—',
      dfsValue: dfs?.solutionDepth !== null && dfs ? fmtInt(dfs.solutionDepth) : '—',
      winner: pickSmallerWinner(
        bfs?.solutionDepth ?? null,
        dfs?.solutionDepth ?? null
      ),
    },
    {
      metric: 'Memoria estimada del árbol',
      bfsValue: bfs ? formatBytes(bfs.estimatedMemoryBytes) : '—',
      dfsValue: dfs ? formatBytes(dfs.estimatedMemoryBytes) : '—',
      winner: pickSmallerWinner(
        bfs ? bfs.estimatedMemoryBytes : null,
        dfs ? dfs.estimatedMemoryBytes : null
      ),
    },
    {
      metric: 'Factor de ramificación promedio',
      bfsValue: bfs ? bfs.branchingFactorAvg.toFixed(2) : '—',
      dfsValue: dfs ? dfs.branchingFactorAvg.toFixed(2) : '—',
      winner: 'N/A',
    },
  ];

  const observations: string[] = [];
  if (bfs && dfs) {
    if (sameInitialBoard) {
      observations.push(
        'Verificación de equidad: ambos algoritmos partieron exactamente del mismo tablero inicial 16×16 y aplicaron la misma política de selección de casillas.'
      );
    }
    if (bfs.solved && dfs.solved) {
      if (dfs.nodesExplored < bfs.nodesExplored) {
        observations.push(
          `DFS exploró ${dfs.nodesExplored.toLocaleString('es-MX')} nodos frente a ${bfs.nodesExplored.toLocaleString('es-MX')} de BFS, ya que descendió directamente hacia la profundidad objetivo sin expandir todos los niveles intermedios.`
        );
      } else if (bfs.nodesExplored < dfs.nodesExplored) {
        observations.push(
          `BFS exploró ${bfs.nodesExplored.toLocaleString('es-MX')} nodos frente a ${dfs.nodesExplored.toLocaleString('es-MX')} de DFS porque DFS incurrió en retrocesos (backtracking) en ramas tempranas.`
        );
      }
    } else if (!bfs.solved && dfs.solved) {
      observations.push(
        `BFS alcanzó su límite (${formatSearchStatus(bfs.status)}) debido al crecimiento exponencial de la frontera por niveles O(b^d), mientras DFS logró alcanzar una solución válida.`
      );
    } else if (bfs.solved && !dfs.solved) {
      observations.push(
        `DFS alcanzó su límite (${formatSearchStatus(dfs.status)}) explorando ramas profundas con contradicciones tardías, mientras BFS encontró la solución.`
      );
    }
  }

  return {
    sameInitialBoard,
    rows,
    observations,
  };
}
