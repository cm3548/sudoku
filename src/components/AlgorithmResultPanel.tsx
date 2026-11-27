import React from 'react';
import {AlertTriangle, CheckCircle2, Clock, XCircle} from 'lucide-react';
import {formatBytes, formatSearchStatus} from '../core/comparison';
import {SearchResult} from '../core/types';
import {SearchTreeViewer} from './SearchTreeViewer';
import {SudokuGrid16} from './SudokuGrid16';

interface AlgorithmResultPanelProps {
  title: string;
  algorithm: 'BFS' | 'DFS';
  result: SearchResult | null;
  isRunning: boolean;
  onRun: () => void;
}

export const AlgorithmResultPanel: React.FC<AlgorithmResultPanelProps> = ({
  title,
  algorithm,
  result,
  isRunning,
  onRun,
}) => {
  const accent = algorithm === 'BFS' ? 'sky' : 'violet';
  const buttonStyle =
    accent === 'sky'
      ? 'bg-sky-700 hover:bg-sky-800 text-white'
      : 'bg-violet-700 hover:bg-violet-800 text-white';

  return (
    <section
      aria-labelledby={`heading-${algorithm.toLowerCase()}`}
      className="rounded-xl border border-slate-200 bg-white p-6"
      data-testid={`panel-${algorithm.toLowerCase()}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2
            id={`heading-${algorithm.toLowerCase()}`}
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50 ${buttonStyle}`}
        >
          {isRunning ? `Ejecutando ${algorithm}…` : `Ejecutar ${algorithm}`}
        </button>
      </div>

      {!result ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <Clock className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            Aún no se ha ejecutado {algorithm} sobre el tablero actual.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Presiona &ldquo;Ejecutar {algorithm}&rdquo; o &ldquo;Ejecutar Ambos&rdquo; para construir el árbol real y registrar métricas.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {/* Indicador explícito de resultado (nunca simula solución si alcanzó límite) */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              result.solved && result.validSolution
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : result.status === 'unsolvable'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {result.solved && result.validSolution ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              ) : result.status === 'unsolvable' ? (
                <XCircle className="h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              )}
              <div>
                <span className="font-semibold">
                  {formatSearchStatus(result.status)}:
                </span>{' '}
                <span>{result.statusMessage}</span>
              </div>
            </div>
            {result.solved && result.validSolution && (
              <span className="text-xs font-semibold text-emerald-800">
                Verificado sin conflictos (16×16)
              </span>
            )}
          </div>

          {/* Métricas cuantitativas */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Tiempo</dt>
              <dd className="mt-0.5 font-mono-tabular text-base font-semibold text-slate-900">
                {result.executionTimeMs.toFixed(2)} ms
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Nodos generados</dt>
              <dd className="mt-0.5 font-mono-tabular text-base font-semibold text-slate-900">
                {result.nodesGenerated.toLocaleString('es-MX')}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Nodos explorados</dt>
              <dd className="mt-0.5 font-mono-tabular text-base font-semibold text-slate-900">
                {result.nodesExplored.toLocaleString('es-MX')}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Profundidad máx.</dt>
              <dd className="mt-0.5 font-mono-tabular text-base font-semibold text-slate-900">
                {result.maxDepth}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Nivel solución</dt>
              <dd className="mt-0.5 font-mono-tabular text-base font-semibold text-slate-900">
                {result.solutionDepth !== null ? result.solutionDepth : '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Memoria árbol</dt>
              <dd className="mt-0.5 font-mono-tabular text-base font-semibold text-slate-900">
                {formatBytes(result.estimatedMemoryBytes)}
              </dd>
            </div>
          </dl>

          {/* Tablero resuelto o aviso de límite */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Tablero Resultante ({algorithm})
            </h3>
            {result.solved && result.solutionBoard ? (
              <div className="flex flex-col gap-2">
                <div className="overflow-x-auto">
                  <SudokuGrid16
                    board={result.solutionBoard}
                    initialBoard={result.initialBoard}
                    accent={accent}
                    compact
                    ariaLabel={`Solución 16x16 encontrada por ${algorithm}`}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Camino solución: {result.solutionPathIds.length} nodos desde la raíz (#0) hasta #{result.solutionNodeId}.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
                {algorithm} no completó el tablero porque alcanzó un límite o determinó que no existe solución dentro de la cota configurada. Puedes incrementar el límite de nodos o inspeccionar los nodos explorados en el árbol inferior.
              </div>
            )}
          </div>

          {/* Árbol de búsqueda + tabla de nodos + inspector */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Árbol de Búsqueda y Registro de Nodos ({algorithm})
            </h3>
            <SearchTreeViewer result={result} accent={accent} />
          </div>
        </div>
      )}
    </section>
  );
};
