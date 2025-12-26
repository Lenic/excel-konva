import { EMPTY, finalize, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

import { MIN_CELL_HEIGHT, MIN_CELL_WIDTH } from '../constants';
import { resizeLine, selectionLayer, stage } from '../konva-items';
import { getColumnLeft$ } from '../utils/column';
import { getRowTop$ } from '../utils/row';
import { getColumnWidth$, getRowHeight$, setColumnWidth, setRowHeight, sheetVisualSize$ } from '../utils/size';

import { BoundaryTypes, MousedownTypes } from './constants';
import { mouseMove$, mouseUp$, typedLeftMouseDown$ } from './core';

export const resizeBoundary$ = typedLeftMouseDown$.pipe(
  switchMap((v) => (v.mousedownType === MousedownTypes.ResizeBoundary ? of([v.data, v.event] as const) : EMPTY)),
  withLatestFrom(getColumnWidth$, getRowHeight$, sheetVisualSize$, getColumnLeft$, getRowTop$),
  switchMap(([[info, e], getColumnWidth, getRowHeight, sheetVisualSize, getColumnLeft, getRowTop]) => {
    // 阻止默认的 mousedown 行为
    e.evt.preventDefault();
    // 设置当前的鼠标样式
    stage.container().style.cursor = info.type === BoundaryTypes.Column ? 'col-resize' : 'row-resize';

    let initialDimension = 0;
    if (info.type === BoundaryTypes.Column) {
      initialDimension = getColumnWidth(info.index);
      resizeLine.points([info.boundary, 0, info.boundary, sheetVisualSize.height]);
    } else {
      initialDimension = getRowHeight(info.index);
      resizeLine.points([0, info.boundary, sheetVisualSize.width, info.boundary]);
    }
    resizeLine.visible(true);

    selectionLayer.batchDraw();

    const clear$ = mouseUp$.pipe(
      tap((ue) => {
        resizeLine.visible(false);

        if (info.type === BoundaryTypes.Column) {
          const dx = ue.evt.clientX - e.evt.clientX;
          const newWidth = Math.max(initialDimension + dx, MIN_CELL_WIDTH);
          setColumnWidth(info.index, Math.round(newWidth));
        } else {
          const dy = ue.evt.clientY - e.evt.clientY;
          const newHeight = Math.max(initialDimension + dy, MIN_CELL_HEIGHT);
          setRowHeight(info.index, newHeight);
        }
      }),
      finalize(() => {
        stage.container().style.cursor = 'default';
      }),
    );

    return mouseMove$.pipe(
      takeUntil(clear$),
      tap((me) => {
        if (info.type === BoundaryTypes.Column) {
          const dx = me.evt.clientX - e.evt.clientX;
          const newWidth = Math.max(initialDimension + dx, MIN_CELL_WIDTH);

          // 实时更新辅助线位置 (获取该列右边界的当前位置，然后加上尺寸变化)
          const currentBoundaryX = getColumnLeft(info.index + 1);
          const widthDelta = newWidth - initialDimension;
          const newX = currentBoundaryX + widthDelta;

          resizeLine.points([newX, 0, newX, sheetVisualSize.height]);
        } else {
          const dy = me.evt.clientY - e.evt.clientY;
          const newHeight = Math.max(initialDimension + dy, MIN_CELL_HEIGHT);

          // 实时更新辅助线位置 (获取该行下边界的当前位置，然后加上尺寸变化)
          const currentBoundaryY = getRowTop(info.index + 1);
          const heightDelta = newHeight - initialDimension;
          const newY = currentBoundaryY + heightDelta;

          resizeLine.points([0, newY, sheetVisualSize.width, newY]);
        }
        selectionLayer.batchDraw();
      }),
    );
  }),
);
