# Sudoku 16×16 · Laboratorio Comparativo BFS y DFS

Aplicación web educativa desarrollada en **React + TypeScript** para la asignatura de **Matemáticas Aplicadas y Computación**, orientada a demostrar formalmente la resolución de Sudokus de **16×16** mediante **Búsqueda en Anchura (BFS)** y **Búsqueda en Profundidad (DFS)**, conservando sus árboles reales de búsqueda, nodos, relaciones padre-hijo y métricas experimentales.

---

## 1. Instalación y Ejecución Rápida

### Prerrequisitos
- **Node.js 18 o superior** (incluye `npm` y `npx`). Puedes comprobar tu versión ejecutando:
  ```bash
  node -v
  ```
- **Git** (opcional, si clonas el repositorio desde GitHub).
- No requiere variables de entorno, base de datos ni claves de API: todo se ejecuta localmente en tu navegador.

### Opción A · Clonar el repositorio
```bash
git clone https://github.com/cm3548/sudoku.git
cd sudoku
npm install
npm run dev
```

### Opción B · Descargar como ZIP
1. Entra a [https://github.com/cm3548/sudoku](https://github.com/cm3548/sudoku), haz clic en **Code → Download ZIP** y descomprímelo en tu computadora.
2. Abre una terminal (PowerShell, CMD o Terminal) dentro de la carpeta descomprimida (`sudoku-main`) y ejecuta:
   ```bash
   npm install
   npm run dev
   ```

Una vez iniciado el servidor, abre tu navegador en:
```text
http://localhost:3000
```

### Otros comandos útiles
- **Verificar tipos de TypeScript**:
  ```bash
  npm run lint
  ```
- **Generar compilación de producción (`dist/`) y previsualizarla**:
  ```bash
  npm run build
  npm run preview
  ```
- **Ejecutar pruebas unitarias de algoritmos y validación**:
  ```bash
  npx --yes tsx --test src/core/__tests__/sudoku.test.ts
  ```

### Guía rápida de uso
- **Panel 1 (Generador)**: elige la cantidad de casillas vacías (de `12` a `115`) o un nivel predefinido y pulsa **Generar Nuevo Sudoku**.
- **Panel 2 (Ejecución)**: ejecuta **BFS**, **DFS** o **Ejecutar Ambos Algoritmos** sobre copias idénticas del tablero inicial (con límite interno de seguridad de `50,000` nodos, `10 s` y `64 MB`).
- **Paneles 3 y 4 (Árboles reales)**: usa la rueda del ratón o el gesto *pinch* del trackpad para acercar/alejar, arrastra para desplazarte, utiliza **Paso a paso** para ver el orden de exploración o haz clic en cualquier nodo (o fila en **Tabla de Nodos**) para inspeccionar su estado 16×16.

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
