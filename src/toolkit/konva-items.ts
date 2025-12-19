import Konva from 'konva';
import { combineLatest, map, shareReplay } from 'rxjs';

import { frozenColumnsSubject, frozenRowsSubject } from './constants';
import { container } from './core-elements';

export const stage = new Konva.Stage({
  container: 'konva-container',
  width: container.clientWidth,
  height: container.clientHeight,
});

export const layer = new Konva.Layer();
stage.add(layer);

export const selectionLayer = new Konva.Layer();
stage.add(selectionLayer);

// 为四个区域创建独立的 Konva Group
export const scrollableGroup = new Konva.Group(); // R1+, C1+
export const sideGroup = new Konva.Group(); // R1+, C0
export const headerGroup = new Konva.Group(); // R0, C1+
export const cornerGroup = new Konva.Group(); // R0, C0

layer.add(scrollableGroup, sideGroup, headerGroup, cornerGroup);

export const getCellGroup$ = combineLatest([frozenRowsSubject, frozenColumnsSubject]).pipe(
  map(([frozenRows, frozenColumns]) => {
    return function getCellGroup(row: number, col: number) {
      const isHeader = row < frozenRows;
      const isFrozenCol = col < frozenColumns;

      if (isHeader && isFrozenCol) return cornerGroup; // R0, C0
      if (isHeader) return headerGroup; // R0, C1+
      if (isFrozenCol) return sideGroup; // R1+, C0
      return scrollableGroup; // R1+, C1+
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
