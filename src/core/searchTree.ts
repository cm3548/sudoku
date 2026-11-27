import {SearchNode} from './types';

export interface PositionedTreeNode {
  node: SearchNode;
  x: number;
  y: number;
  visibleChildrenIds: number[];
}

export interface TreeLayout {
  positionedNodes: PositionedTreeNode[];
  nodeMap: Map<number, PositionedTreeNode>;
  width: number;
  height: number;
  isSampled: boolean;
  totalNodes: number;
  visibleCount: number;
}

/**
 * Selecciona una muestra representativa conectada desde la raíz cuando el árbol
 * supera `maxVisibleNodes`, garantizando:
 * 1) Conservar siempre el nodo raíz (ID 0).
 * 2) Conservar completo el camino hacia la solución (si existe).
 * 3) Incluir nodos en orden real de exploración/generación junto con sus ancestros
 *    para mantener intacta la estructura de árbol enraizado.
 */
export function selectVisibleNodeIds(
  nodes: SearchNode[],
  solutionPathIds: number[],
  maxVisibleNodes: number
): Set<number> {
  if (nodes.length === 0) return new Set();
  if (nodes.length <= maxVisibleNodes) {
    return new Set(nodes.map((n) => n.id));
  }

  const selected = new Set<number>();
  const addWithAncestors = (id: number, enforceLimit: boolean) => {
    const chain: number[] = [];
    let cur: number | null = id;
    while (cur !== null && !selected.has(cur)) {
      chain.push(cur);
      cur = nodes[cur]?.parentId ?? null;
    }
    for (let i = chain.length - 1; i >= 0; i--) {
      if (enforceLimit && selected.size >= maxVisibleNodes) break;
      selected.add(chain[i]);
    }
  };

  addWithAncestors(0, false);
  for (const pathId of solutionPathIds) {
    addWithAncestors(pathId, false);
  }

  // Priorizar nodos explorados en orden cronológico y luego generados
  const exploredFirst = [...nodes].sort((a, b) => {
    const aExp = a.orderExplored ?? Number.MAX_SAFE_INTEGER;
    const bExp = b.orderExplored ?? Number.MAX_SAFE_INTEGER;
    if (aExp !== bExp) return aExp - bExp;
    return a.id - b.id;
  });

  for (const node of exploredFirst) {
    if (selected.size >= maxVisibleNodes) break;
    addWithAncestors(node.id, true);
  }

  return selected;
}

/**
 * Calcula coordenadas jerárquicas (x, y) sin solapamientos para el árbol de búsqueda.
 * Las hojas se distribuyen horizontalmente y cada nodo padre se centra sobre sus hijos.
 */
export function computeTreeLayout(
  nodes: SearchNode[],
  solutionPathIds: number[],
  maxVisibleNodes: number
): TreeLayout {
  if (nodes.length === 0) {
    return {
      positionedNodes: [],
      nodeMap: new Map(),
      width: 600,
      height: 360,
      isSampled: false,
      totalNodes: 0,
      visibleCount: 0,
    };
  }

  const visibleIds = selectVisibleNodeIds(
    nodes,
    solutionPathIds,
    maxVisibleNodes
  );
  const isSampled = visibleIds.size < nodes.length;

  const horizontalGap = 76;
  const verticalGap = 86;
  const paddingX = 64;
  const paddingY = 56;

  const visibleChildrenMap = new Map<number, number[]>();
  for (const id of visibleIds) {
    const node = nodes[id];
    const visChildren = node.childrenIds.filter((cid) => visibleIds.has(cid));
    visibleChildrenMap.set(id, visChildren);
  }

  let nextLeafX = 0;
  const xUnitMap = new Map<number, number>();
  let maxDepth = 0;

  // Asignación bottom-up iterativa/recursiva segura sobre el subárbol visible (<= maxVisibleNodes)
  const assignX = (id: number) => {
    const node = nodes[id];
    if (node.depth > maxDepth) maxDepth = node.depth;
    const children = visibleChildrenMap.get(id) ?? [];
    if (children.length === 0) {
      xUnitMap.set(id, nextLeafX++);
      return;
    }
    for (const cid of children) {
      assignX(cid);
    }
    const firstX = xUnitMap.get(children[0]) ?? 0;
    const lastX = xUnitMap.get(children[children.length - 1]) ?? firstX;
    xUnitMap.set(id, (firstX + lastX) / 2);
  };

  assignX(0);

  const leafCount = Math.max(1, nextLeafX);
  const width = Math.max(640, paddingX * 2 + (leafCount - 1) * horizontalGap);
  const height = Math.max(360, paddingY * 2 + maxDepth * verticalGap);

  const positionedNodes: PositionedTreeNode[] = [];
  const nodeMap = new Map<number, PositionedTreeNode>();

  for (const id of visibleIds) {
    const node = nodes[id];
    const unitX = xUnitMap.get(id) ?? 0;
    const x =
      leafCount === 1 ? width / 2 : paddingX + unitX * horizontalGap;
    const y = paddingY + node.depth * verticalGap;
    const entry: PositionedTreeNode = {
      node,
      x,
      y,
      visibleChildrenIds: visibleChildrenMap.get(id) ?? [],
    };
    positionedNodes.push(entry);
    nodeMap.set(id, entry);
  }

  return {
    positionedNodes,
    nodeMap,
    width,
    height,
    isSampled,
    totalNodes: nodes.length,
    visibleCount: visibleIds.size,
  };
}
