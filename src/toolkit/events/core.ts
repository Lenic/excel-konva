import type { IBoundaryInfo, IStageMouseEvent, TMousedownEvent } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import {
  combineLatest,
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

import { Disposable } from '../core';
import { container } from '../core-elements';
import { cellDimension, columnBoundary, config, rowBoundary, sheetDimension } from '../helpers';
import { stage } from '../konva-items';

import { RESIZE_TOLERANCE } from './constants';
import { EHeaderClickType, EMousedownTypes } from './types';

/**
 * Stage mouse events
 */
export class StageMouseEvent extends Disposable implements IStageMouseEvent {
  private checkResizeBoundary$: Observable<(clientX: number, clientY: number) => IBoundaryInfo | null>;

  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseDownLeft$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUpLeft$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  typedMouseDownLeft$: Observable<TMousedownEvent>;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.checkResizeBoundary$ = this.buildCheckResizeBoundary$();

    this.mousedown$ = this.getMouseEvent$('mousedown');
    this.mouseMove$ = this.getMouseEvent$('mousemove');
    this.mouseUp$ = this.getMouseEvent$('mouseup');

    this.mouseDownLeft$ = this.mousedown$.pipe(
      exhaustMap((e) => (e.evt.button !== 0 ? EMPTY : of(e))),
      share(),
    );
    this.mouseUpLeft$ = this.mouseUp$.pipe(
      exhaustMap((e) => (e.evt.button !== 0 ? EMPTY : of(e))),
      share(),
    );

    this.typedMouseDownLeft$ = this.buildTypedMouseDownLeft$();
  }

  private getMouseEvent$(key: keyof GlobalEventHandlersEventMap) {
    return this.dispositionSubject.pipe(
      switchMap(() =>
        fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
          (fn) => stage.on(key, fn),
          (fn) => stage.off(key, fn),
        ),
      ),
      share(),
    );
  }

  private buildTypedMouseDownLeft$() {
    return this.mouseDownLeft$.pipe(
      exhaustMap((e) =>
        merge(
          this.mouseUpLeft$.pipe(map(() => true)),
          this.mouseMove$.pipe(map(() => false)),
          timer(300).pipe(map(() => false)),
        ).pipe(
          take(1),
          map((up) => [e, up] as const),
        ),
      ),
      withLatestFrom(this.checkResizeBoundary$, cellDimension.getCellLocation$, config.columnCount$, config.rowCount$),
      switchMap(([[e, up], checkResizeBoundary, getCellLocation, columnCount, rowCount]) => {
        /**
         * Whether multi-select mode is active (e.g. Ctrl/Cmd key pressed)
         */
        const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

        // No mouse up event, means it's a resize event
        if (!up) {
          // 1. Check if resize is triggered
          const boundary = checkResizeBoundary(e.evt.clientX, e.evt.clientY);
          if (boundary) {
            return of({ mousedownType: EMousedownTypes.ResizeBoundary, data: boundary, event: e } as TMousedownEvent);
          }

          // 2. Cell selection
          const cell = getCellLocation(e.evt.clientX, e.evt.clientY);
          return of({
            mousedownType: EMousedownTypes.SelectRegion,
            data: {
              region: {
                startRowIndex: cell.rowIndex,
                endRowIndex: cell.rowIndex,
                startColumnIndex: cell.columnIndex,
                endColumnIndex: cell.columnIndex,
              },
              activeCell: cell,
              isMultiSelect,
            },
            event: e,
          } as TMousedownEvent);
        } else {
          // 1. Check if clicked on empty area of Konva Stage (not a cell)
          if (e.target === stage) {
            return of({ mousedownType: EMousedownTypes.Empty, event: e } as TMousedownEvent);
          }

          // 2. Start cell selection
          const activeCell = getCellLocation(e.evt.clientX, e.evt.clientY);

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
              activeCell,
              isMultiSelect,
            },
            event: e,
          } as TMousedownEvent);
        }
      }),
      share(),
    );
  }

  private buildCheckResizeBoundary$() {
    return combineLatest([
      columnBoundary.getBoundary$.pipe(
        switchMap((getColumnLeft) =>
          columnBoundary.accumulated.dimension.get$.pipe(
            take(1),
            map((getColumnWidth) => [getColumnLeft, getColumnWidth] as const),
          ),
        ),
      ),
      rowBoundary.getBoundary$.pipe(
        switchMap((getRowTop) =>
          rowBoundary.accumulated.dimension.get$.pipe(
            take(1),
            map((getRowHeight) => [getRowTop, getRowHeight] as const),
          ),
        ),
      ),
      config.columnCount$,
      config.rowCount$,
      sheetDimension.visualSize$,
    ]).pipe(
      map(([[getColumnLeft, getColumnWidth], [getRowTop, getRowHeight], columnCount, rowCount, sheetVisualSize]) => {
        /**
         * Check boundary information for the current position; return `null` if it's not a boundary.
         *
         * @param clientX - The X coordinate of the mouse relative to the viewport.
         * @param clientY - The Y coordinate of the mouse relative to the viewport.
         */
        return function checkResizeBoundary(clientX: number, clientY: number): IBoundaryInfo | null {
          const containerRect = container.getBoundingClientRect();
          const relX = clientX - containerRect.left;
          const relY = clientY - containerRect.top;

          /**
           * Check column boundary
           *
           * - This event is only triggered within the column header area.
           * - It will not be triggered within the normal cell area.
           */
          if (relY < getRowHeight(0) + RESIZE_TOLERANCE) {
            for (let c = 0; c < columnCount; c++) {
              // Use getColumnLeft to get the precise coordinate value of the right edge of column c
              const boundary = getColumnLeft(c + 1);

              // If the difference between relX and the calculated boundary value is within the tolerance, it is considered a match
              if (Math.abs(relX - boundary) < RESIZE_TOLERANCE) {
                return { type: 'column-boundary', index: c, boundary };
              }

              // Out of viewport
              if (boundary > sheetVisualSize.width) break;
            }
          }

          /**
           * Check row boundary
           *
           * - This event is only triggered within the row header area.
           * - It will not be triggered within the normal cell area.
           */
          if (relX < getColumnWidth(0) + RESIZE_TOLERANCE) {
            for (let r = 0; r < rowCount; r++) {
              // Use getRowTop to get the precise coordinate value of the bottom edge of row r
              const boundary = getRowTop(r + 1);

              // If the difference between relY and the calculated boundary value is within the tolerance, it is considered a match
              if (Math.abs(relY - boundary) < RESIZE_TOLERANCE) {
                return { type: 'row-boundary', index: r, boundary: boundary };
              }

              // Out of viewport
              if (boundary > sheetVisualSize.height) break;
            }
          }

          return null;
        };
      }),
    );
  }
}
