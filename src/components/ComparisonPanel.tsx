import React from 'react';
import {BarChart3, CheckCircle2, Scale} from 'lucide-react';
import {buildComparisonSummary} from '../core/comparison';
import {SearchResult} from '../core/types';

interface ComparisonPanelProps {
  bfsResult: SearchResult | null;
  dfsResult: SearchResult | null;
}

interface BarMetricProps {
  label: string;
  bfsValue: number;
  dfsValue: number;
  unit: string;
  decimals?: number;
}

const ComparativeBarChart: React.FC<BarMetricProps> = ({
  label,
  bfsValue,
  dfsValue,
  unit,
  decimals = 0,
}) => {
  const maxVal = Math.max(bfsValue, dfsValue, 0.0001);
  const bfsPct = Math.max(4, Math.round((bfsValue / maxVal) * 100));
  const dfsPct = Math.max(4, Math.round((dfsValue / maxVal) * 100));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold text-slate-800">{label}</div>
      <div className="mt-3 space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-sky-800">BFS (Anchura)</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              {bfsValue.toLocaleString('es-MX', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })}{' '}
              {unit}
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-300"
              style={{width: `${bfsPct}%`}}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-violet-800">DFS (Profundidad)</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              {dfsValue.toLocaleString('es-MX', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })}{' '}
              {unit}
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-violet-700 transition-all duration-300"
              style={{width: `${dfsPct}%`}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  bfsResult,
  dfsResult,
}) => {
  const summary = buildComparisonSummary(bfsResult, dfsResult);

  return (
    <section
      id="comparacion"
      aria-labelledby="heading-comparacion"
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6"
      data-testid="panel-comparison"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2
            id="heading-comparacion"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Panel 5 · Comparación Experimental (BFS vs DFS)
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Evaluación cuantitativa sobre exactamente el mismo estado inicial del Sudoku 16×16.
          </p>
        </div>
        {summary?.sameInitialBoard && bfsResult && dfsResult && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            Mismo tablero inicial verificado
          </div>
        )}
      </div>

      {!summary ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <Scale className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            Ejecuta al menos un algoritmo (idealmente ambos) para generar la tabla y gráficas comparativas.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {/* Tabla comparativa */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Métrica</th>
                  <th className="px-4 py-3 font-semibold text-sky-800">
                    BFS (Búsqueda en Anchura)
                  </th>
                  <th className="px-4 py-3 font-semibold text-violet-800">
                    DFS (Búsqueda en Profundidad)
                  </th>
                  <th className="px-4 py-3 font-semibold">Menor consumo / Ventaja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.rows.map((row) => (
                  <tr key={row.metric} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {row.metric}
                    </td>
                    <td className="px-4 py-2.5 font-mono-tabular text-slate-900">
                      {row.bfsValue}
                    </td>
                    <td className="px-4 py-2.5 font-mono-tabular text-slate-900">
                      {row.dfsValue}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold">
                      {row.winner === 'BFS' ? (
                        <span className="text-sky-700">BFS</span>
                      ) : row.winner === 'DFS' ? (
                        <span className="text-violet-700">DFS</span>
                      ) : row.winner === 'Empate' ? (
                        <span className="text-slate-600">Empate</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráficas comparativas */}
          {bfsResult && dfsResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BarChart3 className="h-4 w-4 text-slate-700" aria-hidden="true" />
                Gráficas Comparativas
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ComparativeBarChart
                  label="Tiempo de ejecución"
                  bfsValue={bfsResult.executionTimeMs}
                  dfsValue={dfsResult.executionTimeMs}
                  unit="ms"
                  decimals={2}
                />
                <ComparativeBarChart
                  label="Nodos generados"
                  bfsValue={bfsResult.nodesGenerated}
                  dfsValue={dfsResult.nodesGenerated}
                  unit="nodos"
                />
                <ComparativeBarChart
                  label="Nodos explorados"
                  bfsValue={bfsResult.nodesExplored}
                  dfsValue={dfsResult.nodesExplored}
                  unit="nodos"
                />
                <ComparativeBarChart
                  label="Memoria estimada"
                  bfsValue={bfsResult.estimatedMemoryBytes / 1024}
                  dfsValue={dfsResult.estimatedMemoryBytes / 1024}
                  unit="KB"
                  decimals={1}
                />
              </div>
            </div>
          )}

          {/* Observaciones automáticas basadas en mediciones reales */}
          {summary.observations.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Análisis Comparativo de la Prueba
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {summary.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
