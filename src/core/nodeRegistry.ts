import {cloneBoard} from './state';
import {Move, SearchNode} from './types';

/**
 * Estimación estructural conservadora por nodo almacenado en el árbol:
 * - Uint8Array(256) (~256 bytes + cabecera ~64 bytes)
 * - Metadatos del nodo, Move y arreglo childrenIds (~160 bytes)
 */
export const BYTES_PER_NODE_ESTIMATE = 480;

/**
 * Registro centralizado de nodos para construir y conservar el árbol real
 * generado durante la ejecución de BFS o DFS.
 */
export class NodeRegistry {
  public readonly nodes: SearchNode[] = [];
  public readonly explorationOrder: number[] = [];
  public maxDepth = 0;
  private nextId = 0;
  private exploredCounter = 0;

  /**
   * Registra el nodo raíz (estado inicial del Sudoku, profundidad 0).
   */
  createRoot(initialBoard: Uint8Array): SearchNode {
    const root: SearchNode = {
      id: this.nextId++,
      parentId: null,
      depth: 0,
      move: null,
      board: cloneBoard(initialBoard),
      status: 'generated',
      orderGenerated: 0,
      orderExplored: null,
      childrenIds: [],
    };
    this.nodes.push(root);
    return root;
  }

  /**
   * Crea un nodo sucesor válido enlazándolo bidireccionalmente con su padre.
   */
  createChild(
    parentId: number,
    move: Move,
    board: Uint8Array
  ): SearchNode {
    const parent = this.nodes[parentId];
    const id = this.nextId++;
    const depth = parent.depth + 1;
    if (depth > this.maxDepth) {
      this.maxDepth = depth;
    }
    const child: SearchNode = {
      id,
      parentId,
      depth,
      move,
      board,
      status: 'generated',
      orderGenerated: id,
      orderExplored: null,
      childrenIds: [],
    };
    this.nodes.push(child);
    parent.childrenIds.push(id);
    return child;
  }

  /**
   * Marca un nodo como extraído de la frontera (cola FIFO o pila LIFO) y explorado.
   */
  markExplored(nodeId: number): SearchNode {
    const node = this.nodes[nodeId];
    node.status = 'explored';
    node.orderExplored = this.exploredCounter++;
    this.explorationOrder.push(nodeId);
    return node;
  }

  /**
   * Marca el nodo objetivo cuando alcanza un tablero 16x16 completo y válido.
   */
  markSolution(nodeId: number): SearchNode {
    const node = this.nodes[nodeId];
    node.status = 'solution';
    return node;
  }

  /**
   * Reconstruye la secuencia exacta de IDs desde la raíz (0) hasta el nodo solución.
   */
  reconstructPath(targetNodeId: number): number[] {
    const path: number[] = [];
    let currentId: number | null = targetNodeId;
    while (currentId !== null) {
      path.push(currentId);
      currentId = this.nodes[currentId]?.parentId ?? null;
    }
    path.reverse();
    return path;
  }

  getEstimatedMemoryBytes(): number {
    return this.nodes.length * BYTES_PER_NODE_ESTIMATE;
  }

  getAverageBranchingFactor(): number {
    let internalNodes = 0;
    let totalChildren = 0;
    for (const node of this.nodes) {
      if (node.status !== 'generated') {
        internalNodes++;
        totalChildren += node.childrenIds.length;
      }
    }
    return internalNodes > 0 ? totalChildren / internalNodes : 0;
  }
}
