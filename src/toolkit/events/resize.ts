import type { ICellDimension, IItemBoundary, ISheetConfig, ISheetDimension } from '../helpers';
import type { IExcelEntrance } from '../types';
import type { IBoundaryResizeListener, ICursorGetter, IStageMouseEvent } from './types';

import { combineLatest, EMPTY, finalize, map, merge, of, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs';

import { EventListener } from './listener';
import { EBoundaryTypes, EMousedownTypes } from './types';

/**
 * Boundary resize listener
 */
export class BoundaryResizeListener extends EventListener implements IBoundaryResizeListener {
  config: ISheetConfig;
  sheetDimension: ISheetDimension;
  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;
  events: IStageMouseEvent;
  excelEntrance: IExcelEntrance;
  cursorGetter: ICursorGetter;
  cell: ICellDimension;

  /**
   * Constructor
   * @param config sheet config
   * @param sheetDimension sheet dimension
   * @param columnBoundary column boundary
   * @param rowBoundary row boundary
   * @param events stage mouse events
   * @param excelEntrance excel entrance
   * @param cursorGetter cursor getter
   * @param cell cell dimension
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    columnBoundary: IItemBoundary,
    rowBoundary: IItemBoundary,
    events: IStageMouseEvent,
    excelEntrance: IExcelEntrance,
    cursorGetter: ICursorGetter,
    cell: ICellDimension,
  ) {
    super();

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.columnBoundary = columnBoundary;
    this.rowBoundary = rowBoundary;
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
        this.columnBoundary.accumulated.dimension.get$,
        this.rowBoundary.accumulated.dimension.get$,
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
                this.columnBoundary.accumulated.dimension.set(info.index, Math.round(newWidth));
              } else {
                const dy = ue.evt.clientY - e.evt.clientY;
                const newHeight = Math.max(initialDimension + dy, minRowHeight);
                this.rowBoundary.accumulated.dimension.set(info.index, newHeight);
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
