import Konva from 'konva';
import { combineLatest, fromEventPattern, map, shareReplay, tap } from 'rxjs';

import { ServiceLocator } from '../container';

import { scrollContainer } from './core-elements';
import { ISheetConfig } from './helpers';

export const stage = new Konva.Stage({ container: 'konva-container', width: 0, height: 0 });

// Connect Canvas wheel events to scroll container scroll events
fromEventPattern<Konva.KonvaEventObject<WheelEvent>>(
  (fn) => stage.on('wheel', fn),
  (fn) => stage.off('wheel', fn),
)
  .pipe(
    tap((e) => {
      e.evt.preventDefault();
    }),
  )
  .subscribe((e) => {
    scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop + e.evt.deltaY);
    scrollContainer.scrollLeft = Math.max(0, scrollContainer.scrollLeft + e.evt.deltaX);
  });

export const backgroundLayer = new Konva.Layer();
stage.add(backgroundLayer);

export const selectionLayer = new Konva.Layer();
stage.add(selectionLayer);

/**
 * Helper line for resizing by dragging
 */
export const resizeLine = new Konva.Line({
  points: [0, 0, 0, 0],
  stroke: '#4e95ff', // Blue helper line
  strokeWidth: 2,
  dash: [4, 4],
  visible: false,
  listening: false,
});
selectionLayer.add(resizeLine);

// Create independent Konva Groups for four areas
export const scrollableGroup = new Konva.Group(); // R1+, C1+
export const sideGroup = new Konva.Group(); // R1+, C0
export const headerGroup = new Konva.Group(); // R0, C1+
export const cornerGroup = new Konva.Group(); // R0, C0

backgroundLayer.add(scrollableGroup, sideGroup, headerGroup, cornerGroup);

/**
 * Build get cell group function
 *
 * @returns Get cell group function
 */
export function buildGetCellGroup$() {
  const config = ServiceLocator.current.get(ISheetConfig);
  return combineLatest([config.frozenRows$, config.frozenColumns$]).pipe(
    map(([frozenRows, frozenColumns]) => {
      return function getCellGroup(rowIndex: number, columnIndex: number) {
        const isHeader = rowIndex < frozenRows;
        const isFrozenCol = columnIndex < frozenColumns;

        if (isHeader && isFrozenCol) return cornerGroup; // R0, C0
        if (isHeader) return headerGroup; // R0, C1+
        if (isFrozenCol) return sideGroup; // R1+, C0
        return scrollableGroup; // R1+, C1+
      };
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );
}
