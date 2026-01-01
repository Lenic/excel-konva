# excel-konva

An engineering-oriented, Excel-like spreadsheet implementation built on **Konva** and **RxJS**.

## Overview

`excel-konva` is a canvas-based spreadsheet prototype that explores how to build an **Excel-style grid system** using imperative rendering (Konva) combined with **reactive state management** (RxJS).

The project focuses on **rendering architecture, interaction modeling, and performance trade-offs**, rather than feature completeness.

## Goals

- Validate canvas-based spreadsheet rendering feasibility
- Explore reactive event/state modeling with RxJS
- Provide a clean foundation for editor-like systems (tables, grids, timelines)

Non-goals:

- Full Excel feature parity
- Formula engine or persistence layer

## Architecture

```
┌────────────────────┐
│ Input              │  Mouse / Keyboard
└─────┬──────────────┘
      │
┌─────▼──────────────┐
│ RxJS Event Streams │  Selection / Scroll / Edit
└─────┬──────────────┘
      │
┌─────▼──────────────┐
│ State Model        │  Viewport / Cells / Selection
└─────┬──────────────┘
      │
┌─────▼──────────────┐
│ Konva Renderer     │  Rect / Text / Layers
└────────────────────┘
```

### Key Layers

- **Rendering Layer (Konva)**
  - Pure drawing logic
  - No business state
- **State & Events (RxJS)**
  - Cell updates
  - Selection and interaction streams
- **Coordinator**
  - Bridges reactive state to imperative drawing

## Performance Considerations

- Canvas rendering scales with **visible pixels**, not logical grid size
- Large logical grids are clipped by viewport
- No aggressive caching of large shapes
- Event hit-testing minimized via layer separation

## Design Decisions

### Why Konva

- Explicit control over draw order and layers
- Predictable canvas abstraction
- Suitable for editor-style UIs

### Why RxJS

- Clear separation of events vs state
- Deterministic update flow
- Avoids implicit reactivity magic

### Why not DOM / Virtualized Table

- DOM tables struggle with very large grids
- Canvas offers stable performance characteristics

## Development

```bash
pnpm install
pnpm dev
```

## Project Status

This is an **experimental / exploratory project** intended for learning and architectural validation.

## License

MIT
