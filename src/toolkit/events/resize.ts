import type { IItemBoundary, ISheetConfig, ISheetDimension } from '../helpers';
import type { IBoundaryResizeListener, IStageMouseEvent } from './types';

import { EMPTY, finalize, map, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

import { resizeLine, selectionLayer, stage } from '../konva-items';

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

  /**
   * Constructor
   * @param config sheet config
   * @param sheetDimension sheet dimension
   * @param columnBoundary column boundary
   * @param rowBoundary row boundary
   * @param events stage mouse events
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    columnBoundary: IItemBoundary,
    rowBoundary: IItemBoundary,
    events: IStageMouseEvent,
  ) {
    super();

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.columnBoundary = columnBoundary;
    this.rowBoundary = rowBoundary;
    this.events = events;
  }

  protected build() {
    return this.dispositionSubject.pipe(
      switchMap(() => this.events.typedMouseDownLeft$),
      switchMap((v) => (v.mousedownType === EMousedownTypes.ResizeBoundary ? of([v.data, v.event] as const) : EMPTY)),
      withLatestFrom(
        this.columnBoundary.accumulated.dimension.get$,
        this.rowBoundary.accumulated.dimension.get$,
        this.sheetDimension.visualSize$,
        this.columnBoundary.getBoundary$,
        this.rowBoundary.getBoundary$,
        this.config.minRowHeight$,
        this.config.minColumnWidth$,
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
          stage.container().style.cursor = info.type === EBoundaryTypes.Column ? 'col-resize' : 'row-resize';

          let initialDimension = 0;
          if (info.type === EBoundaryTypes.Column) {
            initialDimension = getColumnWidth(info.index);
            resizeLine.points([info.boundary, 0, info.boundary, sheetVisualSize.height]);
          } else {
            initialDimension = getRowHeight(info.index);
            resizeLine.points([0, info.boundary, sheetVisualSize.width, info.boundary]);
          }
          resizeLine.visible(true);

          selectionLayer.batchDraw();

          const clear$ = this.events.mouseUp$.pipe(
            tap((ue) => {
              resizeLine.visible(false);

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
              stage.container().style.cursor = 'default';
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

                resizeLine.points([newX, 0, newX, sheetVisualSize.height]);
              } else {
                const dy = me.evt.clientY - e.evt.clientY;
                const newHeight = Math.max(initialDimension + dy, minRowHeight);

                // Real-time update of helper line position (get current position of row bottom boundary, then add dimension change)
                const currentBoundaryY = getRowTop(info.index + 1);
                const heightDelta = newHeight - initialDimension;
                const newY = currentBoundaryY + heightDelta;

                resizeLine.points([0, newY, sheetVisualSize.width, newY]);
              }
              selectionLayer.batchDraw();
            }),
          );
        },
      ),
    );
  }
}
