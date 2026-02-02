import type { ICellDimension, IItemBoundary, IItemDimension, ISheetConfig, ISheetDimension } from '../helpers';
import type { IExcelEntrance } from '../types';
import type { ICursorGetter, IStageMouseEvent } from './types';

import { combineLatest, EMPTY, finalize, map, merge, of, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs';

import { EventListener } from './listener';
import { EBoundaryTypes, EMousedownTypes } from './types';

/**
 * Boundary resize listener
 */
export class BoundaryResizeListener extends EventListener {
  private rowDimension: IItemDimension;
  private columnDimension: IItemDimension;

  config: ISheetConfig;
  sheetDimension: ISheetDimension;
  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;
  events: IStageMouseEvent;
  excelEntrance: IExcelEntrance;
  cursorGetter: ICursorGetter;
  cell: ICellDimension;

  /**
   * BoundaryResizeListener constructor
   *
   * @param rowDimension - The item dimension manager for rows
   * @param columnDimension - The item dimension manager for columns
   * @param config - The sheet configuration
   * @param sheetDimension - The overall sheet dimension manager
   * @param rowBoundary - The boundary manager for rows
   * @param columnBoundary - The boundary manager for columns
   * @param events - The stage mouse event handler
   * @param excelEntrance - The main entry point for the Excel component
   * @param cursorGetter - The helper to get current cursor style
   * @param cell - The cell dimension manager
   */
  constructor(
    rowDimension: IItemDimension,
    columnDimension: IItemDimension,
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    rowBoundary: IItemBoundary,
    columnBoundary: IItemBoundary,
    events: IStageMouseEvent,
    excelEntrance: IExcelEntrance,
    cursorGetter: ICursorGetter,
    cell: ICellDimension,
  ) {
    super();

    this.rowDimension = rowDimension;
    this.columnDimension = columnDimension;
    this.config = config;
    this.sheetDimension = sheetDimension;
    this.rowBoundary = rowBoundary;
    this.columnBoundary = columnBoundary;
    this.events = events;
    this.excelEntrance = excelEntrance;
    this.cursorGetter = cursorGetter;
    this.cell = cell;
  }

  protected build() {
    return merge(this.buildResize(), this.buildCursor());
  }

  private buildResize() {
    return this.events.typedMouseDownLeft$.pipe(
      switchMap((v) => (v.mousedownType === EMousedownTypes.ResizeBoundary ? of([v.data, v.event] as const) : EMPTY)),
      withLatestFrom(
        this.columnDimension.get$,
        this.rowDimension.get$,
        this.sheetDimension.visualSize$,
        this.columnBoundary.getBoundary$,
        this.rowBoundary.getBoundary$,
        this.config.get$('minRowHeight'),
        this.config.get$('minColumnWidth'),
      ),
      switchMap(
        ([
          [info, e],
          getColumnWidth,
          getRowHeight,
          sheetVisualSize,
          getColumnLeft,
          getRowTop,
          minRowHeight,
          minColumnWidth,
        ]) => {
          // Prevent default mousedown behavior
          e.evt.preventDefault();
          // Set current cursor style
          this.excelEntrance.stage.container().style.cursor =
            info.type === EBoundaryTypes.Column ? 'col-resize' : 'row-resize';

          let initialDimension = 0;
          if (info.type === EBoundaryTypes.Column) {
            initialDimension = getColumnWidth(info.index);
            this.excelEntrance.resizeLine.points([info.boundary, 0, info.boundary, sheetVisualSize.height]);
          } else {
            initialDimension = getRowHeight(info.index);
            this.excelEntrance.resizeLine.points([0, info.boundary, sheetVisualSize.width, info.boundary]);
          }
          this.excelEntrance.resizeLine.visible(true);

          this.excelEntrance.selectionLayer.batchDraw();

          const clear$ = this.events.mouseUp$.pipe(
            tap((ue) => {
              this.excelEntrance.resizeLine.visible(false);

              if (info.type === EBoundaryTypes.Column) {
                const dx = ue.evt.clientX - e.evt.clientX;
                const newWidth = Math.max(initialDimension + dx, minColumnWidth);
                this.columnDimension.set(info.index, Math.round(newWidth));
              } else {
                const dy = ue.evt.clientY - e.evt.clientY;
                const newHeight = Math.max(initialDimension + dy, minRowHeight);
                this.rowDimension.set(info.index, newHeight);
              }
            }),
            finalize(() => {
              this.excelEntrance.stage.container().style.cursor = 'default';
            }),
          );

          return this.events.mouseMove$.pipe(
            takeUntil(clear$),
            map((me) => {
              if (info.type === EBoundaryTypes.Column) {
                const dx = me.evt.clientX - e.evt.clientX;
                const newWidth = Math.max(initialDimension + dx, minColumnWidth);

                // Real-time update of helper line position (get current position of column right boundary, then add dimension change)
                const currentBoundaryX = getColumnLeft(info.index + 1);
                const widthDelta = newWidth - initialDimension;
                const newX = currentBoundaryX + widthDelta;

                this.excelEntrance.resizeLine.points([newX, 0, newX, sheetVisualSize.height]);
              } else {
                const dy = me.evt.clientY - e.evt.clientY;
                const newHeight = Math.max(initialDimension + dy, minRowHeight);

                // Real-time update of helper line position (get current position of row bottom boundary, then add dimension change)
                const currentBoundaryY = getRowTop(info.index + 1);
                const heightDelta = newHeight - initialDimension;
                const newY = currentBoundaryY + heightDelta;

                this.excelEntrance.resizeLine.points([0, newY, sheetVisualSize.width, newY]);
              }
              this.excelEntrance.resizeLine.moveToTop();
              this.excelEntrance.selectionLayer.batchDraw();
            }),
          );
        },
      ),
    );
  }

  private buildCursor() {
    return combineLatest([
      this.cursorGetter.offset$,
      this.cell.getCellLocation$.pipe(
        switchMap((v1) =>
          this.cell.getCellRectBox$.pipe(
            take(1),
            map((v2) => [v1, v2] as const),
          ),
        ),
      ),
      this.events.config.get$('resizeTolerance'),
    ]).pipe(
      map(([offset, [getCellLocation, getCellRectBox], resizeTolerance]) => {
        if (offset === null) return;

        const { deltaX, deltaY } = offset;
        const location = getCellLocation(deltaX, deltaY);

        let cursor = 'default';
        if (location.rowIndex === 0 && location.columnIndex === 0) {
          // do nothing
        } else if (location.rowIndex === 0) {
          const rect = getCellRectBox(location.rowIndex, location.columnIndex);
          const leftLeftX = rect.x - resizeTolerance;
          const leftRightX = rect.x + resizeTolerance;
          const rightLeftX = leftLeftX + rect.width;
          const rightRightX = leftRightX + rect.width;
          if ((leftLeftX <= deltaX && deltaX <= leftRightX) || (rightLeftX <= deltaX && deltaX <= rightRightX)) {
            cursor = 'col-resize';
          }
        } else if (location.columnIndex === 0) {
          const rect = getCellRectBox(location.rowIndex, location.columnIndex);
          const topTopY = rect.y - resizeTolerance;
          const topBottomY = rect.y + resizeTolerance;
          const bottomTopY = topTopY + rect.height;
          const bottomBottomY = topBottomY + rect.height;
          if ((topTopY <= deltaY && deltaY <= topBottomY) || (bottomTopY <= deltaY && deltaY <= bottomBottomY)) {
            cursor = 'row-resize';
          }
        }

        this.excelEntrance.stage.container().style.cursor = cursor;
      }),
    );
  }
}
