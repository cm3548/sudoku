import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Table as TableIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {computeTreeLayout} from '../core/searchTree';
import {SearchNode, SearchResult} from '../core/types';
import {SudokuGrid16} from './SudokuGrid16';

interface SearchTreeViewerProps {
  result: SearchResult;
  accent: 'sky' | 'violet';
}

type ViewerTab = 'tree' | 'table';
type NodeFilter = 'all' | 'explored' | 'generated' | 'solution_path';

export const SearchTreeViewer: React.FC<SearchTreeViewerProps> = ({
  result,
  accent,
}) => {
  const [activeTab, setActiveTab] = useState<ViewerTab>('tree');
  const [maxVisibleNodes, setMaxVisibleNodes] = useState<number>(250);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(
    result.solutionNodeId ?? 0
  );
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{x: number; y: number}>({x: 0, y: 0});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragOriginRef = useRef<{x: number; y: number; panX: number; panY: number} | null>(
    null
  );
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const transformRef = useRef<{zoom: number; pan: {x: number; y: number}}>({
    zoom: 1,
    pan: {x: 0, y: 0},
  });
  const touchPinchRef = useRef<{distance: number} | null>(null);

  // Estado para reproducción paso a paso del orden real de exploración
  const totalSteps = result.explorationOrder.length;
  const [stepLimit, setStepLimit] = useState<number>(totalSteps);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Estado de tabla de nodos
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>('all');
  const [page, setPage] = useState<number>(0);
  const pageSize = 40;

  const layout = useMemo(
    () =>
      computeTreeLayout(
        result.nodes,
        result.solutionPathIds,
        maxVisibleNodes
      ),
    [result.nodes, result.solutionPathIds, maxVisibleNodes]
  );

  const fitView = useMemo(() => {
    const viewW = 920;
    const viewH = 400;
    const scaleX = viewW / Math.max(layout.width, 1);
    const scaleY = viewH / Math.max(layout.height, 1);
    const fitZoom = Math.max(
      0.1,
      Math.min(1, Number(Math.min(scaleX, scaleY).toFixed(2)))
    );
    const offsetX = Math.max(0, (viewW - layout.width * fitZoom) / 2);
    return {zoom: fitZoom, pan: {x: offsetX, y: 0}};
  }, [layout.width, layout.height]);

  useEffect(() => {
    transformRef.current = {zoom, pan};
  }, [zoom, pan]);

  useEffect(() => {
    setSelectedNodeId(result.solutionNodeId ?? 0);
    setStepLimit(result.explorationOrder.length);
    setIsPlaying(false);
    setZoom(fitView.zoom);
    setPan(fitView.pan);
    transformRef.current = {zoom: fitView.zoom, pan: fitView.pan};
    setPage(0);
  }, [result, fitView]);

  useEffect(() => {
    if (!isPlaying) return;
    if (stepLimit >= totalSteps) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setInterval(() => {
      setStepLimit((prev) => {
        if (prev + 1 >= totalSteps) {
          setIsPlaying(false);
          return totalSteps;
        }
        return prev + 1;
      });
    }, 220);
    return () => window.clearInterval(timer);
  }, [isPlaying, stepLimit, totalSteps]);

  const solutionPathSet = useMemo(
    () => new Set(result.solutionPathIds),
    [result.solutionPathIds]
  );

  // Determinar qué nodos ya han sido revelados en el paso actual de reproducción
  const revealedExploredSet = useMemo(() => {
    if (stepLimit >= totalSteps) return null;
    return new Set(result.explorationOrder.slice(0, stepLimit));
  }, [result.explorationOrder, stepLimit, totalSteps]);

  const selectedNode: SearchNode | undefined =
    result.nodes[selectedNodeId] ?? result.nodes[0];

  const activeStepNodeId =
    stepLimit > 0 && stepLimit <= totalSteps
      ? result.explorationOrder[stepLimit - 1]
      : null;

  const filteredNodes = useMemo(() => {
    return result.nodes.filter((n) => {
      if (nodeFilter === 'explored') return n.status === 'explored' || n.status === 'solution';
      if (nodeFilter === 'generated') return n.status === 'generated';
      if (nodeFilter === 'solution_path') return solutionPathSet.has(n.id);
      return true;
    });
  }, [result.nodes, nodeFilter, solutionPathSet]);

  const totalPages = Math.max(1, Math.ceil(filteredNodes.length / pageSize));
  const pagedNodes = filteredNodes.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const accentExploredFill = accent === 'sky' ? '#0284c7' : '#6d28d9';
  const accentExploredStroke = accent === 'sky' ? '#0369a1' : '#5b21b6';
  const accentTabActive =
    accent === 'sky'
      ? 'bg-sky-600 text-white'
      : 'bg-violet-700 text-white';

  const applyZoomAtClientPoint = (
    nextZoomRaw: number,
    clientX?: number,
    clientY?: number
  ) => {
    const nextZoom = Math.min(3, Math.max(0.08, Number(nextZoomRaw.toFixed(3))));
    const {zoom: curZoom, pan: curPan} = transformRef.current;
    if (Math.abs(nextZoom - curZoom) < 0.0005) return;

    const svg = svgRef.current;
    let nextPan = curPan;
    if (svg && clientX !== undefined && clientY !== undefined) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const svgX = ((clientX - rect.left) / rect.width) * 920;
        const svgY = ((clientY - rect.top) / rect.height) * 400;
        const worldX = (svgX - curPan.x) / curZoom;
        const worldY = (svgY - curPan.y) / curZoom;
        nextPan = {
          x: svgX - worldX * nextZoom,
          y: svgY - worldY * nextZoom,
        };
      }
    }

    transformRef.current = {zoom: nextZoom, pan: nextPan};
    setZoom(nextZoom);
    setPan(nextPan);
  };

  useEffect(() => {
    if (activeTab !== 'tree') return;
    const el = treeContainerRef.current;
    if (!el) return;

    // Listener nativo no pasivo para interceptar tanto pinch del trackpad (ctrlKey + wheel)
    // como scroll del ratón o trackpad sin desplazar la página.
    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let deltaY = e.deltaY;
      if (e.deltaMode === 1) deltaY *= 24;
      else if (e.deltaMode === 2) deltaY *= 240;

      // Si es gesto pinch del trackpad (ctrlKey) o scroll de ratón/trackpad,
      // escalar de forma suave y proporcional centrado en el cursor.
      const sensitivity = e.ctrlKey
        ? 0.012
        : Math.abs(deltaY) < 40
          ? 0.0075
          : 0.0028;
      const factor = Math.exp(-deltaY * sensitivity);
      const {zoom: curZoom} = transformRef.current;
      applyZoomAtClientPoint(curZoom * factor, e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchPinchRef.current = {distance: Math.hypot(dx, dy)};
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchPinchRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (touchPinchRef.current.distance > 0 && dist > 0) {
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const ratio = dist / touchPinchRef.current.distance;
          applyZoomAtClientPoint(
            transformRef.current.zoom * ratio,
            midX,
            midY
          );
        }
        touchPinchRef.current = {distance: dist};
      }
    };

    const onTouchEnd = () => {
      touchPinchRef.current = null;
    };

    el.addEventListener('wheel', onNativeWheel, {passive: false});
    el.addEventListener('touchstart', onTouchStart, {passive: true});
    el.addEventListener('touchmove', onTouchMove, {passive: false});
    el.addEventListener('touchend', onTouchEnd, {passive: true});

    return () => {
      el.removeEventListener('wheel', onNativeWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeTab, result]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).closest('[data-tree-node="true"]')) return;
    setIsDragging(true);
    dragOriginRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragOriginRef.current) return;
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const scaleX = rect && rect.width > 0 ? 920 / rect.width : 1;
    const scaleY = rect && rect.height > 0 ? 400 / rect.height : 1;
    setPan({
      x:
        dragOriginRef.current.panX +
        (e.clientX - dragOriginRef.current.x) * scaleX,
      y:
        dragOriginRef.current.panY +
        (e.clientY - dragOriginRef.current.y) * scaleY,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragOriginRef.current = null;
  };

  const maxDepthVisible = useMemo(() => {
    let m = 0;
    for (const p of layout.positionedNodes) {
      if (p.node.depth > m) m = p.node.depth;
    }
    return m;
  }, [layout.positionedNodes]);

  return (
    <div className="space-y-4">
      {/* Barra superior: selector de vista Árbol vs Tabla + Muestra */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div
          className="inline-flex rounded-lg bg-slate-100 p-1"
          role="tablist"
          aria-label={`Vista del árbol ${result.algorithm}`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tree'}
            onClick={() => setActiveTab('tree')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'tree'
                ? accentTabActive
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            Árbol de Búsqueda
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'table'}
            onClick={() => setActiveTab('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'table'
                ? accentTabActive
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Tabla de Nodos ({result.nodes.length.toLocaleString('es-MX')})
          </button>
        </div>

        {activeTab === 'tree' && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Muestra gráfica:</span>
              <select
                aria-label={`Muestra máxima del árbol ${result.algorithm}`}
                value={maxVisibleNodes}
                onChange={(e) => setMaxVisibleNodes(Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-mono-tabular text-slate-800"
              >
                <option value={120}>120 nodos</option>
                <option value={250}>250 nodos</option>
                <option value={500}>500 nodos</option>
                <option value={1000}>1,000 nodos</option>
              </select>
            </label>
            <span className="font-mono-tabular text-slate-500">
              {layout.isSampled
                ? `Mostrando ${layout.visibleCount.toLocaleString('es-MX')} de ${layout.totalNodes.toLocaleString('es-MX')} nodos`
                : `${layout.totalNodes.toLocaleString('es-MX')} nodos completos`}
            </span>
          </div>
        )}
      </div>

      {activeTab === 'tree' ? (
        <div className="space-y-3">
          {/* Controles de reproducción paso a paso y zoom */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label={`${isPlaying ? 'Pausar' : 'Reproducir'} pasos ${result.algorithm}`}
                onClick={() => {
                  if (stepLimit >= totalSteps) setStepLimit(1);
                  setIsPlaying((p) => !p);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Paso a paso
                  </>
                )}
              </button>
              <button
                type="button"
                aria-label={`Paso anterior ${result.algorithm}`}
                onClick={() => {
                  setIsPlaying(false);
                  setStepLimit((s) => Math.max(1, s - 1));
                }}
                disabled={stepLimit <= 1}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Siguiente paso ${result.algorithm}`}
                onClick={() => {
                  setIsPlaying(false);
                  setStepLimit((s) => Math.min(totalSteps, s + 1));
                }}
                disabled={stepLimit >= totalSteps}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Ver árbol completo ${result.algorithm}`}
                onClick={() => {
                  setIsPlaying(false);
                  setStepLimit(totalSteps);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                Ver todo
              </button>
              <span className="font-mono-tabular text-xs text-slate-600">
                Paso {stepLimit.toLocaleString('es-MX')} / {totalSteps.toLocaleString('es-MX')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`Alejar árbol ${result.algorithm}`}
                onClick={() => applyZoomAtClientPoint(zoom * 0.8)}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100"
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-12 text-center font-mono-tabular text-xs font-medium text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                aria-label={`Acercar árbol ${result.algorithm}`}
                onClick={() => applyZoomAtClientPoint(zoom * 1.25)}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100"
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Restablecer vista árbol ${result.algorithm}`}
                onClick={() => {
                  setZoom(fitView.zoom);
                  setPan(fitView.pan);
                  transformRef.current = {zoom: fitView.zoom, pan: fitView.pan};
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                Ajustar
              </button>
            </div>
          </div>

          {/* Leyenda clara con texto e iconos geométricos */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-2 border-slate-900 bg-slate-900" />
              Inicial (#0)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{backgroundColor: accentExploredFill}}
              />
              Explorado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-amber-600 bg-amber-100" />
              Pendiente (frontera)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-700 bg-emerald-600" />
              Solución / Camino solución
            </span>
            <span className="text-slate-400">
              · Arrastra para desplazar, pinch o rueda para zoom
            </span>
          </div>

          {/* Lienzo SVG interactivo */}
          <div
            ref={treeContainerRef}
            className="relative h-[400px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white touch-none"
            data-testid={`tree-canvas-${result.algorithm.toLowerCase()}`}
          >
            <svg
              ref={svgRef}
              className={`h-full w-full select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              viewBox="0 0 920 400"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Bandas de nivel para diferenciar profundidades */}
                {Array.from({length: maxDepthVisible + 1}, (_, depth) => {
                  const yTop = 56 + depth * 86 - 43;
                  return (
                    <g key={`level-${depth}`}>
                      <rect
                        x={0}
                        y={yTop}
                        width={layout.width}
                        height={86}
                        fill={depth % 2 === 0 ? '#f8fafc' : '#ffffff'}
                      />
                      <text
                        x={12}
                        y={yTop + 47}
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748b"
                      >
                        N{depth}
                      </text>
                    </g>
                  );
                })}

                {/* Aristas padre -> hijo */}
                {layout.positionedNodes.map((pos) =>
                  pos.visibleChildrenIds.map((childId) => {
                    const childPos = layout.nodeMap.get(childId);
                    if (!childPos) return null;
                    if (
                      revealedExploredSet !== null &&
                      !revealedExploredSet.has(pos.node.id)
                    ) {
                      return null;
                    }
                    const isSolutionEdge =
                      solutionPathSet.has(pos.node.id) &&
                      solutionPathSet.has(childId);
                    return (
                      <line
                        key={`edge-${pos.node.id}-${childId}`}
                        x1={pos.x}
                        y1={pos.y}
                        x2={childPos.x}
                        y2={childPos.y}
                        stroke={isSolutionEdge ? '#059669' : '#cbd5e1'}
                        strokeWidth={isSolutionEdge ? 3 : 1.4}
                      />
                    );
                  })
                )}

                {/* Nodos del árbol */}
                {layout.positionedNodes.map((pos) => {
                  const {node} = pos;
                  const parentRevealed =
                    revealedExploredSet === null ||
                    node.parentId === null ||
                    revealedExploredSet.has(node.parentId);
                  if (!parentRevealed) return null;

                  const isExploredNow =
                    revealedExploredSet === null
                      ? node.status !== 'generated'
                      : revealedExploredSet.has(node.id);
                  const isSolution =
                    node.status === 'solution' &&
                    (revealedExploredSet === null ||
                      revealedExploredSet.has(node.id));
                  const onSolPath =
                    solutionPathSet.has(node.id) && isExploredNow;
                  const isRoot = node.id === 0;
                  const isSelected = node.id === selectedNodeId;
                  const isActiveStep = node.id === activeStepNodeId;

                  let fill = '#fef3c7'; // pendiente
                  let stroke = '#d97706';
                  let textColor = '#92400e';
                  let strokeDasharray: string | undefined = '3 2';

                  if (isRoot) {
                    fill = '#0f172a';
                    stroke = '#0f172a';
                    textColor = '#ffffff';
                    strokeDasharray = undefined;
                  } else if (isSolution) {
                    fill = '#059669';
                    stroke = '#065f46';
                    textColor = '#ffffff';
                    strokeDasharray = undefined;
                  } else if (isExploredNow) {
                    fill = accentExploredFill;
                    stroke = onSolPath ? '#059669' : accentExploredStroke;
                    textColor = '#ffffff';
                    strokeDasharray = undefined;
                  }

                  return (
                    <g
                      key={`node-${node.id}`}
                      data-tree-node="true"
                      role="button"
                      tabIndex={0}
                      aria-label={`Nodo ${node.id}, nivel ${node.depth}, ${
                        node.move
                          ? `fila ${node.move.row + 1} columna ${node.move.col + 1} símbolo ${node.move.symbol}`
                          : 'estado inicial'
                      }`}
                      onClick={() => setSelectedNodeId(node.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedNodeId(node.id);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      {(isSelected || isActiveStep) && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={23}
                          fill="none"
                          stroke={isSelected ? '#f59e0b' : '#0ea5e9'}
                          strokeWidth={3}
                        />
                      )}
                      {isRoot ? (
                        <rect
                          x={pos.x - 16}
                          y={pos.y - 16}
                          width={32}
                          height={32}
                          rx={6}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={2}
                        />
                      ) : (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={16}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={onSolPath ? 3 : 1.75}
                          strokeDasharray={strokeDasharray}
                        />
                      )}
                      <text
                        x={pos.x}
                        y={pos.y + 3.5}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={600}
                        fontFamily="IBM Plex Mono, monospace"
                        fill={textColor}
                      >
                        {isRoot ? 'INI' : node.move?.symbol ?? `#${node.id}`}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 29}
                        textAnchor="middle"
                        fontSize={9}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#475569"
                      >
                        #{node.id}
                        {node.move ? ` (${node.move.row + 1},${node.move.col + 1})` : ''}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
      ) : (
        /* Vista alternativa: Tabla de nodos */
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(
                [
                  ['all', 'Todos'],
                  ['explored', 'Explorados'],
                  ['generated', 'Pendientes'],
                  ['solution_path', 'Camino solución'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setNodeFilter(key);
                    setPage(0);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    nodeFilter === key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="font-mono-tabular text-xs text-slate-500">
              {filteredNodes.length.toLocaleString('es-MX')} registros
            </span>
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">ID</th>
                  <th className="px-3 py-2 font-semibold">Padre</th>
                  <th className="px-3 py-2 font-semibold">Nivel</th>
                  <th className="px-3 py-2 font-semibold">Movimiento</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Orden Exp.</th>
                  <th className="px-3 py-2 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-tabular">
                {pagedNodes.map((node) => {
                  const isSel = node.id === selectedNodeId;
                  const statusLabel =
                    node.status === 'solution'
                      ? 'Solución'
                      : node.status === 'explored'
                        ? 'Explorado'
                        : 'Pendiente';
                  return (
                    <tr
                      key={node.id}
                      className={isSel ? 'bg-amber-50/70' : 'hover:bg-slate-50'}
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        #{node.id}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {node.parentId === null ? '—' : `#${node.parentId}`}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{node.depth}</td>
                      <td className="px-3 py-2 text-slate-800">
                        {node.move
                          ? `(F${node.move.row + 1}, C${node.move.col + 1}) = ${node.move.symbol}`
                          : 'Estado inicial'}
                      </td>
                      <td className="px-3 py-2 font-sans font-medium">
                        <span
                          className={
                            node.status === 'solution'
                              ? 'text-emerald-700'
                              : node.status === 'explored'
                                ? 'text-slate-800'
                                : 'text-amber-700'
                          }
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {node.orderExplored === null ? '—' : node.orderExplored}
                      </td>
                      <td className="px-3 py-2 font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          className="text-xs font-semibold text-sky-700 hover:underline whitespace-nowrap"
                        >
                          Ver tablero
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="font-mono-tabular">
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inspector detallado del nodo seleccionado + su estado Sudoku 16x16 */}
      {selectedNode && (
        <div
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          data-testid={`node-inspector-${result.algorithm.toLowerCase()}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Inspector del Nodo #{selectedNode.id} ({result.algorithm})
              </h4>
              <p className="text-xs text-slate-600">
                {selectedNode.move
                  ? `Movimiento aplicado: Fila ${selectedNode.move.row + 1}, Columna ${selectedNode.move.col + 1} → símbolo "${selectedNode.move.symbol}"`
                  : 'Nodo raíz: tablero inicial sin asignaciones adicionales.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedNode.parentId !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(selectedNode.parentId!)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Ir a padre (#{selectedNode.parentId})
                </button>
              )}
              {result.solutionNodeId !== null &&
                selectedNode.id !== result.solutionNodeId && (
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(result.solutionNodeId!)}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                  >
                    Ir a solución (#{result.solutionNodeId})
                  </button>
                )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] items-start">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-slate-500">ID Nodo</dt>
                <dd className="font-mono-tabular font-semibold text-slate-900">
                  #{selectedNode.id}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">ID Padre</dt>
                <dd className="font-mono-tabular font-semibold text-slate-900">
                  {selectedNode.parentId === null ? 'Raíz' : `#${selectedNode.parentId}`}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Profundidad</dt>
                <dd className="font-mono-tabular font-semibold text-slate-900">
                  Nivel {selectedNode.depth}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Estado</dt>
                <dd className="font-semibold text-slate-900">
                  {selectedNode.status === 'solution'
                    ? 'Solución'
                    : selectedNode.status === 'explored'
                      ? 'Explorado'
                      : 'Pendiente'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Orden generación</dt>
                <dd className="font-mono-tabular text-slate-800">
                  #{selectedNode.orderGenerated}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Orden exploración</dt>
                <dd className="font-mono-tabular text-slate-800">
                  {selectedNode.orderExplored === null
                    ? 'Sin explorar'
                    : `Paso ${selectedNode.orderExplored + 1}`}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Sucesores directos</dt>
                <dd className="font-mono-tabular text-slate-800">
                  {selectedNode.childrenIds.length > 0
                    ? selectedNode.childrenIds.map((c) => `#${c}`).join(', ')
                    : 'Ninguno (hoja / contradicción / frontera)'}
                </dd>
              </div>
            </dl>

            <div className="overflow-x-auto">
              <SudokuGrid16
                board={selectedNode.board}
                initialBoard={result.initialBoard}
                highlightCell={
                  selectedNode.move
                    ? {row: selectedNode.move.row, col: selectedNode.move.col}
                    : null
                }
                accent={accent}
                compact
                ariaLabel={`Estado del tablero 16x16 en nodo ${selectedNode.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
