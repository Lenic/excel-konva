import type { TMousedownEvent } from './types';
import type Konva from 'konva';

import { EMPTY, exhaustMap, fromEventPattern, map, of, shareReplay, withLatestFrom } from 'rxjs';

import { cellDimension, sheet } from '../helpers';
import { stage } from '../konva-items';

import { EHeaderClickType, EMousedownTypes } from './types';
import { checkResizeBoundary$ } from './utils';

function getMouseEvent$(key: keyof GlobalEventHandlersEventMap) {
  return fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
    (fn) => stage.on(key, fn),
    (fn) => stage.off(key, fn),
  ).pipe(shareReplay({ refCount: true, bufferSize: 1 }));
}

export const mouseDown$ = getMouseEvent$('mousedown');
export const mouseMove$ = getMouseEvent$('mousemove');
export const mouseUp$ = getMouseEvent$('mouseup');

export const typedLeftMouseDown$ = mouseDown$.pipe(
  exhaustMap((e) => (e.evt.button === 0 ? of(e) : EMPTY)),
  withLatestFrom(checkResizeBoundary$, cellDimension.getCellLocation$, sheet.columnCount$, sheet.rowCount$),
  map(([e, checkResizeBoundary, getCellLocation, columnCount, rowCount]) => {
    // 1. Check if resize is triggered
    const boundary = checkResizeBoundary(e.evt.clientX, e.evt.clientY);
    if (boundary) {
      return { mousedownType: EMousedownTypes.ResizeBoundary, data: boundary, event: e } as TMousedownEvent;
    }

    // 2. Check if clicked on empty area of Konva Stage (not a cell)
    if (e.target === stage) {
      return { mousedownType: EMousedownTypes.Empty, event: e } as TMousedownEvent;
    }

    // 3. Start cell selection
    const startCell = getCellLocation(e.evt.clientX, e.evt.clientY);
    const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

    const isRowHeaderClick = startCell.columnIndex === 0 && startCell.rowIndex !== 0;
    const isColHeaderClick = startCell.rowIndex === 0 && startCell.columnIndex !== 0;
    const isCornerClick = startCell.rowIndex === 0 && startCell.columnIndex === 0;

    if (isCornerClick) {
      return {
        mousedownType: EMousedownTypes.HeaderClick,
        data: {
          type: EHeaderClickType.Corner,
          region: {
            startRowIndex: 1,
            endRowIndex: rowCount - 1,
            startColumnIndex: 1,
            endColumnIndex: columnCount - 1,
          },
          activeCell: {
            rowIndex: 1,
            columnIndex: 1,
          },
          isMultiSelect,
        },
        event: e,
      } as TMousedownEvent;
    } else if (isRowHeaderClick) {
      return {
        mousedownType: EMousedownTypes.HeaderClick,
        data: {
          type: EHeaderClickType.RowHeader,
          region: {
            startRowIndex: startCell.rowIndex,
            endRowIndex: startCell.rowIndex,
            startColumnIndex: 1,
            endColumnIndex: columnCount - 1,
          },
          activeCell: {
            rowIndex: startCell.rowIndex,
            columnIndex: 1,
          },
          isMultiSelect,
        },
        event: e,
      } as TMousedownEvent;
    } else if (isColHeaderClick) {
      return {
        mousedownType: EMousedownTypes.HeaderClick,
        data: {
          type: EHeaderClickType.ColumnHeader,
          region: {
            startRowIndex: 1,
            endRowIndex: rowCount - 1,
            startColumnIndex: startCell.columnIndex,
            endColumnIndex: startCell.columnIndex,
          },
          activeCell: {
            rowIndex: 1,
            columnIndex: startCell.columnIndex,
          },
          isMultiSelect,
        },
        event: e,
      } as TMousedownEvent;
    }

    // Clicked on a data cell
    return {
      mousedownType: EMousedownTypes.HeaderClick,
      data: {
        type: EHeaderClickType.ColumnHeader,
        region: {
          startRowIndex: 1,
          endRowIndex: rowCount - 1,
          startColumnIndex: startCell.columnIndex,
          endColumnIndex: startCell.columnIndex,
        },
        activeCell: {
          rowIndex: 1,
          columnIndex: startCell.columnIndex,
        },
        isMultiSelect,
      },
      event: e,
    } as TMousedownEvent;
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
