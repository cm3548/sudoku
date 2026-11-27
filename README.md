# Sudoku 16×16 · Laboratorio Comparativo BFS y DFS

Aplicación web educativa desarrollada en **React + TypeScript** para la asignatura de **Matemáticas Aplicadas y Computación**, orientada a demostrar formalmente la resolución de Sudokus de **16×16** mediante **Búsqueda en Anchura (BFS)** y **Búsqueda en Profundidad (DFS)**, conservando sus árboles reales de búsqueda, nodos, relaciones padre-hijo y métricas experimentales.

---

## 1. Requisitos e Instalación

### Prerrequisitos
- Node.js 18+ y npm.

### Instalación y ejecución local
```bash
npm install
npm run dev
```
La aplicación se iniciará en `http://localhost:3000`.

### Compilación y verificación de tipos
```bash
npm run lint
npm run build
```

### Pruebas unitarias de algoritmos y validación
```bash
npx --yes tsx --test src/core/__tests__/sudoku.test.ts
```

---

## 2. Arquitectura Modular del Código

```text
src/
├── core/
│   ├── types.ts          # Constantes 16x16 (1..9, A..G), interfaces de nodos y resultados
│   ├── state.ts          # Representación compacta Uint8Array(256) y política determinista
│   ├── validator.ts      # Verificación de filas, columnas, regiones 4x4 y solución final
│   ├── nodeRegistry.ts   # Registro real de nodos, relaciones padre-hijo y ruta solución
│   ├── generator.ts      # Generador independiente 16x16 con comprobación de unicidad
│   ├── bfs.ts            # Implementación auténtica BFS con cola FIFO (sin recursión)
│   ├── dfs.ts            # Implementación auténtica DFS con pila LIFO y backtracking
│   ├── searchTree.ts     # Muestreo conectado y layout jerárquico sin solapamientos
│   ├── comparison.ts     # Cálculo comparativo de métricas y verificación de tablero idéntico
│   └── __tests__/
│       └── sudoku.test.ts # Suite de pruebas automatizadas (node:test)
├── components/
│   ├── SudokuGrid16.tsx         # Cuadrícula 16x16 con subregiones 4x4 y resaltado de movimientos
│   ├── SearchTreeViewer.tsx     # Visualizador SVG con zoom/pan, paso a paso, tabla e inspector
│   ├── AlgorithmResultPanel.tsx # Panel simétrico de métricas, tablero final y árbol (BFS / DFS)
│   ├── ComparisonPanel.tsx      # Tabla comparativa y gráficas de barras comparativas
│   └── AcademicDocs.tsx         # Documentación académica completa en español (12 secciones)
├── App.tsx               # Orquestación de los 5 paneles y estado experimental
└── main.tsx              # Punto de entrada React
```

---

## 3. Correspondencia entre Requisitos Universitarios y Módulos

| Requisito de la Asignatura | Implementación en la Aplicación |
| :--- | :--- |
| **Generación aleatoria 16×16 (1..9, A..G) y solución única** | `src/core/generator.ts` (`generateCompleteBoard`, `countSolutionsUpToTwo`, `generateSudokuPuzzle`) separado de los algoritmos de búsqueda. |
| **Representación de estados y política determinista** | `src/core/state.ts` (`Uint8Array(256)`, `findNextEmptyCell` por filas, `.` para casillas vacías). |
| **Validación de restricciones (filas, columnas, regiones 4×4)** | `src/core/validator.ts` (`getValidCandidates`, `validateBoard`, `validateSolutionAgainstInitial`). |
| **Implementación auténtica BFS (cola FIFO)** | `src/core/bfs.ts` (`solveWithBFS` con cola FIFO `head++`, expansión por niveles y registro en `NodeRegistry`). |
| **Implementación auténtica DFS (pila LIFO y backtracking)** | `src/core/dfs.ts` (`solveWithDFS` con pila LIFO `stack.pop()`, descenso por rama y retroceso ante contradicciones). |
| **Árboles reales de búsqueda con ID, padre, nivel, movimiento y estado** | `src/core/nodeRegistry.ts` (`SearchNode`) + `src/core/searchTree.ts` (`computeTreeLayout`). |
| **Visualización interactiva (zoom, pan, paso a paso, inspector, tabla)** | `src/components/SearchTreeViewer.tsx` (SVG interactivo + reproducción paso a paso + tabla filtrable + tablero 16×16 del nodo). |
| **Paneles 1–5 (Generador, Ejecución, BFS, DFS, Comparación)** | `src/App.tsx`, `src/components/AlgorithmResultPanel.tsx`, `src/components/ComparisonPanel.tsx`. |
| **Límites configurables sin simular soluciones** | `SearchConfig` (`maxNodes`, `maxTimeMs`, `maxMemoryBytes`) en `bfs.ts` y `dfs.ts`; si se alcanza límite, `solved = false`. |
| **Documentación académica en español (12 puntos)** | `src/components/AcademicDocs.tsx` integrado directamente en la interfaz. |
