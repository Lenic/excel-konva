import Konva from 'konva';
import { combineLatest, fromEventPattern, map, shareReplay, tap } from 'rxjs';

import { scrollContainer } from './core-elements';
import { config, sheetDimension } from './helpers';

export const stage = new Konva.Stage({ container: 'konva-container', width: 0, height: 0 });
sheetDimension.visualSize$.subscribe((size) => stage.setAttrs(size));

// 连接 Canvas 的鼠标滚轮事件和滚动容器的滚动事件
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
 * 拖拽调整尺寸时的辅助线
 */
export const resizeLine = new Konva.Line({
  points: [0, 0, 0, 0],
  stroke: '#4e95ff', // 蓝色辅助线
  strokeWidth: 2,
  dash: [4, 4],
  visible: false,
  listening: false,
});
selectionLayer.add(resizeLine);

// 为四个区域创建独立的 Konva Group
export const scrollableGroup = new Konva.Group(); // R1+, C1+
export const sideGroup = new Konva.Group(); // R1+, C0
export const headerGroup = new Konva.Group(); // R0, C1+
export const cornerGroup = new Konva.Group(); // R0, C0

backgroundLayer.add(scrollableGroup, sideGroup, headerGroup, cornerGroup);

export const getCellGroup$ = combineLatest([config.frozenRows$, config.frozenColumns$]).pipe(
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
