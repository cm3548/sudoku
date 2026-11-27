import React, {useCallback, useState} from 'react';
import {
  CheckCircle2,
  Play,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {AcademicDocs} from './components/AcademicDocs';
import {AlgorithmResultPanel} from './components/AlgorithmResultPanel';
import {ComparisonPanel} from './components/ComparisonPanel';
import {SudokuGrid16} from './components/SudokuGrid16';
import {solveWithBFS} from './core/bfs';
import {solveWithDFS} from './core/dfs';
import {generateSudokuPuzzle} from './core/generator';
import {cloneBoard} from './core/state';
import {
  DEFAULT_SEARCH_CONFIG,
  GeneratedPuzzle,
  SearchResult,
  SYMBOLS,
} from './core/types';

const DIFFICULTY_PRESETS = [
  {label: 'Demo Inicial (75)', emptyCount: 75},
  {label: 'Media (95)', emptyCount: 95},
  {label: 'Alta (115)', emptyCount: 115},
  {label: 'Extrema (135)', emptyCount: 135},
] as const;

export const App: React.FC = () => {
  // Se inicia con una semilla fija (75 vacías) para demostrar ramificación real y diferencia BFS vs DFS
  const [emptyCountTarget, setEmptyCountTarget] = useState<number>(75);
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle>(() =>
    generateSudokuPuzzle(75, 205)
  );

  const [bfsResult, setBfsResult] = useState<SearchResult | null>(null);
  const [dfsResult, setDfsResult] = useState<SearchResult | null>(null);
  const [runningState, setRunningState] = useState<
    'idle' | 'bfs' | 'dfs' | 'both'
  >('idle');

  const handleGeneratePuzzle = useCallback(
    (requestedEmpty: number = emptyCountTarget) => {
      const nextPuzzle = generateSudokuPuzzle(requestedEmpty);
      setPuzzle(nextPuzzle);
      setBfsResult(null);
      setDfsResult(null);
    },
    [emptyCountTarget]
  );

  const handleSelectPreset = (emptyCount: number) => {
    setEmptyCountTarget(emptyCount);
    handleGeneratePuzzle(emptyCount);
  };

  const handleResetTests = () => {
    setBfsResult(null);
    setDfsResult(null);
    setRunningState('idle');
  };

  const handleRunBFS = () => {
    if (runningState !== 'idle') return;
    setRunningState('bfs');
    window.setTimeout(() => {
      const res = solveWithBFS(
        cloneBoard(puzzle.initialBoard),
        DEFAULT_SEARCH_CONFIG
      );
      setBfsResult(res);
      setRunningState('idle');
    }, 20);
  };

  const handleRunDFS = () => {
    if (runningState !== 'idle') return;
    setRunningState('dfs');
    window.setTimeout(() => {
      const res = solveWithDFS(
        cloneBoard(puzzle.initialBoard),
        DEFAULT_SEARCH_CONFIG
      );
      setDfsResult(res);
      setRunningState('idle');
    }, 20);
  };

  const handleRunBoth = () => {
    if (runningState !== 'idle') return;
    setRunningState('both');
    window.setTimeout(() => {
      // Ambos algoritmos reciben una copia independiente e idéntica del tablero inicial
      const bfsInput = cloneBoard(puzzle.initialBoard);
      const dfsInput = cloneBoard(puzzle.initialBoard);
      const resBfs = solveWithBFS(bfsInput, DEFAULT_SEARCH_CONFIG);
      const resDfs = solveWithDFS(dfsInput, DEFAULT_SEARCH_CONFIG);
      setBfsResult(resBfs);
      setDfsResult(resDfs);
      setRunningState('idle');
    }, 20);
  };

  const isRunning = runningState !== 'idle';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Barra superior (contrato de 3 zonas) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
          <a
            href="#generador"
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Sudoku 16×16 · BFS y DFS
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#generador"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Generador
            </a>
            <a
              href="#resultados"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Resultados
            </a>
            <a
              href="#comparacion"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Comparación
            </a>
            <a
              href="#documentacion"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Documentación
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleRunBoth}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              {runningState === 'both' ? 'Ejecutando…' : 'Ejecutar Ambos'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
        {/* Encabezado académico conciso */}
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Matemáticas Aplicadas y Computación · Búsqueda en Espacio de Estados
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
            Resolución de Sudoku 16×16 mediante BFS y DFS
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Genera un tablero único de 16×16 (símbolos {SYMBOLS.join(', ')}) y ejecuta Búsqueda en Anchura (cola FIFO) y Búsqueda en Profundidad (pila LIFO) sobre el mismo estado inicial para inspeccionar sus árboles reales de búsqueda.
          </p>
        </div>

        {/* PANEL 1 y PANEL 2 */}
        <div
          id="generador"
          className="scroll-mt-20 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] items-start"
        >
          {/* PANEL 1: Generador de Sudoku */}
          <section
            aria-labelledby="heading-generador"
            className="rounded-xl border border-slate-200 bg-white p-6"
            data-testid="panel-generator"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2
                  id="heading-generador"
                  className="text-xl font-bold tracking-tight text-slate-900"
                >
                  Panel 1 · Generador de Sudoku 16×16
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Tablero inicial compartido por ambos algoritmos. Las casillas vacías se representan con «.».
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGeneratePuzzle(emptyCountTarget)}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Generar Nuevo Sudoku
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center space-y-4">
              <SudokuGrid16
                board={puzzle.initialBoard}
                ariaLabel="Tablero inicial de Sudoku 16 por 16"
              />

              {/* Indicador de validez y metadatos del tablero generado */}
              <div
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-xs ${
                  puzzle.validation.isValid && puzzle.isUnique
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-rose-200 bg-rose-50 text-rose-900'
                }`}
                data-testid="puzzle-validity"
              >
                <div className="flex items-center gap-2 font-medium">
                  {puzzle.validation.isValid ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="h-4 w-4 shrink-0 text-rose-700"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {puzzle.validation.isValid
                      ? 'Tablero válido (0 conflictos en filas, columnas y cajas 4×4)'
                      : `Conflictos detectados: ${puzzle.validation.conflicts.length}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-slate-700">
                  <span>
                    Vacías: <strong>{puzzle.emptyCountActual}</strong> / 256
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Solución única:{' '}
                    <strong>{puzzle.isUnique ? 'Verificada' : 'No garantizada'}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{puzzle.generationTimeMs.toFixed(1)} ms</span>
                </div>
              </div>
            </div>
          </section>

          {/* Controles del Generador + PANEL 2: Ejecución de Algoritmos */}
          <div className="space-y-6">
            {/* Configuración del generador */}
            <section
              aria-labelledby="heading-config-generador"
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
            >
              <div>
                <h3
                  id="heading-config-generador"
                  className="text-base font-bold text-slate-900"
                >
                  Dificultad y Casillas Vacías
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  La demostración inicial usa 75 casillas vacías (29% del tablero) para mostrar ramificación real entre BFS y DFS.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTY_PRESETS.map((preset) => (
                  <button
                    key={preset.emptyCount}
                    type="button"
                    onClick={() => handleSelectPreset(preset.emptyCount)}
                    disabled={isRunning}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                      emptyCountTarget === preset.emptyCount
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="empty-cells-slider"
                    className="font-medium text-slate-700"
                  >
                    Cantidad de casillas vacías
                  </label>
                  <span className="font-mono-tabular font-semibold text-slate-900">
                    {emptyCountTarget} casillas
                  </span>
                </div>
                <input
                  id="empty-cells-slider"
                  type="range"
                  min={12}
                  max={140}
                  step={1}
                  value={emptyCountTarget}
                  onChange={(e) => setEmptyCountTarget(Number(e.target.value))}
                  className="w-full accent-slate-900"
                />
                <div className="flex justify-between font-mono-tabular text-[11px] text-slate-400">
                  <span>12 (simple)</span>
                  <span>75 (demo)</span>
                  <span>140 (alto ramificado)</span>
                </div>
              </div>
            </section>

            {/* PANEL 2: Ejecución de Algoritmos */}
            <section
              aria-labelledby="heading-ejecucion"
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
              data-testid="panel-execution"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2
                  id="heading-ejecucion"
                  className="text-xl font-bold tracking-tight text-slate-900"
                >
                  Panel 2 · Ejecución de Algoritmos
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Ejecución independiente sobre copias exactas del tablero inicial.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleRunBFS}
                  disabled={isRunning}
                  className="rounded-lg bg-sky-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap disabled:opacity-50"
                >
                  {runningState === 'bfs' ? 'Ejecutando BFS…' : 'Ejecutar BFS'}
                </button>
                <button
                  type="button"
                  onClick={handleRunDFS}
                  disabled={isRunning}
                  className="rounded-lg bg-violet-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-violet-800 whitespace-nowrap disabled:opacity-50"
                >
                  {runningState === 'dfs' ? 'Ejecutando DFS…' : 'Ejecutar DFS'}
                </button>
                <button
                  type="button"
                  onClick={handleRunBoth}
                  disabled={isRunning}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  {runningState === 'both'
                    ? 'Ejecutando BFS y DFS…'
                    : 'Ejecutar Ambos Algoritmos'}
                </button>
                <button
                  type="button"
                  onClick={handleResetTests}
                  disabled={isRunning}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reiniciar Pruebas
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* PANEL 3 (BFS) y PANEL 4 (DFS) */}
        <div id="resultados" className="scroll-mt-20 space-y-8">
          <AlgorithmResultPanel
            title="Panel 3 · Resultados BFS (Búsqueda en Anchura)"
            algorithm="BFS"
            result={bfsResult}
            isRunning={runningState === 'bfs' || runningState === 'both'}
            onRun={handleRunBFS}
          />

          <AlgorithmResultPanel
            title="Panel 4 · Resultados DFS (Búsqueda en Profundidad)"
            algorithm="DFS"
            result={dfsResult}
            isRunning={runningState === 'dfs' || runningState === 'both'}
            onRun={handleRunDFS}
          />
        </div>

        {/* PANEL 5: Comparación */}
        <ComparisonPanel bfsResult={bfsResult} dfsResult={dfsResult} />

        {/* Documentación Académica */}
        <AcademicDocs
          emptyCountActual={puzzle.emptyCountActual}
          bfsResult={bfsResult}
          dfsResult={dfsResult}
        />
      </main>
    </div>
  );
};

export default App;
