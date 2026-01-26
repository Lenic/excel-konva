import type { ICellDimension, IItemBoundary, ISheetConfig, ISheetDimension } from '../helpers';
import type { IExcelEntrance } from '../types';
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

import { ObservableDisposable } from '../core';

import { EHeaderClickType, EMousedownTypes } from './types';

/**
 * Stage mouse events
 */
export class StageMouseEvent extends ObservableDisposable implements IStageMouseEvent {
  private checkResizeBoundary$: Observable<(relX: number, relY: number) => IBoundaryInfo | null>;

  cellDimension: ICellDimension;
  columnBoundary: IItemBoundary;
  config: ISheetConfig;
  rowBoundary: IItemBoundary;
  sheetDimension: ISheetDimension;
  excelEntrance: IExcelEntrance;

  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseDownLeft$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUpLeft$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  typedMouseDownLeft$: Observable<TMousedownEvent>;
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;

  /**
   * Constructor
   *
   * @param cellDimension - Cell dimension
   * @param columnBoundary - Column boundary
   * @param config - Sheet config
   * @param rowBoundary - Row boundary
   * @param sheetDimension - Sheet dimension
   * @param excelEntrance - Excel entrance
   */
  constructor(
    cellDimension: ICellDimension,
    columnBoundary: IItemBoundary,
    config: ISheetConfig,
    rowBoundary: IItemBoundary,
    sheetDimension: ISheetDimension,
    excelEntrance: IExcelEntrance,
  ) {
    super();

    this.cellDimension = cellDimension;
    this.columnBoundary = columnBoundary;
    this.config = config;
    this.rowBoundary = rowBoundary;
    this.sheetDimension = sheetDimension;
    this.excelEntrance = excelEntrance;

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

    this.typedMouseDownLeft$ = this.buildTypedMouseDownLeft$(excelEntrance.rootElement);

    this.dblclick$ = this.getMouseEvent$('dblclick');
  }

  private getMouseEvent$(key: keyof GlobalEventHandlersEventMap) {
    return fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
      (fn) => this.excelEntrance.stage.on(key, fn),
      (fn) => this.excelEntrance.stage.off(key, fn),
    ).pipe(this.withShare());
  }

  private buildTypedMouseDownLeft$(rootElement: HTMLDivElement) {
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
      withLatestFrom(
        this.checkResizeBoundary$,
        this.cellDimension.getCellLocation$,
        this.config.get$('columnCount'),
        this.config.get$('rowCount'),
      ),
      switchMap(([[e, up], checkResizeBoundary, getCellLocation, columnCount, rowCount]) => {
        /**
         * Whether multi-select mode is active (e.g. Ctrl/Cmd key pressed)
         */
        const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

        const rect = rootElement.getBoundingClientRect();
        const relX = e.evt.clientX - rect.left;
        const relY = e.evt.clientY - rect.top;

        // No mouse up event, means it's a resize event
        if (!up) {
          // 1. Check if resize is triggered
          const boundary = checkResizeBoundary(relX, relY);
          if (boundary) {
            return of({ mousedownType: EMousedownTypes.ResizeBoundary, data: boundary, event: e } as TMousedownEvent);
          }

          // 2. Cell selection
          const cell = getCellLocation(relX, relY);
          return of({
            mousedownType: EMousedownTypes.SelectRegion,
            data: {
              id: Date.now(),
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
          const activeCell = getCellLocation(relX, relY);

          // Return empty click if clicked on empty area of Konva Stage (not a cell)
          if (activeCell.columnIndex === -1 || activeCell.rowIndex === -1) {
            return of({ mousedownType: EMousedownTypes.Empty, event: e } as TMousedownEvent);
          }

          const isRowHeaderClick = activeCell.columnIndex === 0 && activeCell.rowIndex !== 0;
          const isColumnHeaderClick = activeCell.rowIndex === 0 && activeCell.columnIndex !== 0;
          const isCornerClick = activeCell.rowIndex === 0 && activeCell.columnIndex === 0;

          if (isCornerClick) {
            return of({
              mousedownType: EMousedownTypes.HeaderClick,
              data: {
                id: Date.now(),
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
                id: Date.now(),
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
                id: Date.now(),
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
              id: Date.now(),
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
      this.columnBoundary.getBoundary$.pipe(
        switchMap((getColumnLeft) =>
          this.columnBoundary.accumulated.dimension.get$.pipe(
            take(1),
            map((getColumnWidth) => [getColumnLeft, getColumnWidth] as const),
          ),
        ),
      ),
      this.rowBoundary.getBoundary$.pipe(
        switchMap((getRowTop) =>
          this.rowBoundary.accumulated.dimension.get$.pipe(
            take(1),
            map((getRowHeight) => [getRowTop, getRowHeight] as const),
          ),
        ),
      ),
      this.config.get$('columnCount'),
      this.config.get$('rowCount'),
      this.sheetDimension.visualSize$,
      this.config.get$('resizeTolerance'),
    ]).pipe(
      map(
        ([
          [getColumnLeft, getColumnWidth],
          [getRowTop, getRowHeight],
          columnCount,
          rowCount,
          sheetVisualSize,
          resizeTolerance,
        ]) => {
          /**
           * Check boundary information for the current position; return `null` if it's not a boundary.
           *
           * @param relX - The X coordinate of the mouse relative to the canvas.
           * @param relY - The Y coordinate of the mouse relative to the canvas.
           */
          return function checkResizeBoundary(relX: number, relY: number): IBoundaryInfo | null {
            /**
             * Check column boundary
             *
             * - This event is only triggered within the column header area.
             * - It will not be triggered within the normal cell area.
             */
            if (relY < getRowHeight(0) + resizeTolerance) {
              for (let c = 0; c < columnCount; c++) {
                // Use getColumnLeft to get the precise coordinate value of the right edge of column c
                const boundary = getColumnLeft(c + 1);

                // If the difference between relX and the calculated boundary value is within the tolerance, it is considered a match
                if (Math.abs(relX - boundary) < resizeTolerance) {
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
            if (relX < getColumnWidth(0) + resizeTolerance) {
              for (let r = 0; r < rowCount; r++) {
                // Use getRowTop to get the precise coordinate value of the bottom edge of row r
                const boundary = getRowTop(r + 1);

                // If the difference between relY and the calculated boundary value is within the tolerance, it is considered a match
                if (Math.abs(relY - boundary) < resizeTolerance) {
                  return { type: 'row-boundary', index: r, boundary: boundary };
                }

                // Out of viewport
                if (boundary > sheetVisualSize.height) break;
              }
            }

            return null;
          };
        },
      ),
    );
  }
}
