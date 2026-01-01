import type { TMousedownEvent } from './types';
import type Konva from 'konva';

import {
  EMPTY,
  exhaustMap,
  fromEventPattern,
  map,
  merge,
  of,
  share,
  switchMap,
  take,
  timer,
  withLatestFrom,
} from 'rxjs';

import { cellDimension, config } from '../helpers';
import { stage } from '../konva-items';

import { EHeaderClickType, EMousedownTypes } from './types';
import { checkResizeBoundary$ } from './utils';

function getMouseEvent$(key: keyof GlobalEventHandlersEventMap) {
  return fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
    (fn) => stage.on(key, fn),
    (fn) => stage.off(key, fn),
  ).pipe(share());
}

export const mouseDown$ = getMouseEvent$('mousedown');
export const mouseMove$ = getMouseEvent$('mousemove');
export const mouseUp$ = getMouseEvent$('mouseup');

export const mouseUpLeft$ = mouseUp$.pipe(
  exhaustMap((e) => (e.evt.button !== 0 ? EMPTY : of(e))),
  share(),
);

export const typedMouseDownLeft$ = mouseDown$.pipe(
  exhaustMap((e) =>
    e.evt.button !== 0
      ? EMPTY
      : merge(mouseUpLeft$.pipe(map(() => true)), timer(300).pipe(map(() => false))).pipe(
          take(1),
          map((up) => [e, up] as const),
        ),
  ),
  withLatestFrom(checkResizeBoundary$, cellDimension.getCellLocation$, config.columnCount$, config.rowCount$),
  switchMap(([[e, up], checkResizeBoundary, getCellLocation, columnCount, rowCount]) => {
    // No mouse up event, means it's a resize event
    if (!up) {
      // 1. Check if resize is triggered
      const boundary = checkResizeBoundary(e.evt.clientX, e.evt.clientY);
      if (boundary) {
        return of({ mousedownType: EMousedownTypes.ResizeBoundary, data: boundary, event: e } as TMousedownEvent);
      }

      return EMPTY;
    } else {
      // 1. Check if clicked on empty area of Konva Stage (not a cell)
      if (e.target === stage) {
        return of({ mousedownType: EMousedownTypes.Empty, event: e } as TMousedownEvent);
      }

      // 2. Start cell selection
      const activeCell = getCellLocation(e.evt.clientX, e.evt.clientY);
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

      const isRowHeaderClick = activeCell.columnIndex === 0 && activeCell.rowIndex !== 0;
      const isColumnHeaderClick = activeCell.rowIndex === 0 && activeCell.columnIndex !== 0;
      const isCornerClick = activeCell.rowIndex === 0 && activeCell.columnIndex === 0;

      if (isCornerClick) {
        return of({
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
        } as TMousedownEvent);
      } else if (isRowHeaderClick) {
        return of({
          mousedownType: EMousedownTypes.HeaderClick,
          data: {
            type: EHeaderClickType.RowHeader,
            region: {
              startRowIndex: activeCell.rowIndex,
              endRowIndex: activeCell.rowIndex,
              startColumnIndex: 1,
              endColumnIndex: columnCount - 1,
            },
            activeCell: {
              rowIndex: activeCell.rowIndex,
              columnIndex: 1,
            },
            isMultiSelect,
          },
          event: e,
        } as TMousedownEvent);
      } else if (isColumnHeaderClick) {
        return of({
          mousedownType: EMousedownTypes.HeaderClick,
          data: {
            type: EHeaderClickType.ColumnHeader,
            region: {
              startRowIndex: 1,
              endRowIndex: rowCount - 1,
              startColumnIndex: activeCell.columnIndex,
              endColumnIndex: activeCell.columnIndex,
            },
            activeCell: {
              rowIndex: 1,
              columnIndex: activeCell.columnIndex,
            },
            isMultiSelect,
          },
          event: e,
        } as TMousedownEvent);
      }

      // Clicked on a data cell
      return of({
        mousedownType: EMousedownTypes.CellClick,
        data: {
          type: EHeaderClickType.ColumnHeader,
          region: {
            startRowIndex: activeCell.rowIndex,
            endRowIndex: activeCell.rowIndex,
            startColumnIndex: activeCell.columnIndex,
            endColumnIndex: activeCell.columnIndex,
          },
          activeCell: activeCell,
          isMultiSelect,
        },
        event: e,
      } as TMousedownEvent);
    }
  }),
  share(),
);
