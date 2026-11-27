import React from 'react';
import {formatBytes, formatSearchStatus} from '../core/comparison';
import {SearchResult} from '../core/types';

interface AcademicDocsProps {
  emptyCountActual: number;
  bfsResult: SearchResult | null;
  dfsResult: SearchResult | null;
}

export const AcademicDocs: React.FC<AcademicDocsProps> = ({
  emptyCountActual,
  bfsResult,
  dfsResult,
}) => {
  return (
    <section
      id="documentacion"
      aria-labelledby="heading-documentacion"
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 md:p-8"
    >
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Matemáticas Aplicadas y Computación · Inteligencia Artificial
        </p>
        <h2
          id="heading-documentacion"
          className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
        >
          Documentación Académica del Proyecto
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Formulación formal del Sudoku 16×16 como problema de búsqueda en espacio de estados y análisis comparativo entre BFS y DFS.
        </p>
      </div>

      <div className="font-serif-academic mt-6 grid grid-cols-1 gap-6 text-[15px] leading-relaxed text-slate-800 lg:grid-cols-2">
        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            1. Planteamiento del problema
          </h3>
          <p>
            El Sudoku de orden 4 (16×16) es un problema clásico de satisfacción de restricciones (CSP) perteneciente a la clase NP-completo en su formulación generalizada. Consiste en completar una cuadrícula de 256 celdas dividida en 16 subregiones cuadradas de 4×4 utilizando un alfabeto de 16 símbolos distintos <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">{'{1..9, A..G}'}</code>, partiendo de un conjunto dado de pistas iniciales que garantizan una solución única.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            2. Representación del Sudoku como espacio de estados
          </h3>
          <p>
            Cada estado <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">s</code> se modela como un vector compacto <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">Uint8Array(256)</code> donde el valor <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">0</code> representa una casilla vacía (<code className="font-mono-tabular text-xs">.</code>) y los enteros <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">1..16</code> codifican los símbolos <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">1..G</code>. El espacio de búsqueda se organiza como un árbol dirigido enraizado donde cada arista etiqueta una asignación válida de un símbolo en una celda vacía.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            3. Estado inicial
          </h3>
          <p>
            El estado inicial <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">s₀</code> (nodo raíz <code className="font-mono-tabular text-xs bg-slate-100 px-1 py-0.5 rounded">#0</code>, profundidad <code className="font-mono-tabular text-xs">d = 0</code>) corresponde al tablero 16×16 generado aleatoriamente tras verificar su validez y unicidad. Ambos algoritmos (BFS y DFS) reciben copias independientes e idénticas de <code className="font-mono-tabular text-xs">s₀</code>, actualmente con <span className="font-mono-tabular font-semibold">{emptyCountActual}</span> casillas vacías.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            4. Estados sucesores
          </h3>
          <p>
            Dado un estado <code className="font-mono-tabular text-xs">s</code>, se selecciona de manera determinista la primera casilla vacía en orden por filas (<em>row-major</em>). Para dicha coordenada <code className="font-mono-tabular text-xs">(r, c)</code> se calculan todos los símbolos candidatos <code className="font-mono-tabular text-xs">v ∈ {'{1..G}'}</code> que no violan las restricciones de fila, columna ni subregión 4×4. Cada candidato genera un nuevo nodo sucesor en profundidad <code className="font-mono-tabular text-xs">d + 1</code>.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            5. Prueba de objetivo
          </h3>
          <p>
            Un estado <code className="font-mono-tabular text-xs">s</code> satisface la prueba de objetivo si y solo si: (a) no contiene ninguna casilla vacía (<code className="font-mono-tabular text-xs">0</code>) y (b) supera la validación estructural completa sin símbolos repetidos en ninguna fila, columna o bloque 4×4, conservando todas las pistas de <code className="font-mono-tabular text-xs">s₀</code>.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            6. Restricciones del problema
          </h3>
          <p>
            Todo estado válido debe satisfacer tres familias de restricciones alldiff: (1) cada una de las 16 filas contiene a lo sumo una ocurrencia de cada símbolo; (2) cada una de las 16 columnas contiene a lo sumo una ocurrencia de cada símbolo; y (3) cada una de las 16 cajas 4×4 contiene a lo sumo una ocurrencia de cada símbolo.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            7. Funcionamiento de BFS (Búsqueda en Anchura)
          </h3>
          <p>
            BFS mantiene la frontera en una cola estrictamente <strong>FIFO</strong> (<em>First-In, First-Out</em>). Expande todos los nodos de nivel <code className="font-mono-tabular text-xs">d</code> antes de pasar al nivel <code className="font-mono-tabular text-xs">d + 1</code>. Es completo y óptimo en profundidad de pasos, pero su complejidad espacial es exponencial <code className="font-mono-tabular text-xs">O(b^d)</code>, pues retiene simultáneamente en memoria toda la frontera del nivel actual y el árbol generado.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            8. Funcionamiento de DFS (Búsqueda en Profundidad)
          </h3>
          <p>
            DFS gestiona la frontera mediante una pila explícita <strong>LIFO</strong> (<em>Last-In, First-Out</em>). Desciende por una rama hasta alcanzar una solución o una contradicción (casilla sin candidatos válidos), momento en el cual retrocede (<em>backtracking</em>) al último punto de ramificación pendiente. Su complejidad espacial de frontera es lineal respecto a la profundidad <code className="font-mono-tabular text-xs">O(b · m)</code>.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            9. Diferencias entre ambas estrategias
          </h3>
          <p>
            En un Sudoku con <code className="font-mono-tabular text-xs">k</code> casillas vacías, todas las soluciones válidas se encuentran exactamente a profundidad <code className="font-mono-tabular text-xs">d = k</code>. Por ello, BFS debe explorar prácticamente todo el subárbol de niveles <code className="font-mono-tabular text-xs">0..k-1</code> antes de tocar el nivel <code className="font-mono-tabular text-xs">k</code>, mientras que DFS alcanza rápidamente la profundidad <code className="font-mono-tabular text-xs">k</code> explorando una fracción mucho menor de nodos cuando el orden de candidatos acierta temprano.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            10. Construcción del árbol de búsqueda
          </h3>
          <p>
            Ambos algoritmos registran cada nodo real en <code className="font-mono-tabular text-xs">NodeRegistry</code> con identificador único (<code className="font-mono-tabular text-xs">id</code>), referencia al padre (<code className="font-mono-tabular text-xs">parentId</code>), profundidad, movimiento realizado, estado del tablero 16×16, orden de generación y orden de exploración. Al hallar el objetivo, se recorren los punteros <code className="font-mono-tabular text-xs">parentId</code> hasta la raíz para reconstruir el camino solución.
          </p>
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            11. Resultados experimentales
          </h3>
          {bfsResult || dfsResult ? (
            <p>
              En la ejecución actual sobre el tablero de <span className="font-mono-tabular font-semibold">{emptyCountActual}</span> casillas vacías:{' '}
              {bfsResult && (
                <>
                  <strong>BFS</strong> concluyó con estado «{formatSearchStatus(bfsResult.status)}» en{' '}
                  <span className="font-mono-tabular">{bfsResult.executionTimeMs.toFixed(2)} ms</span>, generando{' '}
                  <span className="font-mono-tabular">{bfsResult.nodesGenerated.toLocaleString('es-MX')}</span> nodos y explorando{' '}
                  <span className="font-mono-tabular">{bfsResult.nodesExplored.toLocaleString('es-MX')}</span> (memoria estimada:{' '}
                  <span className="font-mono-tabular">{formatBytes(bfsResult.estimatedMemoryBytes)}</span>).{' '}
                </>
              )}
              {dfsResult && (
                <>
                  <strong>DFS</strong> concluyó con estado «{formatSearchStatus(dfsResult.status)}» en{' '}
                  <span className="font-mono-tabular">{dfsResult.executionTimeMs.toFixed(2)} ms</span>, generando{' '}
                  <span className="font-mono-tabular">{dfsResult.nodesGenerated.toLocaleString('es-MX')}</span> nodos y explorando{' '}
                  <span className="font-mono-tabular">{dfsResult.nodesExplored.toLocaleString('es-MX')}</span> (memoria estimada:{' '}
                  <span className="font-mono-tabular">{formatBytes(dfsResult.estimatedMemoryBytes)}</span>).
                </>
              )}
            </p>
          ) : (
            <p>
              Ejecuta ambos algoritmos en el panel superior para observar en tiempo real la diferencia entre el crecimiento por niveles de BFS y el descenso con retroceso de DFS sobre este mismo tablero.
            </p>
          )}
        </article>

        <article className="space-y-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">
            12. Conclusiones
          </h3>
          <p>
            Aunque BFS garantiza explorar en orden estricto de profundidad mínima, su requerimiento de memoria <code className="font-mono-tabular text-xs">O(b^d)</code> vuelve inviable la búsqueda no informada en Sudokus 16×16 con muchas casillas vacías sin límites de seguridad. DFS, en cambio, aprovecha que todas las soluciones residen en el fondo del árbol (<code className="font-mono-tabular text-xs">d = k</code>) para resolver instancias más amplias con menor consumo de memoria y nodos, evidenciando por qué los algoritmos de búsqueda en profundidad con propagación de restricciones son el fundamento de los resolvedores modernos.
          </p>
        </article>
      </div>
    </section>
  );
};
